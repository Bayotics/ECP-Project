import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/server/collections";
import { proposalRecipients } from "@/lib/server/proposals";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
export async function GET(request: NextRequest) {
  try { await clubAdmin(request); return NextResponse.json({ ok: true, data: { recipients: await proposalRecipients() } }, { headers: privateHeaders }); } catch (error) { return clubError(error); }
}
export async function PUT(request: NextRequest) {
  try {
    const admin = await clubAdmin(request), body = await request.json();
    if (!Array.isArray(body.recipients) || body.recipients.length < 1 || body.recipients.length > 50) throw new VolunteerError("Provide between 1 and 50 notification recipients.", 400);
    const recipients: {name: string; email: string}[] = [];
    for (const person of body.recipients) {
      if (typeof person?.email !== "string" || person.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email.trim()) || typeof person.name !== "string" || person.name.length > 150) throw new VolunteerError("Each recipient needs a valid email and a name of at most 150 characters.", 400);
      const email = person.email.trim().toLowerCase();
      if (!recipients.some(person => person.email === email)) recipients.push({ name: person.name.trim(), email });
    }
    await (await getCollection("clubSettings")).updateOne({ id: "proposal-recipients" }, { $set: { recipients, updatedAt: new Date().toISOString(), updatedBy: admin.sub } }, { upsert: true });
    return NextResponse.json({ ok: true, data: { recipients } });
  } catch (error) { return clubError(error); }
}
