import { NextRequest, NextResponse } from "next/server";
import type { UpdateDonationInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("donations");
    const donation = serializeDocument(await collection.findOne({ $or: [{ id }, { referenceNumber: id }] }));

    if (!donation) {
      return NextResponse.json({ ok: false, error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: donation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch donation";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateDonationInput;
    const collection = await getCollection("donations");
    const result = await collection.findOneAndUpdate(
      { $or: [{ id }, { referenceNumber: id }] },
      { $set: { ...payload, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    const donation = serializeDocument(result);
    if (!donation) {
      return NextResponse.json({ ok: false, error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: donation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update donation";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("donations");
    const result = await collection.deleteOne({ $or: [{ id }, { referenceNumber: id }] });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Donation not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete donation";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
