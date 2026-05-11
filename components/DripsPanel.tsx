"use client";

import { useState } from "react";
import type {
  DripSequence,
  DripStep,
  DripEnrollment,
  Contact,
  SmtpConfig,
  SendLogEntry,
} from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";

interface DripsPanelProps {
  sequences: DripSequence[];
  enrollments: DripEnrollment[];
  contacts: Contact[];
  optOuts: string[];
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  appUrl: string;
  onSequencesChange: (s: DripSequence[]) => void;
  onEnrollmentsChange: (e: DripEnrollment[]) => void;
  onLogEntry: (e: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

function dayLabel(n: number) {
  if (n === 0) return "Immediately";
  return `Day ${n}`;
}

export default function DripsPanel({
  sequences, enrollments, contacts, optOuts,
  smtp, senderName, senderEmail, appUrl,
  onSequencesChange, onEnrollmentsChange, onLogEntry, onShowToast,
}: DripsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(sequences[0]?.id ?? null);
  const [editingStep, setEditingStep] = useState<DripStep | null>(null);
  const [isNewStep, setIsNewStep] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTag, setEnrollTag] = useState("All");
  const [isFiring, setIsFiring] = useState(false);

  const selected = sequences.find((s) => s.id === selectedId) ?? null;

  function createSequence() {
    const s: DripSequence = {
      id: crypto.randomUUID(),
      name: "New Sequence",
      description: "",
      steps: [],
      createdAt: new Date().toISOString(),
    };
    onSequencesChange([...sequences, s]);
    setSelectedId(s.id);
  }

  function updateSelected(patch: Partial<DripSequence>) {
    onSequencesChange(sequences.map((s) => (s.id === selectedId ? { ...s, ...patch } : s)));
  }

  function deleteSequence(id: string) {
    onSequencesChange(sequences.filter((s) => s.id !== id));
    onEnrollmentsChange(enrollments.filter((e) => e.sequenceId !== id));
    if (selectedId === id) setSelectedId(sequences.find((s) => s.id !== id)?.id ?? null);
  }

  function openNewStep() {
    setEditingStep({ id: crypto.randomUUID(), dayOffset: (selected?.steps.at(-1)?.dayOffset ?? 0) + 3, subject: "", htmlBody: "" });
    setIsNewStep(true);
  }

  function saveStep() {
    if (!editingStep || !selected) return;
    const steps = isNewStep
      ? [...selected.steps, editingStep].sort((a, b) => a.dayOffset - b.dayOffset)
      : selected.steps.map((s) => (s.id === editingStep.id ? editingStep : s));
    updateSelected({ steps });
    setEditingStep(null);
  }

  function deleteStep(stepId: string) {
    if (!selected) return;
    updateSelected({ steps: selected.steps.filter((s) => s.id !== stepId) });
  }

  function enrollContacts() {
    if (!selected) return;
    const toEnroll = contacts.filter((c) => {
      if (c.unsubscribed || optOuts.includes(c.email.toLowerCase())) return false;
      if (enrollTag !== "All" && !c.tags.includes(enrollTag)) return false;
      // Don't re-enroll active ones
      return !enrollments.some((e) => e.sequenceId === selected.id && e.contactEmail === c.email && !e.completed);
    });

    if (toEnroll.length === 0) {
      onShowToast("error", "No eligible contacts to enroll.");
      return;
    }

    const now = new Date().toISOString();
    const newEnrollments: DripEnrollment[] = toEnroll.map((c) => ({
      id: crypto.randomUUID(),
      sequenceId: selected.id,
      contactEmail: c.email,
      enrolledAt: now,
      nextStepIndex: 0,
      completed: false,
    }));
    onEnrollmentsChange([...enrollments, ...newEnrollments]);
    setShowEnrollModal(false);
    onShowToast("success", `Enrolled ${toEnroll.length} contacts in "${selected.name}".`);
  }

  async function fireDueSteps() {
    if (!smtp.host || !senderEmail) {
      onShowToast("error", "Configure SMTP and Sender Email first.");
      return;
    }
    setIsFiring(true);
    let fired = 0;

    const updatedEnrollments = [...enrollments];

    for (let ei = 0; ei < updatedEnrollments.length; ei++) {
      const enrollment = updatedEnrollments[ei];
      if (enrollment.completed) continue;

      const sequence = sequences.find((s) => s.id === enrollment.sequenceId);
      if (!sequence) continue;

      const step = sequence.steps[enrollment.nextStepIndex];
      if (!step) {
        updatedEnrollments[ei] = { ...enrollment, completed: true };
        continue;
      }

      const dueAt = new Date(enrollment.enrolledAt);
      dueAt.setDate(dueAt.getDate() + step.dayOffset);
      if (new Date() < dueAt) continue;

      const contact = contacts.find((c) => c.email === enrollment.contactEmail);
      if (!contact || contact.unsubscribed || optOuts.includes(contact.email.toLowerCase())) {
        updatedEnrollments[ei] = { ...enrollment, completed: true };
        continue;
      }

      const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(contact.email)}`;
      const wrapped = wrapWithBrandTemplate(step.htmlBody, step.subject).replace("{{UNSUB_URL}}", unsubUrl);

      try {
        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp, senderName, senderEmail,
            recipientEmail: contact.email,
            subject: step.subject,
            htmlBody: wrapped,
          }),
        });
        const data = await res.json();
        const logId = crypto.randomUUID();
        onLogEntry({
          id: logId,
          timestamp: new Date().toISOString(),
          to: contact.email,
          subject: step.subject,
          status: data.success ? "success" : "error",
          ...(data.messageId && { messageId: data.messageId }),
          ...(!data.success && { error: data.error }),
        });
        if (data.success) {
          fired++;
          const nextIndex = enrollment.nextStepIndex + 1;
          updatedEnrollments[ei] = {
            ...enrollment,
            nextStepIndex: nextIndex,
            lastSentAt: new Date().toISOString(),
            completed: nextIndex >= sequence.steps.length,
          };
        }
      } catch {
        // Continue to next
      }
    }

    onEnrollmentsChange(updatedEnrollments);
    setIsFiring(false);
    if (fired > 0) {
      onShowToast("success", `Fired ${fired} drip step${fired !== 1 ? "s" : ""}.`);
    } else {
      onShowToast("success", "No steps due right now.");
    }
  }

  const seqEnrollments = selected
    ? enrollments.filter((e) => e.sequenceId === selected.id)
    : [];
  const activeEnrollments = seqEnrollments.filter((e) => !e.completed);

  return (
    <div className="flex flex-1 min-h-0 bg-[#0a1929]">
      {/* Left: sequence list */}
      <div className="w-64 shrink-0 border-r border-white/8 flex flex-col">
        <div className="px-5 pt-7 pb-4 border-b border-white/8 shrink-0">
          <h1 className="text-white text-base font-semibold">Drip Sequences</h1>
          <p className="text-white/30 text-[10px] mt-0.5">Automated email journeys</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sequences.length === 0 && (
            <p className="text-white/25 text-xs text-center mt-8 px-4">No sequences yet.</p>
          )}
          {sequences.map((s) => {
            const count = enrollments.filter((e) => e.sequenceId === s.id && !e.completed).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={[
                  "w-full text-left px-5 py-3 transition-colors",
                  selectedId === s.id ? "bg-accent/15 border-l-2 border-accent" : "hover:bg-white/4 border-l-2 border-transparent",
                ].join(" ")}
              >
                <p className="text-xs text-white font-medium truncate">{s.name}</p>
                <p className="text-[10px] text-white/35 mt-0.5">{s.steps.length} steps · {count} active</p>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-white/8 shrink-0 space-y-2">
          <button
            onClick={createSequence}
            className="w-full py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent/85 transition-colors"
          >
            + New Sequence
          </button>
          <button
            onClick={fireDueSteps}
            disabled={isFiring}
            className="w-full py-2 rounded-md border border-white/12 text-white/50 text-xs hover:text-white hover:border-white/25 disabled:opacity-30 transition-colors"
          >
            {isFiring ? "Processing…" : "⚡ Fire Due Steps"}
          </button>
        </div>
      </div>

      {/* Right: sequence editor */}
      {selected ? (
        <div className="flex-1 overflow-y-auto px-8 py-7">
          <div className="max-w-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1 mr-4">
                <input
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                  className="bg-transparent text-white text-lg font-semibold outline-none border-b border-transparent hover:border-white/20 focus:border-accent/60 transition-colors w-full"
                />
                <input
                  value={selected.description}
                  onChange={(e) => updateSelected({ description: e.target.value })}
                  placeholder="Description (optional)"
                  className="bg-transparent text-white/40 text-xs outline-none border-b border-transparent hover:border-white/10 focus:border-white/20 transition-colors w-full mt-1"
                />
              </div>
              <button
                onClick={() => deleteSequence(selected.id)}
                className="text-white/25 hover:text-red-400 transition-colors text-xs"
              >
                Delete
              </button>
            </div>

            {/* Steps */}
            <div className="mb-6">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35 mb-3">Steps</p>
              {selected.steps.length === 0 && (
                <p className="text-white/25 text-xs py-4">No steps yet — add the first step.</p>
              )}
              <div className="flex flex-col gap-2">
                {selected.steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-3 bg-white/4 border border-white/8 rounded-lg px-4 py-3">
                    <div className="w-14 shrink-0 text-center">
                      <span className="text-[10px] font-semibold text-accent-light/70">{dayLabel(step.dayOffset)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/80 truncate">{step.subject || <span className="text-white/30 italic">No subject</span>}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Step {idx + 1}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setEditingStep(step); setIsNewStep(false); }}
                        className="text-white/30 hover:text-white text-xs transition-colors"
                      >Edit</button>
                      <button
                        onClick={() => deleteStep(step.id)}
                        className="text-white/25 hover:text-red-400 text-xs transition-colors"
                      >×</button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={openNewStep}
                className="mt-3 text-xs text-accent-light/60 hover:text-accent-light border border-dashed border-white/15 hover:border-accent/40 rounded-lg px-4 py-2 w-full transition-colors"
              >
                + Add Step
              </button>
            </div>

            {/* Enrollments */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-semibold tracking-widest uppercase text-white/35">
                  Enrollments ({activeEnrollments.length} active)
                </p>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  disabled={contacts.length === 0 || selected.steps.length === 0}
                  className="text-xs px-3 py-1 rounded bg-accent/20 text-accent-light hover:bg-accent/30 disabled:opacity-30 transition-colors"
                >
                  Enroll Contacts
                </button>
              </div>
              {seqEnrollments.length === 0 ? (
                <p className="text-white/20 text-xs">No enrollments yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {seqEnrollments.slice(0, 20).map((e) => {
                    const contact = contacts.find((c) => c.email === e.contactEmail);
                    const step = selected.steps[e.nextStepIndex];
                    return (
                      <div key={e.id} className="flex items-center gap-3 text-xs bg-white/3 rounded-lg px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 truncate">{contact?.name ? `${contact.name} (${e.contactEmail})` : e.contactEmail}</p>
                          <p className="text-white/25 text-[10px] mt-0.5">
                            {e.completed ? "Completed" : step ? `Next: Day ${step.dayOffset} — ${step.subject}` : "Complete"}
                          </p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${e.completed ? "bg-white/8 text-white/25" : "bg-green-500/20 text-green-400"}`}>
                          {e.completed ? "Done" : `Step ${e.nextStepIndex + 1}/${selected.steps.length}`}
                        </span>
                        <button
                          onClick={() => onEnrollmentsChange(enrollments.filter((en) => en.id !== e.id))}
                          className="text-white/20 hover:text-red-400 transition-colors"
                        >×</button>
                      </div>
                    );
                  })}
                  {seqEnrollments.length > 20 && (
                    <p className="text-white/25 text-[10px] pl-1">+{seqEnrollments.length - 20} more</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-white/20">
          <div className="text-center">
            <p className="text-sm mb-2">No sequence selected</p>
            <p className="text-xs">Create one to get started</p>
          </div>
        </div>
      )}

      {/* Step edit modal */}
      {editingStep && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setEditingStep(null)}>
          <div className="bg-navy border border-white/10 rounded-xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <p className="text-white font-semibold text-sm">{isNewStep ? "Add Step" : "Edit Step"}</p>
              <button onClick={() => setEditingStep(null)} className="text-white/30 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="field-label">Send on day</label>
                <input
                  type="number"
                  min={0}
                  value={editingStep.dayOffset}
                  onChange={(e) => setEditingStep({ ...editingStep, dayOffset: parseInt(e.target.value) || 0 })}
                  className="field-input w-32"
                />
                <p className="text-[10px] text-white/25 mt-1">0 = immediately upon enrollment</p>
              </div>
              <div>
                <label className="field-label">Subject</label>
                <input
                  value={editingStep.subject}
                  onChange={(e) => setEditingStep({ ...editingStep, subject: e.target.value })}
                  className="field-input"
                  placeholder="Subject line…"
                />
              </div>
              <div>
                <label className="field-label">Body (HTML)</label>
                <textarea
                  value={editingStep.htmlBody}
                  onChange={(e) => setEditingStep({ ...editingStep, htmlBody: e.target.value })}
                  className="field-input font-mono text-xs resize-none"
                  rows={8}
                  placeholder="<p>Hello {{first_name}},</p><p>…</p>"
                />
                <p className="text-[10px] text-white/25 mt-1">Supports {"{{name}}"}, {"{{first_name}}"}, {"{{email}}"}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
              <button onClick={() => setEditingStep(null)} className="px-4 py-2 text-xs text-white/40 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={saveStep}
                disabled={!editingStep.subject.trim()}
                className="px-5 py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent/85 disabled:opacity-30 transition-colors"
              >
                {isNewStep ? "Add Step" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={() => setShowEnrollModal(false)}>
          <div className="bg-navy border border-white/10 rounded-xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <p className="text-white font-semibold text-sm">Enroll Contacts</p>
              <button onClick={() => setShowEnrollModal(false)} className="text-white/30 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="px-6 py-5">
              <p className="field-label mb-2">Enroll which contacts?</p>
              <div className="flex flex-wrap gap-1.5">
                {["All", ...CONTACT_TAGS].map((tag) => {
                  const count = tag === "All"
                    ? contacts.filter(c => !c.unsubscribed).length
                    : contacts.filter(c => c.tags.includes(tag) && !c.unsubscribed).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setEnrollTag(tag)}
                      className={[
                        "text-[10px] px-2.5 py-1 rounded-full border transition-colors",
                        enrollTag === tag ? "border-accent bg-accent/20 text-accent-light" : "border-white/12 text-white/35 hover:text-white",
                      ].join(" ")}
                    >
                      {tag} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/8 flex justify-end gap-2">
              <button onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-xs text-white/40 hover:text-white">Cancel</button>
              <button
                onClick={enrollContacts}
                className="px-5 py-2 rounded-md bg-accent text-white text-xs font-semibold hover:bg-accent/85 transition-colors"
              >
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
