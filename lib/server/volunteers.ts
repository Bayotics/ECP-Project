import { nanoid } from "nanoid";
import type { ClientSession } from "mongodb";
import type { Event, VolunteerSignup } from "@/lib/models";
import type { VolunteerInput } from "@/lib/volunteer-input";
import { volunteerEventClosedReason } from "@/lib/volunteer-events";
import { getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { queueVolunteerMessages } from "@/lib/server/volunteer-notifications";

export class VolunteerError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function lockEvent(id: string, session: ClientSession) {
  const event = await (await getCollection("events")).findOneAndUpdate({ id }, { $inc: { volunteerRevision: 1 } }, { session, returnDocument: "after" });
  if (!event) throw new VolunteerError("This event could not be found.", 404);
  return event;
}

/** All capacity mutations take the same event write lock before reading sign-ups. */
async function promoteWaiting(event: Event, session: ClientSession) {
  if (volunteerEventClosedReason(event)) return [] as string[];
  const signups = await getCollection("volunteerSignups");
  const people = await getCollection("volunteers");
  const confirmed = await signups.countDocuments({ eventId: event.id, status: "confirmed" }, { session });
  const remaining = event.volunteerCap == null ? 50 : Math.min(50, Math.max(0, event.volunteerCap - confirmed));
  if (!remaining) return [] as string[];
  const waiting = await signups.find({ eventId: event.id, status: "waitlisted" }, { session }).sort({ registeredAt: 1, queueOrder: 1, id: 1 }).limit(remaining).toArray();
  const messages: string[] = [];
  for (const record of waiting) {
    const person = await people.findOne({ id: record.volunteerId }, { session });
    if (!person) continue;
    const updated: VolunteerSignup = { ...record, status: "confirmed", updatedAt: new Date().toISOString() };
    await signups.updateOne({ id: record.id, status: "waitlisted" }, { $set: { status: "confirmed", updatedAt: updated.updatedAt } }, { session });
    messages.push(...await queueVolunteerMessages(person, updated, event, session));
  }
  return messages;
}

export async function registerVolunteer(input: VolunteerInput, memberAccess: boolean) {
  return volunteerTransaction(async session => {
    const event = input.eventId ? await lockEvent(input.eventId, session) : undefined;
    if (event) {
      const reason = volunteerEventClosedReason(event);
      if (reason) throw new VolunteerError(reason, 400);
      if ((event.membersOnly || !event.isPublic) && !memberAccess) throw new VolunteerError("Please log in with an active member account to volunteer for this members-only event.", 403);
    }
    const people = await getCollection("volunteers");
    const now = new Date().toISOString();
    const { eventId: _eventId, ...details } = input;
    void _eventId;
    const person = await people.findOneAndUpdate({ email: input.email }, { $set: { ...details, updatedAt: now }, $setOnInsert: { id: nanoid(), createdAt: now } }, { upsert: true, returnDocument: "after", session });
    if (!person) throw new Error("Volunteer upsert failed");
    if (!event) {
      if (person.generalRegisteredAt) return { volunteerId: person.id, reference: person.id, status: "general" as const, alreadyRegistered: true, messageIds: [] as string[] };
      await people.updateOne({ id: person.id }, { $set: { generalRegisteredAt: now } }, { session });
      const messageIds = await queueVolunteerMessages(person, undefined, undefined, session);
      return { volunteerId: person.id, reference: person.id, status: "general" as const, alreadyRegistered: false, messageIds };
    }
    const signups = await getCollection("volunteerSignups");
    const existing = await signups.findOne({ eventId: event.id, volunteerId: person.id }, { session });
    const promotedMessages = await promoteWaiting(event, session);
    if (existing && existing.status !== "cancelled") {
      const current = await signups.findOne({ id: existing.id }, { session });
      return { volunteerId: person.id, reference: existing.id, status: current!.status, alreadyRegistered: true, messageIds: promotedMessages };
    }
    const count = await signups.countDocuments({ eventId: event.id, status: "confirmed" }, { session });
    // Existing waiters get first refusal, including when a cap increase needs
    // more than one reconciliation batch. New arrivals cannot skip the queue.
    const queued = await signups.countDocuments({ eventId: event.id, status: "waitlisted" }, { session });
    const status = queued > 0 || (event.volunteerCap != null && count >= event.volunteerCap) ? "waitlisted" as const : "confirmed" as const;
    const record: VolunteerSignup = { id: existing?.id ?? nanoid(), volunteerId: person.id, eventId: event.id, status, registeredAt: now, queueOrder: event.volunteerRevision, updatedAt: now };
    if (existing) await signups.updateOne({ id: existing.id }, { $set: record }, { session });
    else await signups.insertOne(record, { session });
    const messageIds = [...promotedMessages, ...await queueVolunteerMessages(person, record, event, session)];
    return { volunteerId: person.id, reference: record.id, status, alreadyRegistered: false, messageIds };
  });
}

export async function reconcileVolunteerEvent(eventId: string) {
  return volunteerTransaction(async session => promoteWaiting(await lockEvent(eventId, session), session));
}

export async function cancelVolunteerSignup(signupId: string) {
  return volunteerTransaction(async session => {
    const signups = await getCollection("volunteerSignups");
    const original = await signups.findOne({ id: signupId }, { session });
    if (!original) throw new VolunteerError("Volunteer sign-up not found.", 404);
    const event = await lockEvent(original.eventId, session);
    const record = await signups.findOne({ id: signupId }, { session });
    if (!record || record.status === "cancelled") return [] as string[];
    const person = await (await getCollection("volunteers")).findOne({ id: record.volunteerId }, { session });
    const cancelled: VolunteerSignup = { ...record, status: "cancelled", updatedAt: new Date().toISOString() };
    await signups.updateOne({ id: signupId }, { $set: { status: "cancelled", updatedAt: cancelled.updatedAt } }, { session });
    const messages = person ? await queueVolunteerMessages(person, cancelled, event, session) : [];
    return [...messages, ...await promoteWaiting(event, session)];
  });
}
