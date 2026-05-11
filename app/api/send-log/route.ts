import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SendLog from "@/lib/models/SendLog";

export async function GET(request: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "500"), 1000);

  const query = campaignId ? { campaignId } : {};
  const logs = await SendLog.find(query).sort({ sentAt: -1 }).limit(limit).lean();
  return NextResponse.json(logs);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  const log = await SendLog.create(body);
  return NextResponse.json(log, { status: 201 });
}
