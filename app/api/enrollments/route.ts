import { NextRequest, NextResponse } from "next/server";
import { ensureDbConnection, getErrorMessage } from "@/lib/api";
import Enrollment from "@/lib/models/Enrollment";

export async function GET(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  const { searchParams } = new URL(request.url);
  const sequenceId = searchParams.get("sequenceId");

  try {
    const filter = sequenceId ? { sequenceId } : {};
    const enrollments = await Enrollment.find(filter).lean();
    return NextResponse.json(enrollments);
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const dbError = await ensureDbConnection();
  if (dbError) return dbError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) {
    return NextResponse.json({ error: "At least one enrollment is required." }, { status: 400 });
  }

  try {
    const ops = items.map((item: Record<string, unknown>) => ({
      updateOne: {
        filter: { sequenceId: item.sequenceId as string, email: (item.email as string).toLowerCase() },
        update: {
          $setOnInsert: {
            sequenceId: item.sequenceId as string,
            contactId: (item.contactId as string | undefined) ?? undefined,
            email: (item.email as string).toLowerCase(),
            enrolledAt: new Date(),
            completedSteps: [],
            active: true,
          },
        },
        upsert: true,
      },
    }));

    const result = await Enrollment.bulkWrite(ops);
    return NextResponse.json({ created: result.upsertedCount }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
