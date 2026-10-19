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
  const recipients = [{ to: volunteer.email, audience: "volunteer" as const }, ...[...staff].map(to => ({ to, audience: "staff" as const }))];
  const messages: VolunteerMessage[] = recipients.map(recipient => ({
    id: nanoid(), volunteerId: volunteer.id,
    ...(signup ? { signupId: signup.id, signupStatus: signup.status } : {}),
    ...(event ? { eventId: event.id } : {}),
    ...recipient,
    ...volunteerEmail({ preferencesUrl: recipient.audience === "volunteer" ? preferencesUrl : undefined, volunteer, status: signup?.status ?? "general", reference: signup?.id ?? volunteer.id, event, audience: recipient.audience, url: `${siteUrl()}${recipient.audience === "staff" ? "/admin/volunteers" : event ? `/events/${encodeURIComponent(event.slug)}` : "/volunteer"}` }),
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
    const result = await sendEmail({ to: message.to, subject: message.subject, html: message.html, tags: { type: `volunteer-${message.audience}`, volunteerId: message.volunteerId, ...(message.eventId ? { eventId: message.eventId } : {}) } });
    await collection.updateOne({ id: message.id }, { $set: result.ok ? { status: "sent", sentAt: new Date().toISOString(), error: "" } : { status: "failed", error: result.error }, $unset: { leaseUntil: "" } });
    if (result.ok) sent++; else failed++;
  }
  const confirmationPending = ids ? await collection.countDocuments({ id: { $in: ids }, audience: "volunteer", status: { $ne: "sent" } }) : 0;
  return { sent, failed, confirmationEmailSent: confirmationPending === 0 };
}

export async function queueVolunteerWelcome(volunteer: Volunteer, session: ClientSession) {
  const id = nanoid();
  const preferencesUrl = await volunteerPreferencesUrl(volunteer.id, session);
  await (await getCollection("volunteerMessages")).insertOne({ id, volunteerId: volunteer.id, audience: "volunteer", to: volunteer.email, ...volunteerWelcomeEmail(volunteer.name, preferencesUrl), status: "pending", attempts: 0, createdAt: new Date().toISOString() }, { session });
  return [id];
}
