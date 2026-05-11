import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Contact from "@/lib/models/Contact";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  const body = await request.json();
  try {
    const updated = await Contact.findByIdAndUpdate(id, { $set: body }, { new: true, runValidators: true });
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (e: unknown) {
    return NextResponse.json({ error: getErrorMessage(e, "Update failed.") }, { status: 422 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;
  const { id } = await params;
  const deleted = await Contact.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
