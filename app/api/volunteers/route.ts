import { NextRequest, NextResponse } from "next/server";
import { validateVolunteerInput } from "@/lib/volunteer-input";
import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { getRequestSession } from "@/lib/server/guards";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { registerVolunteer, VolunteerError } from "@/lib/server/volunteers";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Send a valid volunteer form." }, { status: 400 }); }
  const validation = validateVolunteerInput(body);
  if ("error" in validation) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  const verification = await verifyRecaptcha((body as Record<string, unknown>).recaptchaToken);
  if (!verification.ok) return NextResponse.json({ ok: false, error: verification.error }, { status: verification.status });
  try {
    await ensureCoreIndexes();
    const session = await getRequestSession(request);
    const result = await registerVolunteer(validation.value, Boolean(session && ["member", "admin", "super-admin"].includes(session.role)));
    const messages = await getCollection("volunteerMessages");
    const ownFilter = { volunteerId: result.volunteerId, ...(result.status === "general" ? { signupId: { $exists: false } } : { signupId: result.reference, signupStatus: result.status }), audience: "volunteer" as const, status: { $ne: "superseded" as const } };
    const ownMessages = await messages.find(ownFilter).project({ id: 1 }).toArray();
    const ownIds = ownMessages.map(message => message.id);
    let confirmationEmailSent = false;
    try {
      await deliverVolunteerMessages([...new Set([...result.messageIds, ...ownIds])]);
      confirmationEmailSent = ownIds.length > 0 && await messages.countDocuments({ id: { $in: ownIds }, status: { $ne: "sent" } }) === 0;
    } catch (error) { console.error("[volunteers] Delivery deferred; saved messages will be retried", error); }
    return NextResponse.json({ ok: true, data: { reference: result.reference, status: result.status, alreadyRegistered: result.alreadyRegistered, confirmationEmailSent } }, { status: result.alreadyRegistered ? 200 : 201 });
  } catch (error) {
    if (error instanceof VolunteerError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    console.error("[volunteers] Registration failed", error);
    return NextResponse.json({ ok: false, error: "Your volunteer sign-up could not be saved. Please try again." }, { status: 503 });
  }
}
