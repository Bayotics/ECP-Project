import { NextRequest, NextResponse } from "next/server";
import type { UpdateRSVPInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("rsvps");
    const rsvp = serializeDocument(await collection.findOne({ id }));

    if (!rsvp) {
      return NextResponse.json({ ok: false, error: "RSVP not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: rsvp });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch RSVP";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateRSVPInput;
    const collection = await getCollection("rsvps");
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: payload },
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

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
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
