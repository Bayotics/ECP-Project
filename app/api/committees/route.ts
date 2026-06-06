import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { Committee, CreateCommitteeInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("committees");
    const params = request.nextUrl.searchParams;
    const filter: Filter<Committee> = {};

    const status = params.get("status");
    const type = params.get("type");
    if (status) filter.status = status as Committee["status"];
    if (type) filter.type = type as Committee["type"];

    const committees = serializeDocuments(await collection.find(filter).sort({ createdAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: committees });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch committees";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateCommitteeInput>;

    if (!payload.name?.trim()) return badRequest("Committee name is required");
    if (!payload.slug?.trim()) return badRequest("Committee slug is required");
    if (!payload.description?.trim()) return badRequest("Committee description is required");
    if (!payload.type) return badRequest("Committee type is required");
    if (!payload.status) return badRequest("Committee status is required");
    if (!Array.isArray(payload.members)) return badRequest("Committee members must be an array");
    if (!payload.establishedAt?.trim()) return badRequest("Committee establishment date is required");

    const now = new Date().toISOString();
    const committee: Committee = {
      id: nanoid(),
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      description: payload.description.trim(),
      type: payload.type,
      status: payload.status,
      mandate: payload.mandate,
      members: payload.members,
      imageUrl: payload.imageUrl,
      establishedAt: payload.establishedAt,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection("committees");
    await collection.insertOne(committee);
    return NextResponse.json({ ok: true, data: committee }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create committee";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
