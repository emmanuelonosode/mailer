"use client";

import { useState } from "react";
import type { EmailTemplate } from "@/types/email";

interface TemplateModalProps {
  templates: EmailTemplate[];
  currentSubject: string;
  currentHtmlBody: string;
  onSave: (name: string) => void;
  onLoad: (t: EmailTemplate) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TemplateModal({
  templates,
  currentSubject,
  currentHtmlBody,
  onSave,
  onLoad,
  onDelete,
  onClose,
}: TemplateModalProps) {
  const [saveName, setSaveName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    if (!currentSubject.trim() && !currentHtmlBody.trim()) return;
    onSave(name);
    setSaveName("");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        className="bg-navy border border-white/10 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">Email Templates</p>
            <p className="text-white/35 text-[10px] tracking-[0.15em] uppercase mt-0.5">
              {templates.length} saved
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Save current */}
        <div className="px-5 py-4 border-b border-white/8 shrink-0">
          <p className="field-label mb-2">Save current as template</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="e.g. New Listing — Virginia Beach"
              className="field-input flex-1 text-xs"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!saveName.trim() || (!currentSubject.trim() && !currentHtmlBody.trim())}
              className="text-xs px-3 py-1 rounded bg-accent text-white hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              Save
            </button>
          </div>
          {!currentSubject.trim() && !currentHtmlBody.trim() && (
            <p className="text-[10px] text-white/30 mt-1.5">Compose a subject and body first.</p>
          )}
        </div>

        {/* Template list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <p className="text-white/30 text-sm">No templates yet.</p>
              <p className="text-white/20 text-xs">Save your first template above.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-white/8 bg-white/3 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{t.name}</p>
                      <p className="text-white/40 text-[11px] mt-0.5 truncate">
                        {t.subject || <em className="text-white/20">No subject</em>}
                      </p>
                      <p className="text-white/25 text-[10px] mt-1">{formatDate(t.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {confirmDelete === t.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => { onDelete(t.id); setConfirmDelete(null); }}
                            className="text-[11px] text-red-400 hover:text-red-300 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="text-[11px] text-white/30 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onLoad(t)}
                            className="text-[11px] px-2 py-1 rounded bg-accent/20 text-accent-light/80 hover:bg-accent/40 hover:text-white transition-colors"
                          >
                            Load
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(t.id)}
                            className="text-[11px] text-white/25 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
