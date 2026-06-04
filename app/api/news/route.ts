import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { CreateNewsInput, NewsPost } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function validateCreateNews(input: Partial<CreateNewsInput>): string | null {
  if (!input.title?.trim()) return "News title is required";
  if (!input.slug?.trim()) return "News slug is required";
  if (!input.excerpt?.trim()) return "News excerpt is required";
  if (!input.content?.trim()) return "News content is required";
  if (!input.category) return "News category is required";
  if (!input.status) return "News status is required";
  if (!input.authorId?.trim()) return "Author ID is required";
  if (!input.authorName?.trim()) return "Author name is required";
  if (!Array.isArray(input.tags)) return "News tags must be an array";
  if (typeof input.readingTimeMinutes !== "number") return "readingTimeMinutes must be a number";
  if (typeof input.isFeatured !== "boolean") return "isFeatured must be a boolean";
  if (typeof input.isBreaking !== "boolean") return "isBreaking must be a boolean";
  if (typeof input.isPinned !== "boolean") return "isPinned must be a boolean";
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("news");
    const searchParams = request.nextUrl.searchParams;

    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const breaking = searchParams.get("breaking");
    const limit = Number(searchParams.get("limit") ?? "0");

    const filter: Partial<NewsPost> = {};
    if (status) filter.status = status as NewsPost["status"];
    if (category) filter.category = category as NewsPost["category"];
    if (featured === "true") filter.isFeatured = true;
    if (breaking === "true") filter.isBreaking = true;

    const cursor = collection.find(filter).sort({ publishedAt: -1, createdAt: -1 });
    if (Number.isFinite(limit) && limit > 0) {
      cursor.limit(limit);
    }

    const posts = serializeDocuments(await cursor.toArray());
    return NextResponse.json({ ok: true, data: posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch news";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateNewsInput>;
    const validationError = validateCreateNews(payload);

    if (validationError) {
      return badRequest(validationError);
    }

    const collection = await getCollection("news");
    const now = new Date().toISOString();

    const post: NewsPost = {
      id: nanoid(),
      title: payload.title!.trim(),
      slug: payload.slug!.trim(),
      excerpt: payload.excerpt!.trim(),
      content: payload.content!.trim(),
      category: payload.category!,
      status: payload.status!,
      imageUrl: payload.imageUrl,
      imageAlt: payload.imageAlt,
      authorId: payload.authorId!.trim(),
      authorName: payload.authorName!.trim(),
      authorAvatarUrl: payload.authorAvatarUrl,
      viewCount: 0,
      readingTimeMinutes: payload.readingTimeMinutes!,
      isFeatured: payload.isFeatured!,
      isBreaking: payload.isBreaking!,
      isPinned: payload.isPinned!,
      tags: payload.tags!,
      publishedAt: payload.publishedAt,
      createdAt: now,
      updatedAt: now,
    };

    await collection.insertOne(post);
    return NextResponse.json({ ok: true, data: post }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create news post";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
