import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Campaign from "@/lib/models/Campaign";
import Contact from "@/lib/models/Contact";
import OptOut from "@/lib/models/OptOut";
import SendLog from "@/lib/models/SendLog";
import { sendEmail } from "@/lib/mailer";
import { convertToPlainText } from "@/lib/htmlToPlainText";
import { injectTracking } from "@/lib/tracking";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  // Build SMTP config strictly from env
  const smtp = {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER!,
    password: process.env.SMTP_PASSWORD!,
  };

  if (!smtp.host || !smtp.user || !smtp.password) {
    return NextResponse.json({ error: "SMTP not configured on the server." }, { status: 500 });
  }

  const senderName = process.env.SENDER_NAME ?? body.senderName ?? "Hasker & Co. Realty Group";
  const senderEmail = process.env.SENDER_EMAIL ?? body.senderEmail ?? "";
  if (!senderEmail) return NextResponse.json({ error: "SENDER_EMAIL not set" }, { status: 400 });

  const origin = process.env.APP_URL ?? new URL(request.url).origin;
  const from = `${senderName} <${senderEmail}>`;

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (campaign.status === "sent") return NextResponse.json({ error: "Already sent" }, { status: 409 });

    let contacts: { email: string; name?: string }[] = [];
    if (campaign.segmentTag) {
      contacts = await Contact.find({ tags: campaign.segmentTag, bounced: { $ne: true } }).lean();
    } else if (campaign.segment.length > 0) {
      contacts = await Contact.find({ email: { $in: campaign.segment }, bounced: { $ne: true } }).lean();
    } else {
      contacts = await Contact.find({ bounced: { $ne: true } }).lean();
    }

    const optOutDocs = await OptOut.find().lean();
    const optOuts = new Set(optOutDocs.map((o) => o.email.toLowerCase()));

    await Campaign.findByIdAndUpdate(id, { status: "sending" });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    const shuffled = [...contacts].sort(() => Math.random() - 0.5);
    const CONCURRENCY = 5;

    for (let i = 0; i < shuffled.length; i += CONCURRENCY) {
      const chunk = shuffled.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async (contact, indexInChunk) => {
          const globalIndex = i + indexInChunk;
          const email = contact.email.toLowerCase();

          if (optOuts.has(email)) {
            skipped++;
            await SendLog.create({ campaignId: id, to: email, subject: campaign.subject, status: "skipped" });
            return;
          }

          const variant: "a" | "b" | undefined = campaign.abTest
            ? globalIndex < shuffled.length / 2 ? "a" : "b"
            : undefined;

          const subject = variant === "b" && campaign.subjectB ? campaign.subjectB : campaign.subject;
          const sendId = `${id}-${email}-${Date.now()}`;
          const unsubUrl = `${origin}/unsubscribe?email=${encodeURIComponent(email)}`;

          let processedHtml = campaign.html.replace(/{{UNSUB_URL}}/g, unsubUrl);
          processedHtml = injectTracking(processedHtml, sendId, email, origin, id);

          try {
            const { messageId } = await sendEmail({
              smtp,
              from,
              to: email,
              subject,
              html: processedHtml,
              text: convertToPlainText(processedHtml),
              listUnsubscribeUrl: unsubUrl,
              isBulk: true,
            });
            sent++;
            await SendLog.create({ campaignId: id, to: email, subject, status: "sent", messageId, variant });
          } catch (error) {
            failed++;
            const errMsg = getErrorMessage(error, "Unknown error");
            const isBounce = errMsg.includes("550") || errMsg.includes("551") || errMsg.includes("553");
            if (isBounce) {
              await Contact.findOneAndUpdate({ email }, { $addToSet: { tags: "Bounced" }, bounced: true });
            }
            await SendLog.create({ campaignId: id, to: email, subject, status: "failed", error: errMsg, bounced: isBounce, variant });
          }
        }),
      );
    }

    await Campaign.findByIdAndUpdate(id, {
      status: "sent",
      sentAt: new Date(),
      sentCount: sent,
      bounceCount: failed,
    });

    return NextResponse.json({ sent, failed, skipped });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to launch campaign.") }, { status: 500 });
  }
}
