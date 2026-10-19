import type { EventSummary, ActivityEvent } from "@/lib/event-summary";
import type { Volunteer, VolunteerSignup } from "@/lib/models/volunteer";
import { volunteerEventClosedReason } from "@/lib/volunteer-events";
import { clubWallTimeToInstant } from "@/lib/club-time";

/** The volunteer table is the source of truth; attendee RSVPs don't reserve volunteer places. */
export function withVolunteerSummary(summary: EventSummary, events: Array<ActivityEvent & { endDate?: string; volunteerCap?: number | null }>, people: Array<Pick<Volunteer, "id" | "generalRegisteredAt">>, signups: Array<Pick<VolunteerSignup, "volunteerId" | "eventId" | "status" | "registeredAt">>, now: Date): EventSummary {
  const openVolunteerOpportunities = events.filter(event => {
    if (!event.isPublic || event.membersOnly || volunteerEventClosedReason(event, now)) return false;
    const confirmed = signups.filter(signup => signup.eventId === event.id && signup.status === "confirmed").length;
    return !signups.some(signup => signup.eventId === event.id && signup.status === "waitlisted") && (event.volunteerCap == null || confirmed < event.volunteerCap);
  }).length;
  const yearStart = clubWallTimeToInstant(`${summary.calendarYear}-01-01`, "00:00")!.getTime();
  const inYear = (value?: string) => Boolean(value && Date.parse(value) >= yearStart && Date.parse(value) <= now.getTime());
  const validEvents = new Set(events.filter(event => ["published", "completed"].includes(event.status)).map(event => event.id));
  const registered = new Set(signups.filter(signup => signup.status !== "cancelled" && validEvents.has(signup.eventId) && inYear(signup.registeredAt)).map(signup => signup.volunteerId));
  for (const person of people) if (inYear(person.generalRegisteredAt)) registered.add(person.id);
  return { ...summary, openVolunteerOpportunities, volunteersSignedUpThisYear: registered.size };
}
