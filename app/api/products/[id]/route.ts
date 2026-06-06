import { NextRequest, NextResponse } from "next/server";
import type { UpdateProductInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("products");
    const product = serializeDocument(await collection.findOne({ $or: [{ id }, { slug: id }] }));

    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateProductInput;
    const collection = await getCollection("products");
    const result = await collection.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      { $set: { ...payload, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    const product = serializeDocument(result);
    if (!product) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("products");
    const result = await collection.deleteOne({ $or: [{ id }, { slug: id }] });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
