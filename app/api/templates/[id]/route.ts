import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Template from "@/lib/models/Template";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  const body = await request.json();
  try {
    const updated = await Template.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update template.") }, { status: 422 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  const deleted = await Template.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
