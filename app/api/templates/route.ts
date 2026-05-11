import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Template from "@/lib/models/Template";

export async function GET() {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  try {
    const templates = await Template.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to load templates.") }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const body = await request.json();
  try {
    const template = await Template.create(body);
    return NextResponse.json(template, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e, "Failed to create template.") }, { status: 422 });
  }
}
