import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection } from "@/lib/api";
import Contact from "@/lib/models/Contact";

const HARGROVE_API_URL = "https://api.haskerrealtygroup.com";
const HARGROVE_SYNC_KEY = "hsk_sync_secret_change_me_in_production";

interface HargroveContact {
  email: string;
  name: string;
  phone?: string;
  tags?: string[];
  notes?: string;
  budget_min?: string | null;
  budget_max?: string | null;
  preferred_location?: string;
}

interface HargroveResponse {
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  contacts: HargroveContact[];
}

/** GET /api/hargrove-sync — fetch preview stats without importing */
export async function GET() {
  try {
    const res = await fetch(`${HARGROVE_API_URL}/api/v1/mailer/contacts/?page=1&page_size=1`, {
      headers: { "X-Mailer-Key": HARGROVE_SYNC_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Hargrove API error ${res.status}: ${text.slice(0, 200)}` },
        { status: res.status }
      );
    }

    const data: HargroveResponse = await res.json();
    return NextResponse.json({ total: data.total, connected: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Cannot reach Hargrove: ${msg}` }, { status: 502 });
  }
}

/** POST /api/hargrove-sync — fetch all contacts and upsert into MongoDB */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const contactType: string = body.type ?? "all"; // all | leads | clients | users
  const updatedSince: string | undefined = body.updated_since;

  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  let page = 1;
  let totalImported = 0;
  let totalFailed = 0;
  let hasNext = true;

  while (hasNext) {
    let url = `${HARGROVE_API_URL}/api/v1/mailer/contacts/?page=${page}&page_size=500&type=${contactType}`;
    if (updatedSince) url += `&updated_since=${encodeURIComponent(updatedSince)}`;

    let data: HargroveResponse;
    try {
      const res = await fetch(url, {
        headers: { "X-Mailer-Key": HARGROVE_SYNC_KEY },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: `Hargrove API error on page ${page}: ${text.slice(0, 200)}` },
          { status: 502 }
        );
      }
      data = await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: `Fetch error on page ${page}: ${msg}` }, { status: 502 });
    }

    // Upsert contacts by email (merge tags, don't overwrite existing data)
    for (const hc of data.contacts) {
      if (!hc.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hc.email)) {
        totalFailed++;
        continue;
      }

      try {
        const existing = await Contact.findOne({ email: hc.email.toLowerCase() }).lean();
        const mergedTags = Array.from(
          new Set([...(existing?.tags ?? []), ...(hc.tags ?? [])])
        );

        const notes = [
          existing?.notes ?? "",
          hc.notes ?? "",
          hc.preferred_location ? `Location: ${hc.preferred_location}` : "",
          hc.budget_min || hc.budget_max
            ? `Budget: $${hc.budget_min ?? "?"} – $${hc.budget_max ?? "?"}`
            : "",
        ]
          .filter(Boolean)
          .join(" | ");

        const safeName = hc.name?.trim() || existing?.name || hc.email.split("@")[0];

        await Contact.findOneAndUpdate(
          { email: hc.email.toLowerCase() },
          {
            $set: {
              name: safeName,
              phone: hc.phone || existing?.phone || "",
              tags: mergedTags,
              notes: notes || existing?.notes || "",
              hargrove_synced: true,
              hargrove_synced_at: new Date(),
            },
            $setOnInsert: { email: hc.email.toLowerCase() },
          },
          { upsert: true, new: true }
        );
        totalImported++;
      } catch {
        totalFailed++;
      }
    }

    hasNext = data.has_next;
    page++;
  }

  return NextResponse.json({
    success: true,
    imported: totalImported,
    failed: totalFailed,
    syncedAt: new Date().toISOString(),
  });
}
