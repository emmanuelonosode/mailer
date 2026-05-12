import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, getAdminPassword, getExpectedSessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Define public routes that should NOT be protected
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/config") ||
    pathname.startsWith("/unsubscribe") ||
    pathname.startsWith("/api/track") ||
    pathname.startsWith("/api/optouts") || // Opt-outs from the unsubscribe page
    pathname.startsWith("/api/hargrove-webhook") || // Hargrove CRM webhook — validates own key
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 2. Check for the admin session cookie
  const authSession = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const adminPassword = getAdminPassword();

  // If no password is set in env, we allow access (local dev convenience)
  // But in production, this should always be set.
  if (!adminPassword) {
    return NextResponse.next();
  }

  const expectedSession = await getExpectedSessionToken();

  if (!authSession || authSession !== expectedSession) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Redirect to login if not authenticated
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes except for the ones excluded above
  matcher: ["/((?!api/track|api/optouts|unsubscribe|_next/static|_next/image|favicon.ico).*)"],
};
