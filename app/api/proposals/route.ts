import { NextRequest, NextResponse } from "next/server";
import { validateProposalInput } from "@/lib/proposal-input";
import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { submitProposal, deliverProposalMessages } from "@/lib/server/proposals";
import { clubError } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = validateProposalInput(body);
    if ("error" in input) throw new VolunteerError(input.error, 400);
    const captcha = await verifyRecaptcha(body.recaptchaToken);
    if (!captcha.ok) throw new VolunteerError(captcha.error, captcha.status);
    await ensureCoreIndexes();
    const { proposal, duplicate } = await submitProposal(input.value);
    try { await deliverProposalMessages(proposal.id); } catch { /* saved in outbox */ }
    const acknowledgementEmailSent = await (await getCollection("proposalMessages")).countDocuments({ proposalId: proposal.id, audience: "submitter", status: "sent" }) > 0;
    return NextResponse.json({ ok: true, data: { reference: proposal.id, duplicate, acknowledgementEmailSent } }, { status: duplicate ? 200 : 201 });
  } catch (error) { return clubError(error); }
}
