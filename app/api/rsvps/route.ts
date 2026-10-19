import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guards";
import type { Filter } from "mongodb";
import type { CreateRSVPInput, RSVP } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument, serializeDocuments } from "@/lib/server/collections";
import { sendRSVPConfirmation } from "@/lib/server/notifications";
import { getSessionUser } from "@/lib/server/session";
import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { registrationMode } from "@/lib/event-registration";

const duplicateMessage = "This email address is already registered for this event. Please check your confirmation email or contact the club if you need to change your registration.";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;

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
    if (session!.role !== "admin" && session!.role !== "super-admin") {
      filter.$or = [{ userId: session!.sub }, { email: session!.email.trim().toLowerCase() }];
    }

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

    if (typeof payload.eventId !== "string" || !payload.eventId.trim()) return badRequest("Event ID is required");
    if (typeof payload.name !== "string" || !payload.name.trim()) return badRequest("Name is required");
    if (typeof payload.email !== "string" || !payload.email.trim()) return badRequest("Email is required");
    const email = payload.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return badRequest("Please enter a valid email address.");
    if (payload.name.trim().length < 2 || payload.name.length > 150) return badRequest("Name must be between 2 and 150 characters.");
    if (payload.guestCount !== undefined && (!Number.isInteger(payload.guestCount) || payload.guestCount < 0 || payload.guestCount > 9)) return badRequest("Additional guests must be between 0 and 9.");
    if (payload.notes !== undefined && (typeof payload.notes !== "string" || payload.notes.length > 500)) return badRequest("Notes must be under 500 characters.");
    if (payload.phone !== undefined && (typeof payload.phone !== "string" || payload.phone.length > 30)) return badRequest("Please enter a valid phone number.");
    const verification = await verifyRecaptcha(payload.recaptchaToken);
    if (!verification.ok) return NextResponse.json({ ok: false, error: verification.error }, { status: verification.status });

    // Validate members-only restriction
    const eventsCollection = await getCollection("events");
    const event = serializeDocument(await eventsCollection.findOne({ id: payload.eventId.trim() }));
    if (!event) return badRequest("Event not found");
    if (event.status !== "published") return badRequest("Registration is not open for this event.");
    if (registrationMode(event) !== "form") return badRequest("This event does not accept registrations through the club's form. Use the event's registration link if one is provided.");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    if ((event.endDate || event.date).slice(0, 10) < today) return badRequest("This event has already taken place.");
    if (event.registrationDeadline && (event.registrationDeadline.length === 10 ? event.registrationDeadline < today : new Date(event.registrationDeadline).getTime() < Date.now())) return badRequest("The registration deadline for this event has passed.");
    const sessionUser = await getSessionUser(request);

    if (event.membersOnly) {
      const isMember = sessionUser && (sessionUser.role === "member" || sessionUser.role === "admin" || sessionUser.role === "super-admin");
      if (!isMember) {
        return NextResponse.json(
          { ok: false, error: "This event is for members only. Please log in with a member account to register." },
          { status: 403 }
        );
      }
    }

    const collection = await getCollection("rsvps");
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const duplicate = await collection.findOne({ eventId: event.id, email: { $regex: `^${escapedEmail}$`, $options: "i" }, status: { $ne: "cancelled" } });
    if (duplicate) {
      return NextResponse.json({ ok: false, error: duplicateMessage }, { status: 409 });
    }
    if (event.maxAttendees != null) {
      const existing = await collection.find({ eventId: event.id, status: "confirmed" }).project({ guestCount: 1 }).toArray();
      const attending = existing.reduce((total, row) => total + 1 + Math.max(0, row.guestCount ?? 0), 0);
      if (attending + 1 + (payload.guestCount ?? 0) > event.maxAttendees) {
        return badRequest(attending >= event.maxAttendees ? "This event is fully booked." : "There are not enough spaces for you and your additional guests. Please reduce the guest count or contact the club.");
      }
    }

    const rsvp: RSVP = {
      id: nanoid(),
      eventId: payload.eventId.trim(),
      userId: sessionUser?.id,
      name: payload.name.trim(),
      email,
      phone: payload.phone,
      status: "confirmed",
      guestCount: payload.guestCount,
      notes: payload.notes,
      registeredAt: new Date().toISOString(),
      registrationKey: `${event.id}:${email}`,
    };

    await collection.insertOne(rsvp);

    // Await delivery attempts so a serverless invocation cannot drop the messages.
    try {
      const result = await sendRSVPConfirmation(rsvp, event);
      rsvp.confirmationEmailSent = result.confirmationEmailSent;
      if (!result.confirmationEmailSent || result.adminEmailsFailed) console.error("[RSVP] Some registration emails could not be sent", { rsvpId: rsvp.id, ...result });
    } catch (error) {
      console.error("[RSVP] Email notification failed", error);
      rsvp.confirmationEmailSent = false;
    }

    return NextResponse.json({ ok: true, data: rsvp }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ ok: false, error: duplicateMessage }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Failed to create RSVP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
