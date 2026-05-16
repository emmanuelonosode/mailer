"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import ControlPanel from "@/components/ControlPanel";
import LivePreview from "@/components/LivePreview";
import Toast from "@/components/Toast";
import TemplateModal from "@/components/TemplateModal";
import SendLogModal from "@/components/SendLogModal";
import CampaignLauncher from "@/components/CampaignLauncher";
import PropertyCardBuilder from "@/components/PropertyCardBuilder";
import UtmBuilder from "@/components/UtmBuilder";
import MultiListingShowcase from "@/components/MultiListingShowcase";
import SchedulerModal from "@/components/SchedulerModal";
import NavSidebar, { type NavSection } from "@/components/NavSidebar";
import ContactsPanel from "@/components/ContactsPanel";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import DripsPanel from "@/components/DripsPanel";
import ListingsPanel from "@/components/ListingsPanel";
import CampaignPanel from "@/components/CampaignPanel";
import SettingsPanel from "@/components/SettingsPanel";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";
import type {
  SendEmailPayload, SendEmailResponse, ToastState, Attachment,
  EmailTemplate, SendLogEntry, Contact,
  ScheduledSend, TrackingEvent,
} from "@/types/email";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

interface ConfigData {
  smtpConfigured: boolean;
  senderName: string;
  senderEmail: string;
  appUrl: string;
  dbConnected: boolean;
}

export default function Page() {
  // ── SMTP (Config status from API) ────────────────────────────────────────
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  // ── Sender ──────────────────────────────────────────────────────────────
  const [senderName, setSenderName] = useState("Hasker & Co. Realty Group");
  const [senderEmail, setSenderEmail] = useState("");

  // ── Message ─────────────────────────────────────────────────────────────
  const [recipient, setRecipient] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editorKey, setEditorKey] = useState(0);

  // ── UI ──────────────────────────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<NavSection>("compose");
  const [bulkMode, setBulkMode] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showCampaign, setShowCampaign] = useState(false);
  const [showPropertyCard, setShowPropertyCard] = useState(false);
  const [showUtmBuilder, setShowUtmBuilder] = useState(false);
  const [showMultiListing, setShowMultiListing] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ type: null, message: "" });
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // ── Persisted data ───────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [sendLog, setSendLog] = useState<SendLogEntry[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [optOuts, setOptOuts] = useState<string[]>([]);
  const [scheduledSends, setScheduledSends] = useState<ScheduledSend[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);

  // ── App URL (auto-detected for tracking) ────────────────────────────────
  const [appUrl, setAppUrl] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hasker_app_url");
      setAppUrl(saved || window.location.origin);
    }
  }, []);

  // ── Load from API + localStorage on mount ────────────────────────────────
  useEffect(() => {
    // Load templates and send log from localStorage
    try { const v = localStorage.getItem("hasker_templates"); if (v) setTemplates(JSON.parse(v)); } catch {}
    try { const v = localStorage.getItem("hasker_sendlog"); if (v) setSendLog(JSON.parse(v)); } catch {}
    // Load scheduled sends from MongoDB API
    fetch("/api/scheduled-sends")
      .then(r => r.json())
      .then((d: ScheduledSend[]) => {
        if (Array.isArray(d)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setScheduledSends(d.map((s: any) => ({ ...s, id: s._id?.toString() ?? s.id })));
        }
      })
      .catch(() => {
        try { const v = localStorage.getItem("hasker_scheduled"); if (v) setScheduledSends(JSON.parse(v)); } catch {}
      });
    // Check env SMTP config
    fetch("/api/config")
      .then(r => r.json())
      .then((data: ConfigData) => {
        setSmtpConfigured(data.smtpConfigured);
        if (data.smtpConfigured) {
          if (data.senderName) setSenderName(data.senderName);
          if (data.senderEmail) setSenderEmail(data.senderEmail);
        }
      })
      .catch(() => {});

    // Load contacts from MongoDB API
    fetch("/api/contacts")
      .then(r => r.json())
      .then((d: Contact[]) => { if (Array.isArray(d)) setContacts(d); })
      .catch(() => {
        // Fallback to localStorage if DB not connected
        try { const v = localStorage.getItem("hasker_contacts"); if (v) setContacts(JSON.parse(v)); } catch {}
      });

    // Load opt-outs from MongoDB API
    fetch("/api/optouts")
      .then(r => r.json())
      .then((d: string[]) => { if (Array.isArray(d)) setOptOuts(d); })
      .catch(() => {
        try { const v = localStorage.getItem("hasker_optouts"); if (v) setOptOuts(JSON.parse(v)); } catch {}
      });

    // Load tracking events
    fetch("/api/track?type=stats")
      .then(r => r.json())
      .then((d: TrackingEvent[]) => { if (Array.isArray(d)) setTrackingEvents(d); })
      .catch(() => {});
  }, []);

  useEffect(() => { try { localStorage.setItem("hasker_templates", JSON.stringify(templates)); } catch {} }, [templates]);
  useEffect(() => { try { localStorage.setItem("hasker_sendlog", JSON.stringify(sendLog.slice(0, 500))); } catch {} }, [sendLog]);

  // ── Refresh contacts from API ─────────────────────────────────────────────
  const refreshContacts = useCallback(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then((d: Contact[]) => { if (Array.isArray(d)) setContacts(d); })
      .catch(() => {});
  }, []);


  // ── Derived ──────────────────────────────────────────────────────────────
  const wrappedHtml = useMemo(() => wrapWithBrandTemplate(htmlBody, subject), [htmlBody, subject]);

  // ── Toast ────────────────────────────────────────────────────────────────
  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 7000);
  }

  // ── Log ──────────────────────────────────────────────────────────────────
  function addLogEntry(entry: SendLogEntry) {
    setSendLog((prev) => [entry, ...prev]);
    // Also persist to MongoDB send log
    fetch("/api/send-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: entry.to, subject: entry.subject, status: entry.status === "success" ? "sent" : "failed", messageId: entry.messageId, error: entry.error, sentAt: entry.timestamp }),
    }).catch(() => {});
  }

  // ── Template actions ─────────────────────────────────────────────────────
  function handleSaveTemplate(name: string) {
    const t: EmailTemplate = { id: crypto.randomUUID(), name, subject, htmlBody, createdAt: new Date().toISOString() };
    setTemplates((prev) => [t, ...prev]);
    // Also save to MongoDB
    fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, subject, html: htmlBody }),
    }).catch(() => {});
    showToast("success", `Template "${name}" saved.`);
  }
  function handleLoadTemplate(t: EmailTemplate) {
    setSubject(t.subject); setHtmlBody(t.htmlBody);
    setEditorKey((k) => k + 1); setShowTemplates(false);
    showToast("success", `Template "${t.name}" loaded.`);
  }
  function handleDeleteTemplate(id: string) { setTemplates((prev) => prev.filter((t) => t.id !== id)); }

  // ── Campaign ─────────────────────────────────────────────────────────────
  function handleLoadCampaign(s: string, b: string) {
    setSubject(s); setHtmlBody(b); setEditorKey((k) => k + 1); setShowCampaign(false);
    showToast("success", "Campaign template loaded.");
  }

  // ── Property card ────────────────────────────────────────────────────────
  function handleInsertPropertyCard(cardHtml: string) {
    setHtmlBody((prev) => (prev ? prev + "\n\n" + cardHtml : cardHtml));
    setEditorKey((k) => k + 1); setShowPropertyCard(false);
    showToast("success", "Listing card inserted.");
  }

  // ── Multi-listing showcase ────────────────────────────────────────────────
  function handleInsertShowcase(html: string) {
    setHtmlBody((prev) => (prev ? prev + "\n\n" + html : html));
    setEditorKey((k) => k + 1); setShowMultiListing(false);
    showToast("success", "Multi-listing showcase inserted.");
  }

  // ── UTM ──────────────────────────────────────────────────────────────────
  function handleApplyUtm(updatedHtml: string) {
    setHtmlBody(updatedHtml); setEditorKey((k) => k + 1); setShowUtmBuilder(false);
    showToast("success", "UTM parameters applied.");
  }

  // ── Scheduler ────────────────────────────────────────────────────────────
  async function handleSchedule(s: ScheduledSend) {
    try {
      const res = await fetch("/api/scheduled-sends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      if (res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const created: any = await res.json();
        setScheduledSends((prev) => [...prev, { ...created, id: created._id?.toString() ?? created.id }]);
        showToast("success", `Scheduled: "${s.label}"`);
      } else {
        showToast("error", "Failed to save scheduled send.");
      }
    } catch {
      showToast("error", "Failed to save scheduled send.");
    }
  }
  async function handleCancelScheduled(id: string) {
    try {
      await fetch(`/api/scheduled-sends/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
    } catch {}
    setScheduledSends((prev) => prev.map((s) => s.id === id ? { ...s, status: "cancelled" } : s));
  }

  // ── Validate + send ──────────────────────────────────────────────────────
  function validateClient(recipientOverride?: string): string | null {
    const eff = recipientOverride ?? recipient;
    if (!senderEmail.trim()) return "Sender Email is required.";
    if (!isValidEmail(senderEmail)) return "Sender Email is not valid.";
    if (!eff.trim()) return "Recipient Email is required.";
    if (!isValidEmail(eff)) return "Recipient Email is not valid.";
    if (!subject.trim()) return "Subject line is required.";
    if (!htmlBody.trim()) return "Email body cannot be empty.";
    return null;
  }

  async function handleSend(recipientOverride?: string) {
    const effectiveRecipient = recipientOverride ?? recipient;
    const clientError = validateClient(effectiveRecipient);
    if (clientError) { showToast("error", clientError); return; }

    setIsSending(true);
    const sendId = crypto.randomUUID();
    try {
      const unsubUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(effectiveRecipient)}`;
      let finalHtml = wrappedHtml.replace("{{UNSUB_URL}}", unsubUrl);
      if (appUrl) finalHtml = injectTracking(finalHtml, sendId, effectiveRecipient, appUrl);

      const payload: SendEmailPayload = {
        smtp: { host: "", port: 587, secure: false, user: "", password: "" },
        senderName, senderEmail, recipientEmail: effectiveRecipient,
        ...(cc.trim() && { cc }),
        ...(bcc.trim() && { bcc }),
        subject, htmlBody: finalHtml,
        ...(attachments.length > 0 && { attachments }),
      };

      const res = await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data: SendEmailResponse = await res.json();

      addLogEntry({
        id: sendId,
        timestamp: new Date().toISOString(),
        to: effectiveRecipient,
        ...(cc.trim() && { cc }),
        subject,
        status: data.success ? "success" : "error",
        ...(data.messageId && { messageId: data.messageId }),
        ...(!data.success && { error: data.error }),
      });

      if (data.success) {
        showToast("success", `Email sent.${data.messageId ? `  ID: ${data.messageId}` : ""}`);
      } else {
        showToast("error", data.error ?? "An unknown error occurred.");
      }
    } catch (err) {
      showToast("error", !navigator.onLine ? "You appear to be offline." : "Network error — is the dev server running?");
      console.error("[send-email]", err);
    } finally {
      setIsSending(false);
    }
  }

  function handleTestSend() {
    if (!senderEmail.trim()) { showToast("error", "Set a Sender Email first."); return; }
    handleSend(senderEmail);
  }

  const pendingScheduled = scheduledSends.filter(s => s.status === "pending").length;

  return (
    <>
      <div className="flex min-h-screen flex-col overflow-hidden lg:h-screen lg:flex-row">
        <NavSidebar
          active={activeSection}
          onChange={setActiveSection}
          scheduledCount={pendingScheduled}
        />

        {activeSection === "compose" && (
          <div className="flex flex-1 min-h-0 flex-col lg:flex-row animate-fade-up">
            <ControlPanel
              smtpConfigured={smtpConfigured}
              // Sender
              senderName={senderName} onSenderNameChange={setSenderName}
              senderEmail={senderEmail} onSenderEmailChange={setSenderEmail}
              recipient={recipient} onRecipientChange={setRecipient}
              cc={cc} onCcChange={setCc}
              bcc={bcc} onBccChange={setBcc}
              subject={subject} onSubjectChange={setSubject}
              htmlBody={htmlBody} onHtmlBodyChange={setHtmlBody}
              attachments={attachments} onAttachmentsChange={setAttachments}
              editorKey={editorKey}
              bulkMode={bulkMode} onBulkModeToggle={() => setBulkMode((v) => !v)}
              onSend={() => handleSend()}
              onTestSend={handleTestSend}
              isSending={isSending}
              onOpenTemplates={() => setShowTemplates(true)}
              onOpenLog={() => setShowLog(true)}
              templateCount={templates.length}
              logCount={sendLog.length}
              onOpenCampaign={() => setShowCampaign(true)}
              onOpenPropertyCard={() => setShowPropertyCard(true)}
              onOpenUtmBuilder={() => setShowUtmBuilder(true)}
              onOpenMultiListing={() => setShowMultiListing(true)}
              onOpenScheduler={() => setShowScheduler(true)}
              contacts={contacts}
              optOuts={optOuts}
              appUrl={appUrl}
              onLogEntry={addLogEntry}
              onShowToast={showToast}
              mobilePreviewOpen={mobilePreviewOpen}
              onToggleMobilePreview={() => setMobilePreviewOpen((value) => !value)}
            />
            <LivePreview
              wrappedHtml={wrappedHtml}
              mobilePreviewOpen={mobilePreviewOpen}
            />
          </div>
        )}

        {activeSection === "campaigns" && (
          <div className="flex flex-1 min-h-0 animate-fade-up">
            <CampaignPanel
              contacts={contacts}
              senderEmail={senderEmail}
              senderName={senderName}
            />
          </div>
        )}

        {activeSection === "contacts" && (
          <div className="flex flex-1 min-h-0 animate-fade-up">
            <ContactsPanel
              contacts={contacts}
              onContactsChange={(c) => { setContacts(c); refreshContacts(); }}
              optOuts={optOuts}
            />
          </div>
        )}

        {activeSection === "analytics" && (
          <div className="flex flex-1 min-h-0 animate-fade-up">
            <AnalyticsPanel
              sendLog={sendLog}
              contacts={contacts}
              trackingEvents={trackingEvents}
            />
          </div>
        )}

        {activeSection === "listings" && (
          <div className="flex flex-1 min-h-0 animate-fade-up">
            <ListingsPanel
              contacts={contacts}
              optOuts={optOuts}
              senderName={senderName}
              senderEmail={senderEmail}
              appUrl={appUrl}
              onLogEntry={addLogEntry}
              onShowToast={showToast}
            />
          </div>
        )}

        {activeSection === "sequences" && (
          <div className="flex flex-1 min-h-0 animate-fade-up">
            <DripsPanel
              contacts={contacts}
              optOuts={optOuts}
              senderName={senderName}
              senderEmail={senderEmail}
              appUrl={appUrl}
              onLogEntry={addLogEntry}
              onShowToast={showToast}
            />
          </div>
        )}

        {activeSection === "settings" && (
          <SettingsPanel
            onAppUrlChange={(url) => setAppUrl(url)}
          />
        )}
      </div>

      <Toast toast={toast} />

      {showTemplates && (
        <TemplateModal
          templates={templates}
          currentSubject={subject}
          currentHtmlBody={htmlBody}
          onSave={handleSaveTemplate}
          onLoad={handleLoadTemplate}
          onDelete={handleDeleteTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showLog && (
        <SendLogModal
          log={sendLog}
          onClear={() => setSendLog([])}
          onClose={() => setShowLog(false)}
        />
      )}

      {showCampaign && (
        <CampaignLauncher
          onLoad={handleLoadCampaign}
          onClose={() => setShowCampaign(false)}
        />
      )}

      {showPropertyCard && (
        <PropertyCardBuilder
          onInsert={handleInsertPropertyCard}
          onClose={() => setShowPropertyCard(false)}
        />
      )}

      {showMultiListing && (
        <MultiListingShowcase
          onInsert={handleInsertShowcase}
          onClose={() => setShowMultiListing(false)}
        />
      )}

      {showUtmBuilder && (
        <UtmBuilder
          htmlBody={htmlBody}
          onApply={handleApplyUtm}
          onClose={() => setShowUtmBuilder(false)}
        />
      )}

      {showScheduler && (
        <SchedulerModal
          scheduledSends={scheduledSends}
          contacts={contacts}
          senderName={senderName}
          senderEmail={senderEmail}
          subject={subject}
          htmlBody={htmlBody}
          onSchedule={handleSchedule}
          onCancel={handleCancelScheduled}
          onClose={() => setShowScheduler(false)}
        />
      )}
    </>
  );
}
