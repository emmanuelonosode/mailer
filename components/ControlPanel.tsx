"use client";

import SenderFields from "@/components/SenderFields";
import MessageFields from "@/components/MessageFields";
import BulkSend from "@/components/BulkSend";
import type { Attachment, SendLogEntry, Contact } from "@/types/email";

interface ControlPanelProps {
  smtpConfigured: boolean;
  // Sender
  senderName: string; onSenderNameChange: (v: string) => void;
  senderEmail: string; onSenderEmailChange: (v: string) => void;
  // Message
  recipient: string; onRecipientChange: (v: string) => void;
  cc: string; onCcChange: (v: string) => void;
  bcc: string; onBccChange: (v: string) => void;
  subject: string; onSubjectChange: (v: string) => void;
  htmlBody: string; onHtmlBodyChange: (v: string) => void;
  attachments: Attachment[]; onAttachmentsChange: (a: Attachment[]) => void;
  editorKey: number;
  // Bulk
  bulkMode: boolean; onBulkModeToggle: () => void;
  // Actions
  onSend: () => void;
  onTestSend: () => void;
  isSending: boolean;
  // Modals
  onOpenTemplates: () => void;
  onOpenLog: () => void;
  templateCount: number;
  logCount: number;
  // Marketing tools
  onOpenCampaign: () => void;
  onOpenPropertyCard: () => void;
  onOpenUtmBuilder: () => void;
  onOpenMultiListing: () => void;
  onOpenScheduler: () => void;
  // Contacts / tracking
  contacts: Contact[];
  optOuts: string[];
  appUrl: string;
  // Log
  onLogEntry: (entry: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-accent-light/50 mb-3">
      {title}
    </p>
  );
}

function IconButton({
  onClick,
  title,
  badge,
  children,
}: {
  onClick: () => void;
  title: string;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="relative flex items-center justify-center w-7 h-7 rounded-md text-white/35 hover:text-white hover:bg-white/8 transition-colors"
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-accent text-white text-[8px] flex items-center justify-center font-bold">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

export default function ControlPanel({
  smtpConfigured,
  senderName, onSenderNameChange,
  senderEmail, onSenderEmailChange,
  recipient, onRecipientChange,
  cc, onCcChange,
  bcc, onBccChange,
  subject, onSubjectChange,
  htmlBody, onHtmlBodyChange,
  attachments, onAttachmentsChange,
  editorKey,
  bulkMode, onBulkModeToggle,
  onSend, onTestSend, isSending,
  onOpenTemplates, onOpenLog,
  templateCount, logCount,
  onOpenCampaign, onOpenPropertyCard, onOpenUtmBuilder,
  onOpenMultiListing, onOpenScheduler,
  contacts, optOuts, appUrl,
  onLogEntry, onShowToast,
}: ControlPanelProps) {

  return (
    <aside className="flex flex-col h-full bg-navy border-r border-white/8 overflow-hidden">

      {/* Brand bar */}
      <div className="px-5 py-4 border-b border-white/8 shrink-0 flex items-center">
        <div className="flex-1">
          <p className="font-serif text-white text-lg tracking-[0.12em] uppercase leading-tight">
            Hasker &amp; Co.
          </p>
          <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase mt-0.5">
            Email Campaign Sender
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Bulk toggle */}
          <button
            type="button"
            onClick={onBulkModeToggle}
            title={bulkMode ? "Switch to single send" : "Switch to bulk send"}
            className={[
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold tracking-widest uppercase transition-colors",
              bulkMode
                ? "bg-accent text-white"
                : "text-white/30 hover:text-white hover:bg-white/8",
            ].join(" ")}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Bulk
          </button>

          {/* Templates */}
          <IconButton onClick={onOpenTemplates} title="Email templates" badge={templateCount}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </IconButton>

          {/* Scheduler */}
          <IconButton onClick={onOpenScheduler} title="Schedule a send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </IconButton>

          {/* Send log */}
          <IconButton onClick={onOpenLog} title="Send history" badge={logCount > 0 ? logCount : undefined}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Scrollable form */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-2 gap-5">

        {/* Sender */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <SectionHeading title="Sender" />
            {smtpConfigured && (
              <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">
                SMTP ACTIVE
              </span>
            )}
          </div>
          <SenderFields
            senderName={senderName} onSenderNameChange={onSenderNameChange}
            senderEmail={senderEmail} onSenderEmailChange={onSenderEmailChange}
          />
        </section>

        <div className="h-px bg-white/6" />

        {/* Marketing tools strip */}
        <section>
          <SectionHeading title="Marketing Tools" />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenCampaign}
              className="flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border border-white/8 hover:border-accent/40 hover:bg-accent/6 transition-colors group"
              title="Load a pre-built campaign template"
            >
              <span className="text-lg leading-none">⚡</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase text-white/40 group-hover:text-white/70 transition-colors">Campaign</span>
            </button>
            <button
              type="button"
              onClick={onOpenPropertyCard}
              className="flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border border-white/8 hover:border-accent/40 hover:bg-accent/6 transition-colors group"
              title="Build and insert a property listing card"
            >
              <span className="text-lg leading-none">🏠</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase text-white/40 group-hover:text-white/70 transition-colors">Listing Card</span>
            </button>
            <button
              type="button"
              onClick={onOpenUtmBuilder}
              className="flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border border-white/8 hover:border-accent/40 hover:bg-accent/6 transition-colors group"
              title="Add UTM tracking parameters to all links"
            >
              <span className="text-lg leading-none">📊</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase text-white/40 group-hover:text-white/70 transition-colors">UTM Links</span>
            </button>
            <button
              type="button"
              onClick={onOpenMultiListing}
              className="flex-1 flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border border-white/8 hover:border-accent/40 hover:bg-accent/6 transition-colors group"
              title="Feature multiple listings in a grid"
            >
              <span className="text-lg leading-none">🏘️</span>
              <span className="text-[9px] font-semibold tracking-widest uppercase text-white/40 group-hover:text-white/70 transition-colors">Showcase</span>
            </button>
          </div>
        </section>

        <div className="h-px bg-white/6" />

        {/* Message / Bulk */}
        <section className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-3">
            <SectionHeading title={bulkMode ? "Bulk Send" : "Message"} />
          </div>

          {bulkMode ? (
            <>
              {/* Subject still needed for bulk (supports tokens) */}
              <div className="mb-4">
                <label className="field-label">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  placeholder="Dear {{name}}, check out this listing…"
                  className="field-input"
                />
                <p className="text-[10px] text-white/25 mt-1">Supports {"{{name}}"}, {"{{email}}"}, {"{{first_name}}"}</p>
              </div>

              {/* Body editor (tokens apply here too) */}
              <div className="mb-4">
                <label className="field-label">Body (use Visual editor on Compose tab)</label>
                <p className="text-[10px] text-white/30 leading-relaxed mt-0.5">
                  Body is taken from the Compose tab. Switch there to edit it.
                </p>
              </div>

              <BulkSend
                senderName={senderName}
                senderEmail={senderEmail}
                subject={subject}
                rawHtmlBody={htmlBody}
                contacts={contacts}
                optOuts={optOuts}
                appUrl={appUrl}
                onLogEntry={onLogEntry}
                onShowToast={onShowToast}
              />
            </>
          ) : (
            <MessageFields
              recipient={recipient} onRecipientChange={onRecipientChange}
              cc={cc} onCcChange={onCcChange}
              bcc={bcc} onBccChange={onBccChange}
              subject={subject} onSubjectChange={onSubjectChange}
              htmlBody={htmlBody} onHtmlBodyChange={onHtmlBodyChange}
              attachments={attachments} onAttachmentsChange={onAttachmentsChange}
              editorKey={editorKey}
            />
          )}
        </section>

      </div>

      {/* Send button (only in compose mode) */}
      {!bulkMode && (
        <div className="px-5 py-4 border-t border-white/8 shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className={[
              "w-full py-3 rounded-md font-semibold text-sm tracking-wider uppercase",
              "transition-all duration-150 flex items-center justify-center gap-2",
              isSending
                ? "bg-accent/30 text-white/30 cursor-not-allowed"
                : "bg-accent text-white hover:bg-accent/85 active:scale-[0.98] cursor-pointer",
            ].join(" ")}
          >
            {isSending ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                </svg>
                Send Email
              </>
            )}
          </button>

          {/* Test send */}
          <button
            type="button"
            onClick={onTestSend}
            disabled={isSending}
            className="w-full py-2 rounded-md text-xs font-medium text-white/35 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Send test to myself
          </button>
        </div>
      )}
    </aside>
  );
}
