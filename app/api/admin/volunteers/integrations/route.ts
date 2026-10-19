import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { nanoid } from "nanoid";
import type { VolunteerIntegrationSettings, VolunteerIntegrationMapping } from "@/lib/models/proposal";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
import { siteUrl } from "@/lib/server/email";
export async function GET(request: NextRequest) {
  try {
    await clubAdmin(request);
    const config = await (await getCollection("clubSettings")).findOne({ id: "volunteer-integrations" }) as VolunteerIntegrationSettings | null;
    const events = await (await getCollection("events")).find({ status: { $in: ["published", "draft"] } }).project({ _id: 0, id: 1, title: 1, date: 1 }).sort({ date: 1 }).toArray();
    return NextResponse.json({ ok: true, data: { mappings: config?.mappings ?? [], keyConfigured: Boolean(config?.connectorKeyHash), endpoint: `${siteUrl()}/api/integrations/volunteers`, volunteerUrl: `${siteUrl()}/volunteer`, events } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
export async function PUT(request: NextRequest) {
  try {
    const admin = await clubAdmin(request), body = await request.json();
    await ensureCoreIndexes();
    if (!Array.isArray(body.mappings) || body.mappings.length > 100) throw new VolunteerError("Provide at most 100 event mappings.", 400);
    const mappings: VolunteerIntegrationMapping[] = [];
    for (const row of body.mappings) {
      if (!row || !["eventbrite", "partiful", "other"].includes(row.source) || typeof row.externalEventId !== "string" || !row.externalEventId.trim() || row.externalEventId.length > 200 || typeof row.eventId !== "string" || !Array.isArray(row.volunteerTicketClassIds) || row.volunteerTicketClassIds.length > 100 || row.volunteerTicketClassIds.some((id: unknown) => typeof id !== "string" || !id.trim() || id.length > 200)) throw new VolunteerError("Each mapping needs a source, external event ID and club event.", 400);
      if (row.source === "eventbrite" && (!/^\d+$/.test(row.externalEventId.trim()) || !row.volunteerTicketClassIds.length || row.volunteerTicketClassIds.some((id: string) => !/^\d+$/.test(id)))) throw new VolunteerError("Eventbrite mappings require a numeric event ID and numeric volunteer ticket class IDs. Ordinary attendees must not be imported as volunteers.", 400);
      if (mappings.some(mapping => mapping.source === row.source && mapping.externalEventId === row.externalEventId.trim())) throw new VolunteerError("Each external event can be mapped only once per source.", 400);
      if (!await (await getCollection("events")).findOne({ id: row.eventId })) throw new VolunteerError("A mapped club event does not exist.", 400);
      mappings.push({ id: nanoid(), source: row.source, externalEventId: row.externalEventId.trim(), eventId: row.eventId, volunteerTicketClassIds: [...new Set<string>(row.volunteerTicketClassIds.map((id: string) => id.trim()))] });
    }
    const key = body.rotateKey === true ? randomBytes(32).toString("hex") : undefined;
    await (await getCollection("clubSettings")).updateOne({ id: "volunteer-integrations" }, { $set: { mappings, updatedAt: new Date().toISOString(), updatedBy: admin.sub, ...(key ? { connectorKeyHash: createHash("sha256").update(key).digest("hex") } : {}) } }, { upsert: true });
    return NextResponse.json({ ok: true, data: { key, mappings } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
