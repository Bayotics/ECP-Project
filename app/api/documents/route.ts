import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { CreateDocumentInput, OrgDocument } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("documents");
    const params = request.nextUrl.searchParams;
    const filter: Filter<OrgDocument> = {};

    const category = params.get("category");
    const access = params.get("access");
    if (category) filter.category = category as OrgDocument["category"];
    if (access) filter.access = access as OrgDocument["access"];

    const documents = serializeDocuments(await collection.find(filter).sort({ uploadedAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch documents";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateDocumentInput>;

    if (!payload.label?.trim()) return badRequest("Document label is required");
    if (!payload.name?.trim()) return badRequest("Document file name is required");
    if (!payload.category) return badRequest("Document category is required");
    if (!payload.access) return badRequest("Document access level is required");
    if (!payload.fileType) return badRequest("Document file type is required");
    if (!payload.simulatedSize?.trim()) return badRequest("Document size is required");
    if (!payload.uploadedBy?.trim()) return badRequest("Uploader is required");

    const now = new Date().toISOString();
    const document: OrgDocument = {
      id: nanoid(),
      label: payload.label.trim(),
      name: payload.name.trim(),
      category: payload.category,
      access: payload.access,
      fileType: payload.fileType,
      simulatedSize: payload.simulatedSize.trim(),
      description: payload.description?.trim(),
      uploadedAt: now,
      uploadedBy: payload.uploadedBy.trim(),
      updatedAt: now,
    };

    const collection = await getCollection("documents");
    await collection.insertOne(document);
    return NextResponse.json({ ok: true, data: document }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create document";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
