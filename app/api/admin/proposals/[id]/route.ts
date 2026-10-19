import { NextRequest, NextResponse } from "next/server";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/lib/models/proposal";
import { getCollection } from "@/lib/server/collections";
import { clubAdmin, clubError } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
import { convertProposal, deliverProposalMessages } from "@/lib/server/proposals";
export const maxDuration = 60;
export async function PATCH(request: NextRequest, context: {params: Promise<{id: string}>}) {
  try {
    const admin = await clubAdmin(request), { id } = await context.params, body = await request.json();
    if (!PROPOSAL_STATUSES.includes(body.status) || typeof body.reviewNotes !== "string" || body.reviewNotes.length > 5000) throw new VolunteerError("Choose a valid status and keep review notes under 5,000 characters.", 400);
    const updated = await (await getCollection("proposals")).findOneAndUpdate({ id, ...(body.status !== "approved" ? { draftEventId: { $exists: false } } : {}) }, { $set: { status: body.status as ProposalStatus, reviewNotes: body.reviewNotes.trim(), reviewedBy: admin.sub, updatedAt: new Date().toISOString() } }, { returnDocument: "after" });
    if (!updated) throw new VolunteerError("Proposal not found, or already converted to a draft. Converted proposals remain approved.", 409);
    return NextResponse.json({ ok: true, data: { id: updated.id } });
  } catch (error) { return clubError(error); }
}
export async function POST(request: NextRequest, context: {params: Promise<{id: string}>}) {
  try {
    const admin = await clubAdmin(request), { id } = await context.params, body = await request.json();
    if (body.action === "convert") return NextResponse.json({ ok: true, data: await convertProposal(id, admin) });
    if (body.action === "retry-email") {
      if (!await (await getCollection("proposals")).findOne({ id })) throw new VolunteerError("Proposal not found.", 404);
      return NextResponse.json({ ok: true, data: await deliverProposalMessages(id) });
    }
    throw new VolunteerError("Unknown proposal action.", 400);
  } catch (error) { return clubError(error); }
}
