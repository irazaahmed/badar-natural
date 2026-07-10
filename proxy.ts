import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";

/**
 * Next.js 16 route protection (proxy.ts replaces middleware.ts).
 *
 * Edge-safe: builds its own Auth.js instance from auth.config.ts only, so no
 * bcryptjs is bundled here. The `auth` wrapper decodes the session JWT and
 * exposes it on `req.auth`.
 *
 * Two audiences: /admin/* requires the ADMIN session; /portal/* requires a
 * CUSTOMER session. Each is redirected to its own home (or /login) when the
 * role doesn't match.
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const { pathname } = nextUrl;
  const role = req.auth?.user?.role;
  const isAdmin = role === "ADMIN";
  const isCustomer = role === "CUSTOMER";

  const home = isAdmin ? "/admin" : isCustomer ? "/portal" : "/login";

  // /admin/* → ADMIN only
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!isAdmin) return NextResponse.redirect(new URL(home, nextUrl));
    return NextResponse.next();
  }

  // /portal/* → CUSTOMER only
  if (pathname === "/portal" || pathname.startsWith("/portal/")) {
    if (!isCustomer) return NextResponse.redirect(new URL(home, nextUrl));
    return NextResponse.next();
  }

  // Already-authenticated users have no business on /login
  if (pathname === "/login" && (isAdmin || isCustomer)) {
    return NextResponse.redirect(new URL(home, nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*", "/login"],
};
