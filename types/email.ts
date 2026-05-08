export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export interface SendEmailPayload {
  smtp: SmtpConfig;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  htmlBody: string;
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
