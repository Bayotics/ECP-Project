import { NextRequest, NextResponse } from "next/server";
import type { UpdateNewsInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("news");
    const post = serializeDocument(await collection.findOne({ $or: [{ id }, { slug: id }] }));

    if (!post) {
      return NextResponse.json({ ok: false, error: "News post not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch news post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateNewsInput;

    const collection = await getCollection("news");
    const result = await collection.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      { $set: { ...payload, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    const post = serializeDocument(result);
    if (!post) {
      return NextResponse.json({ ok: false, error: "News post not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update news post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("news");
    const result = await collection.deleteOne({ $or: [{ id }, { slug: id }] });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "News post not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete news post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
