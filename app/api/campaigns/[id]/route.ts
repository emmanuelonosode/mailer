import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Campaign from "@/lib/models/Campaign";
import TrackingEvent from "@/lib/models/TrackingEvent";
import SendLog from "@/lib/models/SendLog";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  try {
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [opens, clicks, sends] = await Promise.all([
      TrackingEvent.countDocuments({ campaignId: id, type: "open" }),
      TrackingEvent.countDocuments({ campaignId: id, type: "click" }),
      SendLog.find({ campaignId: id }).lean(),
    ]);

    return NextResponse.json({ ...campaign, opens, clicks, sends });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to load campaign.") }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  const body = await request.json();
  try {
    const updated = await Campaign.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update campaign.") }, { status: 422 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  try {
    await Campaign.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to delete campaign.") }, { status: 500 });
  }
}
