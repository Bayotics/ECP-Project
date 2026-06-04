import { NextRequest, NextResponse } from "next/server";
import type { UpdateEventInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("events");
    const event = serializeDocument(await collection.findOne({ $or: [{ id }, { slug: id }] }));

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateEventInput;

    const collection = await getCollection("events");
    const patch: UpdateEventInput = {
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    const result = await collection.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      { $set: patch },
      { returnDocument: "after" }
    );

    const event = serializeDocument(result);
    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: event });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("events");
    const result = await collection.deleteOne({ $or: [{ id }, { slug: id }] });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete event";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
