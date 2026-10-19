import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { volunteerPreferencesUrl } from "@/lib/server/volunteer-access";
import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";
import { escapeHtml } from "@/lib/server/email-templates";
import { committeeOrigin } from "@/lib/server/committee-session";
import { VolunteerError } from "@/lib/server/volunteer-error";
import { clubError, privateHeaders } from "@/lib/server/club-api";

export async function POST(request: NextRequest) {
  try {
    committeeOrigin(request);
    const body = await request.json();
    if (typeof body?.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || (body.committeeId !== undefined && (typeof body.committeeId !== "string" || body.committeeId.length > 100))) throw new VolunteerError("Enter your volunteer email and choose a valid committee.", 400);
    const captcha = await verifyRecaptcha(body.recaptchaToken);
    if (!captcha.ok) throw new VolunteerError(captcha.error, captcha.status);
    await ensureCoreIndexes();
    const ids = await volunteerTransaction(async session => {
      const committee = body.committeeId ? await (await getCollection("committees")).findOne({ id: body.committeeId, status: "active" }, { session }) : null;
      if (body.committeeId && !committee) throw new VolunteerError("This committee is not accepting new participants.", 409);
      const people = await getCollection("volunteers"), email = body.email.trim().toLowerCase();
      const person = await people.findOne({ email }, { session });
      if (!person) return [];
      const outbox = await getCollection("volunteerMessages"), cutoff = new Date(Date.now()-15*60000).toISOString();
      if (await outbox.countDocuments({ volunteerId: person.id, kind: "access", subject: "Confirm your committee access", createdAt: { $gte: cutoff } }, { session })) return [];
      // Serialize concurrent requests before checking the cooldown again on retry.
      await people.updateOne({ id: person.id }, { $set: { updatedAt: new Date().toISOString() } }, { session });
      const manage = await volunteerPreferencesUrl(person.id, session);
      const access = manage.replace("/volunteer/preferences#", "/committees#") + (committee ? `&join=${encodeURIComponent(committee.id)}` : "");
      const id = nanoid();
      await outbox.insertOne({ id, volunteerId: person.id, audience: "volunteer", kind: "access", to: person.email, subject: "Confirm your committee access", html: `<p>Hello ${escapeHtml(person.name)},</p><p>${committee ? `Confirm your email to join ${escapeHtml(committee.name)}.` : "Confirm your email to manage your committees."} After confirmation, joining or leaving is one click on this browser. Keep this private link to yourself.</p><p><a href="${escapeHtml(access)}">Confirm committee access${committee ? " and join" : ""}</a></p><p><a href="${escapeHtml(manage)}">Manage my volunteering</a></p>`, status: "pending", attempts: 0, createdAt: new Date().toISOString() }, { session });
      return [id];
    });
    try { await deliverVolunteerMessages(ids); } catch { /* The durable outbox retries. */ }
    return NextResponse.json({ ok: true, data: { message: "If that email has a volunteer record, a confirmation link will be emailed. Check your inbox and spam folder. Allow 15 minutes before requesting another link." } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
