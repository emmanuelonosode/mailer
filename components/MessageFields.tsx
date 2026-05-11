"use client";

import { useState, useRef } from "react";
import RichEditor from "@/components/RichEditor";
import type { Attachment } from "@/types/email";

interface MessageFieldsProps {
  recipient: string; onRecipientChange: (v: string) => void;
  cc: string; onCcChange: (v: string) => void;
  bcc: string; onBccChange: (v: string) => void;
  subject: string; onSubjectChange: (v: string) => void;
  htmlBody: string; onHtmlBodyChange: (v: string) => void;
  attachments: Attachment[]; onAttachmentsChange: (a: Attachment[]) => void;
  editorKey: number;
}

function bytesToSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageFields({
  recipient, onRecipientChange,
  cc, onCcChange,
  bcc, onBccChange,
  subject, onSubjectChange,
  htmlBody, onHtmlBodyChange,
  attachments, onAttachmentsChange,
  editorKey,
}: MessageFieldsProps) {
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sourceMode, setSourceMode] = useState(false);
  const [visualKey, setVisualKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleSourceMode() {
    if (sourceMode) setVisualKey((k) => k + 1); // remount TipTap with current HTML
    setSourceMode((s) => !s);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] ?? "";
        onAttachmentsChange([
          ...attachments,
          { name: file.name, content: base64, contentType: file.type || "application/octet-stream" },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeAttachment(name: string) {
    onAttachmentsChange(attachments.filter((a) => a.name !== name));
  }

  // Sync external editorKey (template load) → remount visual editor
  const combinedEditorKey = `${editorKey}-${visualKey}`;

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">

      {/* To */}
      <div>
        <div className="flex items-end justify-between mb-1">
          <label className="field-label !mb-0">To</label>
          <button
            type="button"
            onClick={() => setShowCcBcc((v) => !v)}
            className="text-[10px] text-white/30 hover:text-accent-light/60 transition-colors tracking-wide"
          >
            {showCcBcc ? "Hide CC/BCC" : "CC / BCC"}
          </button>
        </div>
        <input
          type="email"
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
          placeholder="prospect@example.com"
          className="field-input"
        />
      </div>

      {/* CC / BCC (collapsible) */}
      {showCcBcc && (
        <>
          <div>
            <label className="field-label">CC</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => onCcChange(e.target.value)}
              placeholder="cc@example.com, another@example.com"
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">BCC</label>
            <input
              type="text"
              value={bcc}
              onChange={(e) => onBccChange(e.target.value)}
              placeholder="bcc@example.com"
              className="field-input"
            />
          </div>
        </>
      )}

      {/* Subject */}
      <div>
        <label className="field-label">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => onSubjectChange(e.target.value)}
          placeholder="Exclusive Listing: 740 Park Avenue"
          className="field-input"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-0.5">
          <label className="field-label !mb-0">Body</label>
          <button
            type="button"
            onClick={toggleSourceMode}
            title={sourceMode ? "Switch to visual editor" : "Switch to HTML source"}
            className="text-[10px] font-mono text-white/25 hover:text-accent-light/60 transition-colors"
          >
            {sourceMode ? "Visual" : "</>"}
          </button>
        </div>

        {sourceMode ? (
          <textarea
            value={htmlBody}
            onChange={(e) => onHtmlBodyChange(e.target.value)}
            placeholder={`<h2>Dear John,</h2>\n<p>We have a new listing we think you'll love...</p>`}
            className="resize-y bg-transparent border-t border-white/10 pt-3 font-mono text-xs leading-relaxed text-white/80 placeholder:text-white/20 outline-none flex-1"
            style={{ minHeight: "200px" }}
            spellCheck={false}
          />
        ) : (
          <RichEditor
            key={combinedEditorKey}
            initialValue={htmlBody}
            onChange={onHtmlBodyChange}
          />
        )}
      </div>

      {/* Attachments */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="field-label !mb-0">Attachments</label>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] text-white/30 hover:text-accent-light/60 transition-colors flex items-center gap-1"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 0 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
            Attach file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            {attachments.map((a) => (
              <div key={a.name} className="flex items-center gap-2 text-xs group">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-light/40 shrink-0">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 0 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                <span className="flex-1 text-white/65 truncate">{a.name}</span>
                <span className="text-white/25 text-[10px] shrink-0 tabular-nums">
                  {bytesToSize(Math.round((a.content.length * 3) / 4))}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.name)}
                  className="text-white/20 hover:text-red-400 transition-colors shrink-0"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
