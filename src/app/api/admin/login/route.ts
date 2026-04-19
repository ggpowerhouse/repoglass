import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminToken, credentialsMatch } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { email = "", password = "" } = body;
  if (!credentialsMatch(email, password)) {
    // Intentionally generic error to avoid enumeration.
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }
  const token = createAdminToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 24 * 60 * 60,
  });
  return res;
}
