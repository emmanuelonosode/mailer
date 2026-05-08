import nodemailer from "nodemailer";
import type { SmtpConfig } from "@/types/email";

export interface MailOptions {
  smtp: SmtpConfig;
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
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
    // Allow self-signed certs for internal mail servers
    tls: {
      rejectUnauthorized: false,
    },
  });

  const info = await transporter.sendMail({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    headers: {
      "X-Mailer": "Hasker-Co-EmailSender/1.0",
      "X-Entity-Ref-ID": `hasker-${Date.now()}`,
    },
    list: {
      unsubscribe: {
        url: "https://haskerrealtygroup.com/unsubscribe",
        comment: "Unsubscribe from Hasker & Co. emails",
      },
      id: {
        url: "newsletter.haskerrealtygroup.com",
        comment: "Hasker & Co. Realty Group",
      },
    },
  });

  return { messageId: info.messageId };
}
