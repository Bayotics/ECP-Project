import type { Event } from "@/lib/models/event";
import type { RSVP } from "@/lib/models/rsvp";
import { CLUB_TIME_ZONE, clubWallTimeToInstant } from "@/lib/club-time";
import { registrationMode } from "@/lib/event-registration";

export const EVENT_SUMMARY_WINDOW_DAYS = 90;
export type ActivityEvent = Pick<Event, "id" | "slug" | "title" | "date" | "time" | "type" | "status" | "isPublic" | "membersOnly" | "registrationRequired" | "registrationMode" | "registrationUrl" | "registrationDeadline" | "maxAttendees" | "dayIsProvisional">;
export type VolunteerRegistration = Pick<RSVP, "eventId" | "email" | "userId" | "status" | "registeredAt" | "guestCount">;
export interface EventSummary {
  upcomingEventCount: number;
  openVolunteerOpportunities: number;
  activeCommittees: number;
  volunteersSignedUpThisYear: number;
  calendarYear: number;
  windowDays: number;
  windowStart: string;
  windowEnd: string;
  generatedAt: string;
  upcomingEvents: Array<Pick<ActivityEvent, "id" | "slug" | "title" | "date" | "dayIsProvisional">>;
}

export function clubCalendarDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: CLUB_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (name: string) => parts.find(item => item.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isCalendarDate(value: string): boolean {
  // Existing calendar seeds store a date at UTC midnight and keep the local
  // scheduled time separately. Preserve the date instead of shifting it a day.
  return /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/.test(value);
}

function startOfEvent(event: ActivityEvent): number {
  if (!isCalendarDate(event.date)) return Date.parse(event.date);
  const date = event.date.slice(0, 10);
  const parsed = new Date(`${date}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return NaN;
  // A date without a scheduled time stays upcoming until the end of that club day.
  const instant = clubWallTimeToInstant(date, event.time || "23:59")?.getTime() ?? NaN;
  return event.time ? instant : instant + 59_999;
}

export function calculateEventSummary(events: readonly ActivityEvent[], registrations: readonly VolunteerRegistration[], activeCommittees: number, now: Date): EventSummary {
  const windowStart = clubCalendarDate(now);
  const endDay = new Date(`${windowStart}T12:00:00Z`);
  endDay.setUTCDate(endDay.getUTCDate() + EVENT_SUMMARY_WINDOW_DAYS);
  const windowEnd = endDay.toISOString().slice(0, 10);
  const end = clubWallTimeToInstant(windowEnd, "00:00")!.getTime();
  const instant = now.getTime();
  const calendarYear = Number(windowStart.slice(0, 4));
  const yearStart = clubWallTimeToInstant(`${calendarYear}-01-01`, "00:00")!.getTime();
  const upcoming = events.filter(event => event.status === "published" && event.isPublic && !event.membersOnly && startOfEvent(event) >= instant && startOfEvent(event) < end)
    .sort((a, b) => startOfEvent(a) - startOfEvent(b) || a.id.localeCompare(b.id));
  const volunteerIds = new Set(events.filter(event => event.type === "volunteer" && ["published", "completed"].includes(event.status)).map(event => event.id));
  const confirmed = registrations.filter(row => row.status === "confirmed" && volunteerIds.has(row.eventId));
  const attending = new Map<string, number>();
  for (const row of confirmed) attending.set(row.eventId, (attending.get(row.eventId) ?? 0) + 1 + Math.max(0, row.guestCount ?? 0));
  const openVolunteerOpportunities = events.filter(event => {
    if (event.status !== "published" || event.type !== "volunteer" || !event.isPublic || event.membersOnly || startOfEvent(event) < instant || !Number.isFinite(startOfEvent(event)) || !registrationMode(event)) return false;
    if (event.registrationDeadline) {
      const deadline = /^\d{4}-\d{2}-\d{2}$/.test(event.registrationDeadline)
        ? (clubWallTimeToInstant(event.registrationDeadline, "23:59")?.getTime() ?? NaN) + 59_999
        : Date.parse(event.registrationDeadline);
      if (!Number.isFinite(deadline) || deadline < instant) return false;
    }
    return event.maxAttendees == null || (attending.get(event.id) ?? 0) < event.maxAttendees;
  }).length;
  const thisYear = confirmed.filter(row => Date.parse(row.registeredAt) >= yearStart && Date.parse(row.registeredAt) <= instant);
  // Link guest signups to signed-in signups sharing the same address, and count
  // a member once even if their email changed between volunteer events.
  const emailUsers = new Map<string, string>();
  for (const row of thisYear) if (row.userId && row.email?.trim()) emailUsers.set(row.email.trim().toLowerCase(), row.userId);
  const volunteers = new Set<string>();
  for (const row of thisYear) {
    const email = row.email?.trim().toLowerCase();
    const user = row.userId || (email ? emailUsers.get(email) : undefined);
    if (user) volunteers.add(`user:${user}`); else if (email) volunteers.add(`email:${email}`);
  }
  return {
    upcomingEventCount: upcoming.length, openVolunteerOpportunities, activeCommittees,
    volunteersSignedUpThisYear: volunteers.size, calendarYear,
    windowDays: EVENT_SUMMARY_WINDOW_DAYS, windowStart, windowEnd, generatedAt: now.toISOString(),
    upcomingEvents: upcoming.slice(0, 5).map(({ id, slug, title, date, dayIsProvisional }) => ({ id, slug, title, date, dayIsProvisional })),
  };
}

export function formatSummaryEventDate(event: EventSummary["upcomingEvents"][number]): string {
  const date = new Date(isCalendarDate(event.date) ? `${event.date.slice(0, 10)}T12:00:00Z` : event.date);
  const label = new Intl.DateTimeFormat("en-US", { timeZone: CLUB_TIME_ZONE, month: "short", ...(event.dayIsProvisional ? {} : { day: "numeric" }), year: "numeric" }).format(date);
  return event.dayIsProvisional ? `${label} · day to be confirmed` : label;
}
