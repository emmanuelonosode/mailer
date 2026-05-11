"use client";

import { useState } from "react";
import type { FetchedProperty } from "@/app/api/fetch-property/route";

interface MultiListingShowcaseProps {
  onInsert: (html: string) => void;
  onClose: () => void;
}

interface FetchedSlot {
  status: "idle" | "loading" | "done" | "error";
  property?: FetchedProperty;
  error?: string;
}

function buildShowcaseHtml(properties: FetchedProperty[]): string {
  const cards = properties.map((p) => {
    const photo = p.photos[0] ?? "";
    const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
    const meta = [p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${p.sqft} sqft`]
      .filter(Boolean).join(" · ");

    return `
<td width="50%" valign="top" style="padding: 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;background:#fff;">
    <tr>
      <td>
        ${photo ? `<img src="${photo}" alt="${p.address}" width="100%" style="display:block;height:180px;object-fit:cover;border-radius:8px 8px 0 0;" />` : `<div style="height:180px;background:#f3f4f6;border-radius:8px 8px 0 0;"></div>`}
      </td>
    </tr>
    <tr>
      <td style="padding:16px;">
        <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#0B1F3A;">${p.price ? `$${p.price}${p.priceType === "month" ? "/mo" : ""}` : "Contact for price"}</p>
        <p style="margin:0 0 8px;font-size:13px;color:#374151;">${address}</p>
        <p style="margin:0 0 12px;font-size:12px;color:#6b7280;">${meta}</p>
        ${p.applyUrl ? `<a href="${p.applyUrl}" style="display:inline-block;padding:8px 20px;background:#1A56DB;color:#fff;font-size:12px;font-weight:600;text-decoration:none;border-radius:6px;">View Listing →</a>` : ""}
      </td>
    </tr>
  </table>
</td>`.trim();
  });

  const rows: string[] = [];
  for (let i = 0; i < cards.length; i += 2) {
    const pair = cards.slice(i, i + 2);
    if (pair.length === 1) pair.push('<td width="50%" style="padding:8px;"></td>');
    rows.push(`<tr>${pair.join("")}</tr>`);
  }

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr><td align="center" style="padding-bottom:16px;">
    <p style="font-family:Georgia,serif;font-size:20px;color:#0B1F3A;margin:0;font-weight:700;">Featured Listings</p>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#9ca3af;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase;">Hasker &amp; Co. Realty Group</p>
  </td></tr>
  <tr><td>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${rows.join("\n      ")}
    </table>
  </td></tr>
</table>`.trim();
}

export default function MultiListingShowcase({ onInsert, onClose }: MultiListingShowcaseProps) {
  const [urls, setUrls] = useState<string[]>(["", ""]);
  const [slots, setSlots] = useState<FetchedSlot[]>([{ status: "idle" }, { status: "idle" }]);
  const [isFetching, setIsFetching] = useState(false);

  function addUrl() {
    if (urls.length >= 4) return;
    setUrls([...urls, ""]);
    setSlots([...slots, { status: "idle" }]);
  }

  function removeUrl(i: number) {
    setUrls(urls.filter((_, idx) => idx !== i));
    setSlots(slots.filter((_, idx) => idx !== i));
  }

  async function fetchAll() {
    setIsFetching(true);
    const newSlots = [...slots];

    await Promise.all(
      urls.map(async (url, i) => {
        if (!url.trim()) return;
        newSlots[i] = { status: "loading" };
        setSlots([...newSlots]);
        try {
          const res = await fetch(`/api/fetch-property?url=${encodeURIComponent(url.trim())}`);
          const data = await res.json() as FetchedProperty & { error?: string };
          if (res.ok && !data.error) {
            newSlots[i] = { status: "done", property: data };
          } else {
            newSlots[i] = { status: "error", error: data.error ?? "Failed to fetch" };
          }
        } catch {
          newSlots[i] = { status: "error", error: "Network error" };
        }
        setSlots([...newSlots]);
      })
    );
    setIsFetching(false);
  }

  const fetchedProperties = slots
    .map((s) => s.property)
    .filter((p): p is FetchedProperty => !!p);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-navy border border-white/10 rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Multi-Listing Showcase</p>
            <p className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">Feature up to 4 properties in a grid</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* URL inputs */}
          <div className="flex flex-col gap-3">
            {urls.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      const next = [...urls];
                      next[i] = e.target.value;
                      setUrls(next);
                    }}
                    placeholder="https://haskerrealtygroup.com/properties/..."
                    className="field-input text-xs"
                  />
                </div>
                <div className="w-20 shrink-0">
                  {slots[i]?.status === "loading" && (
                    <span className="text-[10px] text-white/40 animate-pulse">Fetching…</span>
                  )}
                  {slots[i]?.status === "done" && (
                    <span className="text-[10px] text-green-400">✓ Fetched</span>
                  )}
                  {slots[i]?.status === "error" && (
                    <span className="text-[10px] text-red-400">Error</span>
                  )}
                </div>
                {urls.length > 2 && (
                  <button onClick={() => removeUrl(i)} className="text-white/25 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                )}
              </div>
            ))}
            {urls.length < 4 && (
              <button onClick={addUrl} className="text-xs text-white/30 hover:text-white/60 self-start transition-colors">+ Add another property</button>
            )}
          </div>

          {/* Fetched preview */}
          {fetchedProperties.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 mb-3">Preview ({fetchedProperties.length} properties)</p>
              <div className="grid grid-cols-2 gap-3">
                {fetchedProperties.map((p, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                    {p.photos[0] && (
                      <img src={p.photos[0]} alt={p.address} className="w-full h-28 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="text-xs font-semibold text-white">{p.price ? `$${p.price}${p.priceType === "month" ? "/mo" : ""}` : "—"}</p>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">{p.address}, {p.city}</p>
                      <p className="text-[10px] text-white/30 mt-1">{[p.beds && `${p.beds}bd`, p.baths && `${p.baths}ba`, p.sqft && `${p.sqft}sqft`].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
          <button
            onClick={fetchAll}
            disabled={isFetching || urls.every(u => !u.trim())}
            className="px-4 py-2 rounded-md border border-white/15 text-white/60 text-xs font-medium hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors"
          >
            {isFetching ? "Fetching…" : "Fetch All Properties"}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
            <button
              onClick={() => {
                if (fetchedProperties.length > 0) {
                  onInsert(buildShowcaseHtml(fetchedProperties));
                }
              }}
              disabled={fetchedProperties.length === 0}
              className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Insert into Email →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
