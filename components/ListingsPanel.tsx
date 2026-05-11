"use client";

import { useState, useCallback } from "react";
import type { FetchedProperty } from "@/app/api/fetch-property/route";
import type { Contact, SmtpConfig, SendLogEntry } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";

interface ListingsPanelProps {
  contacts: Contact[];
  optOuts: string[];
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  appUrl: string;
  onLogEntry: (e: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

interface PropertySlot {
  url: string;
  status: "pending" | "loading" | "done" | "error";
  data?: FetchedProperty;
  error?: string;
}

function buildShowcaseHtml(properties: FetchedProperty[], title: string): string {
  const intro = `<p style="font-size:15px;color:#374151;margin:0 0 24px;">We found some great properties that match your criteria. Take a look at the latest available homes below.</p>`;

  const cards = properties.map((p) => {
    const photo = p.photos[0] ?? "";
    const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
    const meta = [p.beds && `${p.beds} bed`, p.baths && `${p.baths} bath`, p.sqft && `${Number(p.sqft).toLocaleString()} sqft`].filter(Boolean).join(" · ");
    const amenityList = p.amenities.flatMap((a) => a.items).slice(0, 6);

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#ffffff;">
  <tr>
    <td>
      ${photo ? `<img src="${photo}" alt="${p.address || "Property"}" width="100%" style="display:block;height:200px;object-fit:cover;border-radius:10px 10px 0 0;max-height:200px;" />` : `<div style="height:160px;background:#f3f4f6;border-radius:10px 10px 0 0;"></div>`}
    </td>
  </tr>
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0B1F3A;">${p.price ? `$${Number(p.price).toLocaleString()}${p.priceType === "month" ? "<span style='font-size:14px;font-weight:400;color:#6b7280;'>/mo</span>" : ""}` : "Contact for price"}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#374151;font-weight:500;">${address}</p>
            ${meta ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${meta}</p>` : ""}
            ${p.propertyType ? `<p style="margin:0 0 12px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">${p.propertyType}</p>` : ""}
            ${amenityList.length > 0 ? `<p style="margin:0 0 16px;font-size:12px;color:#6b7280;">${amenityList.slice(0, 4).join(" · ")}</p>` : ""}
            ${p.petPolicy ? `<p style="margin:0 0 16px;font-size:12px;color:#059669;background:#ecfdf5;padding:6px 10px;border-radius:4px;display:inline-block;">${p.petPolicy}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding-top:4px;">
            ${p.applyUrl ? `<a href="${p.applyUrl}" style="display:inline-block;padding:10px 24px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;margin-right:8px;">View Listing →</a>` : ""}
            ${p.virtualTourUrl ? `<a href="${p.virtualTourUrl}" style="display:inline-block;padding:10px 24px;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Virtual Tour</a>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
  });

  return `
<h2 style="font-family:Georgia,serif;font-size:20px;color:#0B1F3A;margin:0 0 8px;font-weight:700;">${title}</h2>
${intro}
${cards.join("\n")}
<p style="font-size:13px;color:#6b7280;margin:24px 0 0;">Questions? Reply to this email or call us — we're happy to help you find the perfect home.</p>`.trim();
}

function PropertyCard({
  slot,
  selected,
  onToggle,
}: {
  slot: PropertySlot;
  selected: boolean;
  onToggle: () => void;
}) {
  const p = slot.data;

  if (slot.status === "loading" || slot.status === "pending") {
    return (
      <div className="bg-white/4 border border-white/8 rounded-xl overflow-hidden animate-pulse">
        <div className="h-36 bg-white/6" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-white/8 rounded w-1/2" />
          <div className="h-3 bg-white/6 rounded w-3/4" />
          <div className="h-3 bg-white/5 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (slot.status === "error" || !p) {
    return (
      <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p className="text-red-400 text-xs truncate">{slot.error ?? "Failed to load"}</p>
      </div>
    );
  }

  const photo = p.photos[0];
  const address = [p.address, p.city, p.state].filter(Boolean).join(", ");
  const meta = [p.beds && `${p.beds} bd`, p.baths && `${p.baths} ba`, p.sqft && `${Number(p.sqft).toLocaleString()} sf`].filter(Boolean).join(" · ");

  return (
    <div
      onClick={onToggle}
      className={[
        "relative bg-white/4 border rounded-xl overflow-hidden cursor-pointer transition-all",
        selected ? "border-accent shadow-lg shadow-accent/20 ring-1 ring-accent/40" : "border-white/8 hover:border-white/20",
      ].join(" ")}
    >
      {/* Checkbox */}
      <div className={[
        "absolute top-3 left-3 w-5 h-5 rounded-md border-2 z-10 flex items-center justify-center transition-colors",
        selected ? "bg-accent border-accent" : "bg-black/50 border-white/30",
      ].join(" ")}>
        {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>

      {photo ? (
        <img src={photo} alt={p.address} className="w-full h-36 object-cover" />
      ) : (
        <div className="w-full h-36 bg-white/6 flex items-center justify-center">
          <span className="text-white/20 text-3xl">🏠</span>
        </div>
      )}

      <div className="p-4">
        <p className="text-white font-semibold text-sm mb-0.5">
          {p.price ? `$${Number(p.price).toLocaleString()}${p.priceType === "month" ? "/mo" : ""}` : "Contact for price"}
        </p>
        <p className="text-white/60 text-xs truncate mb-1">{address || "Address unavailable"}</p>
        <p className="text-white/35 text-[11px]">{meta || p.propertyType}</p>
      </div>
    </div>
  );
}

export default function ListingsPanel({
  contacts, optOuts, smtp, senderName, senderEmail, appUrl,
  onLogEntry, onShowToast,
}: ListingsPanelProps) {
  const [cityInput, setCityInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [slots, setSlots] = useState<PropertySlot[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);

  // Campaign builder state
  const [segment, setSegment] = useState("All");
  const [customSubject, setCustomSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ sent: number; total: number } | null>(null);

  const updateSlot = useCallback((url: string, patch: Partial<PropertySlot>) => {
    setSlots((prev) => prev.map((s) => (s.url === url ? { ...s, ...patch } : s)));
  }, []);

  async function handleSearch() {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    setSlots([]);
    setSelectedUrls(new Set());
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search-properties?city=${encodeURIComponent(cityInput.trim())}`);
      const data = await res.json() as { urls?: string[]; error?: string };

      if (!res.ok || data.error || !data.urls?.length) {
        setIsSearching(false);
        onShowToast("error", data.error ?? "No properties found. Try a different city name.");
        return;
      }

      const initial: PropertySlot[] = data.urls.map((url) => ({ url, status: "pending" as const }));
      setSlots(initial);
      setIsSearching(false);

      // Fetch all details in parallel (batches of 4)
      const batch = 4;
      for (let i = 0; i < initial.length; i += batch) {
        const chunk = initial.slice(i, i + batch);
        await Promise.all(
          chunk.map(async (slot) => {
            updateSlot(slot.url, { status: "loading" });
            try {
              const r = await fetch(`/api/fetch-property?url=${encodeURIComponent(slot.url)}`);
              const d = await r.json() as FetchedProperty & { error?: string };
              if (r.ok && !d.error) {
                updateSlot(slot.url, { status: "done", data: d });
              } else {
                updateSlot(slot.url, { status: "error", error: d.error ?? "Failed" });
              }
            } catch {
              updateSlot(slot.url, { status: "error", error: "Network error" });
            }
          })
        );
      }
    } catch {
      setIsSearching(false);
      onShowToast("error", "Search failed — check your connection.");
    }
  }

  function toggleSelect(url: string) {
    setSelectedUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  function selectAll() {
    const done = slots.filter((s) => s.status === "done").map((s) => s.url);
    setSelectedUrls(new Set(done));
  }

  const selectedProperties = slots
    .filter((s) => s.status === "done" && s.data && selectedUrls.has(s.url))
    .map((s) => s.data!);

  const recipients = contacts.filter((c) => {
    if (c.unsubscribed || optOuts.includes(c.email.toLowerCase())) return false;
    return segment === "All" || c.tags.includes(segment);
  });

  const defaultSubject = cityInput
    ? `New Listings in ${cityInput} — Available Now`
    : "New Property Listings Just for You";

  const effectiveSubject = customSubject.trim() || defaultSubject;

  async function launchCampaign() {
    if (selectedProperties.length === 0) { onShowToast("error", "Select at least one property."); return; }
    if (recipients.length === 0) { onShowToast("error", "No eligible contacts in selected segment."); return; }
    if (!smtp.host || !senderEmail) { onShowToast("error", "Configure SMTP and Sender Email first."); return; }

    setIsSending(true);
    setSendProgress({ sent: 0, total: recipients.length });
    let sent = 0;
    const errors: string[] = [];

    const bodyHtml = buildShowcaseHtml(selectedProperties, effectiveSubject);

    for (let i = 0; i < recipients.length; i++) {
      const contact = recipients[i];
      const firstName = contact.name?.split(" ")[0] || contact.email.split("@")[0];
      const personalizedBody = bodyHtml.replace(/{{first_name}}/gi, firstName).replace(/{{name}}/gi, contact.name || firstName);

      const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}`;
      let finalHtml = wrapWithBrandTemplate(personalizedBody, effectiveSubject).replace("{{UNSUB_URL}}", unsubUrl);
      const sendId = crypto.randomUUID();
      if (appUrl) finalHtml = injectTracking(finalHtml, sendId, contact.email, appUrl);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp, senderName, senderEmail,
            recipientEmail: contact.email,
            subject: effectiveSubject,
            htmlBody: finalHtml,
          }),
        });
        const data = await res.json();
        onLogEntry({
          id: sendId, timestamp: new Date().toISOString(),
          to: contact.email, subject: effectiveSubject,
          status: data.success ? "success" : "error",
          ...(!data.success && { error: data.error }),
        });
        if (data.success) sent++;
        else errors.push(contact.email);
      } catch {
        errors.push(contact.email);
      }

      setSendProgress({ sent: i + 1, total: recipients.length });
    }

    setIsSending(false);
    setSendProgress(null);
    if (errors.length === 0) {
      onShowToast("success", `Campaign sent — ${sent} emails delivered.`);
    } else {
      onShowToast("error", `${sent} sent, ${errors.length} failed. Check Send Log.`);
    }
  }

  const doneCount = slots.filter((s) => s.status === "done").length;
  const loadingCount = slots.filter((s) => s.status === "loading" || s.status === "pending").length;

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[#0a1929]">
      {/* Header */}
      <div className="px-8 pt-7 pb-5 border-b border-white/8 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold tracking-tight">Property Discovery</h1>
            <p className="text-white/35 text-xs mt-0.5">Search haskerrealtygroup.com by city and launch campaigns from the results</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSearching && handleSearch()}
              placeholder="Enter city and state — e.g. Houston, TX"
              className="w-full bg-white/5 border border-white/12 hover:border-white/20 focus:border-accent/60 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!cityInput.trim() || isSearching}
            className="px-6 py-2.5 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSearching ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Searching…</>
            ) : (
              <>Search Listings</>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Property grid */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {!hasSearched && (
            <div className="flex flex-col items-center justify-center h-64 text-white/20">
              <span className="text-5xl mb-4">🏘️</span>
              <p className="text-sm">Enter a city to discover available properties</p>
              <p className="text-xs mt-1">Properties are fetched live from haskerrealtygroup.com</p>
            </div>
          )}

          {hasSearched && slots.length === 0 && !isSearching && (
            <div className="flex flex-col items-center justify-center h-64 text-white/20">
              <span className="text-4xl mb-3">🔍</span>
              <p className="text-sm">No properties found for &ldquo;{cityInput}&rdquo;</p>
              <p className="text-xs mt-1">Try a different city name or check the URL spelling</p>
            </div>
          )}

          {slots.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <p className="text-white/60 text-sm">
                    {doneCount} properties loaded
                    {loadingCount > 0 && <span className="text-white/30 ml-1">· {loadingCount} loading…</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedUrls.size > 0 && (
                    <span className="text-accent-light text-xs font-semibold">{selectedUrls.size} selected</span>
                  )}
                  <button onClick={selectAll} className="text-xs text-white/40 hover:text-white transition-colors">Select All</button>
                  <button onClick={() => setSelectedUrls(new Set())} className="text-xs text-white/30 hover:text-white/60 transition-colors">Clear</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {slots.map((slot) => (
                  <PropertyCard
                    key={slot.url}
                    slot={slot}
                    selected={selectedUrls.has(slot.url)}
                    onToggle={() => toggleSelect(slot.url)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Campaign builder sidebar */}
        {selectedProperties.length > 0 && (
          <div className="w-80 shrink-0 border-l border-white/8 flex flex-col bg-navy/60">
            <div className="px-5 pt-5 pb-4 border-b border-white/8">
              <p className="text-white font-semibold text-sm">Campaign Builder</p>
              <p className="text-white/35 text-[10px] mt-0.5">{selectedProperties.length} {selectedProperties.length === 1 ? "property" : "properties"} selected</p>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
              {/* Selected properties summary */}
              <div className="flex flex-col gap-2">
                {selectedProperties.slice(0, 4).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-white/4 rounded-lg px-3 py-2">
                    <span className="text-accent-light font-medium">${p.price ? Number(p.price).toLocaleString() : "—"}</span>
                    <span className="text-white/50 truncate">{p.address}</span>
                  </div>
                ))}
                {selectedProperties.length > 4 && (
                  <p className="text-white/25 text-[10px] pl-1">+{selectedProperties.length - 4} more</p>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="field-label">Subject line</label>
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={defaultSubject}
                  className="field-input text-xs"
                />
                <p className="text-[10px] text-white/25 mt-1">Leave blank to use the default above</p>
              </div>

              {/* Recipients */}
              <div>
                <label className="field-label">Send to segment</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {["All", ...CONTACT_TAGS].map((tag) => {
                    const count = tag === "All"
                      ? contacts.filter(c => !c.unsubscribed && !optOuts.includes(c.email.toLowerCase())).length
                      : contacts.filter(c => c.tags.includes(tag) && !c.unsubscribed && !optOuts.includes(c.email.toLowerCase())).length;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSegment(tag)}
                        className={[
                          "text-[10px] px-2 py-1 rounded-full border transition-colors",
                          segment === tag ? "border-accent bg-accent/20 text-accent-light" : "border-white/12 text-white/35 hover:text-white",
                        ].join(" ")}
                      >
                        {tag} ({count})
                      </button>
                    );
                  })}
                </div>
                {recipients.length === 0 && contacts.length > 0 && (
                  <p className="text-amber-400/70 text-[10px] mt-2">No eligible contacts in this segment.</p>
                )}
                {contacts.length === 0 && (
                  <p className="text-white/30 text-[10px] mt-2">No contacts yet — add some in the Contacts tab.</p>
                )}
              </div>

              {/* Send progress */}
              {sendProgress && (
                <div>
                  <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
                    <span>Sending campaign…</span>
                    <span>{sendProgress.sent}/{sendProgress.total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.round((sendProgress.sent / sendProgress.total) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/8 shrink-0">
              <button
                onClick={launchCampaign}
                disabled={isSending || recipients.length === 0 || selectedProperties.length === 0}
                className="w-full py-3 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSending ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Sending…</>
                ) : (
                  <> 🚀 Launch Campaign ({recipients.length})</>
                )}
              </button>
              <p className="text-center text-[10px] text-white/25 mt-2">
                {selectedProperties.length} listings → {recipients.length} contact{recipients.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
