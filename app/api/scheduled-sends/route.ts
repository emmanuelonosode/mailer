import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import ScheduledSend from "@/lib/models/ScheduledSend";

export async function GET() {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  try {
    const sends = await ScheduledSend.find().sort({ scheduledAt: -1 }).lean();
    return NextResponse.json(sends);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { label, scheduledAt, senderName, senderEmail, recipients, subject, htmlBody } = body as Record<string, unknown>;

  if (!label || !scheduledAt || !subject || !htmlBody) {
    return NextResponse.json({ error: "label, scheduledAt, subject, and htmlBody are required." }, { status: 400 });
  }
  if (!Array.isArray(recipients) || recipients.length === 0) {
    return NextResponse.json({ error: "At least one recipient is required." }, { status: 400 });
  }

  try {
    const doc = await ScheduledSend.create({
      label: label as string,
      scheduledAt: new Date(scheduledAt as string),
      senderName: (senderName as string | undefined) ?? "",
      senderEmail: senderEmail as string,
      recipients: recipients as Array<{ name: string; email: string }>,
      subject: subject as string,
      htmlBody: htmlBody as string,
      status: "pending",
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
