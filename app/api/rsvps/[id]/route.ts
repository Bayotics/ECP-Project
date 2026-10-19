import { NextRequest, NextResponse } from "next/server";
import type { UpdateRSVPInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { requireSession } from "@/lib/server/guards";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("rsvps");
    const rsvp = serializeDocument(await collection.findOne({ id }));

    if (!rsvp) {
      return NextResponse.json({ ok: false, error: "RSVP not found" }, { status: 404 });
    }
    if (!["admin", "super-admin"].includes(session!.role) && rsvp.userId !== session!.sub && rsvp.email.toLowerCase() !== session!.email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "You can only view your own registrations." }, { status: 403 });
    }

    return NextResponse.json({ ok: true, data: rsvp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch RSVP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateRSVPInput;
    const collection = await getCollection("rsvps");
    const existing = await collection.findOne({ id });
    if (!existing) return NextResponse.json({ ok: false, error: "RSVP not found" }, { status: 404 });
    const isAdmin = ["admin", "super-admin"].includes(session!.role);
    if (!isAdmin && (existing.userId !== session!.sub && existing.email.toLowerCase() !== session!.email.toLowerCase())) return NextResponse.json({ ok: false, error: "You can only cancel your own registration." }, { status: 403 });
    if (!isAdmin && (payload.status !== "cancelled" || Object.keys(payload).some(key => key !== "status"))) return NextResponse.json({ ok: false, error: "Members can only cancel an existing registration." }, { status: 403 });
    if (payload.status !== undefined && !["confirmed", "waitlisted", "cancelled"].includes(payload.status)) return NextResponse.json({ ok: false, error: "Invalid registration status." }, { status: 400 });
    // Identity and duplicate-protection fields are immutable through this endpoint.
    const patch = {
      ...(payload.status ? { status: payload.status } : {}),
      ...(isAdmin && typeof payload.checkedInAt === "string" ? { checkedInAt: payload.checkedInAt } : {}),
      ...(payload.status === "cancelled" ? { cancelledAt: new Date().toISOString() } : {}),
    };
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" }
    );

    const rsvp = serializeDocument(result);
    if (!rsvp) {
      return NextResponse.json({ ok: false, error: "RSVP not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rsvp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update RSVP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;
  if (!["admin", "super-admin"].includes(session!.role)) return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("rsvps");
    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "RSVP not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete RSVP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
