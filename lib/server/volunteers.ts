import { validateVolunteerCommittees } from "@/lib/server/volunteer-profile";
import { nanoid } from "nanoid";
import type { ClientSession } from "mongodb";
import { createHash } from "crypto";
import type { VolunteerSource } from "@/lib/volunteer-sources";
import type { Event, VolunteerSignup } from "@/lib/models";
import type { VolunteerInput } from "@/lib/volunteer-input";
import { volunteerEventClosedReason } from "@/lib/volunteer-events";
import { getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { queueVolunteerWelcome } from "@/lib/server/volunteer-notifications";
import { queueVolunteerMessages } from "@/lib/server/volunteer-notifications";

import { VolunteerError } from "@/lib/server/volunteer-error";
export { VolunteerError } from "@/lib/server/volunteer-error";

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
    if (!person || person.status === "inactive") continue;
    const updated: VolunteerSignup = { ...record, status: "confirmed", updatedAt: new Date().toISOString() };
    await signups.updateOne({ id: record.id, status: "waitlisted" }, { $set: { status: "confirmed", updatedAt: updated.updatedAt } }, { session });
    messages.push(...await queueVolunteerMessages(person, updated, event, session));
  }
  return messages;
}

export async function registerVolunteer(input: VolunteerInput, memberAccess: boolean, context: { source?: VolunteerSource; imported?: boolean; externalId?: string } = {}) {
  const source = context.source ?? "website";
  const externalKey = context.imported && context.externalId ? createHash("sha256").update(JSON.stringify([source, input.eventId || "general", context.externalId])).digest("hex") : undefined;
  return volunteerTransaction(async session => {
    const event = input.eventId ? await lockEvent(input.eventId, session) : undefined;
    if (event) {
      const reason = volunteerEventClosedReason(event);
      if (reason) throw new VolunteerError(reason, 400);
      if ((event.membersOnly || !event.isPublic) && !memberAccess) throw new VolunteerError("Please log in with an active member account to volunteer for this members-only event.", 403);
    }
    const people = await getCollection("volunteers");
    const now = new Date().toISOString();
    const references = await getCollection("volunteerExternalRegistrations");
    if (externalKey) {
      const previous = await references.findOne({ id: externalKey }, { session });
      if (previous && previous.email !== input.email) throw new VolunteerError("This external registration belongs to a different email. Review it before importing.", 409);
    }
    const member = await (await getCollection("users")).findOne({email:input.email,role:{$in:["member","admin","super-admin"]}}, {session,collation:{locale:"en",strength:2}});
    const byEmail=await people.findOne({email:input.email},{session});
    const byMember=member?await people.findOne({userId:member.id},{session}):null;
    if(byEmail&&byMember&&byEmail.id!==byMember.id)throw new VolunteerError("This member has two existing volunteer identities. Contact the club to combine the records.",409);
    const old=byMember??byEmail;
    if (old?.userId && member && old.userId !== member.id) throw new VolunteerError("This email is linked to another volunteer identity. Contact the club to review the records.",409);
    await validateVolunteerCommittees(input.committeeIds,session,old?.committeeIds);
    const addedCommittees = (input.committeeIds ?? []).filter(id => !old?.committeeIds?.includes(id));
    const profile = {
      ...(input.firstName ? {firstName:input.firstName,lastName:input.lastName} : {}),
      city:input.city ?? "",zip:input.zip ?? "",availability:input.availability ?? "",heardAbout:input.heardAbout ?? "",
      committeeIds:input.committeeIds ?? [],interestAreas:input.interestAreas ?? [],
    };
    // Contact details and consent on an existing profile can only be changed
    // through its private link. A new committee selection records interest.
    if (old && addedCommittees.length) delete (profile as Partial<typeof profile>).committeeIds;
    const person = await people.findOneAndUpdate(old ? {id:old.id} : {email:input.email}, {
      $set: {updatedAt:now,source:old?.source ?? (old?"website":source),...(member?{userId:member.id}:{})},
      $addToSet: {sources:{$each:[...new Set([...(old?.sources ?? (old?[old.source??"website"]:[])),source])]},...(old&&addedCommittees.length?{committeeIds:{$each:addedCommittees}}:{})},
      $setOnInsert: {id:nanoid(),email:input.email,createdAt:now,name:input.name,phone:input.phone,interests:input.interests,notes:input.notes,opportunityEmails:context.imported?false:input.opportunityEmails===true,consentUpdatedAt:now,status:"active",...profile},
    }, {upsert:true,returnDocument:"after",session});
    if (!person) throw new Error("Volunteer upsert failed");
    if (externalKey) await references.updateOne({ id: externalKey }, { $setOnInsert: { id: externalKey, volunteerId: person.id, email: input.email, source, externalId: context.externalId!, ...(event ? { eventId: event.id } : {}), createdAt: now } }, { upsert: true, session });
    if (!old) await (await getCollection("volunteerChanges")).insertOne({id:nanoid(),volunteerId:person.id,action:"registered",at:now,emailConsent:person.opportunityEmails===true,changedFields:["profile","opportunityEmails"],toStatus:"active"},{session});
    const welcome: string[] = [];
    if(old&&addedCommittees.length) {
      await (await getCollection("volunteerChanges")).insertOne({id:nanoid(),volunteerId:person.id,action:"profile-updated",at:now,changedFields:["committeeIds"]},{session});
      if(event)welcome.push(...await queueVolunteerMessages(person,undefined,undefined,session));
    }
    if (context.imported && !person.importWelcomeQueuedAt) {
      welcome.push(...await queueVolunteerWelcome(person, session));
      await people.updateOne({ id: person.id }, { $set: { importWelcomeQueuedAt: now } }, { session });
    }
    if (!event) {
      if (person.generalRegisteredAt && !addedCommittees.length) return { volunteerId: person.id, reference: person.id, status: "general" as const, alreadyRegistered: true, messageIds: welcome };
      await people.updateOne({ id: person.id }, { $set: { generalRegisteredAt: person.generalRegisteredAt ?? now } }, { session });
      const messageIds = [...welcome, ...await queueVolunteerMessages(person, undefined, undefined, session)];
      return { volunteerId: person.id, reference: person.id, status: "general" as const, alreadyRegistered: Boolean(person.generalRegisteredAt), messageIds };
    }
    const signups = await getCollection("volunteerSignups");
    const existing = await signups.findOne({ eventId: event.id, volunteerId: person.id }, { session });
    const promotedMessages = await promoteWaiting(event, session);
    if (existing) await signups.updateOne({ id: existing.id }, { $set: { source: existing.source ?? "website" }, $addToSet: { sources: { $each: [existing.source ?? "website", source] } } }, { session });
    if (existing && (existing.status !== "cancelled" || context.imported)) {
      const current = await signups.findOne({ id: existing.id }, { session });
      return { volunteerId: person.id, reference: existing.id, status: current!.status, alreadyRegistered: true, messageIds: [...welcome, ...promotedMessages] };
    }
    const count = await signups.countDocuments({ eventId: event.id, status: "confirmed" }, { session });
    // Existing waiters get first refusal, including when a cap increase needs
    // more than one reconciliation batch. New arrivals cannot skip the queue.
    const queued = await signups.countDocuments({ eventId: event.id, status: "waitlisted" }, { session });
    const status = queued > 0 || (event.volunteerCap != null && count >= event.volunteerCap) ? "waitlisted" as const : "confirmed" as const;
    const record: VolunteerSignup = { id: existing?.id ?? nanoid(), volunteerId: person.id, eventId: event.id, status, registeredAt: now, queueOrder: event.volunteerRevision, updatedAt: now, source: existing?.source ?? source, sources: [...new Set([...(existing?.sources ?? (existing ? [existing.source ?? "website"] : [])), source])] };
    if (existing) await signups.updateOne({ id: existing.id }, { $set: record }, { session });
    else await signups.insertOne(record, { session });
    const messageIds = [...welcome, ...promotedMessages, ...await queueVolunteerMessages(person, record, event, session)];
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
