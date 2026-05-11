import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Campaign from "@/lib/models/Campaign";

export async function GET() {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(campaigns);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to load campaigns.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const body = await request.json();
  try {
    const campaign = await Campaign.create(body);
    return NextResponse.json(campaign, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e, "Failed to create campaign.") }, { status: 422 });
  }
}
