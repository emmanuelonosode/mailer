"use client";

import SenderFields from "@/components/SenderFields";
import MessageFields from "@/components/MessageFields";
import BulkSend from "@/components/BulkSend";
import type { Attachment, SendLogEntry, Contact } from "@/types/email";

interface ControlPanelProps {
  smtpConfigured: boolean;
  senderName: string;
  onSenderNameChange: (v: string) => void;
  senderEmail: string;
  onSenderEmailChange: (v: string) => void;
  recipient: string;
  onRecipientChange: (v: string) => void;
  cc: string;
  onCcChange: (v: string) => void;
  bcc: string;
  onBccChange: (v: string) => void;
  subject: string;
  onSubjectChange: (v: string) => void;
  htmlBody: string;
  onHtmlBodyChange: (v: string) => void;
  attachments: Attachment[];
  onAttachmentsChange: (a: Attachment[]) => void;
  editorKey: number;
  bulkMode: boolean;
  onBulkModeToggle: () => void;
  onSend: () => void;
  onTestSend: () => void;
  isSending: boolean;
  onOpenTemplates: () => void;
  onOpenLog: () => void;
  templateCount: number;
  logCount: number;
  onOpenCampaign: () => void;
  onOpenPropertyCard: () => void;
  onOpenUtmBuilder: () => void;
  onOpenMultiListing: () => void;
  onOpenScheduler: () => void;
  contacts: Contact[];
  optOuts: string[];
  appUrl: string;
  onLogEntry: (entry: SendLogEntry) => void;
  onShowToast: (type: "success" | "error", message: string) => void;
  mobilePreviewOpen: boolean;
  onToggleMobilePreview: () => void;
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p className="mb-3 text-[11px] font-semibold text-white/35 tracking-[0.12em] uppercase">
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
      className="relative flex h-8 w-8 items-center justify-center rounded-[8px] text-white/40 transition-all duration-150 hover:bg-white/[0.07] hover:text-white active:scale-95"
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}

function ToolButton({
  onClick,
  title,
  icon,
  label,
}: {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="group flex flex-1 flex-col items-center gap-1.5 rounded-[10px] border border-white/[0.07] bg-white/[0.02] px-2 py-3 transition-all duration-150 hover:border-accent/30 hover:bg-accent/[0.07] active:scale-95"
    >
      <span className="text-white/55 transition-colors group-hover:text-white/90">{icon}</span>
      <span className="text-[9px] font-medium tracking-wide text-white/35 uppercase transition-colors group-hover:text-white/65">
        {label}
      </span>
    </button>
  );
}

export default function ControlPanel({
  smtpConfigured,
  senderName,
  onSenderNameChange,
  senderEmail,
  onSenderEmailChange,
  recipient,
  onRecipientChange,
  cc,
  onCcChange,
  bcc,
  onBccChange,
  subject,
  onSubjectChange,
  htmlBody,
  onHtmlBodyChange,
  attachments,
  onAttachmentsChange,
  editorKey,
  bulkMode,
  onBulkModeToggle,
  onSend,
  onTestSend,
  isSending,
  onOpenTemplates,
  onOpenLog,
  templateCount,
  logCount,
  onOpenCampaign,
  onOpenPropertyCard,
  onOpenUtmBuilder,
  onOpenMultiListing,
  onOpenScheduler,
  contacts,
  optOuts,
  appUrl,
  onLogEntry,
  onShowToast,
  mobilePreviewOpen,
  onToggleMobilePreview,
}: ControlPanelProps) {
  return (
    <aside className="flex min-h-0 w-full flex-col overflow-hidden border-b border-white/[0.07] bg-navy lg:h-full lg:max-w-[32rem] lg:border-b-0 lg:border-r">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/[0.07] px-4 py-3 sm:px-5">
        <p className="flex-1 text-[11px] font-semibold text-white/40 tracking-[0.12em] uppercase">
          Compose
        </p>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleMobilePreview}
            className="rounded-[7px] px-2.5 py-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wide transition-all hover:bg-white/[0.07] hover:text-white/80 active:scale-95 lg:hidden"
          >
            {mobilePreviewOpen ? "Hide" : "Preview"}
          </button>

          <button
            type="button"
            onClick={onBulkModeToggle}
            title={bulkMode ? "Switch to single send" : "Switch to bulk send"}
            className={[
              "flex items-center gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-150 active:scale-95",
              bulkMode
                ? "bg-accent/20 text-accent-light border border-accent/30"
                : "text-white/35 hover:bg-white/[0.07] hover:text-white/80",
            ].join(" ")}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            Bulk
          </button>

          <IconButton onClick={onOpenTemplates} title="Email templates" badge={templateCount}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </IconButton>

          <IconButton onClick={onOpenScheduler} title="Schedule a send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </IconButton>

          <IconButton onClick={onOpenLog} title="Send history" badge={logCount > 0 ? logCount : undefined}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </IconButton>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 pb-2 pt-5 sm:px-5">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading title="Sender" />
            {smtpConfigured && (
              <span className="rounded-full border border-green-500/20 bg-green-500/10 px-2 py-0.5 text-[9px] font-bold text-green-400">
                SMTP ACTIVE
              </span>
            )}
          </div>
          <SenderFields
            senderName={senderName}
            onSenderNameChange={onSenderNameChange}
            senderEmail={senderEmail}
            onSenderEmailChange={onSenderEmailChange}
          />
        </section>

        <div className="h-px bg-white/6" />

        <section>
          <SectionHeading title="Marketing Tools" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ToolButton
              onClick={onOpenCampaign}
              title="Load a pre-built campaign template"
              label="Campaign"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
            />
            <ToolButton
              onClick={onOpenPropertyCard}
              title="Build and insert a property listing card"
              label="Listing"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
            />
            <ToolButton
              onClick={onOpenUtmBuilder}
              title="Add UTM tracking parameters to all links"
              label="UTM"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
            />
            <ToolButton
              onClick={onOpenMultiListing}
              title="Feature multiple listings in a grid"
              label="Showcase"
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>}
            />
          </div>
        </section>

        <div className="h-px bg-white/6" />

        <section className="flex min-h-0 flex-1 flex-col">
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading title={bulkMode ? "Bulk Send" : "Message"} />
          </div>

          {bulkMode ? (
            <>
              <div className="mb-4">
                <label className="field-label">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => onSubjectChange(e.target.value)}
                  placeholder="Dear {{name}}, check out this listing..."
                  className="field-input"
                />
                <p className="mt-1 text-[10px] text-white/25">Supports {"{{name}}"}, {"{{email}}"}, {"{{first_name}}"}</p>
              </div>

              <div className="mb-4">
                <label className="field-label">Body</label>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/30">
                  The bulk sender uses the same email body from the compose editor above.
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
              recipient={recipient}
              onRecipientChange={onRecipientChange}
              cc={cc}
              onCcChange={onCcChange}
              bcc={bcc}
              onBccChange={onBccChange}
              subject={subject}
              onSubjectChange={onSubjectChange}
              htmlBody={htmlBody}
              onHtmlBodyChange={onHtmlBodyChange}
              attachments={attachments}
              onAttachmentsChange={onAttachmentsChange}
              editorKey={editorKey}
            />
          )}
        </section>
      </div>

      {!bulkMode && (
        <div className="flex shrink-0 flex-col gap-2 border-t border-white/[0.07] px-4 py-4 sm:px-5">
          <button
            type="button"
            onClick={onSend}
            disabled={isSending}
            className={[
              "flex w-full items-center justify-center gap-2 rounded-[10px] py-3 text-[13px] font-semibold tracking-wide transition-all duration-150",
              isSending
                ? "cursor-not-allowed bg-accent/25 text-white/25"
                : "cursor-pointer bg-accent text-white shadow-lg shadow-accent/25 hover:bg-[#1548c0] active:scale-[0.97]",
            ].join(" ")}
          >
            {isSending ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v8z" />
                </svg>
                Sending&hellip;
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Send Email
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onTestSend}
            disabled={isSending}
            className="w-full rounded-[8px] py-2 text-[11px] font-medium text-white/30 transition-all hover:bg-white/[0.05] hover:text-white/60 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-25"
          >
            Send test to myself
          </button>
        </div>
      )}
    </aside>
  );
}
