import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import OptOut from "@/lib/models/OptOut";
import Contact from "@/lib/models/Contact";

export async function GET() {
  const dbError = await ensureDbConnection();
  if (dbError) return NextResponse.json([]);
  try {
    const optOuts = await OptOut.find().lean();
    return NextResponse.json(optOuts.map((o) => o.email));
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const body = await request.json() as { email?: string; reason?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  try {
    await OptOut.findOneAndUpdate(
      { email },
      { $set: { email, reason: body.reason, addedAt: new Date() } },
      { upsert: true }
    );

    await Contact.findOneAndUpdate(
      { email },
      { $addToSet: { tags: "Unsubscribed" } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update opt-out list.") }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const body = await request.json() as { email?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  try {
    await OptOut.deleteOne({ email });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to remove opt-out.") }, { status: 500 });
  }
}
