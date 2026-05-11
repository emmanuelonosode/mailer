import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define public routes that should NOT be protected
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/unsubscribe") ||
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/api/optouts") || // Opt-outs from the unsubscribe page
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Check for the admin session cookie
  const authSession = request.cookies.get("hasker_admin_session")?.value;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no password is set in env, we allow access (local dev convenience)
  // But in production, this should always be set.
  if (!adminPassword) {
    return NextResponse.next();
  }

  if (authSession !== adminPassword) {
    // Redirect to login if not authenticated
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes except for the ones excluded above
  matcher: ["/((?!api/track|api/optouts|unsubscribe|_next/static|_next/image|favicon.ico).*)"],
};
