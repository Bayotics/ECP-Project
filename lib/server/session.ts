import { createHmac } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { User } from "@/lib/models";
import { getCollection, serializeDocument } from "@/lib/server/collections";

export const AUTH_COOKIE_NAME = "ecp_auth_token";
export const CART_COOKIE_NAME = "ecp_cart_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  sub: string;
  email: string;
  role: User["role"];
  iat: number;
  exp: number;
}

function getSessionSecret(): string {
  const configured = process.env.AUTH_JWT_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing AUTH_JWT_SECRET. Add it to your .env.local file.");
  }
  return process.env.MONGODB_URI?.trim() || "ecp-dev-session-secret";
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(unsignedToken: string): string {
  return createHmac("sha256", getSessionSecret()).update(unsignedToken).digest("base64url");
}

export function createSessionToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: now,
      exp: now + SESSION_MAX_AGE_SECONDS,
    } satisfies SessionPayload)
  );
  const unsignedToken = `${header}.${payload}`;
  return `${unsignedToken}.${sign(unsignedToken)}`;
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;

  const [header, payload, signature] = token.split(".");
  if (!header || !payload || !signature) return null;

  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = sign(unsignedToken);
  if (signature !== expectedSignature) return null;

  try {
    const parsed = JSON.parse(decodeBase64Url(payload)) as SessionPayload;
    if (!parsed.sub || !parsed.exp || parsed.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function buildCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setAuthSessionCookie(response: NextResponse, user: User): void {
  response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(user), buildCookieOptions(SESSION_MAX_AGE_SECONDS));
}

export function clearAuthSessionCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", buildCookieOptions(0));
}

export function setCartSessionCookie(response: NextResponse, sessionId: string): void {
  response.cookies.set(CART_COOKIE_NAME, sessionId, buildCookieOptions(60 * 60 * 24 * 30));
}

export function clearCartSessionCookie(response: NextResponse): void {
  response.cookies.set(CART_COOKIE_NAME, "", buildCookieOptions(0));
}

export function getCartSessionId(request: NextRequest): string | null {
  return request.cookies.get(CART_COOKIE_NAME)?.value ?? null;
}

export function getSessionUserId(request: NextRequest): string | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  return payload?.sub ?? null;
}

export async function getSessionUser(request: NextRequest): Promise<User | null> {
  const userId = getSessionUserId(request);
  if (!userId) return null;

  const collection = await getCollection("users");
  return serializeDocument(await collection.findOne({ id: userId }));
}
