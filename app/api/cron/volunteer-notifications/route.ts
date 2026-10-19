import { deliverCommitteeMessages } from "@/lib/server/committee-notifications";
import { resumeDueVolunteers } from "@/lib/server/volunteer-management";
import { deliverProposalMessages } from "@/lib/server/proposals";
import { NextRequest, NextResponse } from "next/server";
import { validCronSecret } from "@/lib/server/dues-reminders";
import { getCollection } from "@/lib/server/collections";
import { reconcileVolunteerEvent } from "@/lib/server/volunteers";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  if (!validCronSecret(request.headers.get("authorization"))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try {
    await resumeDueVolunteers();
    const waitingEvents = await (await getCollection("volunteerSignups")).distinct("eventId", { status: "waitlisted" });
    const available = await (await getCollection("events")).find({ id: { $in: waitingEvents }, status: "published" }).project({ id: 1 }).toArray();
    for (const event of available) await reconcileVolunteerEvent(event.id);
    const volunteers = await deliverVolunteerMessages();
    const proposals = await deliverProposalMessages();
    const committees = await deliverCommitteeMessages();
    const result = { sent: volunteers.sent + proposals.sent + committees.sent, failed: volunteers.failed + proposals.failed + committees.failed, volunteers, proposals, committees };
    return NextResponse.json({ ok: result.failed === 0, data: result }, { status: result.failed ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[volunteers] Scheduled retry failed", error);
    return NextResponse.json({ ok: false, error: "Volunteer notification retry failed." }, { status: 503 });
  }
}
