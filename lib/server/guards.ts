import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";

/**
 * Authorization always checks the current account, including restrictions
 * and session version, rather than trusting a role in an older cookie.
 */

export interface RequestSession {
  sub: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export async function getRequestSession(request: NextRequest): Promise<RequestSession | null> {
  const user = await getSessionUser(request);
  if (!user) return null;
  return {
    sub: user.id,
    email: user.email,
    role: user.role,
    /* Older tokens predate the field. Treating absent as verified keeps
       existing sessions working; a signed-out unverified user cannot get a
       new token at all, because login refuses them. */
    emailVerified: user.emailVerified !== false,
  };
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

/**
 * Returns the session, or `null` alongside a ready-made 401 response.
 * Usage:
 *   const { session, deny } = await requireSession(request);
 *   if (deny) return deny;
 */
export async function requireSession(request: NextRequest): Promise<{
  session: RequestSession | null;
  deny: NextResponse | null;
}> {
  const session = await getRequestSession(request);
  if (!session) return { session: null, deny: unauthorized() };
  return { session, deny: null };
}
