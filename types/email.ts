export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface Attachment {
  name: string;
  content: string; // base64-encoded
  contentType: string;
}

export interface SendEmailPayload {
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  cc?: string;
  bcc?: string;
  subject: string;
  htmlBody: string;
  attachments?: Attachment[];
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export type ToastState = {
  type: "success" | "error" | null;
  message: string;
};

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlBody: string;
  createdAt: string;
}

export interface SendLogEntry {
  id: string;
  timestamp: string;
  to: string;
  cc?: string;
  subject: string;
  status: "success" | "error";
  error?: string;
  messageId?: string;
}

export interface BulkRecipient {
  name: string;
  email: string;
}

export interface BulkProgress {
  sent: number;
  total: number;
  errors: Array<{ email: string; error: string }>;
  done: boolean;
}

// ── CRM ──────────────────────────────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  lastContactedAt?: string;
  unsubscribed?: boolean;
}

export const CONTACT_TAGS = ["Buyer", "Renter", "Investor", "Lead", "Past Client"] as const;

// ── Drip Sequences ────────────────────────────────────────────────────────────

export interface DripStep {
  id: string;
  dayOffset: number;
  subject: string;
  htmlBody: string;
}

export interface DripSequence {
  id: string;
  name: string;
  description: string;
  steps: DripStep[];
  createdAt: string;
}

export interface DripEnrollment {
  id: string;
  sequenceId: string;
  contactEmail: string;
  enrolledAt: string;
  nextStepIndex: number;
  completed: boolean;
  lastSentAt?: string;
}

// ── Scheduler ─────────────────────────────────────────────────────────────────

export interface ScheduledSend {
  id: string;
  label: string;
  scheduledAt: string;
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  recipients: Array<{ name: string; email: string }>;
  subject: string;
  htmlBody: string;
  status: "pending" | "sent" | "failed" | "cancelled";
  sentAt?: string;
  error?: string;
}

// ── Tracking ──────────────────────────────────────────────────────────────────

export interface TrackingEvent {
  id: string;
  sendId: string;
  recipientEmail: string;
  type: "open" | "click";
  url?: string;
  timestamp: string;
}
