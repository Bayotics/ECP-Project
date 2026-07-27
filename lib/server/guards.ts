import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/server/session";

/**
 * Lightweight authorization guards for API route handlers.
 *
 * `requireSession` verifies the signed auth cookie WITHOUT a database hit
 * (the token payload already carries id/email/role). Use it to protect
 * endpoints that expose member or applicant data.
 */

export interface RequestSession {
  sub: string;
  email: string;
  role: string;
}

export function getRequestSession(request: NextRequest): RequestSession | null {
  const payload = verifySessionToken(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  if (!payload) return null;
  return { sub: payload.sub, email: payload.email, role: payload.role };
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

/**
 * Returns the session, or `null` alongside a ready-made 401 response.
 * Usage:
 *   const { session, deny } = requireSession(request);
 *   if (deny) return deny;
 */
export function requireSession(request: NextRequest): {
  session: RequestSession | null;
  deny: NextResponse | null;
} {
  const session = getRequestSession(request);
  if (!session) return { session: null, deny: unauthorized() };
  return { session, deny: null };
}
