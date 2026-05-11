"use client";

import { useState } from "react";
import type { ScheduledSend, SmtpConfig, Contact } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";

interface SchedulerModalProps {
  scheduledSends: ScheduledSend[];
  contacts: Contact[];
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  subject: string;
  htmlBody: string;
  onSchedule: (s: ScheduledSend) => void;
  onCancel: (id: string) => void;
  onClose: () => void;
}

function formatDt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return "Overdue";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function SchedulerModal({
  scheduledSends, contacts, smtp, senderName, senderEmail,
  subject, htmlBody, onSchedule, onCancel, onClose,
}: SchedulerModalProps) {
  const [label, setLabel] = useState("");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date(Date.now() + 3_600_000);
    d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [recipientMode, setRecipientMode] = useState<"single" | "segment">("single");
  const [singleEmail, setSingleEmail] = useState("");
  const [segment, setSegment] = useState("All");

  const pendingSends = scheduledSends.filter((s) => s.status === "pending");

  function buildRecipients(): Array<{ name: string; email: string }> {
    if (recipientMode === "single") {
      return [{ name: "", email: singleEmail.trim() }];
    }
    return contacts
      .filter((c) => {
        if (c.unsubscribed) return false;
        return segment === "All" || c.tags.includes(segment);
      })
      .map((c) => ({ name: c.name, email: c.email }));
  }

  function handleSchedule() {
    if (!scheduledAt || !subject.trim() || !htmlBody.trim()) return;
    const recipients = buildRecipients();
    if (recipients.length === 0) return;

    const s: ScheduledSend = {
      id: crypto.randomUUID(),
      label: label.trim() || subject.slice(0, 40),
      scheduledAt: new Date(scheduledAt).toISOString(),
      smtp,
      senderName,
      senderEmail,
      recipients,
      subject,
      htmlBody,
      status: "pending",
    };
    onSchedule(s);
    onClose();
  }

  const recipientCount = buildRecipients().length;
  const canSchedule = scheduledAt && recipientCount > 0 && subject.trim() && htmlBody.trim();

  const minDt = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-navy border border-white/10 rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Email Scheduler</p>
            <p className="text-white/35 text-[10px] tracking-widest uppercase mt-0.5">Schedule a future send</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Schedule form */}
          <div className="bg-white/4 border border-white/8 rounded-xl p-5 flex flex-col gap-4">
            <div>
              <label className="field-label">Label <span className="normal-case font-normal tracking-normal text-white/25">optional</span></label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className="field-input" placeholder={subject.slice(0, 40) || "My scheduled send"} />
            </div>

            <div>
              <label className="field-label">Send at</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                min={minDt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="field-input text-xs"
              />
            </div>

            <div>
              <label className="field-label">Recipients</label>
              <div className="flex gap-3 mb-3">
                {(["single", "segment"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-1.5 cursor-pointer text-xs text-white/60 hover:text-white">
                    <input type="radio" checked={recipientMode === m} onChange={() => setRecipientMode(m)} className="accent-accent" />
                    {m === "single" ? "Single email" : "Contact segment"}
                  </label>
                ))}
              </div>

              {recipientMode === "single" ? (
                <input
                  type="email"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="field-input"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {["All", ...CONTACT_TAGS].map((tag) => {
                    const count = tag === "All"
                      ? contacts.filter(c => !c.unsubscribed).length
                      : contacts.filter(c => c.tags.includes(tag) && !c.unsubscribed).length;
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSegment(tag)}
                        className={[
                          "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                          segment === tag ? "border-accent bg-accent/20 text-accent-light" : "border-white/12 text-white/35 hover:text-white",
                        ].join(" ")}
                      >
                        {tag} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-white/4 border border-white/8 px-4 py-3 text-xs text-white/50">
              <p className="font-medium text-white/70 mb-1">{subject || <span className="italic text-white/30">No subject set</span>}</p>
              <p>{recipientCount} recipient{recipientCount !== 1 ? "s" : ""} · {scheduledAt ? formatDt(new Date(scheduledAt).toISOString()) : "—"}</p>
            </div>
          </div>

          {/* Pending queue */}
          {pendingSends.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 mb-3">Scheduled Queue ({pendingSends.length})</p>
              <div className="flex flex-col gap-2">
                {pendingSends.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-lg px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">{s.label}</p>
                      <p className="text-[10px] text-white/35 mt-0.5">{formatDt(s.scheduledAt)} · {s.recipients.length} recipient{s.recipients.length !== 1 ? "s" : ""}</p>
                    </div>
                    <span className="text-[10px] text-amber-400 shrink-0">{timeUntil(s.scheduledAt)}</span>
                    <button
                      onClick={() => onCancel(s.id)}
                      className="text-white/25 hover:text-red-400 transition-colors text-xs shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scheduledSends.filter(s => s.status === "sent").length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 mb-3">Sent Scheduled</p>
              <div className="flex flex-col gap-1.5">
                {scheduledSends.filter(s => s.status === "sent").slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-xs text-white/40 px-1">
                    <span className="w-2 h-2 rounded-full bg-green-400/60 shrink-0" />
                    <span className="truncate flex-1">{s.label}</span>
                    <span className="shrink-0">{s.sentAt ? formatDt(s.sentAt) : "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-white/8 shrink-0 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-white/40 hover:text-white transition-colors">Close</button>
          <button
            onClick={handleSchedule}
            disabled={!canSchedule}
            className="px-5 py-2 rounded-md bg-accent text-white text-sm font-semibold hover:bg-accent/85 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Schedule Send →
          </button>
        </div>
      </div>
    </div>
  );
}
