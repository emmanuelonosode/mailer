import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import OptOut from "@/lib/models/OptOut";
import Contact from "@/lib/models/Contact";

export async function GET() {
  try {
    await connectDB();
  } catch {
    return NextResponse.json([]);
  }
  const optOuts = await OptOut.find().lean();
  return NextResponse.json(optOuts.map((o) => o.email));
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json() as { email?: string; reason?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

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
}

export async function DELETE(request: NextRequest) {
  await connectDB();
  const body = await request.json() as { email?: string };
  const email = body.email?.toLowerCase().trim();
  if (!email) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  await OptOut.deleteOne({ email });
  return NextResponse.json({ success: true });
}
