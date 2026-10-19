import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/guards";
import { cancelVolunteerSignup, VolunteerError } from "@/lib/server/volunteers";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Send a valid cancellation request." }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || !("status" in payload) || payload.status !== "cancelled") return NextResponse.json({ ok: false, error: "Only cancellation is supported. Waitlisted volunteers are promoted automatically in sign-up order." }, { status: 400 });
  try {
    const ids = await cancelVolunteerSignup((await context.params).id);
    try { await deliverVolunteerMessages(ids); } catch (error) { console.error("[volunteers] Notification delivery deferred", error); }
    return NextResponse.json({ ok: true, data: { cancelled: true } });
  } catch (error) {
    if (error instanceof VolunteerError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status });
    console.error("[volunteers] Cancellation failed", error);
    return NextResponse.json({ ok: false, error: "Could not cancel the volunteer sign-up. Please try again." }, { status: 503 });
  }
}
