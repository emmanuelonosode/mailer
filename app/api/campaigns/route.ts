import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Campaign from "@/lib/models/Campaign";

export async function GET() {
  await connectDB();
  const campaigns = await Campaign.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(campaigns);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  try {
    const campaign = await Campaign.create(body);
    return NextResponse.json(campaign, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 422 });
  }
}
