"use client";

import { useState } from "react";
import type { FetchedProperty, AmenitySection } from "@/app/api/fetch-property/route";

interface PropertyCardBuilderProps {
  onInsert: (html: string) => void;
  onClose: () => void;
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
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin:20px 0;font-family:Arial,Helvetica,sans-serif;">
  ${
    fields.photoUrl
      ? `<tr>
    <td style="padding:0;line-height:0;">
      <img src="${fields.photoUrl}" alt="${fields.address}" width="520" style="width:100%;max-height:240px;object-fit:cover;display:block;" />
    </td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding:20px 24px 0 24px;">
      <p style="font-size:26px;font-weight:800;color:#0B1F3A;margin:0 0 4px 0;">$${fields.price}${priceLabel}</p>
      <p style="font-size:13px;color:#374151;margin:0 0 12px 0;">
        ${fields.address}${fields.city ? ` &nbsp;·&nbsp; ${fields.city}` : ""}${fields.state ? `, ${fields.state}` : ""}
      </p>
      ${
        metaCells
          ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
        <tr>${metaCells}</tr>
      </table>`
          : ""
      }
      ${amenityPills ? `<div style="margin-bottom:16px;line-height:1.2;">${amenityPills}</div>` : ""}
    </td>
  </tr>
  ${
    fields.petPolicy
      ? `<tr>
    <td style="padding:0 24px 12px 24px;">
      <p style="font-size:12px;color:#6b7280;margin:0;">🐾 ${fields.petPolicy}</p>
    </td>
  </tr>`
      : ""
  }
  <tr>
    <td style="padding:0 24px 20px 24px;">
      ${
        fields.ctaUrl
          ? `<a href="${fields.ctaUrl}" style="display:inline-block;padding:11px 24px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;border-radius:6px;font-family:Arial,Helvetica,sans-serif;margin-right:10px;">${fields.ctaText} →</a>`
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
  // Fetch state
  const [urlInput, setUrlInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchedData, setFetchedData] = useState<FetchedProperty | null>(null);

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

  async function handleFetch() {
    const url = urlInput.trim();
    if (!url) return;
    setFetching(true);
    setFetchError("");

    try {
      const res = await fetch(`/api/fetch-property?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        setFetchError(data.error ?? "Failed to fetch property.");
        return;
      }

      const p = data as FetchedProperty;
      setFetchedData(p);

      // Populate form fields
      setAddress(p.address);
      setCity(p.city);
      setState(p.state);
      setPrice(p.price);
      setPriceType(p.priceType);
      setBeds(p.beds);
      setBaths(p.baths);
      setSqft(p.sqft);
      setPropertyType(p.propertyType);
      setGarage(p.garage);
      setPetPolicy(p.petPolicy);
      setCtaUrl(p.applyUrl);
      setCtaText("Apply Now");

      // Photos
      setAllPhotos(p.photos);
      setPhotoUrl(p.photos[0] ?? "");

      // Flatten amenities from all sections
      const flat = p.amenities.flatMap((s: AmenitySection) => s.items);
      const unique = [...new Set(flat)].filter((a) => a.length > 2);
      setAllAmenities(unique);
      setAmenities(unique); // all selected by default
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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Listing Card Builder</p>
            <p className="text-white/35 text-[10px] tracking-[0.15em] uppercase mt-0.5">
              Paste a Hasker &amp; Co. property URL to auto-fill
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left panel: form ─────────────────────────────────── */}
          <div className="w-[340px] shrink-0 border-r border-white/8 overflow-y-auto p-5 flex flex-col gap-4">

            {/* URL fetch */}
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
              <FieldLabel>Auto-fill from URL</FieldLabel>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  placeholder="https://haskerrealtygroup.com/properties/…"
                  className="flex-1 bg-transparent border-b border-white/20 pb-1 text-[11px] text-white/80 placeholder:text-white/25 outline-none focus:border-accent text-xs font-mono"
                  spellCheck={false}
                />
                <button
                  type="button"
                  onClick={handleFetch}
                  disabled={fetching || !urlInput.trim()}
                  className="px-3 py-1 text-xs rounded bg-accent text-white hover:bg-accent/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center gap-1.5"
                >
                  {fetching ? (
                    <>
                      <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Fetching…
                    </>
                  ) : "Fetch"}
                </button>
              </div>
              {fetchError && (
                <p className="text-red-400/80 text-[10px] mt-2">{fetchError}</p>
              )}
              {fetchedData && !fetchError && (
                <p className="text-green-400/80 text-[10px] mt-2 flex items-center gap-1">
                  <span>✓</span> Auto-filled from listing — edit any field below
                </p>
              )}
            </div>

            {/* Photo picker */}
            {allPhotos.length > 0 && (
              <div>
                <FieldLabel>Choose photo ({allPhotos.length} available)</FieldLabel>
                <div className="grid grid-cols-4 gap-1">
                  {allPhotos.slice(0, 12).map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoUrl(url)}
                      className={[
                        "relative rounded overflow-hidden border-2 transition-colors aspect-square",
                        photoUrl === url ? "border-accent" : "border-transparent hover:border-white/30",
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
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setPhotoUrl("")}
                  className="text-[10px] text-white/25 hover:text-white/50 transition-colors mt-1"
                >
                  No photo
                </button>
              </div>
            )}

            {/* Manual photo URL */}
            {allPhotos.length === 0 && (
              <div>
                <FieldLabel>Property photo URL</FieldLabel>
                <input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…/photo.jpg" className="field-input text-xs" />
              </div>
            )}

            {/* Address */}
            <div>
              <FieldLabel>Street address</FieldLabel>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Elm Street" className="field-input text-xs" />
            </div>

            {/* City + State */}
            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>City</FieldLabel>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Houston" className="field-input text-xs" />
              </div>
              <div className="w-14">
                <FieldLabel>State</FieldLabel>
                <input type="text" value={state} onChange={(e) => setState(e.target.value)} placeholder="TX" className="field-input text-xs" maxLength={2} />
              </div>
            </div>

            {/* Price */}
            <div>
              <FieldLabel>Price</FieldLabel>
              <div className="flex items-center gap-2">
                <span className="text-white/50 text-sm pb-1.5">$</span>
                <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1,450" className="field-input flex-1 text-xs" />
                <div className="flex rounded overflow-hidden border border-white/15 shrink-0">
                  <button type="button" onClick={() => setPriceType("month")} className={`px-2 py-1 text-[10px] transition-colors ${priceType === "month" ? "bg-accent text-white" : "text-white/40 hover:text-white"}`}>/mo</button>
                  <button type="button" onClick={() => setPriceType("sale")} className={`px-2 py-1 text-[10px] transition-colors ${priceType === "sale" ? "bg-accent text-white" : "text-white/40 hover:text-white"}`}>Sale</button>
                </div>
              </div>
            </div>

            {/* Beds / Baths / Sqft */}
            <div className="flex gap-2">
              <div className="flex-1">
                <FieldLabel>Beds</FieldLabel>
                <input type="text" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="3" className="field-input text-xs" />
              </div>
              <div className="flex-1">
                <FieldLabel>Baths</FieldLabel>
                <input type="text" value={baths} onChange={(e) => setBaths(e.target.value)} placeholder="2" className="field-input text-xs" />
              </div>
              <div className="flex-1">
                <FieldLabel>Sqft</FieldLabel>
                <input type="text" value={sqft} onChange={(e) => setSqft(e.target.value)} placeholder="1,273" className="field-input text-xs" />
              </div>
            </div>

            {/* Property type + Garage */}
            <div className="flex gap-3">
              <div className="flex-1">
                <FieldLabel>Type</FieldLabel>
                <input type="text" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} placeholder="House" className="field-input text-xs" />
              </div>
              <div className="flex-1">
                <FieldLabel>Garage</FieldLabel>
                <input type="text" value={garage} onChange={(e) => setGarage(e.target.value)} placeholder="1-Car" className="field-input text-xs" />
              </div>
            </div>

            {/* Amenities */}
            {allAmenities.length > 0 ? (
              <div>
                <FieldLabel>Amenities — click to toggle</FieldLabel>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {allAmenities.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={[
                        "text-[10px] px-2 py-1 rounded-full border transition-colors",
                        amenities.includes(a)
                          ? "border-accent bg-accent/20 text-accent-light"
                          : "border-white/12 text-white/35 hover:text-white hover:border-white/25",
                      ].join(" ")}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/25 mt-1">
                  {amenities.length} of {allAmenities.length} selected
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
                  className="field-input text-xs"
                />
              </div>
            )}

            {/* Pet policy */}
            {petPolicy && (
              <div>
                <FieldLabel>Pet policy</FieldLabel>
                <input type="text" value={petPolicy} onChange={(e) => setPetPolicy(e.target.value)} className="field-input text-xs" />
              </div>
            )}

            {/* CTA */}
            <div>
              <FieldLabel>CTA button</FieldLabel>
              <div className="flex gap-1 mb-1.5">
                {["Apply Now", "Schedule a Showing", "View Listing", "Request Info"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCtaText(opt)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${ctaText === opt ? "border-accent bg-accent/20 text-accent-light" : "border-white/12 text-white/35 hover:text-white"}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <input type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://haskerrealtygroup.com/apply?property=…" className="field-input text-xs" />
            </div>

          </div>

          {/* ── Right panel: preview ──────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-white/8 shrink-0 flex items-center justify-between">
              <p className="text-white/40 text-xs tracking-widest uppercase">Live Preview</p>
              {fetchedData?.virtualTourUrl && (
                <a
                  href={fetchedData.virtualTourUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-accent-light/50 hover:text-accent-light transition-colors"
                >
                  360° Tour ↗
                </a>
              )}
            </div>
            <div className="flex-1 bg-gray-100 overflow-auto p-6">
              {isFilled ? (
                <div
                  dangerouslySetInnerHTML={{ __html: preview }}
                  className="max-w-lg mx-auto"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <p className="text-gray-400 text-sm">Paste a property URL above or fill in the form</p>
                  <p className="text-gray-300 text-xs">Preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
          <p className="text-white/30 text-xs">Card will be appended to your email body.</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
            <button
              type="button"
              onClick={() => onInsert(preview)}
              disabled={!isFilled}
              className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Insert Card →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
