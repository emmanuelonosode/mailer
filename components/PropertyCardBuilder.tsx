"use client";

import { useState, useEffect, useRef } from "react";

interface PropertyCardBuilderProps {
  onInsert: (html: string) => void;
  onClose: () => void;
}

interface HargrovePropertyResult {
  slug: string;
  title: string;
  address: string;
  price: string;
  price_label: string;
  primary_image_url: string;
}

interface HargrovePropertyDetail extends HargrovePropertyResult {
  city: string;
  state: string;
  bedrooms: number;
  bathrooms: string;
  sqft: number;
  type: string;
  images: { url: string }[];
  amenities: { name: string }[];
}

// ── Card HTML builder ─────────────────────────────────────────────

function buildCardHtml(fields: {
  photoUrl: string;
  address: string;
  city: string;
  state: string;
  price: string;
  priceType: "month" | "sale";
  beds: string;
  baths: string;
  sqft: string;
  propertyType: string;
  garage: string;
  amenities: string[];
  petPolicy: string;
  ctaText: string;
  ctaUrl: string;
}): string {
  const priceLabel = fields.priceType === "month" ? "/mo" : " (for sale)";

  const amenityPills = fields.amenities
    .map(
      (a) =>
        `<span style="display:inline-block;background:#eff6ff;color:#1d4ed8;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;margin:0 5px 5px 0;">${a}</span>`
    )
    .join("");

  const metaItems = [
    fields.beds && `${fields.beds} bed`,
    fields.baths && `${fields.baths} bath`,
    fields.sqft && `${fields.sqft} sqft`,
    fields.propertyType,
    fields.garage,
  ].filter(Boolean);

  const metaCells = metaItems
    .map(
      (item) =>
        `<td style="padding-right:18px;font-size:12px;color:#6b7280;white-space:nowrap;">${item}</td>`
    )
    .join("");

  return `
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:20px 0;font-family:Arial,Helvetica,sans-serif;background-color:#ffffff;">
  ${
    fields.photoUrl
      ? `<tr>
    <td style="padding:0;line-height:0;">
      <img src="${fields.photoUrl}" alt="${fields.address}" width="520" style="width:100%;max-height:260px;object-fit:cover;display:block;" />
    </td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding:24px 24px 0 24px;">
      <p style="font-size:28px;font-weight:800;color:#0B1F3A;margin:0 0 6px 0;line-height:1.1;">$${fields.price}${priceLabel}</p>
      <p style="font-size:14px;color:#374151;margin:0 0 16px 0;font-weight:500;">
        ${fields.address}${fields.city ? ` &nbsp;·&nbsp; ${fields.city}` : ""}${fields.state ? `, ${fields.state}` : ""}
      </p>
      ${
        metaCells
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
        <tr>${metaCells}</tr>
      </table>`
          : ""
      }
      ${amenityPills ? `<div style="margin-bottom:20px;line-height:1.2;">${amenityPills}</div>` : ""}
    </td>
  </tr>
  ${
    fields.petPolicy
      ? `<tr>
    <td style="padding:0 24px 14px 24px;">
      <p style="font-size:12px;color:#6b7280;margin:0;">🐾 ${fields.petPolicy}</p>
    </td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding:0 24px 24px 24px;">
      ${
        fields.ctaUrl
          ? `<a href="${fields.ctaUrl}" style="display:inline-block;padding:12px 28px;background:#1A56DB;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;margin-right:10px;">${fields.ctaText} →</a>`
          : ""
      }
    </td>
  </tr>
</table>`.trim();
}

// ── Section heading ───────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-accent-light/50 mb-1.5">
      {children}
    </p>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function PropertyCardBuilder({ onInsert, onClose }: PropertyCardBuilderProps) {
  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HargrovePropertyResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Fetch state
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchedData, setFetchedData] = useState<HargrovePropertyDetail | null>(null);

  // Form fields
  const [photoUrl, setPhotoUrl] = useState("");
  const [allPhotos, setAllPhotos] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [price, setPrice] = useState("");
  const [priceType, setPriceType] = useState<"month" | "sale">("month");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [sqft, setSqft] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [garage, setGarage] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [allAmenities, setAllAmenities] = useState<string[]>([]);
  const [petPolicy, setPetPolicy] = useState("");
  const [ctaText, setCtaText] = useState("Apply Now");
  const [ctaUrl, setCtaUrl] = useState("");
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/hargrove-properties?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.results) {
          setSearchResults(data.results);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 400);
    
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query]);

  async function handleSelectProperty(slug: string) {
    setShowDropdown(false);
    setFetching(true);
    setFetchError("");
    setQuery("");

    try {
      const res = await fetch(`/api/hargrove-properties?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? "Failed to fetch property.");
        return;
      }

      const p = data as HargrovePropertyDetail;
      setFetchedData(p);

      // Populate form fields
      setAddress(p.address || p.title);
      setCity(p.city);
      setState(p.state);
      setPrice(parseFloat(p.price).toLocaleString("en-US", { maximumFractionDigits: 0 }));
      setPriceType(p.price_label?.includes("mo") ? "month" : "sale");
      setBeds(p.bedrooms?.toString() || "");
      setBaths(p.bathrooms || "");
      setSqft(p.sqft?.toString() || "");
      setPropertyType(p.type || "Home");
      setGarage("");
      setPetPolicy("");
      setCtaUrl(`https://haskerrealtygroup.com/properties/${p.slug}`);
      setCtaText("View Details");

      // Photos
      const photos = p.images?.map(img => img.url) || [];
      if (p.primary_image_url && !photos.includes(p.primary_image_url)) {
        photos.unshift(p.primary_image_url);
      }
      setAllPhotos(photos);
      setPhotoUrl(photos[0] ?? "");

      // Amenities
      const unique = (p.amenities || []).map(a => a.name).filter(a => a.length > 2);
      setAllAmenities(unique);
      setAmenities(unique.slice(0, 5)); // Auto-select first 5
    } catch {
      setFetchError("Network error — could not reach the server.");
    } finally {
      setFetching(false);
    }
  }

  function toggleAmenity(a: string) {
    setAmenities((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }

  const preview = buildCardHtml({ photoUrl, address, city, state, price, priceType, beds, baths, sqft, propertyType, garage, amenities, petPolicy, ctaText, ctaUrl });

  const isFilled = !!(address || price);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0 bg-white/5">
          <div>
            <p className="text-white font-semibold text-base">Cinematic Property Card</p>
            <p className="text-white/40 text-[11px] tracking-[0.1em] uppercase mt-0.5">
              Build high-converting sales collateral directly from your CRM
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white text-2xl leading-none transition-colors">×</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left panel: form ─────────────────────────────────── */}
          <div className="w-[380px] shrink-0 border-r border-white/8 overflow-y-auto p-6 flex flex-col gap-5">

            {/* Property Search */}
            <div className="relative z-10">
              <FieldLabel>Search CRM Properties</FieldLabel>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Type an address or neighborhood..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  spellCheck={false}
                />
                {searching && (
                  <div className="absolute right-3 top-3">
                     <svg className="animate-spin w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                  </div>
                )}
              </div>
              
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#162746] border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {searchResults.map(res => (
                    <button
                      key={res.slug}
                      type="button"
                      onClick={() => handleSelectProperty(res.slug)}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex gap-3 items-center transition-colors"
                    >
                      {res.primary_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={res.primary_image_url} alt="" className="w-10 h-10 rounded object-cover border border-white/10" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center">
                          <span className="text-white/20 text-xs">No img</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm truncate font-medium">{res.address || res.title}</p>
                        <p className="text-accent-light text-xs mt-0.5">${parseFloat(res.price).toLocaleString("en-US", { maximumFractionDigits: 0 })}{res.price_label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {fetching && (
                <div className="mt-3 p-3 bg-accent/10 border border-accent/20 rounded-lg flex items-center gap-2 text-accent-light text-xs">
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Syncing property data from Hargrove CRM...
                </div>
              )}

              {fetchError && (
                <p className="text-red-400/80 text-xs mt-2 p-2 bg-red-400/10 rounded border border-red-400/20">{fetchError}</p>
              )}
              {fetchedData && !fetchError && (
                <p className="text-green-400/80 text-xs mt-3 flex items-center gap-1.5 p-2 bg-green-400/10 rounded-lg border border-green-400/20">
                  <span className="bg-green-400 text-black rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">✓</span> 
                  Connected and auto-filled!
                </p>
              )}
            </div>

            {/* Photo picker */}
            {allPhotos.length > 0 && (
              <div>
                <FieldLabel>Showcase Photo ({allPhotos.length} available)</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {allPhotos.slice(0, 12).map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={[
                        "relative rounded-lg overflow-hidden border-2 transition-colors aspect-square",
                        photoUrl === url ? "border-accent shadow-[0_0_15px_rgba(26,86,219,0.5)]" : "border-transparent hover:border-white/30 opacity-70 hover:opacity-100",
                      ].join(" ")}
                      title={`Photo ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url.replace("w_1500,h_1000", "w_200,h_200")}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {photoUrl === url && (
                        <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                          <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-white text-[10px] font-bold">✓</span>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual photo URL */}
            {allPhotos.length === 0 && (
              <div>
                <FieldLabel>Property photo URL</FieldLabel>
                <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…/photo.jpg" className="field-input text-sm py-2" />
              </div>
            )}

            <div className="h-px bg-white/5 my-2"></div>

            {/* Address */}
            <div>
              <FieldLabel>Street address</FieldLabel>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Elm Street" className="field-input text-sm py-2" />
            </div>

            {/* City + State */}
            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>City</FieldLabel>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Houston" className="field-input text-sm py-2" />
              </div>
              <div className="w-16">
                <FieldLabel>State</FieldLabel>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="TX" className="field-input text-sm py-2 text-center" maxLength={2} />
              </div>
            </div>

            {/* Price */}
            <div>
              <FieldLabel>Price</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-base pb-1.5 font-bold">$</span>
                <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1,450" className="field-input flex-1 text-sm py-2 font-mono font-medium" />
                <div className="flex rounded-lg overflow-hidden border border-white/15 shrink-0 bg-black/20">
                  <button type="button" onClick={() => setPriceType("month")} className={`px-3 py-1.5 text-xs transition-colors ${priceType === "month" ? "bg-accent text-white font-medium shadow-inner" : "text-white/40 hover:text-white"}`}>/mo</button>
                  <button type="button" onClick={() => setPriceType("sale")} className={`px-3 py-1.5 text-xs transition-colors ${priceType === "sale" ? "bg-accent text-white font-medium shadow-inner" : "text-white/40 hover:text-white"}`}>Sale</button>
                </div>
              </div>
            </div>

            {/* Beds / Baths / Sqft */}
            <div className="flex gap-2">
              <div className="flex-1">
                <FieldLabel>Beds</FieldLabel>
                <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" className="field-input text-sm py-2 text-center" />
              </div>
              <div className="flex-1">
                <FieldLabel>Baths</FieldLabel>
                <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" className="field-input text-sm py-2 text-center" />
              </div>
              <div className="flex-1">
                <FieldLabel>Sqft</FieldLabel>
                <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,273" className="field-input text-sm py-2 text-center" />
              </div>
            </div>

            {/* Property type + Garage */}
            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>Type</FieldLabel>
                <input type="text" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} placeholder="House" className="field-input text-sm py-2" />
              </div>
              <div className="flex-1">
                <FieldLabel>Garage</FieldLabel>
                <input type="text" value={garage} onChange={(e) => setGarage(e.target.value)} placeholder="1-Car" className="field-input text-sm py-2" />
              </div>
            </div>

            {/* Amenities */}
            {allAmenities.length > 0 ? (
              <div>
                <FieldLabel>Key Highlights — click to toggle</FieldLabel>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {allAmenities.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={[
                        "text-xs px-3 py-1.5 rounded-full border transition-all duration-200",
                        amenities.includes(a)
                          ? "border-accent bg-accent/20 text-accent-light shadow-[0_0_10px_rgba(26,86,219,0.2)]"
                          : "border-white/10 bg-black/20 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5",
                      ].join(" ")}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 mt-2 text-right">
                  {amenities.length} selected for email
                </p>
              </div>
            ) : (
              <div>
                <FieldLabel>Amenities (comma-separated)</FieldLabel>
                <input
                  type="text"
                  value={amenities.join(", ")}
                  onChange={(e) =>
                    setAmenities(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="Pet-Friendly, Fenced Yard, W/D Hookups"
                  className="field-input text-sm py-2"
                />
              </div>
            )}

            {/* Pet policy */}
            <div>
              <FieldLabel>Pet policy</FieldLabel>
              <input type="text" value={petPolicy} onChange={(e) => setPetPolicy(e.target.value)} placeholder="Dogs & Cats Allowed" className="field-input text-sm py-2" />
            </div>

            {/* CTA */}
            <div>
              <FieldLabel>CTA button</FieldLabel>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {["Apply Now", "Schedule a Showing", "View Details", "Request Info"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCtaText(opt)}
                    className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${ctaText === opt ? "border-accent bg-accent text-white shadow-md" : "border-white/10 bg-black/20 text-white/40 hover:text-white hover:bg-white/5"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://haskerrealtygroup.com/properties/..." className="field-input text-sm py-2" />
            </div>

          </div>

          {/* ── Right panel: preview ──────────────────────────────── */}
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-hidden relative">
            {/* Toolbar overlay */}
            <div className="absolute top-0 inset-x-0 h-12 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10 flex items-center justify-between px-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <p className="text-gray-400 text-[11px] font-semibold tracking-widest uppercase">Inbox Preview</p>
            </div>

            <div className="flex-1 overflow-auto p-8 pt-20 custom-scrollbar">
              {isFilled ? (
                <div
                  dangerouslySetInnerHTML={{ __html: preview }}
                  className="max-w-xl mx-auto shadow-2xl rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">Search for a property to generate a card</p>
                  <p className="text-gray-400 text-sm max-w-xs">Data will sync directly from the Hargrove CRM and render a high-conversion email block.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between bg-white/5">
          <p className="text-white/40 text-xs">This card is responsive and renders perfectly on mobile.</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors">Cancel</button>
            <button
              type="button"
              onClick={() => onInsert(preview)}
              disabled={!isFilled}
              className="px-6 py-2.5 rounded-lg bg-accent text-white text-sm font-bold shadow-[0_0_20px_rgba(26,86,219,0.4)] hover:shadow-[0_0_30px_rgba(26,86,219,0.6)] hover:-translate-y-0.5 disabled:opacity-30 disabled:hover:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              Insert into Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
