import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  isAuthConfigured,
  isValidPasswordAttempt,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Authentication is not configured. Add ADMIN_PASSWORD to .env.local and restart the server." },
      { status: 503 },
    );
  }

  if (typeof password === "string" && await isValidPasswordAttempt(password)) {
    const response = NextResponse.json({ success: true });
    const sessionToken = await createSessionToken(password);
    
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return response;
  }

  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
