"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";
import type { SmtpConfig, BulkRecipient, BulkProgress, SendLogEntry, Contact } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";

interface BulkSendProps {
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  subject: string;
  rawHtmlBody: string;
  contacts: Contact[];
  optOuts: string[];
  appUrl: string;
  onLogEntry: (entry: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

function applyTokens(text: string, r: BulkRecipient): string {
  const firstName = (r.name || "").split(" ")[0] || r.email.split("@")[0];
  return text
    .replace(/\{\{name\}\}/gi, r.name || r.email.split("@")[0])
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{email\}\}/gi, r.email);
}

function parseTextInput(raw: string): BulkRecipient[] {
  return raw
    .split(/[\n,]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const angleMatch = line.match(/^(.+?)\s*<([^>]+)>$/);
      if (angleMatch) return { name: angleMatch[1].trim(), email: angleMatch[2].trim() };
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line)) return { name: "", email: line };
      return null;
    })
    .filter((r): r is BulkRecipient => r !== null && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
}

export default function BulkSend({
  smtp, senderName, senderEmail, subject, rawHtmlBody,
  contacts, optOuts, appUrl,
  onLogEntry, onShowToast,
}: BulkSendProps) {
  const [textInput, setTextInput] = useState("");
  const [recipients, setRecipients] = useState<BulkRecipient[]>([]);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [isSending, setIsSending] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  function addRecipients(parsed: BulkRecipient[]) {
    setRecipients((prev) => {
      const existing = new Set(prev.map((r) => r.email.toLowerCase()));
      return [...prev, ...parsed.filter((r) => !existing.has(r.email.toLowerCase()))];
    });
  }

  function handleParseText() {
    const parsed = parseTextInput(textInput);
    if (parsed.length === 0) { onShowToast("error", "No valid email addresses found."); return; }
    addRecipients(parsed);
    setTextInput("");
  }

  function loadSegment(tag: string) {
    const filtered = contacts
      .filter((c) => {
        if (c.unsubscribed || optOuts.includes(c.email.toLowerCase())) return false;
        return tag === "All" || c.tags.includes(tag);
      })
      .map((c) => ({ name: c.name, email: c.email }));
    if (filtered.length === 0) { onShowToast("error", "No eligible contacts in that segment."); return; }
    addRecipients(filtered);
    onShowToast("success", `Loaded ${filtered.length} contacts from "${tag}" segment.`);
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const emailCol = headers.find((h) => /^email$/i.test(h)) ?? headers.find((h) => /email/i.test(h));
        const nameCol = headers.find((h) => /^(name|full.?name)$/i.test(h)) ?? headers.find((h) => /^(first.?name|firstname)$/i.test(h));
        if (!emailCol) { onShowToast("error", "CSV must have an 'email' column."); return; }
        const parsed: BulkRecipient[] = results.data
          .map((row) => ({ email: (row[emailCol] ?? "").trim(), name: nameCol ? (row[nameCol] ?? "").trim() : "" }))
          .filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
        if (parsed.length === 0) { onShowToast("error", "No valid emails found in CSV."); return; }
        addRecipients(parsed);
        onShowToast("success", `Added ${parsed.length} recipients from CSV.`);
      },
      error() { onShowToast("error", "Failed to parse CSV file."); },
    });
  }

  async function handleSendAll() {
    if (recipients.length === 0) { onShowToast("error", "Add at least one recipient first."); return; }
    if (!subject.trim()) { onShowToast("error", "Subject line is required."); return; }
    if (!rawHtmlBody.trim()) { onShowToast("error", "Email body cannot be empty."); return; }
    if (!senderEmail.trim()) { onShowToast("error", "Sender Email is required."); return; }

    setIsSending(true);
    abortRef.current = false;
    const errors: BulkProgress["errors"] = [];
    let skipped = 0;

    for (let i = 0; i < recipients.length; i++) {
      if (abortRef.current) break;

      const r = recipients[i];

      // Skip opted-out
      if (optOuts.includes(r.email.toLowerCase())) {
        skipped++;
        setProgress({ sent: i + 1, total: recipients.length, errors, done: i === recipients.length - 1 });
        continue;
      }

      const personalizedSubject = applyTokens(subject, r);
      const personalizedBody = applyTokens(rawHtmlBody, r);
      const sendId = crypto.randomUUID();
      const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(r.email)}`;

      let wrappedHtml = wrapWithBrandTemplate(personalizedBody, personalizedSubject);
      wrappedHtml = wrappedHtml.replace("{{UNSUB_URL}}", unsubUrl);
      if (appUrl) wrappedHtml = injectTracking(wrappedHtml, sendId, r.email, appUrl);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ senderName, senderEmail, recipientEmail: r.email, subject: personalizedSubject, htmlBody: wrappedHtml }),
        });
        const data = await res.json();

        onLogEntry({
          id: sendId,
          timestamp: new Date().toISOString(),
          to: r.email,
          subject: personalizedSubject,
          status: data.success ? "success" : "error",
          ...(data.messageId && { messageId: data.messageId }),
          ...(!data.success && { error: data.error ?? "Unknown error" }),
        });

        if (!data.success) errors.push({ email: r.email, error: data.error ?? "Unknown error" });
      } catch {
        errors.push({ email: r.email, error: "Network error" });
        onLogEntry({ id: sendId, timestamp: new Date().toISOString(), to: r.email, subject: personalizedSubject, status: "error", error: "Network error" });
      }

      setProgress({ sent: i + 1, total: recipients.length, errors, done: i === recipients.length - 1 });
    }

    setIsSending(false);
    const sent = recipients.length - errors.length - skipped;
    if (errors.length === 0) {
      onShowToast("success", `${sent} emails sent.${skipped > 0 ? ` ${skipped} skipped (unsubscribed).` : ""}`);
    } else {
      onShowToast("error", `${sent} sent, ${errors.length} failed.${skipped > 0 ? ` ${skipped} skipped.` : ""} Check Send Log.`);
    }
  }

  const pct = progress ? Math.round((progress.sent / progress.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[10px] text-white/30 leading-relaxed">
        Tokens: <code className="text-accent-light/60">{"{{name}}"}</code>, <code className="text-accent-light/60">{"{{first_name}}"}</code>, <code className="text-accent-light/60">{"{{email}}"}</code>
      </p>

      {/* Load from contacts */}
      {contacts.length > 0 && (
        <div>
          <label className="field-label mb-1.5">Load from contact book</label>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...CONTACT_TAGS].map((tag) => {
              const count = tag === "All"
                ? contacts.filter((c) => !c.unsubscribed && !optOuts.includes(c.email.toLowerCase())).length
                : contacts.filter((c) => c.tags.includes(tag) && !c.unsubscribed && !optOuts.includes(c.email.toLowerCase())).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => loadSegment(tag)}
                  className="text-[10px] px-2 py-1 rounded border border-white/12 text-white/40 hover:text-white hover:border-white/25 transition-colors"
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual add */}
      <div>
        <label className="field-label">Or add manually</label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={"john@example.com\nJane Doe <jane@example.com>"}
          className="w-full bg-transparent border border-white/10 rounded px-2 py-2 font-mono text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-accent/60 resize-none"
          rows={3}
          spellCheck={false}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleParseText}
            disabled={!textInput.trim()}
            className="text-xs px-3 py-1.5 rounded bg-white/8 text-accent-light/70 hover:bg-white/12 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded bg-white/8 text-accent-light/70 hover:bg-white/12 hover:text-white transition-colors"
          >
            Upload CSV
          </button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
        </div>
      </div>

      {/* Recipient list */}
      {recipients.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="field-label">{recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</span>
            <button type="button" onClick={() => { setRecipients([]); setProgress(null); }} className="text-[10px] text-white/30 hover:text-red-400 transition-colors">Clear all</button>
          </div>
          <div className="max-h-36 overflow-y-auto flex flex-col gap-1 pr-1">
            {recipients.map((r) => (
              <div key={r.email} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-white/70 truncate">
                  {r.name ? <><span className="text-white/90">{r.name}</span> <span className="text-white/40">&lt;{r.email}&gt;</span></> : r.email}
                </span>
                <button type="button" onClick={() => setRecipients((prev) => prev.filter((x) => x.email !== r.email))} className="text-white/25 hover:text-red-400 transition-colors shrink-0">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {progress && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>{progress.done ? "Complete" : "Sending…"}</span>
            <span className="tabular-nums">{progress.sent} / {progress.total}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          {progress.errors.length > 0 && <p className="text-[10px] text-red-400/80">{progress.errors.length} failed — check Send Log.</p>}
        </div>
      )}

      <button
        type="button"
        onClick={isSending ? () => { abortRef.current = true; } : handleSendAll}
        disabled={recipients.length === 0 && !isSending}
        className={[
          "w-full py-2.5 rounded-md font-semibold text-sm tracking-wider uppercase transition-all duration-150 flex items-center justify-center gap-2",
          isSending ? "bg-red-700/80 text-white hover:bg-red-700 cursor-pointer"
            : recipients.length === 0 ? "bg-accent/20 text-white/25 cursor-not-allowed"
            : "bg-accent text-white hover:bg-accent/85 active:scale-[0.98] cursor-pointer",
        ].join(" ")}
      >
        {isSending ? (
          <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg> Stop</>
        ) : (
          <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Send to All {recipients.length > 0 ? `(${recipients.length})` : ""}</>
        )}
      </button>
    </div>
  );
}
