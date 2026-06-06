import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { CreateProductInput, Product } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("products");
    const params = request.nextUrl.searchParams;
    const filter: Filter<Product> = {};

    const category = params.get("category");
    const status = params.get("status");
    const featured = params.get("featured");
    const memberOnly = params.get("memberOnly");
    const inStock = params.get("inStock");

    if (category) filter.category = category as Product["category"];
    if (status) filter.status = status as Product["status"];
    if (featured === "true") filter.isFeatured = true;
    if (memberOnly === "true") filter.isMemberOnly = true;
    if (inStock === "true") filter.stock = { $gt: 0 };

    const products = serializeDocuments(await collection.find(filter).sort({ createdAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateProductInput>;

    if (!payload.name?.trim()) return badRequest("Product name is required");
    if (!payload.slug?.trim()) return badRequest("Product slug is required");
    if (!payload.category) return badRequest("Product category is required");
    if (!payload.status) return badRequest("Product status is required");
    if (typeof payload.price !== "number") return badRequest("Product price is required");
    if (typeof payload.stock !== "number") return badRequest("Product stock is required");
    if (!Array.isArray(payload.tags)) return badRequest("Product tags must be an array");

    const now = new Date().toISOString();
    const product: Product = {
      id: nanoid(),
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      description: payload.description?.trim() ?? payload.name.trim(),
      shortDescription: payload.shortDescription?.trim(),
      price: payload.price,
      compareAtPrice: payload.compareAtPrice,
      category: payload.category,
      status: payload.status,
      imageUrl: payload.imageUrl,
      images: payload.images,
      stock: payload.stock,
      sku: payload.sku,
      tags: payload.tags,
      isFeatured: payload.isFeatured ?? false,
      isMemberOnly: payload.isMemberOnly ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection("products");
    await collection.insertOne(product);
    return NextResponse.json({ ok: true, data: product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
