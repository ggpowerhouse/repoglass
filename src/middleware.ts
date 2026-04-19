import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminTokenEdge } from "@/lib/admin-edge";

/**
 * Guard /admin and /api/admin/* routes with a signed cookie session.
 * Unauthenticated users are redirected to /admin/login.
 * Edge-safe: uses Web Crypto via `@/lib/admin-edge`.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  const ok = await verifyAdminTokenEdge(cookie);
  if (ok) return NextResponse.next();

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
