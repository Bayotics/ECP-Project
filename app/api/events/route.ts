import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { CreateEventInput, Event } from "@/lib/models";
import { validateRegistration } from "@/lib/event-registration";
import { validateEventListings } from "@/lib/event-platform-links";
import { validateVolunteerCap } from "@/lib/volunteer-cap";
import { validateVolunteerLeads, publicVolunteerEvent } from "@/lib/server/event-volunteer-leads";
import { getRequestSession } from "@/lib/server/guards";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

/* A registration link is only useful if a browser can open it, and a bare
   "example.com" silently resolves against our own domain. */
export function validateHttpUrl(value: string | undefined, field: string): string | null {
  if (value !== undefined && typeof value !== "string") return `${field} must be a URL`;
  if (!value?.trim()) return null;
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return `${field} must be a full URL, including https://`;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return `${field} must start with http:// or https://`;
  }
  return null;
}

function validateCreateEvent(input: Partial<CreateEventInput>): string | null {
  if (!input.title?.trim()) return "Event title is required";
  if (!input.slug?.trim()) return "Event slug is required";
  if (!input.description?.trim()) return "Event description is required";
  if (!input.date?.trim()) return "Event date is required";
  if (!input.location?.trim()) return "Event location is required";
  if (!input.organizerId?.trim()) return "Organizer ID is required";
  if (!input.organizerName?.trim()) return "Organizer name is required";
  if (!input.type) return "Event type is required";
  if (!input.status) return "Event status is required";
  if (!Array.isArray(input.tags)) return "Event tags must be an array";
  if (typeof input.registrationRequired !== "boolean") return "registrationRequired must be a boolean";
  if (typeof input.isFeatured !== "boolean") return "isFeatured must be a boolean";
  if (typeof input.isPublic !== "boolean") return "isPublic must be a boolean";
  if (typeof input.isOnline !== "boolean") return "isOnline must be a boolean";
  if (typeof input.membersOnly !== "boolean") return "membersOnly must be a boolean";

  const urlError =
    validateRegistration(input as CreateEventInput) ??
    validateHttpUrl(input.registrationUrl, "Registration link") ??
    validateHttpUrl(input.meetingUrl, "Meeting link");
  if (urlError) return urlError;

  return null;
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("events");
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const featured = searchParams.get("featured");
    const isPublic = searchParams.get("public");
    const upcoming = searchParams.get("upcoming");
    const membersOnly = searchParams.get("membersOnly");
    const limit = Number(searchParams.get("limit") ?? "0");

    const filter: Filter<Event> = {};

    if (status) filter.status = status as Event["status"];
    if (type) filter.type = type as Event["type"];
    if (featured === "true") filter.isFeatured = true;
    if (isPublic === "true") filter.isPublic = true;
    if (membersOnly === "true") filter.membersOnly = true;
    if (membersOnly === "false") filter.membersOnly = { $ne: true };
    if (upcoming === "true") filter.date = { $gte: new Date().toISOString() };

    const cursor = collection.find(filter).sort({ date: 1, createdAt: -1 });
    if (Number.isFinite(limit) && limit > 0) {
      cursor.limit(limit);
    }

    const events = serializeDocuments(await cursor.toArray());
    const viewer = await getRequestSession(request);
    return NextResponse.json({ ok: true, data: events.map(event => publicVolunteerEvent(event, Boolean(viewer && ["admin", "super-admin"].includes(viewer.role)))) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch events";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) {
    return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  }
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateEventInput>;
    const validationError = validateCreateEvent(payload);

    if (validationError) {
      return badRequest(validationError);
    }
    const listings = validateEventListings(payload);
    if ("error" in listings) return badRequest(listings.error);
    const capError = validateVolunteerCap(payload.volunteerCap);
    if (capError) return badRequest(capError);
    const leadError = await validateVolunteerLeads(payload.volunteerLeadIds);
    if (leadError) return badRequest(leadError);

    const collection = await getCollection("events");
    const now = new Date().toISOString();

    const event: Event = {
      ...listings.fields,
      id: nanoid(),
      title: payload.title!.trim(),
      slug: payload.slug!.trim(),
      description: payload.description!.trim(),
      shortDescription: payload.shortDescription?.trim(),
      date: payload.date!,
      endDate: payload.endDate,
      time: payload.time,
      endTime: payload.endTime,
      location: payload.location!.trim(),
      venue: payload.venue?.trim(),
      isOnline: payload.isOnline!,
      meetingUrl: payload.meetingUrl,
      type: payload.type!,
      status: payload.status!,
      imageUrl: payload.imageUrl,
      maxAttendees: payload.maxAttendees,
      volunteerCap: payload.volunteerCap,
      volunteerLeadIds: payload.volunteerLeadIds,
      imageAlt: payload.imageAlt?.trim(),
      registrationRequired: payload.registrationRequired!,
      registrationMode: payload.registrationRequired ? payload.registrationMode : undefined,
      registrationDeadline: payload.registrationDeadline,
      registrationUrl: payload.registrationRequired && payload.registrationMode === "link" ? payload.registrationUrl?.trim() : "",
      programId: payload.programId,
      dayIsProvisional: payload.dayIsProvisional,
      organizerId: payload.organizerId!.trim(),
      organizerName: payload.organizerName!.trim(),
      tags: payload.tags!,
      isFeatured: payload.isFeatured!,
      isPublic: payload.isPublic!,
      membersOnly: payload.membersOnly!,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(event);
    return NextResponse.json({ ok: true, data: event }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
