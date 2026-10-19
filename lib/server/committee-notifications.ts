import type { ClientSession } from "mongodb";
import { nanoid } from "nanoid";
import type { Committee, CommitteeMembershipChange, CommitteeMessage } from "@/lib/models";
import type { CommitteePerson } from "@/lib/server/committee-memberships";
import { committeeLeadEmails } from "@/lib/server/committee-memberships";
import { getCollection } from "@/lib/server/collections";
import { adminRecipients } from "@/lib/server/admin-notifications";
import { volunteerPreferencesUrl } from "@/lib/server/volunteer-access";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { escapeHtml } from "@/lib/server/email-templates";

export async function queueCommitteeChange(person: CommitteePerson, committee: Committee, change: CommitteeMembershipChange, session: ClientSession) {
  const leads = await committeeLeadEmails(committee, session);
  // Keep notices actionable when a seeded chair has no linked email yet.
  const recipients = leads.length ? leads : (await adminRecipients(session)).map(admin => admin.email);
  const url = person.volunteerId ? await volunteerPreferencesUrl(person.volunteerId, session) : `${siteUrl()}/member/profile`;
  const verb = change.action === "join" ? "joined" : "left";
  const details = `<p>${escapeHtml(person.name)} has ${verb} ${escapeHtml(committee.name)}.</p><p>Status: ${change.status}. Role: ${escapeHtml(change.role)}.</p><p>Recorded: ${escapeHtml(change.at)} (UTC).</p>`;
  const messages: CommitteeMessage[] = [{
    id: nanoid(), changeId: change.id, ...(person.userId ? { userId: person.userId } : {}), ...(person.volunteerId ? { volunteerId: person.volunteerId } : {}), audience: "person", to: person.email,
    subject: `You have ${verb} ${committee.name}`, html: `${details}<p><a href="${escapeHtml(url)}">${person.volunteerId ? "Manage my volunteering" : "Manage my committees"}</a></p>`, status: "pending", attempts: 0, createdAt: change.at,
  }, ...[...new Set(recipients.map(email => email.toLowerCase()))].filter(email => email !== person.email.toLowerCase()).map(to => ({
    id: nanoid(), changeId: change.id, audience: "lead" as const, to, subject: `${person.name} has ${verb} ${committee.name}`, html: `${details}<p>Contact: ${escapeHtml(person.email)}</p><p><a href="${escapeHtml(siteUrl()+"/admin/committees")}">Committee administration</a></p>`, status: "pending" as const, attempts: 0, createdAt: change.at,
  }))];
  await (await getCollection("committeeMessages")).insertMany(messages, { session });
  return messages.map(message => message.id);
}

export async function deliverCommitteeMessages(ids?: string[]) {
  const collection = await getCollection("committeeMessages"), now = new Date().toISOString();
  const available = { $or: [{ status: { $in: ["pending", "failed"] as CommitteeMessage["status"][] } }, { status: "sending" as const, leaseUntil: { $lte: now } }] };
  const candidates = await collection.find({ ...(ids ? { id: { $in: ids } } : {}), ...available }).sort({ createdAt: 1 }).limit(100).toArray();
  let sent = 0, failed = 0;
  for (const candidate of candidates) {
    const message = await collection.findOneAndUpdate({ id: candidate.id, ...available }, { $set: { status: "sending", leaseUntil: new Date(Date.now()+120000).toISOString() }, $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (!message) continue;
    if (message.audience === "person") {
      const volunteer = message.volunteerId ? await (await getCollection("volunteers")).findOne({ id: message.volunteerId }) : null;
      const member = message.userId ? await (await getCollection("users")).findOne({ id: message.userId }) : null;
      if (![volunteer?.email, member?.email].some(email => email?.toLowerCase() === message.to.toLowerCase())) {
        await collection.updateOne({ id: message.id }, { $set: { status: "superseded" }, $unset: { leaseUntil: "" } }); continue;
      }
    }
    // Explicitly requested committee changes are transactional confirmations, including for opted-out volunteers.
    const result = await sendEmail({ to: message.to, subject: message.subject, html: message.html, tags: { type: "committee-membership", changeId: message.changeId } });
    await collection.updateOne({ id: message.id }, { $set: result.ok ? { status: "sent", sentAt: new Date().toISOString(), error: "" } : { status: "failed", error: result.error }, $unset: { leaseUntil: "" } });
    if (result.ok) sent++; else failed++;
  }
  return { sent, failed };
}
