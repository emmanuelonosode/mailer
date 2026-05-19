"use client";

import { useState, useRef, useEffect } from "react";
import type { FetchedProperty } from "@/app/api/fetch-property/route";
import type { Contact, SendLogEntry } from "@/types/email";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";
import { buildSinglePropertyHtml } from "@/lib/propertyEmail";

interface QuickSendPanelProps {
  contacts: Contact[];
  optOuts: string[];
  senderName: string;
  senderEmail: string;
  appUrl: string;
  onLogEntry: (e: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

type FetchStatus = "idle" | "loading" | "done" | "error";

async function fetchPropertyByUrl(url: string): Promise<FetchedProperty> {
  const res = await fetch(`/api/fetch-property?url=${encodeURIComponent(url)}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error ?? "Could not load property.");
  return data as FetchedProperty;
}

export default function QuickSendPanel({
  contacts,
  optOuts,
  senderName,
  senderEmail,
  appUrl,
  onLogEntry,
  onShowToast,
}: QuickSendPanelProps) {
  // ── Property fetch ───────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState("");
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [property, setProperty] = useState<FetchedProperty | null>(null);
  const [fetchError, setFetchError] = useState("");

  // ── Recipient ────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);

  // ── Send ─────────────────────────────────────────────────────────
  const [customSubject, setCustomSubject] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch property ───────────────────────────────────────────────
  async function triggerFetch(url?: string) {
    const target = (url ?? urlInput).trim();
    if (!target) return;
    setFetchStatus("loading");
    setProperty(null);
    setFetchError("");
    setSent(false);
    try {
      const data = await fetchPropertyByUrl(target);
      setProperty(data);
      setFetchStatus("done");
      const addr = [data.address, data.city].filter(Boolean).join(", ");
      if (addr) setCustomSubject(`${addr} — Available Now`);
    } catch (err) {
      setFetchStatus("error");
      setFetchError(err instanceof Error ? err.message : "Failed to load property.");
    }
  }

  // Auto-fetch on paste if it looks like a Hasker property URL
  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").trim();
    if (pasted.includes("haskerrealtygroup.com/properties/")) {
      e.preventDefault();
      setUrlInput(pasted);
      setTimeout(() => triggerFetch(pasted), 30);
    }
  }

  // ── Recipient helpers ────────────────────────────────────────────
  const activeOptOuts = new Set(optOuts.map((e) => e.toLowerCase()));
  const filteredContacts = search.length > 0
    ? contacts.filter(
        (c) =>
          !c.unsubscribed &&
          !activeOptOuts.has(c.email.toLowerCase()) &&
          (c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 8)
    : [];

  function selectContact(c: Contact) {
    setSelectedContact(c);
    setSearch(c.name || c.email);
    setShowDropdown(false);
    setManualEmail("");
    setManualName("");
  }

  function clearRecipient() {
    setSelectedContact(null);
    setSearch("");
    setManualEmail("");
    setManualName("");
  }

  const recipientEmail = selectedContact?.email ?? manualEmail.trim();
  const recipientName = selectedContact?.name ?? manualName.trim();
  const recipientFirstName = recipientName.split(" ")[0] || "there";

  const addr = property ? [property.address, property.city].filter(Boolean).join(", ") : "";
  const defaultSubject = addr ? `${addr} — Available Now` : "";
  const effectiveSubject = customSubject.trim() || defaultSubject;

  const canSend =
    property !== null &&
    recipientEmail.includes("@") &&
    !!senderEmail &&
    !isSending;

  // ── Preview ──────────────────────────────────────────────────────
  function handlePreview() {
    if (!property) return;
    const bodyHtml = buildSinglePropertyHtml(property, recipientFirstName);
    const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail || "preview@example.com")}`;
    const html = wrapWithBrandTemplate(bodyHtml, effectiveSubject).replace("{{UNSUB_URL}}", unsubUrl);
    setPreviewHtml(html);
  }

  // ── Send ─────────────────────────────────────────────────────────
  async function handleSend() {
    if (!canSend) return;
    if (!senderEmail) { onShowToast("error", "Set a sender email in Settings first."); return; }

    setIsSending(true);
    const sendId = crypto.randomUUID();
    const bodyHtml = buildSinglePropertyHtml(property!, recipientFirstName);
    const personalized = bodyHtml
      .replace(/\{\{first_name\}\}/gi, recipientFirstName)
      .replace(/\{\{name\}\}/gi, recipientName || recipientFirstName);
    const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
    let finalHtml = wrapWithBrandTemplate(personalized, effectiveSubject).replace("{{UNSUB_URL}}", unsubUrl);
    if (appUrl) finalHtml = injectTracking(finalHtml, sendId, recipientEmail, appUrl);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderName, senderEmail, recipientEmail, subject: effectiveSubject, htmlBody: finalHtml }),
      });
      const data = await res.json();
      onLogEntry({
        id: sendId,
        timestamp: new Date().toISOString(),
        to: recipientEmail,
        subject: effectiveSubject,
        status: data.success ? "success" : "error",
        ...(!data.success && { error: data.error }),
      });
      if (data.success) {
        setSent(true);
        onShowToast("success", `Sent to ${recipientEmail}.`);
        clearRecipient();
      } else {
        onShowToast("error", data.error ?? "Send failed.");
      }
    } catch {
      onShowToast("error", "Network error. Check your connection.");
    } finally {
      setIsSending(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#07111f]">

      {/* ── Top bar: URL input ─────────────────────────────────── */}
      <div className="border-b border-white/[0.07] px-6 py-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/30">
          Property URL
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            {/* Globe icon */}
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && triggerFetch()}
              onPaste={handlePaste}
              placeholder="Paste a haskerrealtygroup.com/properties/… URL and press Enter"
              className="w-full rounded-[10px] border border-white/[0.09] bg-white/[0.04] py-3 pl-10 pr-4 text-[13px] text-white outline-none transition-all placeholder:text-white/20 focus:border-accent/50 focus:bg-accent/[0.05] focus:shadow-[0_0_0_3px_rgba(26,86,219,0.1)]"
            />
          </div>
          <button
            onClick={() => triggerFetch()}
            disabled={!urlInput.trim() || fetchStatus === "loading"}
            className="flex items-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-[13px] font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:bg-[#1548c0] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {fetchStatus === "loading" ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8z"/>
                </svg>
                Fetching…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Fetch
              </>
            )}
          </button>
        </div>

        {fetchStatus === "error" && (
          <p className="mt-2 text-[12px] text-red-400">{fetchError}</p>
        )}
      </div>

      {/* ── Main content ───────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── LEFT: Property preview ─────────────────────────── */}
        <div className="min-h-0 flex-1 overflow-y-auto border-r border-white/[0.07]">

          {/* Idle state */}
          {fetchStatus === "idle" && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.07]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-white/40">Paste a property URL above</p>
                <p className="mt-1 text-[13px] text-white/20">
                  The property details, photos, and price will appear here automatically.
                </p>
              </div>
              <div className="mt-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-left max-w-sm">
                <p className="text-[11px] font-semibold text-white/30 mb-1 uppercase tracking-wider">Example</p>
                <p className="text-[12px] text-white/20 break-all font-mono">haskerrealtygroup.com/properties/123-main-st</p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {fetchStatus === "loading" && (
            <div className="p-6 animate-pulse">
              <div className="h-52 rounded-xl bg-white/[0.06] mb-5" />
              <div className="h-6 w-1/3 rounded-lg bg-white/[0.06] mb-3" />
              <div className="h-4 w-2/3 rounded-lg bg-white/[0.04] mb-2" />
              <div className="h-4 w-1/2 rounded-lg bg-white/[0.04] mb-6" />
              <div className="flex gap-2 mb-6">
                {[1,2,3].map(i => <div key={i} className="h-6 w-20 rounded-full bg-white/[0.06]" />)}
              </div>
              <div className="space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-3 w-full rounded bg-white/[0.04]" />)}
              </div>
            </div>
          )}

          {/* Property card */}
          {fetchStatus === "done" && property && (
            <div className="p-6 animate-fade-up">
              {/* Hero photo */}
              {property.photos[0] && (
                <div className="overflow-hidden rounded-xl mb-5 bg-white/[0.04]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={property.photos[0]}
                    alt={property.address}
                    className="h-56 w-full object-cover"
                  />
                  {/* Gallery strip */}
                  {property.photos.length > 1 && (
                    <div className="flex gap-1 p-1">
                      {property.photos.slice(1, 4).map((photo, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={photo} alt="" className="h-14 flex-1 object-cover rounded-md" />
                      ))}
                      {property.photos.length > 4 && (
                        <div className="flex h-14 flex-1 items-center justify-center rounded-md bg-white/[0.08] text-[11px] text-white/40 font-medium">
                          +{property.photos.length - 4} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Price + address */}
              <div className="mb-4">
                <p className="font-serif text-[28px] font-bold text-white leading-tight tracking-tight">
                  {property.price
                    ? `$${Number(property.price).toLocaleString()}${property.priceType === "month" ? "/mo" : ""}`
                    : "Contact for price"}
                </p>
                <p className="mt-1 text-[14px] text-white/55">
                  {[property.address, property.city, property.state].filter(Boolean).join(", ")}
                </p>
              </div>

              {/* Pill badges */}
              <div className="mb-4 flex flex-wrap gap-2">
                {property.beds && (
                  <span className="rounded-full bg-white/[0.07] border border-white/[0.08] px-3 py-1 text-[12px] font-medium text-white/70">
                    {property.beds} bed
                  </span>
                )}
                {property.baths && (
                  <span className="rounded-full bg-white/[0.07] border border-white/[0.08] px-3 py-1 text-[12px] font-medium text-white/70">
                    {property.baths} bath
                  </span>
                )}
                {property.sqft && (
                  <span className="rounded-full bg-white/[0.07] border border-white/[0.08] px-3 py-1 text-[12px] font-medium text-white/70">
                    {Number(property.sqft).toLocaleString()} sqft
                  </span>
                )}
                {property.propertyType && (
                  <span className="rounded-full bg-white/[0.07] border border-white/[0.08] px-3 py-1 text-[12px] font-medium text-white/70">
                    {property.propertyType}
                  </span>
                )}
                {property.petPolicy && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[12px] font-medium text-emerald-400">
                    {property.petPolicy}
                  </span>
                )}
              </div>

              {/* Amenities */}
              {property.amenities.flatMap((s) => s.items).length > 0 && (
                <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">Features</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                    {property.amenities.flatMap((s) => s.items).slice(0, 8).map((f, i) => (
                      <p key={i} className="text-[12px] text-white/50">
                        <span className="text-[#C8A96E] mr-1.5">—</span>{f}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {property.description && property.description.length > 40 && (
                <p className="text-[13px] text-white/40 leading-relaxed line-clamp-4">
                  {property.description}
                </p>
              )}

              {/* Link to listing */}
              <a
                href={property.applyUrl || `https://haskerrealtygroup.com/properties`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-accent/70 hover:text-accent transition-colors"
              >
                View on site
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>
          )}
        </div>

        {/* ── RIGHT: Send to client ──────────────────────────── */}
        <div className="flex w-[340px] shrink-0 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">

            {/* Recipient */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Client
              </label>

              {selectedContact ? (
                /* Selected contact pill */
                <div className="flex items-center justify-between rounded-[10px] border border-accent/30 bg-accent/[0.08] px-3 py-2.5">
                  <div>
                    <p className="text-[13px] font-medium text-white">{selectedContact.name}</p>
                    <p className="text-[11px] text-white/40">{selectedContact.email}</p>
                  </div>
                  <button onClick={clearRecipient} className="text-white/30 hover:text-white/70 transition-colors ml-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ) : (
                /* Contact search */
                <div ref={searchRef} className="relative">
                  <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/20" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search contacts…"
                    className="w-full rounded-[10px] border border-white/[0.09] bg-white/[0.04] py-2.5 pl-9 pr-3 text-[13px] text-white outline-none transition-all placeholder:text-white/20 focus:border-accent/40 focus:bg-accent/[0.04]"
                  />
                  {showDropdown && filteredContacts.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[10px] border border-white/[0.1] bg-[#0d1f35] shadow-2xl">
                      {filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={() => selectContact(c)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent-light">
                            {(c.name || c.email)[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-medium text-white">{c.name}</p>
                            <p className="truncate text-[11px] text-white/40">{c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showDropdown && search.length > 0 && filteredContacts.length === 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-[10px] border border-white/[0.1] bg-[#0d1f35] px-4 py-3 shadow-2xl">
                      <p className="text-[12px] text-white/30">No contacts match. Enter details manually below.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Manual entry (shown when no contact selected) */}
              {!selectedContact && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Name"
                    className="flex-1 rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-accent/40"
                  />
                  <input
                    type="email"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="Email"
                    className="flex-1 rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white outline-none placeholder:text-white/20 focus:border-accent/40"
                  />
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                Subject Line
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder={defaultSubject || "Enter a subject…"}
                className="w-full rounded-[10px] border border-white/[0.09] bg-white/[0.04] px-3 py-2.5 text-[13px] text-white outline-none transition-all placeholder:text-white/20 focus:border-accent/40 focus:bg-accent/[0.04]"
              />
            </div>

            {/* Email preview of property details (mini summary) */}
            {property && (
              <div className="rounded-[10px] border border-white/[0.07] bg-white/[0.02] p-3">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">Email will include</p>
                <div className="space-y-1">
                  {property.photos[0] && <p className="text-[12px] text-white/40">✓ Hero photo + gallery</p>}
                  <p className="text-[12px] text-white/40">
                    ✓ {property.price ? `$${Number(property.price).toLocaleString()}${property.priceType === "month" ? "/mo" : ""}` : "Price"} — {[property.beds && `${property.beds} bed`, property.baths && `${property.baths} bath`].filter(Boolean).join(", ")}
                  </p>
                  {property.amenities.flatMap(s => s.items).length > 0 && <p className="text-[12px] text-white/40">✓ {property.amenities.flatMap(s => s.items).length} features listed</p>}
                  <p className="text-[12px] text-white/40">✓ Apply / view listing button</p>
                </div>
              </div>
            )}

            {/* Success state */}
            {sent && (
              <div className="rounded-[10px] border border-emerald-500/20 bg-emerald-500/[0.07] px-4 py-3">
                <p className="text-[13px] font-semibold text-emerald-400">Email sent.</p>
                <p className="text-[11px] text-emerald-400/60 mt-0.5">Pick another client to send again.</p>
              </div>
            )}
          </div>

          {/* ── Action buttons ──── */}
          <div className="flex shrink-0 flex-col gap-2 border-t border-white/[0.07] px-5 py-4">
            {/* Preview */}
            <button
              onClick={handlePreview}
              disabled={!property}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.09] py-2.5 text-[12px] font-medium text-white/50 transition-all hover:border-white/20 hover:text-white/80 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Preview Email
            </button>

            {/* Send */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-accent py-3 text-[13px] font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-[#1548c0] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30"
            >
              {isSending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8z"/>
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                  </svg>
                  Send to Client
                </>
              )}
            </button>

            {!senderEmail && (
              <p className="text-center text-[11px] text-amber-400/60">Configure sender email in Settings first.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Preview modal ──────────────────────────────────────── */}
      {previewHtml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-[660px] flex-col rounded-2xl bg-[#0d1a2d] shadow-2xl border border-white/[0.08] animate-spring-in">
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
              <p className="text-[13px] font-semibold text-white">Email Preview</p>
              <button onClick={() => setPreviewHtml(null)} className="text-white/40 hover:text-white transition-colors active:scale-95">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <iframe
                srcDoc={previewHtml}
                width="600"
                sandbox="allow-same-origin"
                className="mx-auto block rounded-lg"
                style={{ height: "70vh", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
