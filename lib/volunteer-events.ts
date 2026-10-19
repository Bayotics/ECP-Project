import type { Event } from "@/lib/models/event";
import { clubCalendarDate } from "@/lib/event-summary";

export function volunteerEventClosedReason(event: Pick<Event, "status" | "date" | "endDate">, now = new Date()): string | null {
  if (event.status !== "published") return "This event is not accepting volunteer sign-ups.";
  const date = (event.endDate || event.date).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) return "This event’s date needs to be confirmed by the club.";
  if (date < clubCalendarDate(now)) return "This event has already taken place.";
  return null;
}
