import { NextRequest, NextResponse } from "next/server";
import type { UpdateApplicationInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("membershipApplications");
    const application = serializeDocument(await collection.findOne({ id }));

    if (!application) {
      return NextResponse.json({ ok: false, error: "Membership application not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch membership application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateApplicationInput;

    const collection = await getCollection("membershipApplications");
    const result = await collection.findOneAndUpdate(
      { id },
      { $set: payload },
      { returnDocument: "after" }
    );

    const application = serializeDocument(result);
    if (!application) {
      return NextResponse.json({ ok: false, error: "Membership application not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update membership application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("membershipApplications");
    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Membership application not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete membership application";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
