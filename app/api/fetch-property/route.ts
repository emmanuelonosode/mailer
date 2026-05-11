import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { connectDB } from "@/lib/mongodb";
import PropertyCache from "@/lib/models/PropertyCache";

export interface FetchedProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  price: string;
  priceType: "month" | "sale";
  beds: string;
  baths: string;
  sqft: string;
  propertyType: string;
  garage: string;
  yearBuilt: string;
  stories: string;
  condition: string;
  photos: string[];
  amenities: AmenitySection[];
  petPolicy: string;
  description: string;
  applyUrl: string;
  virtualTourUrl: string;
  agentName: string;
  agentPhone: string;
}

export interface AmenitySection {
  section: string;
  items: string[];
}

const PROPERTY_HOST = "haskerrealtygroup.com";

function parseAddress(raw: string): Pick<FetchedProperty, "address" | "city" | "state" | "zip"> {
  // Format: "15252 Abella Drive, Montgomery, TX 77316"
  const parts = raw.split(",").map((s) => s.trim());
  if (parts.length >= 3) {
    const stateZip = parts[parts.length - 1].trim().split(/\s+/);
    return {
      address: parts[0],
      city: parts.slice(1, parts.length - 1).join(", "),
      state: stateZip[0] ?? "",
      zip: stateZip[1] ?? "",
    };
  }
  return { address: raw, city: "", state: "", zip: "" };
}

function cleanText(str: string): string {
  return str.replace(/\s+/g, " ").replace(/&amp;/g, "&").replace(/&#x27;/g, "'").trim();
}

function extractNextData(html: string): Record<string, unknown> | null {
  const match = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i)
    ?? html.match(/<script[^>]*type="application\/json"[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function deepFind(obj: unknown, keys: string[]): unknown {
  if (obj === null || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (key in (obj as Record<string, unknown>)) {
      const val = (obj as Record<string, unknown>)[key];
      if (val !== null && val !== undefined) return val;
    }
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    const found = deepFind(val, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

function extractFromNextData(data: Record<string, unknown>): Partial<FetchedProperty> {
  const result: Partial<FetchedProperty> = {};

  // Price
  const price = deepFind(data, ["price", "rent", "monthlyRent", "listPrice"]);
  if (typeof price === "number") {
    result.price = String(Math.round(price));
    result.priceType = "month";
  } else if (typeof price === "string") {
    result.price = price.replace(/[$,]/g, "");
    result.priceType = "month";
  }

  // Beds / baths / sqft
  const beds = deepFind(data, ["bedrooms", "beds", "numBedrooms"]);
  if (beds !== undefined) result.beds = String(beds);

  const baths = deepFind(data, ["bathrooms", "baths", "numBathrooms"]);
  if (baths !== undefined) result.baths = String(baths);

  const sqft = deepFind(data, ["squareFeet", "sqft", "livingArea", "squareFootage"]);
  if (sqft !== undefined) result.sqft = String(sqft).replace(/,/g, "");

  // Address
  const addressObj = deepFind(data, ["address"]);
  if (typeof addressObj === "string") {
    Object.assign(result, parseAddress(addressObj));
  } else if (addressObj && typeof addressObj === "object") {
    const addr = addressObj as Record<string, unknown>;
    if (addr.street || addr.streetAddress) result.address = String(addr.street ?? addr.streetAddress ?? "");
    if (addr.city) result.city = String(addr.city);
    if (addr.state) result.state = String(addr.state);
    if (addr.zip || addr.zipCode || addr.postalCode) result.zip = String(addr.zip ?? addr.zipCode ?? addr.postalCode ?? "");
  }

  // Photos
  const photos = deepFind(data, ["photos", "images", "media"]);
  if (Array.isArray(photos)) {
    result.photos = photos
      .map((p: unknown) => (typeof p === "string" ? p : typeof p === "object" && p !== null ? (p as Record<string, unknown>).url as string ?? "" : ""))
      .filter((u) => u && typeof u === "string" && u.startsWith("http"))
      .slice(0, 16);
  }

  // Amenities
  const features = deepFind(data, ["amenities", "features", "homeFeatures"]);
  if (Array.isArray(features)) {
    result.amenities = [{ section: "Features", items: features.map(String) }];
  }

  return result;
}

function parseAmenitiesFromHtml($: cheerio.CheerioAPI): AmenitySection[] {
  const sections: AmenitySection[] = [];
  const SECTION_LABELS = [
    "Home Features",
    "Kitchen",
    "Kitchen Features",
    "Utilities",
    "Utilities & Maintenance",
    "Community Features",
    "Community",
    "Outdoor",
    "Pet Policy",
    "Interior",
    "Exterior",
    "Appliances",
    "Flooring",
    "Parking",
    "Cooling",
    "Heating",
    "Laundry",
  ];

  // Strategy 1: look for heading elements followed by lists or inline text
  $("h2, h3, h4, strong, b, dt").each((_, el) => {
    const headingText = cleanText($(el).text());
    const label = SECTION_LABELS.find(
      (s) => headingText.toLowerCase().includes(s.toLowerCase())
    );
    if (!label) return;

    const items: string[] = [];

    // Check next sibling or parent's next sibling for list items
    const $next = $(el).next();
    if ($next.is("ul, ol")) {
      $next.find("li").each((_, li) => {
        const t = cleanText($(li).text());
        if (t) items.push(t);
      });
    } else if ($next.is("p, div, span, dd")) {
      // Comma- or bullet-separated text
      cleanText($next.text())
        .split(/[,;•·]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2 && s.length < 60)
        .forEach((s) => items.push(s));
    }

    // Also try children of parent container
    if (items.length === 0) {
      const $parent = $(el).parent();
      $parent.find("li, span").each((_, child) => {
        if (child === el) return;
        const t = cleanText($(child).text());
        if (t.length > 2 && t.length < 60 && t !== headingText) items.push(t);
      });
    }

    if (items.length > 0) {
      const existing = sections.find((s) => s.section === label);
      if (existing) {
        existing.items.push(...items);
      } else {
        sections.push({ section: label, items });
      }
    }
  });

  // Strategy 2: parse from __NEXT_DATA__-style JSON embedded in text
  // (fallback: find comma-separated feature strings near known labels)
  if (sections.length === 0) {
    const bodyText = $.text();
    for (const label of SECTION_LABELS) {
      const regex = new RegExp(
        `${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[:\\s]+([^.\\n]{10,200})`,
        "i"
      );
      const m = bodyText.match(regex);
      if (m) {
        const items = m[1]
          .split(/[,;•·]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 2 && s.length < 60);
        if (items.length > 0) {
          sections.push({ section: label, items });
        }
      }
    }
  }

  return sections;
}

function extractPhotosFromHtml($: cheerio.CheerioAPI, html: string): string[] {
  const cdnUrls: string[] = [];

  // Method 1: img tags with invitationhomes CDN
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const dataSrc = $(el).attr("data-src") ?? "";
    const srcset = $(el).attr("srcset") ?? "";
    [src, dataSrc, ...srcset.split(",").map((s) => s.trim().split(" ")[0])]
      .filter((u) => u.includes("invitationhomes.com") || u.includes("haskerrealtygroup.com"))
      .forEach((u) => cdnUrls.push(u));
  });

  // Method 2: find all invitationhomes CDN URLs in raw HTML text
  const rawMatches = html.match(/https:\/\/images\.invitationhomes\.com\/[^"'\s<>]+/g) ?? [];
  cdnUrls.push(...rawMatches);

  // Deduplicate, filter thumbnails, keep high-res versions
  const seen = new Set<string>();
  return cdnUrls
    .map((u) => {
      // Normalize CDN transforms to w_1500,h_1000,c_limit,q_auto for best quality
      return u.replace(/\/web\/[^/]+\//, "/web/w_1500,h_1000,c_limit,q_auto/");
    })
    .filter((u) => {
      if (seen.has(u)) return false;
      if (u.includes("_thumb") || u.includes("/100/") || u.includes("w_100")) return false;
      seen.add(u);
      return true;
    })
    .slice(0, 18);
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");

  if (!rawUrl) {
    return NextResponse.json({ error: "url parameter is required." }, { status: 400 });
  }

  // Validate URL
  let propertyUrl: URL;
  try {
    propertyUrl = new URL(rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`);
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  if (!propertyUrl.hostname.includes(PROPERTY_HOST)) {
    return NextResponse.json(
      { error: `Only ${PROPERTY_HOST} property URLs are supported.` },
      { status: 400 }
    );
  }
  if (!propertyUrl.pathname.startsWith("/properties/")) {
    return NextResponse.json(
      { error: "URL must point to a property page: haskerrealtygroup.com/properties/…" },
      { status: 400 }
    );
  }

  const slug = propertyUrl.pathname.replace("/properties/", "").replace(/\/$/, "");
  const normalizedUrl = propertyUrl.toString();

  // Check cache first (7-day TTL managed by MongoDB TTL index)
  try {
    await connectDB();
    const cached = await PropertyCache.findOne({ url: normalizedUrl }).lean();
    if (cached) {
      return NextResponse.json({ ...cached.data, _cached: true, _cachedAt: cached.cachedAt });
    }
  } catch {
    // Cache miss or DB unavailable — continue to scrape
  }

  // Fetch the page
  let html: string;
  try {
    const res = await fetch(propertyUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (res.status === 404) {
      return NextResponse.json({ error: "Property not found. Check the URL." }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not load property page (HTTP ${res.status}).` },
        { status: 502 }
      );
    }
    html = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch property page: ${msg}` },
      { status: 502 }
    );
  }

  const $ = cheerio.load(html);

  // ── Try __NEXT_DATA__ first ───────────────────────────────────────
  const nextData = extractNextData(html);
  const fromNextData = nextData ? extractFromNextData(nextData) : {};

  // ── Address from <h1> ─────────────────────────────────────────────
  const h1Text = cleanText($("h1").first().text());
  const addressParsed: Partial<FetchedProperty> = h1Text ? parseAddress(h1Text) : {};

  // ── Price ─────────────────────────────────────────────────────────
  let price = fromNextData.price ?? "";
  let priceType: "month" | "sale" = fromNextData.priceType ?? "month";

  if (!price) {
    // Look in page text
    const priceMatch = html.match(/\$([\d,]+(?:\.\d{1,2})?)\s*\/\s*mo(?:nth)?/i);
    if (priceMatch) {
      price = priceMatch[1].replace(/,/g, "");
      priceType = "month";
    } else {
      // For-sale
      const saleMatch = html.match(/\$([\d,]+)\s*(?:for[- ]sale|purchase)/i);
      if (saleMatch) {
        price = saleMatch[1].replace(/,/g, "");
        priceType = "sale";
      }
    }
  }

  // ── Beds / Baths / Sqft ───────────────────────────────────────────
  const pageText = $.text();

  const beds =
    fromNextData.beds ??
    (pageText.match(/(\d+)\s+[Bb]edrooms?/)?.[1] ?? "");

  const baths =
    fromNextData.baths ??
    (pageText.match(/([\d.]+)\s+[Bb]athrooms?/)?.[1] ?? "");

  const sqftRaw =
    fromNextData.sqft ??
    (pageText.match(/([\d,]+)\s+[Ss]q\.?\s*[Ff]t/i)?.[1]?.replace(/,/g, "") ?? "");

  // ── Property metadata ─────────────────────────────────────────────
  const propertyType = pageText.match(/Property\s+[Tt]ype[:\s]+([A-Za-z ]+)/)?.[1]?.trim() ?? "";
  const garage = pageText.match(/(\d+-[Cc]ar(?:\s+[Gg]arage)?|No\s+[Gg]arage)/i)?.[1] ?? "";
  const yearBuilt = pageText.match(/[Yy]ear\s+[Bb]uilt[:\s]+(\d{4})/)?.[1] ?? "";
  const stories = pageText.match(/[Ss]tories[:\s]+(\d+)/)?.[1] ?? "";
  const condition = pageText.match(/[Cc]ondition[:\s]+([A-Za-z ]+)/)?.[1]?.trim() ?? "";
  const neighborhood = pageText.match(/[Nn]eighborhood[:\s]+([A-Za-z ]+)/)?.[1]?.trim() ?? "";

  // ── Amenities ─────────────────────────────────────────────────────
  const amenities =
    fromNextData.amenities?.length
      ? fromNextData.amenities
      : parseAmenitiesFromHtml($);

  // ── Pet policy ────────────────────────────────────────────────────
  const petMatch = pageText.match(/[Pp]et\s+[Pp]olicy[:\s]+([^.]+\.)/);
  const petPolicy = petMatch?.[1]?.trim() ?? "";

  // ── Description ───────────────────────────────────────────────────
  const metaDesc =
    $('meta[name="description"]').attr("content") ??
    $('meta[property="og:description"]').attr("content") ??
    "";
  const description = cleanText(metaDesc);

  // ── Photos ────────────────────────────────────────────────────────
  const photos = fromNextData.photos?.length
    ? fromNextData.photos
    : extractPhotosFromHtml($, html);

  // ── Agent info ────────────────────────────────────────────────────
  const agentName = pageText.match(/[Ll]isted\s+[Bb]y[:\s]+([A-Za-z ]+)/)?.[1]?.trim() ?? "Marcus Reid";
  const agentPhone = pageText.match(/\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}/)?.[0] ?? "";

  // ── Apply URL ─────────────────────────────────────────────────────
  const applyUrl = `https://haskerrealtygroup.com/apply?property=${slug}`;

  // ── Virtual tour ──────────────────────────────────────────────────
  const vtMatch = html.match(/https:\/\/(?:www\.)?(?:insidemaps|zillow|matterport)\.com\/[^\s"'<>]+/);
  const virtualTourUrl = vtMatch?.[0] ?? "";

  const result: FetchedProperty = {
    address: addressParsed.address ?? fromNextData.address ?? "",
    city: addressParsed.city ?? fromNextData.city ?? "",
    state: addressParsed.state ?? fromNextData.state ?? "",
    zip: addressParsed.zip ?? fromNextData.zip ?? "",
    neighborhood,
    price: String(price),
    priceType,
    beds: String(beds),
    baths: String(baths),
    sqft: String(sqftRaw),
    propertyType,
    garage,
    yearBuilt,
    stories,
    condition,
    photos,
    amenities,
    petPolicy,
    description,
    applyUrl,
    virtualTourUrl,
    agentName,
    agentPhone,
  };

  // Store in cache for future requests
  try {
    const city = (result.city || "unknown").toLowerCase();
    await PropertyCache.findOneAndUpdate(
      { url: normalizedUrl },
      { $set: { data: result as unknown as Record<string, unknown>, city, cachedAt: new Date() } },
      { upsert: true }
    );
  } catch {
    // Non-fatal — cache write failure doesn't break the response
  }

  return NextResponse.json(result);
}
