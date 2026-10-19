import { createHash } from "crypto";
import { nanoid } from "nanoid";
import type { ClientSession } from "mongodb";
import type { Event, EventProposal, ProposalMessage, ProposalRecipientsSettings } from "@/lib/models";
import { proposalEventDescription } from "@/lib/proposal-input";
import type { ProposalInput } from "@/lib/proposal-input";
import { getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { VolunteerError } from "@/lib/server/volunteers";
import { proposalEmail } from "@/lib/server/email-templates";
import { sendEmail, siteUrl } from "@/lib/server/email";

export async function proposalRecipients(session?: ClientSession): Promise<ProposalRecipientsSettings["recipients"]> {
  const settings = await (await getCollection("clubSettings")).findOne({ id: "proposal-recipients" }, { session }) as ProposalRecipientsSettings | null;
  if (settings) return settings.recipients;
  const accounts = await (await getCollection("users")).find({ status: "active" }, { session }).toArray();
  const map = new Map<string, {name: string; email: string}>();
  for (const user of accounts) {
    const title = (user.title || "").toLowerCase().replace(/[^a-z]/g, "");
    if (["admin", "super-admin"].includes(user.role) || ["president", "vicepresident"].includes(title)) {
      const email = user.email?.trim().toLowerCase();
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) map.set(email, { name: user.displayName || email, email });
    }
  }
  return [...map.values()];
}

export async function submitProposal(input: ProposalInput) {
  return volunteerTransaction(async session => {
    const proposals = await getCollection("proposals");
    const contentHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const old = await proposals.findOne({ submissionId: input.submissionId }, { session });
    if (old) {
      if (old.contentHash !== contentHash) throw new VolunteerError("This submission reference was already used. Reload the form for a new proposal.", 409);
      return { proposal: old, duplicate: true };
    }
    const recipients = await proposalRecipients(session);
    if (!recipients.length) throw new VolunteerError("The proposal review inbox is not configured. Please contact the club.", 503);
    const now = new Date().toISOString();
    const proposal: EventProposal = { ...input, id: nanoid(), contentHash, status: "new", createdAt: now, updatedAt: now };
    await proposals.insertOne(proposal, { session });
    const messages: ProposalMessage[] = [{ to: proposal.email, audience: "submitter" as const }, ...recipients.map(person => ({ to: person.email, audience: "admin" as const }))].map(recipient => ({
      id: nanoid(), proposalId: proposal.id, ...recipient,
      ...proposalEmail({ ...proposal, reference: proposal.id, admin: recipient.audience === "admin", url: `${siteUrl()}${recipient.audience === "admin" ? "/admin/proposals" : "/events"}` }),
      status: "pending", attempts: 0, createdAt: now,
    }));
    await (await getCollection("proposalMessages")).insertMany(messages, { session });
    return { proposal, duplicate: false };
  });
}

export async function deliverProposalMessages(proposalId?: string) {
  const messages = await getCollection("proposalMessages");
  const now = new Date().toISOString();
  const available = { $or: [{ status: { $in: ["pending", "failed"] as ProposalMessage["status"][] } }, { status: "sending" as const, leaseUntil: { $lte: now } }] };
  const candidates = await messages.find({ ...(proposalId ? { proposalId } : {}), ...available }).sort({ createdAt: 1, id: 1 }).limit(100).toArray();
  let sent = 0, failed = 0;
  for (const candidate of candidates) {
    const message = await messages.findOneAndUpdate({ id: candidate.id, ...available }, { $set: { status: "sending", leaseUntil: new Date(Date.now() + 120000).toISOString() }, $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (!message) continue;
    const result = await sendEmail({ to: message.to, subject: message.subject, html: message.html, tags: { type: `proposal-${message.audience}`, proposalId: message.proposalId } });
    await messages.updateOne({ id: message.id }, { $set: result.ok ? { status: "sent", sentAt: new Date().toISOString(), error: "" } : { status: "failed", error: result.error }, $unset: { leaseUntil: "" } });
    if (result.ok) sent++; else failed++;
  }
  return { sent, failed };
}

export async function convertProposal(id: string, admin: {sub: string; email: string}) {
  return volunteerTransaction(async session => {
    const proposals = await getCollection("proposals");
    // A write serializes conversion and status changes on the same proposal.
    const proposal = await proposals.findOneAndUpdate({ id }, { $set: { updatedAt: new Date().toISOString() } }, { session, returnDocument: "after" });
    if (!proposal) throw new VolunteerError("Proposal not found.", 404);
    if (proposal.draftEventId) return { id: proposal.draftEventId, slug: proposal.draftEventSlug };
    if (proposal.status !== "approved") throw new VolunteerError("Approve the proposal before creating a draft event.", 409);
    const now = new Date().toISOString(), eventId = nanoid();
    const event: Event = { id: eventId, proposalId: proposal.id, slug: `${proposal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "event"}-${eventId}`, title: proposal.title, description: proposalEventDescription(proposal.description), shortDescription: proposal.description.slice(0, 200), date: `${proposal.proposedDate}T00:00:00.000Z`, location: proposal.location, isOnline: false, type: "other", status: "draft", registrationRequired: false, volunteerCap: null, volunteerLeadIds: [], organizerId: admin.sub, organizerName: admin.email, tags: [], isFeatured: false, isPublic: true, membersOnly: false, createdAt: now, updatedAt: now };
    await (await getCollection("events")).insertOne(event, { session });
    await proposals.updateOne({ id }, { $set: { draftEventId: event.id, draftEventSlug: event.slug, updatedAt: now } }, { session });
    return { id: event.id, slug: event.slug };
  });
}
