import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { queueVolunteerWelcome, deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";
import { clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body?.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) throw new VolunteerError("Enter a valid email address.", 400);
    const captcha = await verifyRecaptcha(body.recaptchaToken);
    if (!captcha.ok) throw new VolunteerError(captcha.error, captcha.status);
    await ensureCoreIndexes();
    const ids = await volunteerTransaction(async session => {
      const people = await getCollection("volunteers");
      const person = await people.findOne({ email: body.email.trim().toLowerCase() }, { session });
      if (!person) return [];
      const recent = await (await getCollection("volunteerAccessTokens")).countDocuments({ volunteerId: person.id, createdAt: { $gte: new Date(Date.now() - 15 * 60000).toISOString() } }, { session });
      if (recent) return [];
      // Lock the person to serialize simultaneous requests and enforce cooldown.
      await people.updateOne({ id: person.id }, { $set: { updatedAt: new Date().toISOString() } }, { session });
      return queueVolunteerWelcome(person, session, true);
    });
    try { await deliverVolunteerMessages(ids); } catch { /* durable retry */ }
    return NextResponse.json({ ok: true, data: { message: "If that email has a volunteer record, a private link will be sent. Check your inbox and spam folder. Please allow 15 minutes before requesting another link." } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
