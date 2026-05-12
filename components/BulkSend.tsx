"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";
import type { BulkRecipient, BulkProgress, SendLogEntry, Contact } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";

interface BulkSendProps {
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

function applyTokens(text: string, recipient: BulkRecipient): string {
  const firstName = (recipient.name || "").split(" ")[0] || recipient.email.split("@")[0];
  return text
    .replace(/\{\{name\}\}/gi, recipient.name || recipient.email.split("@")[0])
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{email\}\}/gi, recipient.email);
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
    .filter((recipient): recipient is BulkRecipient => recipient !== null && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email));
}

export default function BulkSend({
  senderName,
  senderEmail,
  subject,
  rawHtmlBody,
  contacts,
  optOuts,
  appUrl,
  onLogEntry,
  onShowToast,
}: BulkSendProps) {
  const [textInput, setTextInput] = useState("");
  const [recipients, setRecipients] = useState<BulkRecipient[]>([]);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const [isSending, setIsSending] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  function addRecipients(parsed: BulkRecipient[]) {
    setRecipients((prev) => {
      const existing = new Set(prev.map((recipient) => recipient.email.toLowerCase()));
      return [
        ...prev,
        ...parsed.filter((recipient) => !existing.has(recipient.email.toLowerCase())),
      ];
    });
  }

  function handleParseText() {
    const parsed = parseTextInput(textInput);
    if (parsed.length === 0) {
      onShowToast("error", "No valid email addresses found.");
      return;
    }
    addRecipients(parsed);
    setTextInput("");
  }

  function loadSegment(tag: string) {
    const filtered = contacts
      .filter((contact) => {
        if (contact.unsubscribed || optOuts.includes(contact.email.toLowerCase())) return false;
        return tag === "All" || contact.tags.includes(tag);
      })
      .map((contact) => ({ name: contact.name, email: contact.email }));

    if (filtered.length === 0) {
      onShowToast("error", "No eligible contacts in that segment.");
      return;
    }

    addRecipients(filtered);
    onShowToast("success", `Loaded ${filtered.length} contacts from "${tag}" segment.`);
  }

  function handleCsvUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = "";
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const emailCol = headers.find((header) => /^email$/i.test(header)) ?? headers.find((header) => /email/i.test(header));
        const nameCol = headers.find((header) => /^(name|full.?name)$/i.test(header)) ?? headers.find((header) => /^(first.?name|firstname)$/i.test(header));

        if (!emailCol) {
          onShowToast("error", "CSV must have an email column.");
          return;
        }

        const parsed: BulkRecipient[] = results.data
          .map((row) => ({
            email: (row[emailCol] ?? "").trim(),
            name: nameCol ? (row[nameCol] ?? "").trim() : "",
          }))
          .filter((recipient) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email));

        if (parsed.length === 0) {
          onShowToast("error", "No valid emails found in CSV.");
          return;
        }

        addRecipients(parsed);
        onShowToast("success", `Added ${parsed.length} recipients from CSV.`);
      },
      error() {
        onShowToast("error", "Failed to parse CSV file.");
      },
    });
  }

  async function handleSendAll() {
    if (recipients.length === 0) {
      onShowToast("error", "Add at least one recipient first.");
      return;
    }
    if (!subject.trim()) {
      onShowToast("error", "Subject line is required.");
      return;
    }
    if (!rawHtmlBody.trim()) {
      onShowToast("error", "Email body cannot be empty.");
      return;
    }
    if (!senderEmail.trim()) {
      onShowToast("error", "Sender Email is required.");
      return;
    }

    setIsSending(true);
    abortRef.current = false;
    const errors: BulkProgress["errors"] = [];
    let skipped = 0;

    for (let i = 0; i < recipients.length; i++) {
      if (abortRef.current) break;

      const recipient = recipients[i];
      if (optOuts.includes(recipient.email.toLowerCase())) {
        skipped++;
        setProgress({ sent: i + 1, total: recipients.length, errors, done: i === recipients.length - 1 });
        continue;
      }

      const personalizedSubject = applyTokens(subject, recipient);
      const personalizedBody = applyTokens(rawHtmlBody, recipient);
      const sendId = crypto.randomUUID();
      const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(recipient.email)}`;

      let wrappedHtml = wrapWithBrandTemplate(personalizedBody, personalizedSubject);
      wrappedHtml = wrappedHtml.replace("{{UNSUB_URL}}", unsubUrl);
      if (appUrl) wrappedHtml = injectTracking(wrappedHtml, sendId, recipient.email, appUrl);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderName,
            senderEmail,
            recipientEmail: recipient.email,
            subject: personalizedSubject,
            htmlBody: wrappedHtml,
          }),
        });
        const data = await res.json();

        onLogEntry({
          id: sendId,
          timestamp: new Date().toISOString(),
          to: recipient.email,
          subject: personalizedSubject,
          status: data.success ? "success" : "error",
          ...(data.messageId && { messageId: data.messageId }),
          ...(!data.success && { error: data.error ?? "Unknown error" }),
        });

        if (!data.success) {
          errors.push({ email: recipient.email, error: data.error ?? "Unknown error" });
        }
      } catch {
        errors.push({ email: recipient.email, error: "Network error" });
        onLogEntry({
          id: sendId,
          timestamp: new Date().toISOString(),
          to: recipient.email,
          subject: personalizedSubject,
          status: "error",
          error: "Network error",
        });
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
      <p className="text-[10px] leading-relaxed text-white/30">
        Tokens: <code className="text-accent-light/60">{"{{name}}"}</code>,{" "}
        <code className="text-accent-light/60">{"{{first_name}}"}</code>,{" "}
        <code className="text-accent-light/60">{"{{email}}"}</code>
      </p>

      {contacts.length > 0 && (
        <div>
          <label className="mb-1.5 field-label">Load from contact book</label>
          <div className="flex flex-wrap gap-1.5">
            {["All", ...CONTACT_TAGS].map((tag) => {
              const count =
                tag === "All"
                  ? contacts.filter((contact) => !contact.unsubscribed && !optOuts.includes(contact.email.toLowerCase())).length
                  : contacts.filter((contact) => contact.tags.includes(tag) && !contact.unsubscribed && !optOuts.includes(contact.email.toLowerCase())).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => loadSegment(tag)}
                  className="rounded border border-white/12 px-2 py-1 text-[10px] text-white/40 transition-colors hover:border-white/25 hover:text-white"
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="field-label">Or select specific contacts</label>
            <div className="mt-1.5 max-h-32 overflow-y-auto rounded border border-white/10 bg-black/20 p-1 custom-scrollbar">
              {contacts.length === 0 && (
                <p className="text-[10px] text-white/30 p-2 text-center">No contacts available.</p>
              )}
              {contacts.map(c => {
                if (c.unsubscribed || optOuts.includes(c.email.toLowerCase())) return null;
                const isAlreadyAdded = recipients.some(r => r.email.toLowerCase() === c.email.toLowerCase());
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isAlreadyAdded) {
                        setRecipients(prev => prev.filter(r => r.email.toLowerCase() !== c.email.toLowerCase()));
                      } else {
                        addRecipients([{ name: c.name, email: c.email }]);
                      }
                    }}
                    className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-[11px] transition-colors ${isAlreadyAdded ? "bg-accent/20 text-accent-light" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
                  >
                    <span className="truncate pr-2">{c.name} ({c.email})</span>
                    {isAlreadyAdded && <span className="text-[10px]">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="field-label">Or add manually</label>
        <textarea
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder={"john@example.com\nJane Doe <jane@example.com>"}
          className="w-full resize-none rounded border border-white/10 bg-transparent px-2 py-2 font-mono text-xs text-white/80 outline-none placeholder:text-white/20 focus:border-accent/60"
          rows={3}
          spellCheck={false}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleParseText}
            disabled={!textInput.trim()}
            className="rounded bg-white/8 px-3 py-1.5 text-xs text-accent-light/70 transition-colors hover:bg-white/12 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => csvRef.current?.click()}
            className="rounded bg-white/8 px-3 py-1.5 text-xs text-accent-light/70 transition-colors hover:bg-white/12 hover:text-white"
          >
            Upload CSV
          </button>
          <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvUpload} />
        </div>
      </div>

      {recipients.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="field-label">
              {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => {
                setRecipients([]);
                setProgress(null);
              }}
              className="text-[10px] text-white/30 transition-colors hover:text-red-400"
            >
              Clear all
            </button>
          </div>
          <div className="flex max-h-36 flex-col gap-1 overflow-y-auto pr-1">
            {recipients.map((recipient) => (
              <div key={recipient.email} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-white/70">
                  {recipient.name ? (
                    <>
                      <span className="text-white/90">{recipient.name}</span>{" "}
                      <span className="text-white/40">&lt;{recipient.email}&gt;</span>
                    </>
                  ) : (
                    recipient.email
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setRecipients((prev) => prev.filter((entry) => entry.email !== recipient.email))}
                  className="shrink-0 text-white/25 transition-colors hover:text-red-400"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {progress && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>{progress.done ? "Complete" : "Sending..."}</span>
            <span className="tabular-nums">
              {progress.sent} / {progress.total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-accent transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          {progress.errors.length > 0 && (
            <p className="text-[10px] text-red-400/80">{progress.errors.length} failed. Check Send Log.</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={isSending ? () => { abortRef.current = true; } : handleSendAll}
        disabled={recipients.length === 0 && !isSending}
        className={[
          "flex w-full items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold tracking-wider uppercase transition-all duration-150",
          isSending
            ? "cursor-pointer bg-red-700/80 text-white hover:bg-red-700"
            : recipients.length === 0
              ? "cursor-not-allowed bg-accent/20 text-white/25"
              : "cursor-pointer bg-accent text-white hover:bg-accent/85 active:scale-[0.98]",
        ].join(" ")}
      >
        {isSending ? (
          <>
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            Stop
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
            Send to All {recipients.length > 0 ? `(${recipients.length})` : ""}
          </>
        )}
      </button>
    </div>
  );
}
