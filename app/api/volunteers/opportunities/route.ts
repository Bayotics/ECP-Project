import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/server/collections";
import { getRequestSession } from "@/lib/server/guards";
import { volunteerEventClosedReason } from "@/lib/volunteer-events";
import type { VolunteerOpportunity } from "@/lib/models/volunteer";

export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("eventId") || "";
  if (id.length > 100) return NextResponse.json({ ok: false, error: "Invalid event." }, { status: 400 });
  try {
    const session = await getRequestSession(request);
    const member = Boolean(session && ["member", "admin", "super-admin"].includes(session.role));
    const [events, signups] = await Promise.all([getCollection("events"), getCollection("volunteerSignups")]);
    const rows = await events.find({ ...(id ? { id } : { status: "published" as const }), ...(!member ? { isPublic: true, membersOnly: { $ne: true } } : {}) }).sort({ date: 1 }).toArray();
    if (id && !rows.length) return NextResponse.json({ ok: false, error: "This event is unavailable. For members-only events, please log in with an active member account." }, { status: 404 });
    const active = id ? rows : rows.filter(event => !volunteerEventClosedReason(event));
    const counts = active.length ? await signups.aggregate<{ _id: string; confirmed: number; waiting: number }>([
      { $match: { eventId: { $in: active.map(event => event.id) }, status: { $in: ["confirmed", "waitlisted"] } } },
      { $group: { _id: "$eventId", confirmed: { $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] } }, waiting: { $sum: { $cond: [{ $eq: ["$status", "waitlisted"] }, 1, 0] } } } },
    ]).toArray() : [];
    const data: VolunteerOpportunity[] = active.map(event => {
      const count = counts.find(count => count._id === event.id);
      const reason = volunteerEventClosedReason(event);
      return { id: event.id, slug: event.slug, title: event.title, date: event.date, time: event.time, location: event.location, membersOnly: event.membersOnly, accepting: !reason, reason: reason ?? undefined, isFull: (count?.waiting ?? 0) > 0 || (event.volunteerCap != null && (count?.confirmed ?? 0) >= event.volunteerCap) };
    });
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[volunteers] Opportunities failed", error);
    return NextResponse.json({ ok: false, error: "Could not load volunteer opportunities. Please try again." }, { status: 503 });
  }
}
