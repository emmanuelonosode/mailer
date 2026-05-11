import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import SendLog from "@/lib/models/SendLog";

export async function GET(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaignId");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "500"), 1000);

  try {
    const query = campaignId ? { campaignId } : {};
    const logs = await SendLog.find(query).sort({ sentAt: -1 }).limit(limit).lean();
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to load send log.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const body = await request.json();
  try {
    const log = await SendLog.create(body);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to write send log.") }, { status: 422 });
  }
}
