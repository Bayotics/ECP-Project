import { NextRequest, NextResponse } from "next/server";
import { findVolunteerAccess } from "@/lib/server/volunteer-access";
import { committeeOrigin, COMMITTEE_COOKIE, committeeCookieOptions } from "@/lib/server/committee-session";
import { clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteer-error";

export async function POST(request: NextRequest) {
  try {
    committeeOrigin(request);
    const authorization = request.headers.get("authorization");
    const person = await findVolunteerAccess(authorization);
    if (!person) throw new VolunteerError("This volunteer link is invalid or expired. Request a fresh email link.", 401);
    const response = NextResponse.json({ ok: true, data: { verified: true } }, { headers: privateHeaders });
    response.cookies.set(COMMITTEE_COOKIE, authorization!.slice(7), committeeCookieOptions);
    return response;
  } catch (error) { return clubError(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    committeeOrigin(request);
    const response = NextResponse.json({ ok: true, data: null }, { headers: privateHeaders });
    response.cookies.set(COMMITTEE_COOKIE, "", { ...committeeCookieOptions, maxAge: 0 });
    return response;
  } catch (error) { return clubError(error); }
}
