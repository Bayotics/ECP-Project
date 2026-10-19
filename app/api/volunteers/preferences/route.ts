import { NextRequest, NextResponse } from "next/server";
import { findVolunteerAccess } from "@/lib/server/volunteer-access";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { VolunteerError } from "@/lib/server/volunteers";
import { clubError, privateHeaders } from "@/lib/server/club-api";
import { validateVolunteerInput } from "@/lib/volunteer-input";
import { queueVolunteerWelcome, deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";
const publicPreferences = (person: {name: string; email: string; phone: string; interests: string; opportunityEmails?: boolean}) => ({ name: person.name, email: person.email, phone: person.phone, interests: person.interests, opportunityEmails: person.opportunityEmails === true });
export async function GET(request: NextRequest) {
  try {
    const person = await findVolunteerAccess(request.headers.get("authorization"));
    if (!person) throw new VolunteerError("This preference link has expired or is invalid. Request a new link below.", 403);
    return NextResponse.json({ ok: true, data: publicPreferences(person) }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateVolunteerInput({ ...body, notes: "", eventId: "" });
    if ("error" in validation || typeof body.opportunityEmails !== "boolean") throw new VolunteerError("error" in validation ? validation.error : "Choose your volunteer email preference.", 400);
    await ensureCoreIndexes();
    const result = await volunteerTransaction(async session => {
      const person = await findVolunteerAccess(request.headers.get("authorization"), session);
      if (!person) throw new VolunteerError("This preference link has expired or is invalid. Request a new link below.", 403);
      const people = await getCollection("volunteers");
      const { name, email, phone, interests } = validation.value;
      if (email !== person.email && await people.findOne({ email, id: { $ne: person.id } }, { session })) throw new VolunteerError("That email already has a volunteer record. Contact the club to combine your records.", 409);
      const updated = { ...person, name, email, phone, interests, opportunityEmails: body.opportunityEmails, updatedAt: new Date().toISOString() };
      await people.updateOne({ id: person.id }, { $set: { name, email, phone, interests, opportunityEmails: body.opportunityEmails, updatedAt: updated.updatedAt } }, { session });
      let messages: string[] = [];
      if (email !== person.email) {
        await (await getCollection("volunteerExternalRegistrations")).updateMany({ volunteerId: person.id }, { $set: { email } }, { session });
        await (await getCollection("volunteerAccessTokens")).deleteMany({ volunteerId: person.id }, { session });
        messages = await queueVolunteerWelcome(updated, session);
      }
      return { preferences: publicPreferences(updated), emailChanged: email !== person.email, messages };
    });
    let emailSent = true;
    try { const delivery = await deliverVolunteerMessages(result.messages); emailSent = delivery.failed === 0; } catch { emailSent = false; }
    return NextResponse.json({ ok: true, data: { ...result, messages: undefined, emailSent } }, { headers: privateHeaders });
  } catch (error) {
    if ((error as {code?: number})?.code === 11000) return clubError(new VolunteerError("That email already has a volunteer record. Contact the club to combine your records.", 409));
    return clubError(error);
  }
}
