export const ADMIN_SESSION_COOKIE = "carray_admin_session";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Signs an expiry timestamp with the admin password as the HMAC key — no separate session secret needed. */
export async function createSessionToken(adminPassword: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const signature = await hmacHex(adminPassword, String(expiresAt));
  return `${expiresAt}.${signature}`;
}

export async function verifySessionToken(
  token: string | undefined,
  adminPassword: string,
): Promise<boolean> {
  if (!token) return false;
  const [expiresAtRaw, signature] = token.split(".");
  if (!expiresAtRaw || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expectedSignature = await hmacHex(adminPassword, expiresAtRaw);
  return timingSafeEqual(expectedSignature, signature);
}
