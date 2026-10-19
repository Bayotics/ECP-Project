import { clubDate } from "@/lib/dues";
import { volunteerCanReceive } from "@/lib/volunteer-status";
import { volunteerChangeEmail, escapeHtml } from "@/lib/server/email-templates";
import type { VolunteerChange } from "@/lib/models/volunteer";
import type { ClientSession } from "mongodb";
import { nanoid } from "nanoid";
import type { Event, Volunteer, VolunteerSignup, VolunteerMessage } from "@/lib/models";
import { getCollection } from "@/lib/server/collections";
import { adminRecipients } from "@/lib/server/admin-notifications";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { volunteerPreferencesUrl } from "@/lib/server/volunteer-access";
import { volunteerWelcomeEmail } from "@/lib/server/email-templates";
import { volunteerEmail } from "@/lib/server/email-templates";

export async function queueVolunteerMessages(volunteer: Volunteer, signup: VolunteerSignup | undefined, event: Event | undefined, session: ClientSession): Promise<string[]> {
  const outbox = await getCollection("volunteerMessages");
  if (signup) await outbox.updateMany({ signupId: signup.id, status: { $in: ["pending", "failed"] } }, { $set: { status: "superseded" } }, { session });
  const staff = new Set((await adminRecipients(session)).map(person => person.email.toLowerCase()));
  if (event?.volunteerLeadIds?.length) {
    const users = await getCollection("users");
    const leads = await users.find({ id: { $in: event.volunteerLeadIds }, status: "active", role: { $in: ["member", "admin", "super-admin"] } }, { session }).toArray();
    for (const lead of leads) if (lead.email?.trim()) staff.add(lead.email.trim().toLowerCase());
  }
  const preferencesUrl = await volunteerPreferencesUrl(volunteer.id, session);
  const committeeNames = volunteer.committeeIds?.length ? (await (await getCollection("committees")).find({id:{$in:volunteer.committeeIds}},{session}).project({name:1}).toArray()).map(row=>row.name) : [];
  const recipients = [{ to: volunteer.email, audience: "volunteer" as const }, ...[...staff].map(to => ({ to, audience: "staff" as const }))];
  const messages: VolunteerMessage[] = recipients.map(recipient => ({
    id: nanoid(), volunteerId: volunteer.id, kind: "signup",
    ...(signup ? { signupId: signup.id, signupStatus: signup.status } : {}),
    ...(event ? { eventId: event.id } : {}),
    ...recipient,
    ...volunteerEmail({ committeeNames, preferencesUrl: recipient.audience === "volunteer" ? preferencesUrl : undefined, volunteer, status: signup?.status ?? "general", reference: signup?.id ?? volunteer.id, event, audience: recipient.audience, url: `${siteUrl()}${recipient.audience === "staff" ? "/admin/volunteers" : event ? `/events/${encodeURIComponent(event.slug)}` : "/volunteer"}` }),
    status: "pending", attempts: 0, createdAt: new Date().toISOString(),
  }));
  await outbox.insertMany(messages, { session });
  return messages.map(message => message.id);
}

/** Messages are recorded with the sign-up, so a crash or provider failure is retryable. */
export async function deliverVolunteerMessages(ids?: string[]) {
  const collection = await getCollection("volunteerMessages");
  const now = new Date().toISOString();
  const candidates = await collection.find({ ...(ids ? { id: { $in: ids } } : {}), $or: [{ status: { $in: ["pending", "failed"] } }, { status: "sending", leaseUntil: { $lte: now } }] }).sort({ createdAt: 1, id: 1 }).limit(100).toArray();
  let sent = 0, failed = 0;
  for (const candidate of candidates) {
    const message = await collection.findOneAndUpdate({ id: candidate.id, $or: [{ status: { $in: ["pending", "failed"] } }, { status: "sending", leaseUntil: { $lte: now } }] }, { $set: { status: "sending", leaseUntil: new Date(Date.now() + 120000).toISOString() }, $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (!message) continue;
    if (message.audience === "volunteer") {
      let person = await (await getCollection("volunteers")).findOne({id:message.volunteerId});
      if (person?.status === "paused" && person.resumeDate && person.resumeDate <= clubDate()) {
        const {resumeVolunteerIfDue}=await import("@/lib/server/volunteer-management");
        await resumeVolunteerIfDue(person.id);
        person=await (await getCollection("volunteers")).findOne({id:person.id});
      }
      if (!person || !volunteerCanReceive(person,message.kind) || person.email !== message.to) {
        await collection.updateOne({id:message.id},{$set:{status:"superseded"},$unset:{leaseUntil:""}});
        continue;
      }
    }
    const result = await sendEmail({ to: message.to, subject: message.subject, html: message.html, tags: { type: `volunteer-${message.audience}`, volunteerId: message.volunteerId, ...(message.eventId ? { eventId: message.eventId } : {}) } });
    await collection.updateOne({ id: message.id }, { $set: result.ok ? { status: "sent", sentAt: new Date().toISOString(), error: "" } : { status: "failed", error: result.error }, $unset: { leaseUntil: "" } });
    if (result.ok) sent++; else failed++;
  }
  const confirmationPending = ids ? await collection.countDocuments({ id: { $in: ids }, audience: "volunteer", status: { $ne: "sent" } }) : 0;
  return { sent, failed, confirmationEmailSent: confirmationPending === 0 };
}

export async function queueVolunteerWelcome(volunteer: Volunteer, session: ClientSession, access = false) {
  const id = nanoid();
  const preferencesUrl = await volunteerPreferencesUrl(volunteer.id, session);
  await (await getCollection("volunteerMessages")).insertOne({ id, volunteerId: volunteer.id, audience: "volunteer", kind: access ? "access" : "welcome", to: volunteer.email, ...volunteerWelcomeEmail(volunteer.name, preferencesUrl), status: "pending", attempts: 0, createdAt: new Date().toISOString() }, { session });
  return [id];
}

export async function queueVolunteerChange(volunteer: Volunteer, action: VolunteerChange["action"], at: string, session: ClientSession) {
  const id=nanoid(), url=await volunteerPreferencesUrl(volunteer.id,session);
  await (await getCollection("volunteerMessages")).insertOne({id,volunteerId:volunteer.id,audience:"volunteer",kind:"management",to:volunteer.email,...volunteerChangeEmail(volunteer.name,action,at,url,volunteer.resumeDate),status:"pending",attempts:0,createdAt:at},{session});
  return [id];
}

export async function queueVolunteerDeletionNotice(volunteer:Volunteer,session:ClientSession) {
  const ids:string[]=[];
  for(const admin of await adminRecipients(session)) {
    const id=nanoid();ids.push(id);
    await (await getCollection("volunteerMessages")).insertOne({id,volunteerId:volunteer.id,audience:"staff",kind:"management",to:admin.email,subject:`Volunteer data deletion request: ${volunteer.name}`,html:`<p>A volunteer has requested deletion of their volunteering data.</p><p>${escapeHtml(volunteer.name)} (${escapeHtml(volunteer.email)})</p><p>Requested at ${escapeHtml(volunteer.deletionRequestedAt!)}. Volunteer emails have been stopped. The membership account has not been deleted.</p><p><a href="${escapeHtml(siteUrl()+"/admin/volunteers?deletion=requested")}">Review volunteer deletion requests</a></p>`,status:"pending",attempts:0,createdAt:new Date().toISOString()},{session});
  }
  return ids;
}
