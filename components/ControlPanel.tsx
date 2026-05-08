"use client";

import SmtpFields from "@/components/SmtpFields";
import SenderFields from "@/components/SenderFields";
import MessageFields from "@/components/MessageFields";

interface ControlPanelProps {
  smtpHost: string; onSmtpHostChange: (v: string) => void;
  smtpPort: number; onSmtpPortChange: (v: number) => void;
  smtpSecure: boolean; onSmtpSecureChange: (v: boolean) => void;
  smtpUser: string; onSmtpUserChange: (v: string) => void;
  smtpPassword: string; onSmtpPasswordChange: (v: string) => void;
  senderName: string; onSenderNameChange: (v: string) => void;
  senderEmail: string; onSenderEmailChange: (v: string) => void;
  recipient: string; onRecipientChange: (v: string) => void;
  subject: string; onSubjectChange: (v: string) => void;
  htmlBody: string; onHtmlBodyChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
}

function SectionHeading({ title }: { title: string }) {
  return (
    <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-accent-light/50 mb-3">
      {title}
    </p>
  );
}

export default function ControlPanel({
  smtpHost, onSmtpHostChange,
  smtpPort, onSmtpPortChange,
  smtpSecure, onSmtpSecureChange,
  smtpUser, onSmtpUserChange,
  smtpPassword, onSmtpPasswordChange,
  senderName, onSenderNameChange,
  senderEmail, onSenderEmailChange,
  recipient, onRecipientChange,
  subject, onSubjectChange,
  htmlBody, onHtmlBodyChange,
  onSend, isSending,
}: ControlPanelProps) {
  return (
    <aside className="flex flex-col h-full bg-navy border-r border-white/8 overflow-hidden">

      {/* Brand bar */}
      <div className="px-5 py-4 border-b border-white/8 shrink-0">
        <p className="font-serif text-white text-lg tracking-[0.12em] uppercase leading-tight">
          Hasker &amp; Co.
        </p>
        <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase mt-0.5">
          Email Campaign Sender
        </p>
      </div>

      {/* Scrollable form */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-2 gap-5">

        <section>
          <SectionHeading title="SMTP" />
          <SmtpFields
            host={smtpHost} onHostChange={onSmtpHostChange}
            port={smtpPort} onPortChange={onSmtpPortChange}
            secure={smtpSecure} onSecureChange={onSmtpSecureChange}
            user={smtpUser} onUserChange={onSmtpUserChange}
            password={smtpPassword} onPasswordChange={onSmtpPasswordChange}
          />
        </section>

        {/* thin rule between sections */}
        <div className="h-px bg-white/6" />

        <section>
          <SectionHeading title="Sender" />
          <SenderFields
            senderName={senderName} onSenderNameChange={onSenderNameChange}
            senderEmail={senderEmail} onSenderEmailChange={onSenderEmailChange}
          />
        </section>

        <div className="h-px bg-white/6" />

        <section className="flex flex-col flex-1 min-h-0">
          <SectionHeading title="Message" />
          <MessageFields
            recipient={recipient} onRecipientChange={onRecipientChange}
            subject={subject} onSubjectChange={onSubjectChange}
            htmlBody={htmlBody} onHtmlBodyChange={onHtmlBodyChange}
          />
        </section>

      </div>

      {/* Send button */}
      <div className="px-5 py-4 border-t border-white/8 shrink-0">
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
      </div>
    </aside>
  );
}
