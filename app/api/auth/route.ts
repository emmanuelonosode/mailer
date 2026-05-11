import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }

  if (password === adminPassword) {
    const response = NextResponse.json({ success: true });
    
    // Set a simple session cookie
    response.cookies.set("hasker_admin_session", password, {
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
