import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import ScheduledSend from "@/lib/models/ScheduledSend";
import OptOut from "@/lib/models/OptOut";
import SendLog from "@/lib/models/SendLog";
import { sendEmail } from "@/lib/mailer";
import { convertToPlainText } from "@/lib/htmlToPlainText";
import { wrapWithBrandTemplate } from "@/lib/emailTemplate";
import { injectTracking } from "@/lib/tracking";

function buildSmtp() {
  if (!process.env.SMTP_HOST?.trim()) return null;
  return {
    host: process.env.SMTP_HOST.trim(),
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER?.trim() ?? "",
    password: process.env.SMTP_PASSWORD?.trim() ?? "",
  };
}

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret — skip check in dev when CRON_SECRET is not set
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  const smtp = buildSmtp();
  if (!smtp) {
    return NextResponse.json({ error: "SMTP not configured." }, { status: 500 });
  }

  const senderName = process.env.SENDER_NAME ?? "Hasker & Co. Realty Group";
  const senderEmail = process.env.SENDER_EMAIL ?? "";
  const origin = process.env.APP_URL ?? "http://localhost:3000";

  try {
    // Fetch opt-outs once
    const optOutDocs = await OptOut.find().lean();
    const optOuts = new Set(optOutDocs.map((o) => o.email.toLowerCase()));

    // Find all due pending sends
    const now = new Date();
    const dueSends = await ScheduledSend.find({
      status: "pending",
      scheduledAt: { $lte: now },
    }).lean();

    if (dueSends.length === 0) {
      return NextResponse.json({ fired: 0 });
    }

    let fired = 0;

    for (const doc of dueSends) {
      // Atomic claim — prevent double-fire if cron overlaps
      const claimed = await ScheduledSend.findOneAndUpdate(
        { _id: doc._id, status: "pending" },
        { $set: { status: "sending" } },
        { new: true }
      );
      if (!claimed) continue;

      const from = doc.senderName
        ? `${doc.senderName} <${doc.senderEmail || senderEmail}>`
        : doc.senderEmail || senderEmail;

      let allSent = true;

      for (const recipient of doc.recipients) {
        const email = recipient.email.toLowerCase();
        if (optOuts.has(email)) continue;

        const sendId = `${doc._id}-${email}-${Date.now()}`;
        const unsubUrl = `${origin}/unsubscribe?email=${encodeURIComponent(email)}`;

        // The stored htmlBody is the raw inner body — wrap + inject tracking at send time
        let html = wrapWithBrandTemplate(doc.htmlBody, doc.subject);
        html = html.replace(/\{\{UNSUB_URL\}\}/g, unsubUrl);
        html = injectTracking(html, sendId, email, origin);

        try {
          const { messageId } = await sendEmail({
            smtp,
            from,
            to: email,
            subject: doc.subject,
            html,
            text: convertToPlainText(html),
            listUnsubscribeUrl: unsubUrl,
            isBulk: true,
          });
          fired++;
          await SendLog.create({
            to: email,
            subject: doc.subject,
            status: "sent",
            messageId,
            sentAt: new Date(),
          });
        } catch (error) {
          allSent = false;
          await SendLog.create({
            to: email,
            subject: doc.subject,
            status: "failed",
            error: getErrorMessage(error, "Unknown error"),
            sentAt: new Date(),
          });
        }
      }

      await ScheduledSend.findByIdAndUpdate(doc._id, {
        $set: {
          status: allSent ? "sent" : "failed",
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({ fired });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
