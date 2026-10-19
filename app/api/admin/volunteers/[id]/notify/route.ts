import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/guards";
import { getCollection } from "@/lib/server/collections";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  try {
    const messages = await (await getCollection("volunteerMessages")).find({ volunteerId: (await context.params).id, status: { $in: ["pending", "failed"] } }).project({ id: 1 }).toArray();
    const result = await deliverVolunteerMessages(messages.map(message => message.id));
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error("[volunteers] Retry failed", error);
    return NextResponse.json({ ok: false, error: "Could not retry volunteer emails." }, { status: 503 });
  }
}
