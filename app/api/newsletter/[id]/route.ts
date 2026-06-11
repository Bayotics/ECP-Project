import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super-admin")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as { status?: "active" | "unsubscribed"; tags?: string[]; name?: string; phone?: string };
    const collection = await getCollection("newsletterSubscribers");

    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      patch.status = body.status;
      if (body.status === "unsubscribed") patch.unsubscribedAt = new Date().toISOString();
    }
    if (body.tags !== undefined) patch.tags = body.tags;
    if (body.name !== undefined) patch.name = body.name;
    if (body.phone !== undefined) patch.phone = body.phone;

    const result = await collection.findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" }
    );
    const subscriber = serializeDocument(result);
    if (!subscriber) return NextResponse.json({ ok: false, error: "Subscriber not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: subscriber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update subscriber";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super-admin")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const collection = await getCollection("newsletterSubscribers");
    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Subscriber not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete subscriber";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
