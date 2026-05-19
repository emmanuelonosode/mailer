import nodemailer from "nodemailer";
import type { SmtpConfig, Attachment } from "@/types/email";

export interface MailOptions {
  smtp: SmtpConfig;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Attachment[];
  // Spam-compliance extras
  listUnsubscribeUrl?: string;
  campaignId?: string;
  isBulk?: boolean;
}

export async function sendEmail(options: MailOptions): Promise<{ messageId: string }> {
  const transporter = nodemailer.createTransport({
    host: options.smtp.host,
    port: options.smtp.port,
    secure: options.smtp.secure,
    auth: {
      user: options.smtp.user,
      pass: options.smtp.password,
    },
    tls: { rejectUnauthorized: false },
  });

  const domain = options.from.split("@")[1]?.replace(">", "") || "haskerrealtygroup.com";
  const unsubUrl = options.listUnsubscribeUrl ?? `https://${domain}/unsubscribe`;
  const msgId = `<${crypto.randomUUID()}@${domain}>`;
  const dateStr = new Date().toUTCString();

  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    ...(options.cc?.trim() && { cc: options.cc }),
    ...(options.bcc?.trim() && { bcc: options.bcc }),
    subject: options.subject,
    html: options.html,
    text: options.text,
    messageId: msgId,
    date: dateStr,
    attachments: options.attachments?.map((a) => ({
      filename: a.name,
      content: Buffer.from(a.content, "base64"),
      contentType: a.contentType,
    })),
    headers: {
      "MIME-Version": "1.0",
      "Sender": options.from,

      // Bulk/campaign headers — omitted for personal 1:1 sends to avoid Promotions tab
      ...(options.isBulk && {
        "X-Mailer": "Hasker-Email-Platform/2.0",
        "X-Entity-Ref-ID": options.campaignId ?? crypto.randomUUID(),
        "X-Campaign-Source": "hasker-email-platform",
        "Precedence": "bulk",
        "List-Unsubscribe": `<${unsubUrl}>, <mailto:unsubscribe@${domain}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "List-Id": `Hasker & Co. Realty Group <newsletter.${domain}>`,
        "List-Owner": `<mailto:info@${domain}>`,
      }),
    },
  });

  return { messageId: info.messageId };
}
