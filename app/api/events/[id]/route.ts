import { NextRequest, NextResponse } from "next/server";
import type { UpdateEventInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { validateHttpUrl } from "@/app/api/events/route";
import { validateRegistration } from "@/lib/event-registration";
import { validateEventListings } from "@/lib/event-platform-links";
import { validateVolunteerCap } from "@/lib/volunteer-cap";
import { validateVolunteerLeads, publicVolunteerEvent } from "@/lib/server/event-volunteer-leads";
import { reconcileVolunteerEvent } from "@/lib/server/volunteers";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";
import { getRequestSession } from "@/lib/server/guards";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("events");
    const event = serializeDocument(await collection.findOne({ $or: [{ id }, { slug: id }] }));

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    const viewer = await getRequestSession(request);
    return NextResponse.json({ ok: true, data: publicVolunteerEvent(event, Boolean(viewer && ["admin", "super-admin"].includes(viewer.role))) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) {
    return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  }
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateEventInput;
    const listings = validateEventListings(payload);
    if ("error" in listings) return NextResponse.json({ ok: false, error: listings.error }, { status: 400 });
    const capError = validateVolunteerCap(payload.volunteerCap);
    if (capError) return NextResponse.json({ ok: false, error: capError }, { status: 400 });
    const leadError = await validateVolunteerLeads(payload.volunteerLeadIds);
    if (leadError) return NextResponse.json({ ok: false, error: leadError }, { status: 400 });

    const urlError =
      validateHttpUrl(payload.registrationUrl, "Registration link") ??
      validateHttpUrl(payload.meetingUrl, "Meeting link");
    if (urlError) return NextResponse.json({ ok: false, error: urlError }, { status: 400 });

    const collection = await getCollection("events");
    const existing = await collection.findOne({ $or: [{ id }, { slug: id }] });
    if (!existing) return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    const registrationChanged = ["registrationRequired", "registrationMode", "registrationUrl"].some(key => key in payload);
    const merged = { ...existing, ...payload };
    if (registrationChanged) {
      const error = validateRegistration(merged);
      if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
    }
    const patch: UpdateEventInput = {
      ...payload,
      ...listings.fields,
      updatedAt: new Date().toISOString(),
    };
    if (registrationChanged && (!merged.registrationRequired || merged.registrationMode !== "link")) patch.registrationUrl = "";

    const result = await collection.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      { $set: patch },
      { returnDocument: "after" }
    );

    const event = serializeDocument(result);
    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    if ("volunteerCap" in payload || "status" in payload) {
      try { await deliverVolunteerMessages(await reconcileVolunteerEvent(event.id)); }
      catch (error) { console.error("[volunteers] Event saved; scheduled reconciliation will retry", error); }
    }

    return NextResponse.json({ ok: true, data: event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) {
    return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  }
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("events");
    const result = await collection.deleteOne({ $or: [{ id }, { slug: id }] });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
