import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";
import type { VolunteerIntegrationSettings } from "@/lib/models/proposal";
import { validateVolunteerInput } from "@/lib/volunteer-input";
import { getCollection, ensureCoreIndexes } from "@/lib/server/collections";
import { importVolunteer, scheduleImportedVolunteerEmails } from "@/lib/server/volunteer-imports";
import { clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const key = request.headers.get("authorization")?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!key) throw new VolunteerError("Invalid integration credentials.", 401);
    const settings = await (await getCollection("clubSettings")).findOne({ id: "volunteer-integrations" }) as VolunteerIntegrationSettings | null;
    const hash = createHash("sha256").update(key).digest();
    if (!settings?.connectorKeyHash || !timingSafeEqual(hash, Buffer.from(settings.connectorKeyHash, "hex"))) throw new VolunteerError("Invalid integration credentials.", 401);
    const body = await request.json();
    const mapping = settings.mappings.find(row => row.source === body?.source && row.externalEventId === body.externalEventId);
    if (!mapping) throw new VolunteerError("This external event has no approved volunteer mapping.", 400);
    if (mapping.source === "eventbrite" && !mapping.volunteerTicketClassIds.includes(body.ticketClassId)) throw new VolunteerError("This ticket class is not configured for volunteers. The attendee was not imported.", 422);
    if (typeof body.registrationId !== "string" || !body.registrationId.trim() || body.registrationId.length > 200) throw new VolunteerError("A stable external registration ID is required.", 400);
    const input = validateVolunteerInput({ name: body.name, email: body.email, phone: body.phone, interests: body.interests, notes: body.notes, eventId: mapping.eventId });
    if ("error" in input) throw new VolunteerError(input.error, 400);
    await ensureCoreIndexes();
    const { messageIds, ...receipt } = await importVolunteer(input.value, mapping.source, body.registrationId.trim());
    scheduleImportedVolunteerEmails(messageIds);
    return NextResponse.json({ ok: true, data: { ...receipt, emailsQueued: messageIds.length > 0 } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
