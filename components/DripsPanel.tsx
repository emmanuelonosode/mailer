"use client";

import { useState, useEffect, useCallback } from "react";
import type { DripSequence, DripStep, DripEnrollment, Contact, SendLogEntry } from "@/types/email";
import { CONTACT_TAGS } from "@/types/email";

interface DripsPanelProps {
  contacts: Contact[];
  optOuts: string[];
  senderName: string;
  senderEmail: string;
  appUrl: string;
  onLogEntry: (e: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

function dayLabel(n: number) {
  return n === 0 ? "Immediately" : `Day ${n}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeSequence(doc: any): DripSequence {
  return {
    id: doc._id?.toString() ?? doc.id,
    name: doc.name,
    description: doc.description ?? "",
    steps: (doc.steps ?? []).map((s: { _id?: string; id?: string; dayOffset: number; subject: string; html?: string; htmlBody?: string }) => ({
      id: s._id?.toString() ?? s.id ?? crypto.randomUUID(),
      dayOffset: s.dayOffset,
      subject: s.subject,
      htmlBody: s.html ?? s.htmlBody ?? "",
    })),
    createdAt: doc.createdAt ?? new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeEnrollment(doc: any): DripEnrollment {
  return {
    id: doc._id?.toString() ?? doc.id,
    sequenceId: doc.sequenceId,
    contactEmail: doc.email ?? doc.contactEmail,
    enrolledAt: doc.enrolledAt ?? new Date().toISOString(),
    nextStepIndex: doc.completedSteps?.length ?? doc.nextStepIndex ?? 0,
    completed: doc.active === false ? true : (doc.completed ?? false),
    lastSentAt: doc.lastSentAt,
  };
}

export default function DripsPanel({
  contacts,
  optOuts,
  onLogEntry,
  onShowToast,
}: DripsPanelProps) {
  const [sequences, setSequences] = useState<DripSequence[]>([]);
  const [enrollments, setEnrollments] = useState<DripEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<DripStep | null>(null);
  const [isNewStep, setIsNewStep] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollTag, setEnrollTag] = useState("All");
  const [isFiring, setIsFiring] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [seqRes, enrRes] = await Promise.all([
        fetch("/api/sequences"),
        fetch("/api/enrollments"),
      ]);
      const [seqData, enrData] = await Promise.all([seqRes.json(), enrRes.json()]);
      const seqs: DripSequence[] = Array.isArray(seqData) ? seqData.map(normalizeSequence) : [];
      const enrs: DripEnrollment[] = Array.isArray(enrData) ? enrData.map(normalizeEnrollment) : [];
      setSequences(seqs);
      setEnrollments(enrs);
      if (seqs.length > 0 && !selectedId) setSelectedId(seqs[0].id);
    } catch {
      // keep existing state on error
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshEnrollments = useCallback(async () => {
    try {
      const res = await fetch("/api/enrollments");
      const data = await res.json();
      if (Array.isArray(data)) setEnrollments(data.map(normalizeEnrollment));
    } catch {}
  }, []);

  const selected = sequences.find((s) => s.id === selectedId) ?? null;

  async function createSequence() {
    try {
      const res = await fetch("/api/sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Sequence", steps: [] }),
      });
      if (res.ok) {
        const doc = await res.json();
        const seq = normalizeSequence(doc);
        setSequences((prev) => [seq, ...prev]);
        setSelectedId(seq.id);
      }
    } catch {
      onShowToast("error", "Failed to create sequence.");
    }
  }

  async function updateSelected(patch: Partial<DripSequence>) {
    if (!selected) return;
    const updated = { ...selected, ...patch };
    // Optimistic local update
    setSequences((prev) => prev.map((s) => (s.id === selected.id ? updated : s)));

    const apiPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) apiPatch.name = patch.name;
    if (patch.description !== undefined) apiPatch.description = patch.description;
    if (patch.steps !== undefined) {
      apiPatch.steps = patch.steps.map((s) => ({
        dayOffset: s.dayOffset,
        subject: s.subject,
        html: s.htmlBody,
      }));
    }

    try {
      await fetch(`/api/sequences/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPatch),
      });
    } catch {}
  }

  async function deleteSequence(id: string) {
    try {
      await fetch(`/api/sequences/${id}`, { method: "DELETE" });
      setSequences((prev) => prev.filter((s) => s.id !== id));
      setEnrollments((prev) => prev.filter((e) => e.sequenceId !== id));
      if (selectedId === id) {
        setSelectedId(sequences.find((s) => s.id !== id)?.id ?? null);
      }
    } catch {
      onShowToast("error", "Failed to delete sequence.");
    }
  }

  function openNewStep() {
    setEditingStep({
      id: crypto.randomUUID(),
      dayOffset: (selected?.steps.at(-1)?.dayOffset ?? 0) + 3,
      subject: "",
      htmlBody: "",
    });
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

  async function enrollContacts() {
    if (!selected) return;
    const eligible = contacts.filter((c) => {
      if (c.unsubscribed || optOuts.includes(c.email.toLowerCase())) return false;
      if (enrollTag !== "All" && !c.tags.includes(enrollTag)) return false;
      return !enrollments.some(
        (e) => e.sequenceId === selected.id && e.contactEmail === c.email && !e.completed
      );
    });

    if (eligible.length === 0) {
      onShowToast("error", "No eligible contacts to enroll.");
      return;
    }

    try {
      const payload = eligible.map((c) => ({ sequenceId: selected.id, email: c.email, contactId: c.id }));
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await refreshEnrollments();
        setShowEnrollModal(false);
        onShowToast("success", `Enrolled ${eligible.length} contacts in "${selected.name}".`);
      } else {
        onShowToast("error", "Failed to enroll contacts.");
      }
    } catch {
      onShowToast("error", "Failed to enroll contacts.");
    }
  }

  async function removeEnrollment(id: string) {
    try {
      await fetch(`/api/enrollments/${id}`, { method: "DELETE" });
      setEnrollments((prev) => prev.filter((e) => e.id !== id));
    } catch {
      onShowToast("error", "Failed to remove enrollment.");
    }
  }

  async function fireDueSteps() {
    setIsFiring(true);
    try {
      const res = await fetch("/api/cron/fire-sequences");
      const data = await res.json();
      await refreshEnrollments();
      onShowToast(
        "success",
        data.fired > 0
          ? `Fired ${data.fired} drip step${data.fired !== 1 ? "s" : ""}.`
          : "No steps due right now."
      );
    } catch {
      onShowToast("error", "Failed to fire due steps.");
    } finally {
      setIsFiring(false);
    }
  }

  // Keep onLogEntry in scope (used if we re-add client-side logging later)
  void onLogEntry;

  const sequenceEnrollments = selected
    ? enrollments.filter((e) => e.sequenceId === selected.id)
    : [];
  const activeEnrollments = sequenceEnrollments.filter((e) => !e.completed);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0a1929] xl:flex-row">
      <div className="border-b border-white/8 xl:w-64 xl:shrink-0 xl:border-b-0 xl:border-r">
        <div className="border-b border-white/8 px-5 pb-4 pt-7">
          <h1 className="text-base font-semibold text-white">Drip Sequences</h1>
          <p className="mt-0.5 text-[10px] text-white/30">Automated email journeys</p>
        </div>

        <div className="flex gap-2 overflow-x-auto px-4 py-3 xl:flex-col xl:px-0 xl:py-2">
          {loading && <p className="px-4 text-xs text-white/25">Loading...</p>}
          {!loading && sequences.length === 0 && (
            <p className="px-4 text-xs text-white/25 xl:mt-8 xl:text-center">No sequences yet.</p>
          )}
          {sequences.map((sequence) => {
            const count = enrollments.filter(
              (e) => e.sequenceId === sequence.id && !e.completed
            ).length;
            return (
              <button
                key={sequence.id}
                onClick={() => setSelectedId(sequence.id)}
                className={[
                  "min-w-52 rounded-lg border px-4 py-3 text-left transition-colors xl:w-full xl:rounded-none xl:border-x-0 xl:border-y-0 xl:border-l-2 xl:px-5",
                  selectedId === sequence.id
                    ? "border-accent bg-accent/15 xl:border-accent"
                    : "border-white/8 bg-white/3 hover:bg-white/4 xl:border-transparent",
                ].join(" ")}
              >
                <p className="truncate text-xs font-medium text-white">{sequence.name}</p>
                <p className="mt-0.5 text-[10px] text-white/35">
                  {sequence.steps.length} steps | {count} active
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/8 p-4">
          <button
            onClick={createSequence}
            className="w-full rounded-md bg-accent py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/85"
          >
            + New Sequence
          </button>
          <button
            onClick={fireDueSteps}
            disabled={isFiring}
            className="w-full rounded-md border border-white/12 py-2 text-xs text-white/50 transition-colors hover:border-white/25 hover:text-white disabled:opacity-30"
          >
            {isFiring ? "Processing..." : "Fire Due Steps"}
          </button>
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 sm:mr-4">
                <input
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                  className="w-full border-b border-transparent bg-transparent text-lg font-semibold text-white outline-none transition-colors hover:border-white/20 focus:border-accent/60"
                />
                <input
                  value={selected.description}
                  onChange={(e) => updateSelected({ description: e.target.value })}
                  placeholder="Description (optional)"
                  className="mt-1 w-full border-b border-transparent bg-transparent text-xs text-white/40 outline-none transition-colors hover:border-white/10 focus:border-white/20"
                />
              </div>
              <button onClick={() => deleteSequence(selected.id)} className="text-xs text-white/25 transition-colors hover:text-red-400">
                Delete
              </button>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-[10px] font-semibold tracking-widest text-white/35 uppercase">Steps</p>
              {selected.steps.length === 0 && (
                <p className="py-4 text-xs text-white/25">No steps yet. Add the first step.</p>
              )}
              <div className="flex flex-col gap-2">
                {selected.steps.map((step, idx) => (
                  <div key={step.id} className="flex flex-col gap-3 rounded-lg border border-white/8 bg-white/4 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="w-20 shrink-0 text-center">
                      <span className="text-[10px] font-semibold text-accent-light/70">{dayLabel(step.dayOffset)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-white/80">
                        {step.subject || <span className="italic text-white/30">No subject</span>}
                      </p>
                      <p className="mt-0.5 text-[10px] text-white/30">Step {idx + 1}</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setEditingStep(step); setIsNewStep(false); }}
                        className="text-xs text-white/30 transition-colors hover:text-white"
                      >
                        Edit
                      </button>
                      <button onClick={() => deleteStep(step.id)} className="text-xs text-white/25 transition-colors hover:text-red-400">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={openNewStep}
                className="mt-3 w-full rounded-lg border border-dashed border-white/15 px-4 py-2 text-xs text-accent-light/60 transition-colors hover:border-accent/40 hover:text-accent-light"
              >
                + Add Step
              </button>
            </div>

            <div>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-semibold tracking-widest text-white/35 uppercase">
                  Enrollments ({activeEnrollments.length} active)
                </p>
                <button
                  onClick={() => setShowEnrollModal(true)}
                  disabled={contacts.length === 0 || selected.steps.length === 0}
                  className="rounded bg-accent/20 px-3 py-1 text-xs text-accent-light transition-colors hover:bg-accent/30 disabled:opacity-30"
                >
                  Enroll Contacts
                </button>
              </div>

              {sequenceEnrollments.length === 0 ? (
                <p className="text-xs text-white/20">No enrollments yet.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {sequenceEnrollments.slice(0, 20).map((enrollment) => {
                    const contact = contacts.find((c) => c.email === enrollment.contactEmail);
                    const step = selected.steps[enrollment.nextStepIndex];
                    return (
                      <div key={enrollment.id} className="flex flex-col gap-3 rounded-lg bg-white/3 px-4 py-3 text-xs sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-white/70">
                            {contact?.name ? `${contact.name} (${enrollment.contactEmail})` : enrollment.contactEmail}
                          </p>
                          <p className="mt-0.5 text-[10px] text-white/25">
                            {enrollment.completed ? "Completed" : step ? `Next: Day ${step.dayOffset} - ${step.subject}` : "Complete"}
                          </p>
                        </div>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${enrollment.completed ? "bg-white/8 text-white/25" : "bg-green-500/20 text-green-400"}`}>
                          {enrollment.completed ? "Done" : `Step ${enrollment.nextStepIndex + 1}/${selected.steps.length}`}
                        </span>
                        <button
                          onClick={() => removeEnrollment(enrollment.id)}
                          className="text-xs text-white/20 transition-colors hover:text-red-400"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-white/20">
          <div className="text-center">
            <p className="mb-2 text-sm">{loading ? "Loading..." : "No sequence selected"}</p>
            {!loading && <p className="text-xs">Create one to get started.</p>}
          </div>
        </div>
      )}

      {editingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingStep(null)}>
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-navy shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <p className="text-sm font-semibold text-white">{isNewStep ? "Add Step" : "Edit Step"}</p>
              <button onClick={() => setEditingStep(null)} className="text-xl leading-none text-white/30 transition-colors hover:text-white">×</button>
            </div>
            <div className="flex flex-col gap-4 px-6 py-5">
              <div>
                <label className="field-label">Send on day</label>
                <input
                  type="number"
                  min={0}
                  value={editingStep.dayOffset}
                  onChange={(e) => setEditingStep({ ...editingStep, dayOffset: parseInt(e.target.value, 10) || 0 })}
                  className="field-input w-32"
                />
                <p className="mt-1 text-[10px] text-white/25">0 = immediately upon enrollment</p>
              </div>
              <div>
                <label className="field-label">Subject</label>
                <input
                  value={editingStep.subject}
                  onChange={(e) => setEditingStep({ ...editingStep, subject: e.target.value })}
                  className="field-input"
                  placeholder="Subject line..."
                />
              </div>
              <div>
                <label className="field-label">Body (HTML)</label>
                <textarea
                  value={editingStep.htmlBody}
                  onChange={(e) => setEditingStep({ ...editingStep, htmlBody: e.target.value })}
                  className="field-input resize-none font-mono text-xs"
                  rows={8}
                  placeholder="<p>Hello {{first_name}},</p><p>...</p>"
                />
                <p className="mt-1 text-[10px] text-white/25">Supports {"{{name}}"}, {"{{first_name}}"}, {"{{email}}"}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/8 px-6 py-4">
              <button onClick={() => setEditingStep(null)} className="px-4 py-2 text-xs text-white/40 transition-colors hover:text-white">Cancel</button>
              <button
                onClick={saveStep}
                disabled={!editingStep.subject.trim()}
                className="rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/85 disabled:opacity-30"
              >
                {isNewStep ? "Add Step" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowEnrollModal(false)}>
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-navy shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <p className="text-sm font-semibold text-white">Enroll Contacts</p>
              <button onClick={() => setShowEnrollModal(false)} className="text-xl leading-none text-white/30 transition-colors hover:text-white">×</button>
            </div>
            <div className="px-6 py-5">
              <p className="mb-2 field-label">Enroll which contacts?</p>
              <div className="flex flex-wrap gap-1.5">
                {["All", ...CONTACT_TAGS].map((tag) => {
                  const count =
                    tag === "All"
                      ? contacts.filter((c) => !c.unsubscribed).length
                      : contacts.filter((c) => c.tags.includes(tag) && !c.unsubscribed).length;
                  return (
                    <button
                      key={tag}
                      onClick={() => setEnrollTag(tag)}
                      className={[
                        "rounded-full border px-2.5 py-1 text-[10px] transition-colors",
                        enrollTag === tag
                          ? "border-accent bg-accent/20 text-accent-light"
                          : "border-white/12 text-white/35 hover:text-white",
                      ].join(" ")}
                    >
                      {tag} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/8 px-6 py-4">
              <button onClick={() => setShowEnrollModal(false)} className="px-4 py-2 text-xs text-white/40 hover:text-white">Cancel</button>
              <button
                onClick={enrollContacts}
                className="rounded-md bg-accent px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent/85"
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
