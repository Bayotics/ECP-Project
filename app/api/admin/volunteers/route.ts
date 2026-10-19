import { resumeDueVolunteers } from "@/lib/server/volunteer-management";
import { scheduleImportedVolunteerEmails } from "@/lib/server/volunteer-imports";
import { volunteerAdminFilter } from "@/lib/server/volunteer-admin-filter";
import { clubError } from "@/lib/server/club-api";
import { volunteerSource } from "@/lib/volunteer-sources";
import { NextRequest, NextResponse } from "next/server";
import type { VolunteerAdminList } from "@/lib/models/volunteer";
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
    scheduleImportedVolunteerEmails(await resumeDueVolunteers());
    const [people, signups, events] = await Promise.all([getCollection("volunteers"), getCollection("volunteerSignups"), getCollection("events")]);
    const filter = await volunteerAdminFilter(params);
    const pageSize = 25;
    const [rows, total] = await Promise.all([people.find(filter).sort({ updatedAt: -1, id: 1 }).skip(page * pageSize).limit(pageSize).toArray(), people.countDocuments(filter)]);
    const records = rows.length ? serializeDocuments(await signups.find({ volunteerId: { $in: rows.map(row => row.id) } }).sort({ registeredAt: -1, id: 1 }).toArray()) : [];
    const emailIssues = rows.length ? await (await getCollection("volunteerMessages")).find({ volunteerId: { $in: rows.map(row => row.id) }, status: { $in: ["pending", "failed", "sending"] } }).project({ volunteerId: 1 }).toArray() : [];
    const eventIds = [...new Set(records.map(row => row.eventId))];
    const eventRows = eventIds.length ? await events.find({ id: { $in: eventIds } }).project({ _id: 0, id: 1, title: 1, slug: 1, date: 1 }).toArray() : [];
    const [committees,members,changes]=rows.length?await Promise.all([
      (await getCollection("committees")).find({id:{$in:rows.flatMap(row=>row.committeeIds??[])}}).project({id:1,name:1}).toArray(),
      (await getCollection("users")).find({role:{$in:["member","admin","super-admin"]},$or:[{id:{$in:rows.flatMap(row=>row.userId?[row.userId]:[])}},{$expr:{$in:[{$toLower:"$email"},rows.map(row=>row.email.toLowerCase())]}}]}).project({id:1,email:1,displayName:1}).toArray(),
      (await getCollection("volunteerChanges")).find({volunteerId:{$in:rows.map(row=>row.id)}}).sort({at:-1}).limit(500).toArray(),
    ]):[[],[],[]];
    const data: VolunteerAdminList = {
      volunteers: serializeDocuments(rows).map(person => ({ ...person, status:person.status??"active", committeeNames:(person.committeeIds??[]).map(id=>committees.find(row=>row.id===id)?.name??"Committee no longer listed"), member:(()=>{const member=person.userId?members.find(row=>row.id===person.userId):members.find(row=>row.email?.toLowerCase()===person.email.toLowerCase());return member?{id:member.id,name:member.displayName}:undefined;})(), changes:serializeDocuments(changes.filter(row=>row.volunteerId===person.id).slice(0,20)), emailIssues: emailIssues.filter(message => message.volunteerId === person.id).length, signups: records.filter(row => row.volunteerId === person.id).map(row => {
        const event = eventRows.find(event => event.id === row.eventId);
        return { ...row, eventTitle: event?.title ?? "Event no longer available", eventSlug: event?.slug, eventDate: event?.date };
      }) })), page, pageSize, total,
    };
    return NextResponse.json({ ok: true, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && "status" in error) return clubError(error);
    console.error("[volunteers] Admin list failed", error);
    return NextResponse.json({ ok: false, error: "Could not load volunteers. Please try again." }, { status: 503 });
  }
}
