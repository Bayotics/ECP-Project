import { getCollection } from "@/lib/server/collections";
import { calculateEventSummary, type ActivityEvent } from "@/lib/event-summary";
import { withVolunteerSummary } from "@/lib/volunteer-summary";
import type { Volunteer, VolunteerSignup } from "@/lib/models/volunteer";

export async function getEventSummary(now = new Date()) {
  const [eventsCollection, committeesCollection] = await Promise.all([getCollection("events"), getCollection("committees")]);
  const [events, activeCommittees] = await Promise.all([
    eventsCollection.find({ status: { $in: ["published", "completed"] } }).project<ActivityEvent & { endDate?: string; volunteerCap?: number | null }>({ _id: 0, id: 1, slug: 1, title: 1, date: 1, endDate: 1, volunteerCap: 1, time: 1, type: 1, status: 1, isPublic: 1, membersOnly: 1, registrationRequired: 1, registrationMode: 1, registrationUrl: 1, registrationDeadline: 1, maxAttendees: 1, dayIsProvisional: 1 }).toArray(),
    committeesCollection.countDocuments({ status: "active" }),
  ]);
  const [people, signups] = await Promise.all([
    (await getCollection("volunteers")).find({}).project<Pick<Volunteer, "id" | "generalRegisteredAt">>({ _id: 0, id: 1, generalRegisteredAt: 1 }).toArray(),
    (await getCollection("volunteerSignups")).find({ status: { $ne: "cancelled" } }).project<Pick<VolunteerSignup, "volunteerId" | "eventId" | "status" | "registeredAt">>({ _id: 0, volunteerId: 1, eventId: 1, status: 1, registeredAt: 1 }).toArray(),
  ]);
  return withVolunteerSummary(calculateEventSummary(events, [], activeCommittees, now), events, people, signups, now);
}
