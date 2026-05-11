import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Contact from "@/lib/models/Contact";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
  } catch (e) {
    return NextResponse.json([], { headers: { "X-DB-Error": e instanceof Error ? e.message : "DB unavailable" } });
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

  const contacts = await Contact.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  await connectDB();
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
    const msg = e instanceof Error ? e.message : "Failed to create contact";
    return NextResponse.json({ error: msg }, { status: 422 });
  }
}
