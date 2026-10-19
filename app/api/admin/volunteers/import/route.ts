import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { parseVolunteerCsv, previewVolunteerCsv, suggestCsvMapping } from "@/lib/volunteer-csv";
import { volunteerSource } from "@/lib/volunteer-sources";
import { importVolunteer, scheduleImportedVolunteerEmails } from "@/lib/server/volunteer-imports";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  try {
    const admin = await clubAdmin(request), body = await request.json();
    if (typeof body?.csv !== "string") throw new VolunteerError("Upload a CSV file.", 400);
    const source = volunteerSource(body.source);
    if (!source) throw new VolunteerError("Choose a valid volunteer source.", 400);
    const eventId = typeof body.eventId === "string" ? body.eventId : "";
    if (eventId.length > 100) throw new VolunteerError("Choose a valid event.", 400);
    let headers: string[], rows;
    try {
      headers = parseVolunteerCsv(body.csv).headers;
      const mapping = body.mapping || suggestCsvMapping(headers);
      if (body.action === "columns") return NextResponse.json({ ok: true, data: { headers, mapping } }, { headers: privateHeaders });
      rows = previewVolunteerCsv(body.csv, mapping, eventId);
    } catch (error) { throw new VolunteerError(error instanceof Error ? error.message : "Invalid CSV.", 400); }
    if (body.action === "preview") return NextResponse.json({ ok: true, data: { rows, total: rows.length, valid: rows.filter(row => row.value).length } }, { headers: privateHeaders });
    if (body.action !== "import") throw new VolunteerError("Choose preview or import.", 400);
    const offset = Number(body.offset ?? 0);
    if (!Number.isSafeInteger(offset) || offset < 0 || offset >= rows.length) throw new VolunteerError("Invalid import batch.", 400);
    await ensureCoreIndexes();
    const results: Array<{row: number; status?: string; duplicate?: boolean; error?: string; emailDeferred?: boolean}> = [];
    let imported = 0, updated = 0, failed = 0;
    const messageIds: string[] = [];
    // Five per request keeps imports below serverless request limits; the UI
    // continues bounded batches and shows progress and individual row failures.
    for (const row of rows.slice(offset, offset + 5)) {
      if (!row.value) { results.push({ row: row.row, error: row.error, duplicate: row.duplicate }); if (!row.duplicate) failed++; continue; }
      try {
        const result = await importVolunteer(row.value, source, row.externalId);
        messageIds.push(...result.messageIds);
        if (result.alreadyRegistered) updated++; else imported++;
        results.push({ row: row.row, status: result.status, duplicate: result.alreadyRegistered, emailDeferred: result.messageIds.length > 0 });
      } catch (error) {
        failed++;
        results.push({ row: row.row, error: error instanceof VolunteerError ? error.message : "Import failed. Retry this row; saved rows will not reserve duplicate places." });
      }
    }
    scheduleImportedVolunteerEmails(messageIds);
    await (await getCollection("volunteerImportBatches")).insertOne({ id: nanoid(), source, ...(eventId ? {eventId} : {}), createdBy: admin.sub, createdAt: new Date().toISOString(), imported, updated, failed });
    return NextResponse.json({ ok: true, data: { results, nextOffset: Math.min(offset + 5, rows.length), total: rows.length } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
