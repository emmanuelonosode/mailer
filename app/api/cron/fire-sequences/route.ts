import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Enrollment from "@/lib/models/Enrollment";
import Sequence from "@/lib/models/Sequence";
import type { ISequence, IDripStep } from "@/lib/models/Sequence";
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
  const from = senderName ? `${senderName} <${senderEmail}>` : senderEmail;

  try {
    // Fetch all active enrollments
    const enrollments = await Enrollment.find({ active: true }).lean();
    if (enrollments.length === 0) return NextResponse.json({ fired: 0 });

    // Batch-fetch all referenced sequences
    const sequenceIds = [...new Set(enrollments.map((e) => e.sequenceId))];
    const sequenceDocs = await Sequence.find({ _id: { $in: sequenceIds } }).lean();
    const sequenceMap = new Map<string, ISequence & { steps: IDripStep[] }>(
      sequenceDocs.map((s) => [s._id.toString(), s as ISequence & { steps: IDripStep[] }])
    );

    // Fetch opt-outs once
    const optOutDocs = await OptOut.find().lean();
    const optOuts = new Set(optOutDocs.map((o) => o.email.toLowerCase()));

    const now = new Date();
    let fired = 0;

    for (const enrollment of enrollments) {
      const sequence = sequenceMap.get(enrollment.sequenceId.toString());
      if (!sequence) {
        await Enrollment.findByIdAndUpdate(enrollment._id, { $set: { active: false } });
        continue;
      }

      const nextStepIndex = enrollment.completedSteps.length;

      if (nextStepIndex >= sequence.steps.length) {
        await Enrollment.findByIdAndUpdate(enrollment._id, { $set: { active: false } });
        continue;
      }

      const step = sequence.steps[nextStepIndex];
      const dueAt = new Date(enrollment.enrolledAt);
      dueAt.setDate(dueAt.getDate() + step.dayOffset);

      if (now < dueAt) continue;

      const email = enrollment.email.toLowerCase();
      if (optOuts.has(email)) {
        await Enrollment.findByIdAndUpdate(enrollment._id, { $set: { active: false } });
        continue;
      }

      const sendId = `${enrollment._id}-step${nextStepIndex}-${Date.now()}`;
      const unsubUrl = `${origin}/unsubscribe?email=${encodeURIComponent(email)}`;

      let html = wrapWithBrandTemplate(step.html, step.subject);
      html = html.replace(/\{\{UNSUB_URL\}\}/g, unsubUrl);
      html = injectTracking(html, sendId, email, origin);

      try {
        const { messageId } = await sendEmail({
          smtp,
          from,
          to: email,
          subject: step.subject,
          html,
          text: convertToPlainText(html),
          listUnsubscribeUrl: unsubUrl,
          isBulk: true,
        });

        fired++;
        const updatedSteps = [...enrollment.completedSteps, nextStepIndex];
        const isComplete = updatedSteps.length >= sequence.steps.length;

        await Enrollment.findByIdAndUpdate(enrollment._id, {
          $set: { completedSteps: updatedSteps, active: !isComplete },
        });

        await SendLog.create({
          to: email,
          subject: step.subject,
          status: "sent",
          messageId,
          sentAt: new Date(),
        });
      } catch (error) {
        await SendLog.create({
          to: email,
          subject: step.subject,
          status: "failed",
          error: getErrorMessage(error, "Unknown error"),
          sentAt: new Date(),
        });
      }
    }

    return NextResponse.json({ fired });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
