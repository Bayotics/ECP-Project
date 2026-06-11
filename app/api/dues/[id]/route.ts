import { NextRequest, NextResponse } from "next/server";
import type { UpdateDuesPaymentInput } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";
import { sendDuesReceipt } from "@/lib/server/notifications";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = (await request.json()) as UpdateDuesPaymentInput & { sendReceipt?: boolean };

    const col = await getCollection("duesPayments");
    const existing = serializeDocument(await col.findOne({ id }));
    if (!existing) return NextResponse.json({ ok: false, error: "Dues record not found" }, { status: 404 });

    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "super-admin";
    if (!isAdmin && existing.userId !== sessionUser.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const patch = { ...body, updatedAt: now };
    delete (patch as Record<string, unknown>).sendReceipt;

    // If marking as paid, set paidDate
    if (patch.status === "paid" && !patch.paidDate) {
      patch.paidDate = now;
    }

    const result = await col.findOneAndUpdate(
      { id },
      { $set: patch },
      { returnDocument: "after" }
    );
    const updated = serializeDocument(result);
    if (!updated) return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });

    if (updated.status === "paid" && body.sendReceipt) {
      const usersCol = await getCollection("users");
      const user = serializeDocument(await usersCol.findOne({ id: updated.userId }));
      if (user) {
        sendDuesReceipt(updated, user.displayName, user.email, user.phone).catch(console.error);
      }
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update dues";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
