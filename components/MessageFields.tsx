"use client";

interface MessageFieldsProps {
  recipient: string; onRecipientChange: (v: string) => void;
  subject: string; onSubjectChange: (v: string) => void;
  htmlBody: string; onHtmlBodyChange: (v: string) => void;
}

export default function MessageFields({
  recipient, onRecipientChange,
  subject, onSubjectChange,
  htmlBody, onHtmlBodyChange,
}: MessageFieldsProps) {
  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">

      <div>
        <label className="field-label">To</label>
        <input
          type="email"
          value={recipient}
          onChange={(e) => onRecipientChange(e.target.value)}
          placeholder="prospect@example.com"
          className="field-input"
        />
      </div>

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

      <div className="flex flex-col">
        <label className="field-label">
          HTML Body
          <span className="ml-1.5 normal-case font-normal tracking-normal text-white/20">
            — paste raw HTML
          </span>
        </label>
        <textarea
          value={htmlBody}
          onChange={(e) => onHtmlBodyChange(e.target.value)}
          placeholder={`<h2>Dear John,</h2>\n<p>We have a new listing we think you'll love...</p>`}
          className="resize-y bg-transparent border-t border-white/10 pt-3 font-mono text-xs leading-relaxed text-white/80 placeholder:text-white/20 outline-none"
          style={{ minHeight: "220px" }}
          spellCheck={false}
        />
      </div>

    </div>
  );
}
