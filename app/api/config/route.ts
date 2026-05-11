import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { isAuthConfigured } from "@/lib/auth";

export async function GET() {
  const smtpConfigured = !!(
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASSWORD?.trim()
  );

  let dbConnected = false;
  let dbError: string | null = null;
  try {
    await connectDB();
    dbConnected = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : "Unknown error";
  }

  return NextResponse.json({
    authConfigured: isAuthConfigured(),
    smtpConfigured,
    senderName: smtpConfigured ? (process.env.SENDER_NAME ?? "") : "",
    senderEmail: smtpConfigured ? (process.env.SENDER_EMAIL ?? "") : "",
    appUrl: process.env.APP_URL ?? "",
    dbConnected,
    dbError,
  });
}
