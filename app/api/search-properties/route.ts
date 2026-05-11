import { NextResponse } from "next/server";
import { load } from "cheerio";

const HOST = "https://haskerrealtygroup.com";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchHtml(url: string, timeout = 12_000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml,*/*", "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractPropertyPaths(html: string): string[] {
  const $ = load(html);
  const found = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    // Match /properties/slug or full URL
    const clean = href.replace(HOST, "");
    if (/^\/properties\/[a-z0-9][a-z0-9-]{3,}$/.test(clean)) {
      found.add(clean);
    }
  });

  // Also scan raw HTML for property slugs not in anchor tags
  const rawMatches = html.match(/\/properties\/[a-z0-9][a-z0-9-]{3,}(?=["'\s>])/g) ?? [];
  rawMatches.forEach((p) => {
    const clean = p.trim();
    if (/^\/properties\/[a-z0-9][a-z0-9-]{3,}$/.test(clean)) found.add(clean);
  });

  return Array.from(found);
}

function normalizeQuery(city: string): { slug: string; words: string[] } {
  const lower = city.toLowerCase().trim();
  // "Houston, TX" → "houston"  "austin tx" → "austin"
  const words = lower.replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  const slug = words.join("-");
  return { slug, words };
}

function filterByCity(paths: string[], words: string[]): string[] {
  if (words.length === 0) return paths;
  return paths.filter((p) => {
    const slug = p.toLowerCase();
    return words.some((w) => w.length > 2 && slug.includes(w));
  });
}

function removeDuplicatePaths(paths: string[]): string[] {
  return Array.from(new Set(paths));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get("city") ?? searchParams.get("q") ?? "").trim();

  if (!city) {
    return NextResponse.json({ error: "Provide ?city= parameter" }, { status: 400 });
  }

  const { slug, words } = normalizeQuery(city);
  const allPaths: string[] = [];

  // Strategy 1: Direct search query variations
  const searchUrls = [
    `${HOST}/properties?search=${encodeURIComponent(city)}`,
    `${HOST}/properties?city=${encodeURIComponent(city)}`,
    `${HOST}/properties?location=${encodeURIComponent(city)}`,
    `${HOST}/homes-for-rent?search=${encodeURIComponent(city)}`,
    `${HOST}/search?q=${encodeURIComponent(city)}`,
  ];

  for (const url of searchUrls) {
    const html = await fetchHtml(url, 8_000);
    if (html) {
      const paths = extractPropertyPaths(html);
      if (paths.length > 0) {
        allPaths.push(...paths);
        break;
      }
    }
  }

  // Strategy 2: Main properties listing page (all properties, then filter)
  if (allPaths.length === 0) {
    const html = await fetchHtml(`${HOST}/properties`);
    if (html) {
      const paths = extractPropertyPaths(html);
      allPaths.push(...filterByCity(paths, words));
    }
  }

  // Strategy 3: City-slug URL patterns used by Invitation Homes-style sites
  if (allPaths.length === 0) {
    const citySlugUrls = [
      `${HOST}/homes-for-rent/${slug}`,
      `${HOST}/rentals/${slug}`,
      `${HOST}/properties/${slug}`,
    ];
    for (const url of citySlugUrls) {
      const html = await fetchHtml(url, 8_000);
      if (html) {
        const paths = extractPropertyPaths(html);
        if (paths.length > 0) { allPaths.push(...paths); break; }
      }
    }
  }

  // Strategy 4: Sitemap.xml fallback
  if (allPaths.length === 0) {
    for (const sitemapUrl of [`${HOST}/sitemap.xml`, `${HOST}/sitemap_index.xml`]) {
      const xml = await fetchHtml(sitemapUrl, 10_000);
      if (xml) {
        const matches = xml.match(/https:\/\/haskerrealtygroup\.com\/properties\/[a-z0-9][a-z0-9-]{3,}/g) ?? [];
        const paths = [...new Set(matches)].map((u) => u.replace(HOST, ""));
        const filtered = filterByCity(paths, words);
        if (filtered.length > 0) { allPaths.push(...filtered); break; }
        if (paths.length > 0 && words.length === 0) { allPaths.push(...paths); break; }
      }
    }
  }

  const unique = removeDuplicatePaths(allPaths);
  const cityFiltered = filterByCity(unique, words);
  const final = (cityFiltered.length > 0 ? cityFiltered : unique).slice(0, 24);

  return NextResponse.json({
    urls: final.map((p) => HOST + p),
    query: city,
    found: final.length,
  });
}
