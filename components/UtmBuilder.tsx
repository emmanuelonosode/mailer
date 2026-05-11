"use client";

import { useState, useMemo } from "react";

interface UtmBuilderProps {
  htmlBody: string;
  onApply: (updatedHtml: string) => void;
  onClose: () => void;
}

interface LinkEntry {
  original: string;
  preview: string; // truncated for display
}

function extractLinks(html: string): LinkEntry[] {
  const regex = /href="([^"]+)"/gi;
  const seen = new Set<string>();
  const links: LinkEntry[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    if (seen.has(url)) continue;
    if (url.startsWith("mailto:") || url.startsWith("#")) continue;
    seen.add(url);
    links.push({
      original: url,
      preview: url.length > 60 ? url.slice(0, 57) + "…" : url,
    });
  }
  return links;
}

function appendUtm(url: string, params: Record<string, string>): string {
  try {
    const u = new URL(url);
    Object.entries(params).forEach(([k, v]) => {
      if (v.trim()) u.searchParams.set(k, v.trim());
    });
    return u.toString();
  } catch {
    // relative or malformed URL — append manually
    const sep = url.includes("?") ? "&" : "?";
    const qs = Object.entries(params)
      .filter(([, v]) => v.trim())
      .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
      .join("&");
    return qs ? url + sep + qs : url;
  }
}

function applyUtmToHtml(html: string, params: Record<string, string>): string {
  return html.replace(/href="([^"]+)"/gi, (_, url: string) => {
    if (url.startsWith("mailto:") || url.startsWith("#")) return `href="${url}"`;
    return `href="${appendUtm(url, params)}"`;
  });
}

const PRESETS = [
  { label: "New Listing Email", campaign: "new-listing", medium: "email", source: "hasker-crm" },
  { label: "Price Drop Alert", campaign: "price-drop", medium: "email", source: "hasker-crm" },
  { label: "City Spotlight", campaign: "city-spotlight", medium: "email", source: "hasker-crm" },
  { label: "Monthly Newsletter", campaign: "newsletter", medium: "email", source: "hasker-crm" },
  { label: "Re-Engagement", campaign: "re-engagement", medium: "email", source: "hasker-crm" },
];

export default function UtmBuilder({ htmlBody, onApply, onClose }: UtmBuilderProps) {
  const [source, setSource] = useState("hasker-crm");
  const [medium, setMedium] = useState("email");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");

  const links = useMemo(() => extractLinks(htmlBody), [htmlBody]);

  const params: Record<string, string> = {
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    ...(content.trim() && { utm_content: content }),
  };

  function applyPreset(p: (typeof PRESETS)[number]) {
    setSource(p.source);
    setMedium(p.medium);
    setCampaign(p.campaign);
  }

  function handleApply() {
    const updated = applyUtmToHtml(htmlBody, params);
    onApply(updated);
  }

  const previewUrl = links[0]
    ? appendUtm(links[0].original, params)
    : null;

  const canApply = source.trim() && medium.trim() && campaign.trim() && links.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">UTM Link Manager</p>
            <p className="text-white/35 text-[10px] tracking-[0.15em] uppercase mt-0.5">
              Append UTM tracking to every link in your email
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

          {/* Links found */}
          <div>
            <p className="field-label mb-2">
              Links detected in email ({links.length})
            </p>
            {links.length === 0 ? (
              <p className="text-white/30 text-xs">No links found in the current email body.</p>
            ) : (
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                {links.map((l) => (
                  <div key={l.original} className="flex items-center gap-2 text-xs">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light/40 shrink-0">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <span className="text-white/50 font-mono truncate">{l.preview}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Presets */}
          <div>
            <p className="field-label mb-2">Quick presets</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.campaign}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={[
                    "text-[10px] px-2 py-1 rounded border transition-colors",
                    campaign === p.campaign && source === p.source
                      ? "border-accent bg-accent/20 text-accent-light"
                      : "border-white/15 text-white/40 hover:text-white hover:border-white/25",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* UTM fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="field-label">utm_source *</label>
              <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="hasker-crm" className="field-input text-xs" />
            </div>
            <div>
              <label className="field-label">utm_medium *</label>
              <input type="text" value={medium} onChange={(e) => setMedium(e.target.value)} placeholder="email" className="field-input text-xs" />
            </div>
            <div>
              <label className="field-label">utm_campaign *</label>
              <input type="text" value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="new-listing-houston" className="field-input text-xs" />
            </div>
            <div>
              <label className="field-label">utm_content <span className="normal-case font-normal tracking-normal text-white/25">optional</span></label>
              <input type="text" value={content} onChange={(e) => setContent(e.target.value)} placeholder="cta-button" className="field-input text-xs" />
            </div>
          </div>

          {/* Preview */}
          {previewUrl && campaign.trim() && (
            <div>
              <p className="field-label mb-1.5">Preview (first link)</p>
              <p className="text-[10px] font-mono text-accent-light/60 break-all leading-relaxed bg-white/4 rounded px-3 py-2 border border-white/8">
                {previewUrl}
              </p>
            </div>
          )}

          {links.length === 0 && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3">
              <p className="text-amber-300/80 text-xs">
                No links found. Add hyperlinks to your email body first, then come back here to add UTM parameters.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/8 shrink-0 flex items-center justify-between">
          <p className="text-white/30 text-xs">
            Applies to {links.length} link{links.length !== 1 ? "s" : ""}.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Apply to All Links →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
