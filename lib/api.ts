import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export function getErrorMessage(error: unknown, fallback = "Internal server error"): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function ensureDbConnection() {
  try {
    await connectDB();
    return null;
  } catch (error) {
    console.error("[db]", error);
    return NextResponse.json(
      {
        error: "Database unavailable",
        details: process.env.NODE_ENV === "development" ? getErrorMessage(error) : undefined,
      },
      { status: 503 },
    );
  }
}
