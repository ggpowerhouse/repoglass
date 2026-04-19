import { createHmac, timingSafeEqual } from "crypto";

/**
 * Minimal hardcoded admin gate. Credentials can be overridden via env vars
 * in production; defaults are the ones agreed with the product owner.
 *
 * Session format: HMAC-signed cookie so it can't be forged client-side.
 */
export const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL || "admin@gmail.com";
export const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "admin12345";

export const ADMIN_COOKIE = "rg_admin";

// Signing secret; falls back to a dev-only constant. In prod, set ADMIN_SESSION_SECRET.
const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "repoglass-dev-only-secret-please-override-in-env";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex");
}

/** Returns a signed token like "<exp>.<sig>" valid for 24h. */
export function createAdminToken(): string {
  const exp = (Date.now() + 24 * 60 * 60 * 1000).toString();
  const sig = sign(exp);
  return `${exp}.${sig}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = sign(exp);
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function credentialsMatch(email: string, password: string): boolean {
  // Constant-time-ish compare on both fields.
  const safeEq = (a: string, b: string) => {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  };
  return (
    safeEq(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase()) &&
    safeEq(password, ADMIN_PASSWORD)
  );
}
