"use client";

import { useState, useMemo } from "react";
import ControlPanel from "@/components/ControlPanel";
import LivePreview from "@/components/LivePreview";
import Toast from "@/components/Toast";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import type { SendEmailPayload, SendEmailResponse, ToastState } from "@/types/email";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function Page() {
  // SMTP
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");

  // Sender
  const [senderName, setSenderName] = useState("Hasker & Co. Realty Group");
  const [senderEmail, setSenderEmail] = useState("");

  // Message
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");

  // UI
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<ToastState>({ type: null, message: "" });

  // Derived: wrap body with brand header/footer
  const wrappedHtml = useMemo(
    () => wrapWithBrandTemplate(htmlBody, subject),
    [htmlBody, subject]
  );

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast({ type: null, message: "" }), 7000);
  }

  function validateClient(): string | null {
    if (!smtpHost.trim()) return "SMTP Host is required.";
    if (!smtpUser.trim()) return "SMTP Username is required.";
    if (!smtpPassword.trim()) return "SMTP Password is required.";
    if (smtpPort < 1 || smtpPort > 65535) return "SMTP Port must be between 1 and 65535.";
    if (!senderEmail.trim()) return "Sender Email is required.";
    if (!isValidEmail(senderEmail)) return "Sender Email is not a valid email address.";
    if (!recipient.trim()) return "Recipient Email is required.";
    if (!isValidEmail(recipient)) return "Recipient Email is not a valid email address.";
    if (!subject.trim()) return "Subject line is required.";
    if (!htmlBody.trim()) return "Email body cannot be empty.";
    return null;
  }

  async function handleSend() {
    const clientError = validateClient();
    if (clientError) {
      showToast("error", clientError);
      return;
    }

    setIsSending(true);
    try {
      const payload: SendEmailPayload = {
        smtp: { host: smtpHost, port: smtpPort, secure: smtpSecure, user: smtpUser, password: smtpPassword },
        senderName,
        senderEmail,
        recipientEmail: recipient,
        subject,
        htmlBody: wrappedHtml,
      };

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: SendEmailResponse = await res.json();

      if (data.success) {
        showToast(
          "success",
          `Email sent successfully.${data.messageId ? `  ID: ${data.messageId}` : ""}`
        );
      } else {
        showToast("error", data.error ?? "An unknown error occurred.");
      }
    } catch (err) {
      const isOffline = !navigator.onLine;
      showToast(
        "error",
        isOffline
          ? "You appear to be offline. Check your internet connection."
          : "Network error — could not reach the server. Is the dev server running?"
      );
      console.error("[send-email]", err);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 h-screen overflow-hidden">
        <ControlPanel
          smtpHost={smtpHost} onSmtpHostChange={setSmtpHost}
          smtpPort={smtpPort} onSmtpPortChange={setSmtpPort}
          smtpSecure={smtpSecure} onSmtpSecureChange={setSmtpSecure}
          smtpUser={smtpUser} onSmtpUserChange={setSmtpUser}
          smtpPassword={smtpPassword} onSmtpPasswordChange={setSmtpPassword}
          senderName={senderName} onSenderNameChange={setSenderName}
          senderEmail={senderEmail} onSenderEmailChange={setSenderEmail}
          recipient={recipient} onRecipientChange={setRecipient}
          subject={subject} onSubjectChange={setSubject}
          htmlBody={htmlBody} onHtmlBodyChange={setHtmlBody}
          onSend={handleSend}
          isSending={isSending}
        />
        <LivePreview wrappedHtml={wrappedHtml} />
      </div>
      <Toast toast={toast} />
    </>
  );
}
