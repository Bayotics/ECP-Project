import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { readCommitteeMemberships, changeCommitteeMembership } from "@/lib/server/committee-memberships";
import { requestCommitteePerson, committeeOrigin } from "@/lib/server/committee-session";
import { deliverCommitteeMessages } from "@/lib/server/committee-notifications";
import { VolunteerError } from "@/lib/server/volunteer-error";
import { clubError, privateHeaders } from "@/lib/server/club-api";

export async function GET(request: NextRequest) {
  try {
    const person = await requestCommitteePerson(request);
    if (!person) return NextResponse.json({ ok: true, data: null }, { headers: privateHeaders });
    await ensureCoreIndexes();
    return NextResponse.json({ ok: true, data: await readCommitteeMemberships(person) }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
export async function POST(request: NextRequest) {
  try {
    committeeOrigin(request);
    const person = await requestCommitteePerson(request);
    if (!person) throw new VolunteerError("Sign in as a member or verify your volunteer email before changing committees.", 401);
    const body = await request.json();
    if (typeof body?.committeeId !== "string" || !body.committeeId || body.committeeId.length > 100 || !["join", "leave"].includes(body.action)) throw new VolunteerError("Choose a committee and Join or Leave.", 400);
    await ensureCoreIndexes();
    const result = await changeCommitteeMembership(person, body.committeeId, body.action);
    let emailQueued = false;
    try { emailQueued = (await deliverCommitteeMessages(result.messageIds)).failed > 0; } catch { emailQueued = true; }
    return NextResponse.json({ ok: true, data: { ...await readCommitteeMemberships(person), unchanged: result.unchanged, emailQueued } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
