import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Contact from "@/lib/models/Contact";

export async function GET(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) {
    return NextResponse.json([], {
      status: dbError.status,
      headers: { "X-DB-Error": "Database unavailable" },
    });
  }
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");
  const segment = searchParams.get("segment");

  const query: Record<string, unknown> = {};

  if (tag) query.tags = tag;
  if (search) {
    const re = new RegExp(search, "i");
    query.$or = [{ name: re }, { email: re }, { company: re }, { city: re }];
  }
  if (segment === "active") {
    query.bounced = { $ne: true };
    query.tags = { $ne: "Unsubscribed" };
  }
  if (segment === "bounced") query.bounced = true;

  try {
    const contacts = await Contact.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to load contacts.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const body = await request.json();

  // Bulk import
  if (Array.isArray(body)) {
    const results = await Promise.allSettled(
      body.map((c: { email: string; [key: string]: unknown }) =>
        Contact.findOneAndUpdate(
          { email: c.email?.toLowerCase() },
          { $set: c },
          { upsert: true, new: true, runValidators: true }
        )
      )
    );
    const created = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    return NextResponse.json({ created, failed }, { status: 201 });
  }

  // Single create
  try {
    const contact = await Contact.create(body);
    return NextResponse.json(contact, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e, "Failed to create contact.") }, { status: 422 });
  }
}
