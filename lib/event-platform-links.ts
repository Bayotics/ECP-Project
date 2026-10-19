import type { Event, EventPlatformLink } from "@/lib/models/event";

type ListingFields = Pick<Event, "eventbriteUrl" | "partifulUrl" | "otherPlatformLinks">;
export interface EventListingForm {
  eventbriteUrl: string;
  partifulUrl: string;
  otherPlatformLinks: EventPlatformLink[];
}

export function eventListingForm(event: ListingFields = {}): EventListingForm {
  return { eventbriteUrl: event.eventbriteUrl ?? "", partifulUrl: event.partifulUrl ?? "", otherPlatformLinks: (event.otherPlatformLinks ?? []).map(link => ({ ...link })) };
}

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

/** Only supplied fields are returned so partial event updates preserve other listings. */
export function validateEventListings(input: ListingFields): { fields: ListingFields } | { error: string } {
  const fields: ListingFields = {};
  for (const [key, name] of [["eventbriteUrl", "Eventbrite"], ["partifulUrl", "Partiful"]] as const) {
    if (!(key in input)) continue;
    const value = input[key];
    if (typeof value !== "string") return { error: `${name} link must be a URL or an empty string.` };
    if (!value.trim()) { fields[key] = ""; continue; }
    const url = safeUrl(value);
    if (!url) return { error: `${name} link must be a full http:// or https:// URL without sign-in credentials (up to 2,048 characters).` };
    fields[key] = url;
  }
  if ("otherPlatformLinks" in input) {
    if (!Array.isArray(input.otherPlatformLinks) || input.otherPlatformLinks.length > 8) return { error: "Add up to eight other platform links." };
    const links: EventPlatformLink[] = [];
    for (const link of input.otherPlatformLinks) {
      if (!link || typeof link.name !== "string" || typeof link.url !== "string") return { error: "Each other platform needs a name and a link." };
      if (!link.name.trim() && !link.url.trim()) continue;
      if (!link.name.trim() || link.name.trim().length > 60) return { error: "Enter a platform name of 1–60 characters for every other link." };
      const url = safeUrl(link.url);
      if (!url) return { error: `The link for ${link.name.trim()} must be a full http:// or https:// URL without sign-in credentials (up to 2,048 characters).` };
      links.push({ name: link.name.trim(), url });
    }
    fields.otherPlatformLinks = links;
  }
  return { fields };
}

/** Old records have no listing fields; unsafe or incomplete stored links stay hidden. */
export function getEventPlatformLinks(event: ListingFields): EventPlatformLink[] {
  const candidates: EventPlatformLink[] = [
    { name: "Eventbrite", url: event.eventbriteUrl ?? "" },
    { name: "Partiful", url: event.partifulUrl ?? "" },
    ...(Array.isArray(event.otherPlatformLinks) ? event.otherPlatformLinks : []),
  ];
  return candidates.flatMap(link => {
    const url = safeUrl(link?.url);
    return url && typeof link?.name === "string" && link.name.trim() ? [{ name: link.name.trim(), url }] : [];
  });
}
