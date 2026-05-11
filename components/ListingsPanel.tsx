"use client";

import { useCallback, useState } from "react";
import type { FetchedProperty } from "@/app/api/fetch-property/route";
import type { Contact, SendLogEntry } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";

interface ListingsPanelProps {
  contacts: Contact[];
  optOuts: string[];
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

  const cards = properties.map((property) => {
    const photo = property.photos[0] ?? "";
    const address = [property.address, property.city, property.state].filter(Boolean).join(", ");
    const meta = [
      property.beds && `${property.beds} bed`,
      property.baths && `${property.baths} bath`,
      property.sqft && `${Number(property.sqft).toLocaleString()} sqft`,
    ]
      .filter(Boolean)
      .join(" | ");
    const amenityList = property.amenities.flatMap((section) => section.items).slice(0, 6);

    return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#ffffff;">
  <tr>
    <td>
      ${photo ? `<img src="${photo}" alt="${property.address || "Property"}" width="100%" style="display:block;height:200px;object-fit:cover;border-radius:10px 10px 0 0;max-height:200px;" />` : `<div style="height:160px;background:#f3f4f6;border-radius:10px 10px 0 0;"></div>`}
    </td>
  </tr>
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px;font-weight:700;color:#0B1F3A;">${property.price ? `$${Number(property.price).toLocaleString()}${property.priceType === "month" ? "<span style='font-size:14px;font-weight:400;color:#6b7280;'>/mo</span>" : ""}` : "Contact for price"}</p>
            <p style="margin:0 0 6px;font-size:14px;color:#374151;font-weight:500;">${address}</p>
            ${meta ? `<p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${meta}</p>` : ""}
            ${property.propertyType ? `<p style="margin:0 0 12px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">${property.propertyType}</p>` : ""}
            ${amenityList.length > 0 ? `<p style="margin:0 0 16px;font-size:12px;color:#6b7280;">${amenityList.slice(0, 4).join(" | ")}</p>` : ""}
            ${property.petPolicy ? `<p style="margin:0 0 16px;font-size:12px;color:#059669;background:#ecfdf5;padding:6px 10px;border-radius:4px;display:inline-block;">${property.petPolicy}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding-top:4px;">
            ${property.applyUrl ? `<a href="${property.applyUrl}" style="display:inline-block;padding:10px 24px;background:#1A56DB;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;margin-right:8px;">View Listing</a>` : ""}
            ${property.virtualTourUrl ? `<a href="${property.virtualTourUrl}" style="display:inline-block;padding:10px 24px;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;text-decoration:none;border-radius:6px;">Virtual Tour</a>` : ""}
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
<p style="font-size:13px;color:#6b7280;margin:24px 0 0;">Questions? Reply to this email or call us. We're happy to help you find the right home.</p>`.trim();
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
  const property = slot.data;

  if (slot.status === "loading" || slot.status === "pending") {
    return (
      <div className="overflow-hidden rounded-xl border border-white/8 bg-white/4 animate-pulse">
        <div className="h-36 bg-white/6" />
        <div className="space-y-2 p-4">
          <div className="h-4 w-1/2 rounded bg-white/8" />
          <div className="h-3 w-3/4 rounded bg-white/6" />
          <div className="h-3 w-1/3 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  if (slot.status === "error" || !property) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 p-4">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-red-400">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="truncate text-xs text-red-400">{slot.error ?? "Failed to load"}</p>
      </div>
    );
  }

  const photo = property.photos[0];
  const address = [property.address, property.city, property.state].filter(Boolean).join(", ");
  const meta = [
    property.beds && `${property.beds} bd`,
    property.baths && `${property.baths} ba`,
    property.sqft && `${Number(property.sqft).toLocaleString()} sf`,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <button
      type="button"
      onClick={onToggle}
      className={[
        "relative overflow-hidden rounded-xl border bg-white/4 text-left transition-all",
        selected
          ? "border-accent ring-1 ring-accent/40 shadow-lg shadow-accent/20"
          : "border-white/8 hover:border-white/20",
      ].join(" ")}
    >
      <div
        className={[
          "absolute left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
          selected ? "border-accent bg-accent" : "border-white/30 bg-black/50",
        ].join(" ")}
      >
        {selected && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {photo ? (
        <img src={photo} alt={property.address} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-white/6">
          <span className="text-3xl text-white/20">Home</span>
        </div>
      )}

      <div className="p-4">
        <p className="mb-0.5 text-sm font-semibold text-white">
          {property.price ? `$${Number(property.price).toLocaleString()}${property.priceType === "month" ? "/mo" : ""}` : "Contact for price"}
        </p>
        <p className="mb-1 truncate text-xs text-white/60">{address || "Address unavailable"}</p>
        <p className="text-[11px] text-white/35">{meta || property.propertyType}</p>
      </div>
    </button>
  );
}

export default function ListingsPanel({
  contacts,
  optOuts,
  senderName,
  senderEmail,
  appUrl,
  onLogEntry,
  onShowToast,
}: ListingsPanelProps) {
  const [cityInput, setCityInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [slots, setSlots] = useState<PropertySlot[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());
  const [hasSearched, setHasSearched] = useState(false);
  const [segment, setSegment] = useState("All");
  const [customSubject, setCustomSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState<{ sent: number; total: number } | null>(null);

  const updateSlot = useCallback((url: string, patch: Partial<PropertySlot>) => {
    setSlots((prev) => prev.map((slot) => (slot.url === url ? { ...slot, ...patch } : slot)));
  }, []);

  async function handleSearch() {
    if (!cityInput.trim()) return;
    setIsSearching(true);
    setSlots([]);
    setSelectedUrls(new Set());
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search-properties?city=${encodeURIComponent(cityInput.trim())}`);
      const data = (await res.json()) as { urls?: string[]; error?: string };

      if (!res.ok || data.error || !data.urls?.length) {
        setIsSearching(false);
        onShowToast("error", data.error ?? "No properties found. Try a different city name.");
        return;
      }

      const initial: PropertySlot[] = data.urls.map((url) => ({ url, status: "pending" }));
      setSlots(initial);
      setIsSearching(false);

      const batchSize = 4;
      for (let i = 0; i < initial.length; i += batchSize) {
        const chunk = initial.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async (slot) => {
            updateSlot(slot.url, { status: "loading" });
            try {
              const response = await fetch(`/api/fetch-property?url=${encodeURIComponent(slot.url)}`);
              const property = (await response.json()) as FetchedProperty & { error?: string };
              if (response.ok && !property.error) {
                updateSlot(slot.url, { status: "done", data: property });
              } else {
                updateSlot(slot.url, { status: "error", error: property.error ?? "Failed" });
              }
            } catch {
              updateSlot(slot.url, { status: "error", error: "Network error" });
            }
          }),
        );
      }
    } catch {
      setIsSearching(false);
      onShowToast("error", "Search failed. Check your connection.");
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
    const done = slots.filter((slot) => slot.status === "done").map((slot) => slot.url);
    setSelectedUrls(new Set(done));
  }

  const selectedProperties = slots
    .filter((slot) => slot.status === "done" && slot.data && selectedUrls.has(slot.url))
    .map((slot) => slot.data!);

  const recipients = contacts.filter((contact) => {
    if (contact.unsubscribed || optOuts.includes(contact.email.toLowerCase())) return false;
    return segment === "All" || contact.tags.includes(segment);
  });

  const defaultSubject = cityInput
    ? `New Listings in ${cityInput} - Available Now`
    : "New Property Listings Just for You";

  const effectiveSubject = customSubject.trim() || defaultSubject;

  async function launchCampaign() {
    if (selectedProperties.length === 0) {
      onShowToast("error", "Select at least one property.");
      return;
    }
    if (recipients.length === 0) {
      onShowToast("error", "No eligible contacts in selected segment.");
      return;
    }
    if (!senderEmail) {
      onShowToast("error", "Set a sender email first.");
      return;
    }

    setIsSending(true);
    setSendProgress({ sent: 0, total: recipients.length });
    let sent = 0;
    const errors: string[] = [];
    const bodyHtml = buildShowcaseHtml(selectedProperties, effectiveSubject);

    for (let i = 0; i < recipients.length; i++) {
      const contact = recipients[i];
      const firstName = contact.name?.split(" ")[0] || contact.email.split("@")[0];
      const personalizedBody = bodyHtml
        .replace(/{{first_name}}/gi, firstName)
        .replace(/{{name}}/gi, contact.name || firstName);

      const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}`;
      let finalHtml = wrapWithBrandTemplate(personalizedBody, effectiveSubject).replace("{{UNSUB_URL}}", unsubUrl);
      const sendId = crypto.randomUUID();
      if (appUrl) finalHtml = injectTracking(finalHtml, sendId, contact.email, appUrl);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName,
            senderEmail,
            recipientEmail: contact.email,
            subject: effectiveSubject,
            htmlBody: finalHtml,
          }),
        });
        const data = await res.json();

        onLogEntry({
          id: sendId,
          timestamp: new Date().toISOString(),
          to: contact.email,
          subject: effectiveSubject,
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
      onShowToast("success", `Campaign sent. ${sent} emails delivered.`);
    } else {
      onShowToast("error", `${sent} sent, ${errors.length} failed. Check Send Log.`);
    }
  }

  const doneCount = slots.filter((slot) => slot.status === "done").length;
  const loadingCount = slots.filter((slot) => slot.status === "loading" || slot.status === "pending").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0a1929] xl:flex-row">
      <div className="min-h-0 flex-1">
        <div className="border-b border-white/8 px-4 pb-5 pt-6 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-white">Property Discovery</h1>
          <p className="mt-0.5 text-xs text-white/35">Search haskerrealtygroup.com by city and launch campaigns from the results.</p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={cityInput}
                onChange={(event) => setCityInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && !isSearching && handleSearch()}
                placeholder="Enter city and state - e.g. Houston, TX"
                className="w-full rounded-lg border border-white/12 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/25 hover:border-white/20 focus:border-accent/60"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!cityInput.trim() || isSearching}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSearching ? "Searching..." : "Search Listings"}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {!hasSearched && (
            <div className="flex h-64 flex-col items-center justify-center text-white/20">
              <span className="mb-4 text-2xl font-semibold">Browse listings</span>
              <p className="text-sm">Enter a city to discover available properties.</p>
              <p className="mt-1 text-xs">Properties are fetched live from haskerrealtygroup.com.</p>
            </div>
          )}

          {hasSearched && slots.length === 0 && !isSearching && (
            <div className="flex h-64 flex-col items-center justify-center text-white/20">
              <span className="mb-3 text-xl font-semibold">No matches</span>
              <p className="text-sm">No properties found for &ldquo;{cityInput}&rdquo;.</p>
              <p className="mt-1 text-xs">Try a different city name or check the spelling.</p>
            </div>
          )}

          {slots.length > 0 && (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/60">
                  {doneCount} properties loaded
                  {loadingCount > 0 && <span className="ml-1 text-white/30">| {loadingCount} loading...</span>}
                </p>
                <div className="flex items-center gap-3">
                  {selectedUrls.size > 0 && (
                    <span className="text-xs font-semibold text-accent-light">{selectedUrls.size} selected</span>
                  )}
                  <button onClick={selectAll} className="text-xs text-white/40 transition-colors hover:text-white">
                    Select All
                  </button>
                  <button onClick={() => setSelectedUrls(new Set())} className="text-xs text-white/30 transition-colors hover:text-white/60">
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
      </div>

      {selectedProperties.length > 0 && (
        <div className="border-t border-white/8 bg-navy/60 xl:w-80 xl:shrink-0 xl:border-l xl:border-t-0">
          <div className="border-b border-white/8 px-5 pb-4 pt-5">
            <p className="text-sm font-semibold text-white">Campaign Builder</p>
            <p className="mt-0.5 text-[10px] text-white/35">
              {selectedProperties.length} {selectedProperties.length === 1 ? "property" : "properties"} selected
            </p>
          </div>

          <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-2">
              {selectedProperties.slice(0, 4).map((property, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg bg-white/4 px-3 py-2 text-xs">
                  <span className="font-medium text-accent-light">
                    ${property.price ? Number(property.price).toLocaleString() : "-"}
                  </span>
                  <span className="truncate text-white/50">{property.address}</span>
                </div>
              ))}
              {selectedProperties.length > 4 && (
                <p className="pl-1 text-[10px] text-white/25">+{selectedProperties.length - 4} more</p>
              )}
            </div>

            <div>
              <label className="field-label">Subject line</label>
              <input
                value={customSubject}
                onChange={(event) => setCustomSubject(event.target.value)}
                placeholder={defaultSubject}
                className="field-input text-xs"
              />
              <p className="mt-1 text-[10px] text-white/25">Leave blank to use the default subject above.</p>
            </div>

            <div>
              <label className="field-label">Send to segment</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {["All", ...CONTACT_TAGS].map((tag) => {
                  const count =
                    tag === "All"
                      ? contacts.filter((contact) => !contact.unsubscribed && !optOuts.includes(contact.email.toLowerCase())).length
                      : contacts.filter((contact) => contact.tags.includes(tag) && !contact.unsubscribed && !optOuts.includes(contact.email.toLowerCase())).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSegment(tag)}
                      className={[
                        "rounded-full border px-2 py-1 text-[10px] transition-colors",
                        segment === tag
                          ? "border-accent bg-accent/20 text-accent-light"
                          : "border-white/12 text-white/35 hover:text-white",
                      ].join(" ")}
                    >
                      {tag} ({count})
                    </button>
                  );
                })}
              </div>
              {recipients.length === 0 && contacts.length > 0 && (
                <p className="mt-2 text-[10px] text-amber-400/70">No eligible contacts in this segment.</p>
              )}
              {contacts.length === 0 && (
                <p className="mt-2 text-[10px] text-white/30">No contacts yet. Add some in the Contacts tab.</p>
              )}
            </div>

            {sendProgress && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs text-white/50">
                  <span>Sending campaign...</span>
                  <span>
                    {sendProgress.sent}/{sendProgress.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.round((sendProgress.sent / sendProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={launchCampaign}
              disabled={isSending || recipients.length === 0 || selectedProperties.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent/85 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isSending ? "Sending..." : `Launch Campaign (${recipients.length})`}
            </button>

            <p className="text-center text-[10px] text-white/25">
              {selectedProperties.length} listings to {recipients.length} contact{recipients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
