import { createHmac } from "crypto";
import type { NextRequest, NextResponse } from "next/server";
import type { User } from "@/lib/models";
import { accountIsRestricted } from "@/lib/models/user";
import { getCollection, serializeDocument } from "@/lib/server/collections";

export const AUTH_COOKIE_NAME = "ecp_auth_token";
export const CART_COOKIE_NAME = "ecp_cart_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

interface SessionPayload {
  sub: string;
  email: string;
  role: User["role"];
  /** Account status, role and session version are checked live on every request. */
  emailVerified: boolean;
  sessionVersion?: number;
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
      emailVerified: user.emailVerified !== false,
      sessionVersion: user.sessionVersion ?? 0,
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

type SessionRequest = { cookies: { get(name: string): { value: string } | undefined } };

export function getSessionUserId(request: SessionRequest): string | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = verifySessionToken(token);
  return payload?.sub ?? null;
}

export async function getSessionUser(request: SessionRequest): Promise<User | null> {
  const payload = verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!payload) return null;

  const collection = await getCollection("users");
  const user = serializeDocument(await collection.findOne({ id: payload.sub }));
  if (!user || accountIsRestricted(user.status) || (payload.sessionVersion ?? 0) !== (user.sessionVersion ?? 0)) return null;
  return user;
}
