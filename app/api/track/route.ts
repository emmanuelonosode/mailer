import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import TrackingEvent from "@/lib/models/TrackingEvent";
import Campaign from "@/lib/models/Campaign";

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "stats") {
    try {
      await connectDB();
      const events = await TrackingEvent.find().sort({ occurredAt: -1 }).limit(10_000).lean();
      return NextResponse.json(events);
    } catch {
      return NextResponse.json([]);
    }
  }

  if (type === "open" || type === "click") {
    const sendId = decodeURIComponent(searchParams.get("send") ?? "");
    const recipientEmail = decodeURIComponent(searchParams.get("r") ?? "");
    const targetUrl = searchParams.get("url");
    const campaignId = searchParams.get("cid") ?? undefined;

    try {
      await connectDB();
      await TrackingEvent.create({
        type,
        sendId,
        campaignId,
        email: recipientEmail,
        url: targetUrl ? decodeURIComponent(targetUrl) : undefined,
        ip: request.headers?.get?.("x-forwarded-for") ?? undefined,
        userAgent: request.headers?.get?.("user-agent") ?? undefined,
        occurredAt: new Date(),
      });

      // Increment campaign counters
      if (campaignId) {
        const inc = type === "open" ? { openCount: 1 } : { clickCount: 1 };
        await Campaign.findByIdAndUpdate(campaignId, { $inc: inc });
      }

      // ── Bi-directional sync: forward event to Hargrove CRM ──────────────
      const hargroveUrl = process.env.HARGROVE_API_URL;
      const hargroveKey = process.env.HARGROVE_SYNC_KEY;
      if (hargroveUrl && hargroveKey && recipientEmail) {
        // Fire-and-forget: don't await, never block the pixel
        fetch(`${hargroveUrl.replace(/\/$/, "")}/api/v1/mailer/webhook/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Mailer-Key": hargroveKey },
          body: JSON.stringify({
            event: type === "open" ? "email_opened" : "link_clicked",
            email: recipientEmail,
            campaignId: campaignId ?? "",
            url: targetUrl ? decodeURIComponent(targetUrl) : "",
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5_000),
        }).catch(() => { /* silent — tracking must never fail */ });
      }
    } catch {
      // Tracking failure must never break the email experience
    }

    if (type === "click" && targetUrl) {
      return NextResponse.redirect(decodeURIComponent(targetUrl));
    }

    return new Response(PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
