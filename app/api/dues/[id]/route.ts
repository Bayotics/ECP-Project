import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { getCollection, serializeDocument } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";
import { notifyAdminsOfDuesTransfer, settleDuesPayment } from "@/lib/server/dues";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const col = await getCollection("duesPayments");
    const existing = await col.findOne({ id });
    if (!existing) return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
    const admin = user.role === "admin" || user.role === "super-admin";
    if (existing.userId !== user.id && !admin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const body = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    const keys = Object.keys(body);
    if (body.action === "reject" && admin && keys.every(key => ["action", "reason"].includes(key))) {
      if (typeof body.reason !== "string" || !body.reason.trim() || body.reason.length > 500) return NextResponse.json({ ok: false, error: "A reason of up to 500 characters is required" }, { status: 400 });
      const rejected = await col.findOneAndUpdate({ id, schemaVersion: 2, status: "pending", submittedAt: { $exists: true }, paymentMethod: { $in: ["zelle", "bank-transfer"] } }, {
        $set: { rejectionReason: body.reason.trim(), rejectedAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        $unset: { submittedAt: "", paymentMethod: "", reference: "", zelleRef: "", transferReference: "", adminsNotifiedAt: "" },
      }, { returnDocument: "after" });
      if (!rejected) return NextResponse.json({ ok: false, error: "Transfer is no longer pending" }, { status: 409 });
      return NextResponse.json({ ok: true, data: serializeDocument(rejected) });
    }
    if (body.action === "confirm" && admin && keys.every(key => ["action", "reference"].includes(key))) {
      if (!existing.submittedAt || !["zelle", "bank-transfer"].includes(existing.paymentMethod ?? "")) return NextResponse.json({ ok: false, error: "Only submitted transfers can be confirmed" }, { status: 400 });
      const reference = typeof body.reference === "string" ? body.reference.trim().slice(0, 160) : existing.reference;
      const paid = await settleDuesPayment(id, { paymentMethod: existing.paymentMethod, reference: reference || existing.zelleRef || id, confirmedBy: user.id });
      if (!paid) return NextResponse.json({ ok: false, error: "Transfer changed. Refresh and try again." }, { status: 409 });
      return NextResponse.json({ ok: true, data: serializeDocument(paid) });
    }
    if (body.action !== "submit" || !keys.every(key => ["action", "paymentMethod", "transferReference"].includes(key)) || body.paymentMethod !== "zelle") {
      return NextResponse.json({ ok: false, error: "Payment status and amounts can only be changed by verified settlement" }, { status: 403 });
    }
    if (existing.userId !== user.id) return NextResponse.json({ ok: false, error: "Only the member can report their own transfer" }, { status: 403 });
    if (body.transferReference !== undefined && (typeof body.transferReference !== "string" || body.transferReference.length > 160)) return NextResponse.json({ ok: false, error: "Invalid transfer reference" }, { status: 400 });
    if (existing.status !== "pending" || existing.schemaVersion !== 2 || existing.paypalOrderId) return NextResponse.json({ ok: false, error: "This payment cannot be submitted as a transfer" }, { status: 409 });
    const now = new Date().toISOString();
    const reference = existing.reference ?? `ECP-DUES-${nanoid(10).toUpperCase()}`;
    const updated = await col.findOneAndUpdate({ id, status: "pending", submittedAt: { $exists: false }, paypalOrderId: { $exists: false } }, {
      $set: { paymentMethod: body.paymentMethod, reference, zelleRef: reference, transferReference: body.transferReference?.trim() ?? "", submittedAt: now, updatedAt: now },
    }, { returnDocument: "after" });
    if (updated) await notifyAdminsOfDuesTransfer(updated, user).catch(console.error);
    return NextResponse.json({ ok: true, data: serializeDocument(updated ?? await col.findOne({ id })) });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    console.error("[dues] Update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await context.params;
    const result = await (await getCollection("duesPayments")).deleteOne({ id, userId: user.id, schemaVersion: 2, status: "pending", submittedAt: { $exists: false }, paypalOrderId: { $exists: false } });
    if (!result.deletedCount) return NextResponse.json({ ok: false, error: "Submitted payments cannot be discarded" }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to discard draft" }, { status: 500 });
  }
}
