import { volunteerSource } from "@/lib/volunteer-sources";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { Volunteer, VolunteerSignup, VolunteerAdminList } from "@/lib/models/volunteer";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { getRequestSession } from "@/lib/server/guards";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  const params = request.nextUrl.searchParams;
  const page = Number(params.get("page") || 0);
  const query = (params.get("q") || "").trim();
  const eventId = params.get("eventId") || "";
  const status = params.get("status") || "";
  const source = params.get("source") || "";
  if (source && !volunteerSource(source)) return NextResponse.json({ok: false, error: "Invalid volunteer source."}, {status: 400});
  const scope = params.get("scope") || "";
  if (scope && !["general", "event"].includes(scope)) return NextResponse.json({ ok: false, error: "Invalid volunteer list." }, { status: 400 });
  if (!Number.isSafeInteger(page) || page < 0 || page > 100000 || query.length > 100 || eventId.length > 100 || (status && !["confirmed", "waitlisted", "cancelled"].includes(status))) return NextResponse.json({ ok: false, error: "Invalid volunteer filters." }, { status: 400 });
  try {
    await ensureCoreIndexes();
    const [people, signups, events] = await Promise.all([getCollection("volunteers"), getCollection("volunteerSignups"), getCollection("events")]);
    const filter: Filter<Volunteer> = {};
    if (source) filter.$and = [{ $or: [{ sources: volunteerSource(source)! }, { source: volunteerSource(source)! }, ...(source === "website" ? [{source: {$exists: false}}] : [])] }];
    if (scope === "general") filter.generalRegisteredAt = { $exists: true };
    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = ["name", "email", "phone"].map(key => ({ [key]: { $regex: escaped, $options: "i" } }));
    }
    if (eventId || status || scope === "event") {
      const signupFilter: Filter<VolunteerSignup> = {};
      if (eventId) signupFilter.eventId = eventId;
      if (status) signupFilter.status = status as VolunteerSignup["status"];
      filter.id = { $in: await signups.distinct("volunteerId", signupFilter) };
    }
    const pageSize = 25;
    const [rows, total] = await Promise.all([people.find(filter).sort({ updatedAt: -1, id: 1 }).skip(page * pageSize).limit(pageSize).toArray(), people.countDocuments(filter)]);
    const records = rows.length ? serializeDocuments(await signups.find({ volunteerId: { $in: rows.map(row => row.id) } }).sort({ registeredAt: -1, id: 1 }).toArray()) : [];
    const emailIssues = rows.length ? await (await getCollection("volunteerMessages")).find({ volunteerId: { $in: rows.map(row => row.id) }, status: { $in: ["pending", "failed", "sending"] } }).project({ volunteerId: 1 }).toArray() : [];
    const eventIds = [...new Set(records.map(row => row.eventId))];
    const eventRows = eventIds.length ? await events.find({ id: { $in: eventIds } }).project({ _id: 0, id: 1, title: 1, slug: 1, date: 1 }).toArray() : [];
    const data: VolunteerAdminList = {
      volunteers: serializeDocuments(rows).map(person => ({ ...person, emailIssues: emailIssues.filter(message => message.volunteerId === person.id).length, signups: records.filter(row => row.volunteerId === person.id).map(row => {
        const event = eventRows.find(event => event.id === row.eventId);
        return { ...row, eventTitle: event?.title ?? "Event no longer available", eventSlug: event?.slug, eventDate: event?.date };
      }) })), page, pageSize, total,
    };
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[volunteers] Admin list failed", error);
    return NextResponse.json({ ok: false, error: "Could not load volunteers. Please try again." }, { status: 503 });
  }
}
