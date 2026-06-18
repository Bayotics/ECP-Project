import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const payload = (await request.json()) as { status: "approved" | "rejected"; reviewedBy?: string };

    if (!payload.status) {
      return NextResponse.json({ ok: false, error: "status is required" }, { status: 400 });
    }

    const col = await getCollection("committeeJoinRequests");
    const result = await col.findOneAndUpdate(
      { id },
      { $set: { status: payload.status, reviewedAt: new Date().toISOString(), reviewedBy: payload.reviewedBy ?? "admin" } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update join request";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
