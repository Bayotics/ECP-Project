export const VOLUNTEER_SOURCES = ["website", "eventbrite", "partiful", "other"] as const;
export type VolunteerSource = typeof VOLUNTEER_SOURCES[number];
export const VOLUNTEER_SOURCE_LABELS: Record<VolunteerSource, string> = { website: "Website", eventbrite: "Eventbrite", partiful: "Partiful", other: "Other" };
export function volunteerSource(value: unknown): VolunteerSource | null {
  return typeof value === "string" && VOLUNTEER_SOURCES.includes(value.toLowerCase() as VolunteerSource) ? value.toLowerCase() as VolunteerSource : null;
}
