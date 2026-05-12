import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection } from "@/lib/api";
import Contact from "@/lib/models/Contact";

const HARGROVE_SYNC_KEY = process.env.HARGROVE_SYNC_KEY;

/**
 * POST /api/hargrove-webhook
 * Receives real-time events from Hargrove (Django signals) and
 * triggers automatic contact syncs or drip enrollments.
 *
 * Events:
 *   - new_lead       → upsert contact with Lead + interest tags
 *   - lead_qualified → add "Qualified" tag
 *   - application_submitted → add "Applicant" tag
 *   - application_approved  → add "Approved" tag
 *   - new_listing           → (reserved for future listing campaign trigger)
 */
export async function POST(request: NextRequest) {
  // Validate shared key
  const key = request.headers.get("X-Mailer-Key");
  if (!HARGROVE_SYNC_KEY || key !== HARGROVE_SYNC_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as string;
  const email = ((body.email as string) ?? "").toLowerCase().trim();
  const name = (body.name as string) ?? "";
  const phone = (body.phone as string) ?? "";
  const tags: string[] = (body.tags as string[]) ?? [];

  if (!event || !email) {
    return NextResponse.json({ error: "Missing event or email" }, { status: 400 });
  }

  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  const EVENT_TAGS: Record<string, string[]> = {
    new_lead: ["Lead"],
    lead_qualified: ["Lead", "Qualified"],
    lead_converted: ["Lead", "Client"],
    application_submitted: ["Applicant"],
    application_approved: ["Applicant", "Approved Tenant"],
    new_portal_user: ["Portal User", "Verified"],
  };

  const newTags = [...(EVENT_TAGS[event] ?? []), ...tags];

  if (newTags.length === 0) {
    return NextResponse.json({ status: "ignored", reason: `Unknown event: ${event}` });
  }

  try {
    const existing = await Contact.findOne({ email }).lean();
    const mergedTags = Array.from(new Set([...(existing?.tags ?? []), ...newTags]));

    const safeName = name?.trim() || existing?.name || email.split("@")[0];

    await Contact.findOneAndUpdate(
      { email },
      {
        $set: {
          tags: mergedTags,
          hargrove_synced: true,
          hargrove_synced_at: new Date(),
          // Only update name/phone if not already set
          ...(safeName && !existing?.name ? { name: safeName } : {}),
          ...(phone && !existing?.phone ? { phone } : {}),
        },
        $setOnInsert: {
          email,
          name: safeName,
        },
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ status: "ok", event, email, tagsAdded: newTags });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
