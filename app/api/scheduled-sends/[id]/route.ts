import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import ScheduledSend from "@/lib/models/ScheduledSend";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const updated = await ScheduledSend.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
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
    await ScheduledSend.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
