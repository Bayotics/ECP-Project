import { getRequestSession, requireSession } from "@/lib/server/guards";
import { NextRequest, NextResponse } from "next/server";
import type { UpdateCommitteeInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const {deny}=await requireSession(request);if(deny)return deny;
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("committees");
    const committee = serializeDocument(await collection.findOne({ $or: [{ id }, { slug: id }] }));

    if (!committee) {
      return NextResponse.json({ ok: false, error: "Committee not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: committee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch committee";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const viewer=await getRequestSession(request);
  if(!viewer||!["admin","super-admin"].includes(viewer.role))return NextResponse.json({ok:false,error:"Administrator access required"},{status:403});
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as UpdateCommitteeInput;
    const collection = await getCollection("committees");
    const result = await collection.findOneAndUpdate(
      { $or: [{ id }, { slug: id }] },
      { $set: { ...payload, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    const committee = serializeDocument(result);
    if (!committee) {
      return NextResponse.json({ ok: false, error: "Committee not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: committee });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update committee";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const viewer=await getRequestSession(request);
  if(!viewer||!["admin","super-admin"].includes(viewer.role))return NextResponse.json({ok:false,error:"Administrator access required"},{status:403});
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("committees");
    const result = await collection.deleteOne({ $or: [{ id }, { slug: id }] });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "Committee not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete committee";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
