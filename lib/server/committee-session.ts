import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { findVolunteerAccess } from "@/lib/server/volunteer-access";
import { committeePerson } from "@/lib/server/committee-memberships";
import { VolunteerError } from "@/lib/server/volunteer-error";

export const COMMITTEE_COOKIE = "ecp_committee_access";
export const committeeCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 30*86400 };
export function committeeOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new VolunteerError("This request must come from the club website.", 403);
}
export async function requestCommitteePerson(request: NextRequest) {
  const explicit = request.headers.get("authorization");
  if (explicit) return committeePerson(null, await findVolunteerAccess(explicit));
  const user = await getSessionUser(request);
  // Prefer the member's live session; never accept a client-supplied person ID or role.
  if (user && ["member", "admin", "super-admin"].includes(user.role)) return committeePerson(user, null);
  const authorization = request.cookies.get(COMMITTEE_COOKIE)?.value ? `Bearer ${request.cookies.get(COMMITTEE_COOKIE)!.value}` : null;
  return committeePerson(null, await findVolunteerAccess(authorization));
}
