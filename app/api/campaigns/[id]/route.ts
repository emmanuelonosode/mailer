import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";
import TrackingEvent from "@/lib/models/TrackingEvent";
import SendLog from "@/lib/models/SendLog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const campaign = await Campaign.findById(id).lean();
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Attach per-campaign tracking stats
  const [opens, clicks, sends] = await Promise.all([
    TrackingEvent.countDocuments({ campaignId: id, type: "open" }),
    TrackingEvent.countDocuments({ campaignId: id, type: "click" }),
    SendLog.find({ campaignId: id }).lean(),
  ]);

  return NextResponse.json({ ...campaign, opens, clicks, sends });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  const body = await request.json();
  const updated = await Campaign.findByIdAndUpdate(id, { $set: body }, { new: true });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectDB();
  const { id } = await params;
  await Campaign.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
