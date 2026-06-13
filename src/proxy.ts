import { NextResponse, type NextRequest } from "next/server";

// Cheap guard for authenticated areas (Next 16 `proxy`, nodejs runtime): this
// only checks that a session cookie is PRESENT and bounces anonymous requests
// to /login. Pages still re-validate (and decrypt) the session server-side
// (defense in depth) — this just avoids rendering protected shells for clearly
// unauthenticated visitors. SESSION_COOKIE must match sessionOptions.cookieName.
const SESSION_COOKIE = "mosrev_session";

export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/workflows/:path*",
    "/templates/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/t/:path*",
    "/facilities/:path*",
    "/bookings/:path*",
    "/finance/:path*",
    "/community/:path*",
  ],
};
