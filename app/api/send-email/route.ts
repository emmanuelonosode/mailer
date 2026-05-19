import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/mailer";
import { convertToPlainText } from "@/lib/htmlToPlainText";
import type { SendEmailPayload, SendEmailResponse } from "@/types/email";

function classifySmtpError(err: unknown): { message: string; status: number } {
  if (!(err instanceof Error)) {
    return { message: "An unexpected error occurred while sending.", status: 500 };
  }

  const msg = err.message ?? "";
  const code = (err as NodeJS.ErrnoException).code ?? "";
  const responseCode: number =
    ((err as unknown as Record<string, unknown>).responseCode as number) ?? 0;

  if (code === "ECONNREFUSED") {
    return {
      message: `Connection refused. No service is listening on ${msg.match(/\d+\.\d+\.\d+\.\d+:\d+/)?.[0] ?? "that host:port"}. Check Host and Port.`,
      status: 502,
    };
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return { message: "SMTP host not found. The hostname could not be resolved — check for typos.", status: 502 };
  }
  if (code === "ETIMEDOUT" || code === "ESOCKETTIMEDOUT" || code === "ECONNRESET") {
    return { message: "Connection timed out. The SMTP server didn't respond — check Host, Port, and firewall rules.", status: 504 };
  }
  if (msg.includes("SELF_SIGNED_CERT") || msg.includes("CERT_HAS_EXPIRED") || msg.includes("UNABLE_TO_VERIFY_LEAF_SIGNATURE") || msg.includes("certificate")) {
    return { message: "TLS/SSL certificate error. The server's certificate is invalid or self-signed.", status: 502 };
  }
  if (msg.includes("wrong version number") || msg.includes("ssl routines")) {
    return { message: "TLS handshake failed. Try toggling the TLS switch — your Port may not use TLS.", status: 502 };
  }
  if (code === "EAUTH" || responseCode === 535 || responseCode === 534 || msg.includes("Invalid login") || msg.includes("Authentication") || msg.includes("authentication") || msg.includes("Username and Password") || msg.includes("credentials")) {
    return { message: "Authentication failed. Your SMTP username or password is incorrect.", status: 401 };
  }
  if (responseCode === 530 || msg.includes("5.7.0") || msg.includes("STARTTLS")) {
    return { message: "Server requires STARTTLS. Enable the TLS toggle and use Port 587.", status: 502 };
  }
  if (responseCode === 550 || responseCode === 551 || responseCode === 553) {
    return { message: "Recipient rejected by server. The recipient address may not exist or is blocked.", status: 422 };
  }
  if (responseCode === 552 || msg.includes("too large") || msg.includes("message size")) {
    return { message: "Email rejected — message is too large for this SMTP server.", status: 413 };
  }
  if (responseCode === 421 || responseCode === 450 || responseCode === 451) {
    return { message: "Server temporarily unavailable or rate limit hit. Wait a few minutes and try again.", status: 429 };
  }
  if (responseCode === 452) {
    return { message: "Server out of storage. The SMTP server cannot accept messages right now.", status: 503 };
  }
  if (responseCode === 554 || msg.includes("spam") || msg.includes("blacklist") || msg.includes("blocked")) {
    return { message: "Message rejected as spam or sender is blacklisted. Check your sending domain's SPF/DKIM records.", status: 422 };
  }
  if (msg.includes("Greeting never received") || msg.includes("greeting")) {
    return { message: "No SMTP greeting received. The server isn't responding as an SMTP server — wrong Port or Host?", status: 502 };
  }
  return { message: `SMTP error: ${msg}`, status: 500 };
}

function envSmtp() {
  if (!process.env.SMTP_HOST?.trim()) return null;
  return {
    host: process.env.SMTP_HOST.trim(),
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() ?? "",
    password: process.env.SMTP_PASSWORD?.trim() ?? "",
  };
}

function validateFields(body: Partial<SendEmailPayload>): string | null {
  if (!body.senderEmail?.trim() && !process.env.SENDER_EMAIL?.trim())
    return "Sender Email is required.";
  const senderEmail = body.senderEmail?.trim() || process.env.SENDER_EMAIL?.trim() || "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail))
    return "Sender Email is not a valid email address.";
  if (!body.recipientEmail?.trim()) return "Recipient Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.recipientEmail))
    return "Recipient Email is not a valid email address.";
  if (!body.subject?.trim()) return "Subject line is required.";
  if (!body.htmlBody?.trim()) return "Email body cannot be empty.";
  return null;
}

export async function POST(request: NextRequest) {
  let body: Partial<SendEmailPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<SendEmailResponse>(
      { success: false, error: "Invalid request body — expected JSON." },
      { status: 400 }
    );
  }

  const smtp = envSmtp();
  if (!smtp) {
    return NextResponse.json<SendEmailResponse>(
      { success: false, error: "SMTP is not configured on the server." },
      { status: 500 }
    );
  }

  const validationError = validateFields(body);
  if (validationError) {
    return NextResponse.json<SendEmailResponse>({ success: false, error: validationError }, { status: 400 });
  }

  const senderEmail = (body.senderEmail?.trim() || process.env.SENDER_EMAIL?.trim() || "") as string;
  const senderName = body.senderName?.trim() || process.env.SENDER_NAME?.trim() || "";
  const { recipientEmail, cc, bcc, subject, htmlBody, attachments } = body as SendEmailPayload;

  let plainText: string;
  try {
    plainText = convertToPlainText(htmlBody);
  } catch {
    plainText = subject;
  }

  const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;
  const origin = process.env.APP_URL ?? new URL(request.url).origin;
  const listUnsubscribeUrl = `${origin}/unsubscribe?email=${encodeURIComponent(recipientEmail.trim())}`;

  try {
    const { messageId } = await sendEmail({
      smtp: smtp!,
      from,
      to: recipientEmail.trim(),
      cc,
      bcc,
      subject: subject.trim(),
      html: htmlBody,
      text: plainText,
      attachments,
      listUnsubscribeUrl,
      isBulk: body.isBulk ?? false,
    });
    return NextResponse.json<SendEmailResponse>({ success: true, messageId });
  } catch (err: unknown) {
    const { message, status } = classifySmtpError(err);
    return NextResponse.json<SendEmailResponse>({ success: false, error: message }, { status });
  }
}
