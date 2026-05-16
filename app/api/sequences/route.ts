import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Sequence from "@/lib/models/Sequence";

export async function GET() {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  try {
    const sequences = await Sequence.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(sequences);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, steps } = body as { name?: string; steps?: Array<{ dayOffset?: number; subject?: string; html?: string }> };
  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  try {
    const doc = await Sequence.create({ name: name.trim(), steps: steps ?? [] });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
