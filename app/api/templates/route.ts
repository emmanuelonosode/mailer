import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Template from "@/lib/models/Template";

export async function GET() {
  await connectDB();
  const templates = await Template.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(templates);
}

export async function POST(request: NextRequest) {
  await connectDB();
  const body = await request.json();
  try {
    const template = await Template.create(body);
    return NextResponse.json(template, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 422 });
  }
}
