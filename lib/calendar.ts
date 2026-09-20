import type { Event } from "@/lib/models/event";

/* "Add to Google Calendar" links.
 *
 * An event stores its day in `date` (an ISO instant at UTC midnight) and its
 * clock time separately in `time` / `endTime` as the club would say it, in
 * Philadelphia. Reading the hours off `date` would put every event at
 * midnight, so the two are recombined here.
 *
 * Rather than convert to UTC, which would mean doing daylight saving by
 * hand, the link carries a floating local time plus `ctz`, and Google
 * resolves the offset for the date in question. A viewer in another
 * timezone still gets the correct moment.
 */

const CLUB_TIMEZONE = "America/New_York";

/** YYYYMMDD for the day part of an ISO instant, read in UTC. */
function dayStamp(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** "19:00" -> "190000". Anything unparseable falls back to the hour given. */
function timeStamp(time: string | undefined, fallbackHour: number): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time ?? "");
  if (!match) return `${String(fallbackHour).padStart(2, "0")}0000`;
  return `${match[1].padStart(2, "0")}${match[2]}00`;
}

/** Google wants the end of an all-day range to be the day after the last. */
function dayAfter(iso: string): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + 1);
  return dayStamp(d.toISOString());
}

export type CalendarEvent = Pick<
  Event,
  "title" | "date" | "location"
> &
  Partial<Pick<Event, "endDate" | "time" | "endTime" | "description" | "shortDescription" | "venue" | "slug">>;

/**
 * Builds the Google Calendar "create event" URL for an event.
 *
 * An event whose end is on a later day is treated as all-day, because a
 * drive that runs from November to January has no meaningful clock time.
 */
export function googleCalendarUrl(event: CalendarEvent, siteUrl?: string): string {
  const startDay = dayStamp(event.date);
  const endDay = event.endDate ? dayStamp(event.endDate) : startDay;
  const spansDays = endDay !== startDay;

  /* All-day ranges use bare days; a single day uses local times with ctz. */
  const dates = spansDays
    ? `${startDay}/${dayAfter(event.endDate as string)}`
    : `${startDay}T${timeStamp(event.time, 9)}/${startDay}T${timeStamp(event.endTime, 11)}`;

  const details = [
    event.description ?? event.shortDescription ?? "",
    siteUrl && event.slug ? `\n\nDetails: ${siteUrl}/events/${event.slug}` : "",
  ]
    .join("")
    .trim();

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates,
    location: event.venue ? `${event.venue}, ${event.location}` : event.location,
  });
  if (details) params.set("details", details);
  if (!spansDays) params.set("ctz", CLUB_TIMEZONE);

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
