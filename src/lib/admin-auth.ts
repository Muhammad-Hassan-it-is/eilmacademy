import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "eilm_admin_session";

const sessionLifetimeSeconds = 8 * 60 * 60;

function getSessionSecret() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable");
  return secret;
}

function signExpiry(expiry: number) {
  return createHmac("sha256", getSessionSecret())
    .update(`eilm-admin-session:${expiry}`)
    .digest("base64url");
}

export function createAdminSessionToken() {
  const expiry = Math.floor(Date.now() / 1000) + sessionLifetimeSeconds;
  return `${expiry}.${signExpiry(expiry)}`;
}

export function isValidAdminSessionToken(token: string | undefined) {
  if (!token) return false;

  const [expiryValue, signature, extra] = token.split(".");
  const expiry = Number(expiryValue);
  const now = Math.floor(Date.now() / 1000);
  if (
    extra !== undefined ||
    !Number.isSafeInteger(expiry) ||
    expiry <= now ||
    expiry > now + sessionLifetimeSeconds ||
    !signature
  ) {
    return false;
  }

  const expected = Buffer.from(signExpiry(expiry));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSessionToken(token);
}
