/**
 * Edge-runtime-safe token verification (Web Crypto only — no Node `crypto`).
 * Used by middleware.ts. Must stay in sync with src/lib/admin.ts signing.
 */

export const ADMIN_COOKIE = "rg_admin";

const SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  "repoglass-dev-only-secret-please-override-in-env";

async function hmacHex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export async function verifyAdminTokenEdge(
  token: string | undefined | null
): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig) return false;
  if (Number(exp) < Date.now()) return false;
  const expected = await hmacHex(exp);
  return timingSafeEqualHex(sig, expected);
}
