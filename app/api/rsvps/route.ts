import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { CreateRSVPInput, RSVP } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("rsvps");
    const params = request.nextUrl.searchParams;
    const filter: Filter<RSVP> = {};

    const eventId = params.get("eventId");
    const userId = params.get("userId");
    const status = params.get("status");
    const email = params.get("email");

    if (eventId) filter.eventId = eventId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status as RSVP["status"];
    if (email) filter.email = email.trim().toLowerCase();

    const rsvps = serializeDocuments(await collection.find(filter).sort({ registeredAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: rsvps });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch RSVPs";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateRSVPInput>;

    if (!payload.eventId?.trim()) return badRequest("Event ID is required");
    if (!payload.name?.trim()) return badRequest("Name is required");
    if (!payload.email?.trim()) return badRequest("Email is required");

    const collection = await getCollection("rsvps");
    const email = payload.email.trim().toLowerCase();
    const duplicate = await collection.findOne({ eventId: payload.eventId.trim(), email, status: { $ne: "cancelled" } });
    if (duplicate) {
      return NextResponse.json({ ok: false, error: "You have already RSVP'd for this event" }, { status: 409 });
    }

    const rsvp: RSVP = {
      id: nanoid(),
      eventId: payload.eventId.trim(),
      userId: payload.userId,
      name: payload.name.trim(),
      email,
      phone: payload.phone,
      status: "confirmed",
      guestCount: payload.guestCount,
      notes: payload.notes,
      registeredAt: new Date().toISOString(),
    };

    await collection.insertOne(rsvp);
    return NextResponse.json({ ok: true, data: rsvp }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create RSVP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
