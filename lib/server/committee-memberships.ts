import type { ClientSession, Filter } from "mongodb";
import { nanoid } from "nanoid";
import type { Committee, CommitteeMemberProfile, CommitteeMembershipChange, User, Volunteer } from "@/lib/models";
import { getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { VolunteerError } from "@/lib/server/volunteer-error";
import { queueCommitteeChange } from "@/lib/server/committee-notifications";
import { publicCommittee } from "@/lib/public-committees";

export interface CommitteePerson {
  userId?: string;
  volunteerId?: string;
  name: string;
  email: string;
  role: "Member" | "Volunteer";
}

/** Resolve both identities so joining as a member and as a volunteer uses one place. */
export async function committeePerson(user: User | null, volunteer: Volunteer | null): Promise<CommitteePerson | null> {
  const users = await getCollection("users"), people = await getCollection("volunteers");
  if (user && ["member", "admin", "super-admin"].includes(user.role) && user.emailVerified !== false) {
    const matches = await people.find({ $or: [{ userId: user.id }, { email: user.email.trim().toLowerCase() }] }, { collation: { locale: "en", strength: 2 } }).toArray();
    if (matches.length > 1 || matches.some(row => row.userId && row.userId !== user.id)) throw new VolunteerError("Your member and volunteer records need to be reconciled by a club administrator.", 409);
    return { userId: user.id, ...(matches[0] ? { volunteerId: matches[0].id } : {}), name: user.displayName, email: user.email, role: "Member" };
  }
  if (!volunteer) return null;
  const linked = volunteer.userId
    ? await users.findOne({ id: volunteer.userId })
    : await users.findOne({ email: volunteer.email }, { collation: { locale: "en", strength: 2 } });
  return { volunteerId: volunteer.id, ...(linked && ["member", "admin", "super-admin"].includes(linked.role) ? { userId: linked.id } : {}), name: volunteer.name, email: volunteer.email, role: "Volunteer" };
}

export const belongsTo = (member: CommitteeMemberProfile, person: CommitteePerson) => Boolean(
  (person.userId && member.userId === person.userId) || (person.volunteerId && member.volunteerId === person.volunteerId)
);
const identities = (person: CommitteePerson) => [
  ...(person.userId ? [{ userId: person.userId }] : []),
  ...(person.volunteerId ? [{ volunteerId: person.volunteerId }] : []),
];

export async function readCommitteeMemberships(person: CommitteePerson) {
  // Include closed committees the person already belongs to, so leaving is always possible.
  const roster: Filter<Committee> = { $or: [
    { status: "active" },
    ...(person.userId ? [{ "members.userId": person.userId }] : []),
    ...(person.volunteerId ? [{ "members.volunteerId": person.volunteerId }] : []),
  ] };
  const committees = await (await getCollection("committees")).find(roster).sort({ name: 1 }).toArray();
  const history = await (await getCollection("committeeMembershipChanges")).find({ $or: identities(person) }).sort({ at: -1, id: -1 }).limit(50).toArray();
  return { name: person.name, committees: committees.map(committee => {
    const member = (committee.members ?? []).find(row => belongsTo(row, person));
    return { ...publicCommittee(committee), status: committee.status, role: member?.role ?? person.role, joined: Boolean(member), joinedAt: member?.joinedCommitteeAt ?? null };
  }), history: history.map(({ id, committeeId, committeeName, action, status, role, at }) => ({ id, committeeId, committeeName, action, status, role, at })) };
}

export async function changeCommitteeMembership(person: CommitteePerson, committeeId: string, action: "join" | "leave") {
  return volunteerTransaction(async session => {
    const collection = await getCollection("committees");
    const committee = await collection.findOne({ id: committeeId }, { session });
    if (!committee) throw new VolunteerError("Committee not found.", 404);
    if (action === "join" && committee.status !== "active") throw new VolunteerError("This committee is not accepting new participants.", 409);
    const members = committee.members ?? [];
    const existing = members.find(member => belongsTo(member, person));
    if (Boolean(existing) === (action === "join")) return { unchanged: true, messageIds: [] as string[] };
    const at = new Date().toISOString(), role = existing?.role ?? person.role;
    const identity = { ...(person.userId ? { userId: person.userId } : {}), ...(person.volunteerId ? { volunteerId: person.volunteerId } : {}) };
    const next = members.filter(member => !belongsTo(member, person));
    if (action === "join") next.push({ ...identity, name: person.name, role, isChairperson: false, isViceChair: false, joinedCommitteeAt: at });
    // This document write serializes simultaneous joins/leaves. A retry re-reads its roster.
    await collection.updateOne({ id: committeeId }, { $set: { members: next, updatedAt: at } }, { session });
    if (person.volunteerId) {
      await (await getCollection("volunteers")).updateOne({ id: person.volunteerId }, {
        $set: { updatedAt: at, ...(person.userId ? { userId: person.userId } : {}) },
        ...(action === "join" ? { $addToSet: { committeeIds: committeeId } } : { $pull: { committeeIds: committeeId } }),
      }, { session });
    }
    const membershipCollection = await getCollection("committeeMemberships");
    const previous = await membershipCollection.findOne({ committeeId, $or: identities(person) }, { session });
    await membershipCollection.updateOne(previous ? { id: previous.id } : { committeeId, $or: identities(person) }, {
      $set: { committeeId, ...identity, status: action === "join" ? "active" : "left", role, updatedAt: at, joinedAt: action === "join" ? at : previous?.joinedAt ?? existing?.joinedCommitteeAt ?? at },
      $setOnInsert: { id: nanoid() },
    }, { session, upsert: true });
    const change: CommitteeMembershipChange = { id: nanoid(), committeeId, committeeName: committee.name, ...identity, name: person.name, action, status: action === "join" ? "active" : "left", role, at };
    await (await getCollection("committeeMembershipChanges")).insertOne(change, { session });
    // Retire obsolete approval requests so the previous admin queue cannot add someone back later.
    if (person.userId) await (await getCollection("committeeJoinRequests")).updateMany({ committeeId, userId: person.userId, status: "pending" }, { $set: { status: "rejected", reviewedAt: at, reviewedBy: "replaced-by-self-service" } }, { session });
    return { unchanged: false, messageIds: await queueCommitteeChange(person, committee, change, session) };
  });
}

export async function committeeLeadEmails(committee: Committee, session: ClientSession) {
  const leaders = (committee.members ?? []).filter(member => member.isChairperson || member.isViceChair);
  const users = await (await getCollection("users")).find({ id: { $in: leaders.flatMap(member => member.userId ? [member.userId] : []) }, status: "active" }, { session }).toArray();
  const volunteers = await (await getCollection("volunteers")).find({ id: { $in: leaders.flatMap(member => member.volunteerId ? [member.volunteerId] : []) } }, { session }).toArray();
  return [...new Set([...users.map(user => user.email), ...volunteers.map(person => person.email), ...leaders.flatMap(member => (member.socialLinks ?? []).filter(link => link.platform === "email").map(link => link.url.replace(/^mailto:/i, "")))].map(email => email.trim().toLowerCase()).filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))];
}
