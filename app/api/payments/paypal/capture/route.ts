import { NextRequest, NextResponse } from "next/server";
import { paypalCaptureOrder, paypalGetOrder, isPayPalConfigured, type PayPalCaptureResult } from "@/lib/server/paypal";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { sendDonationReceipt, sendOrderReceipt } from "@/lib/server/notifications";
import { getSessionUser } from "@/lib/server/session";
import { settleDuesPayment } from "@/lib/server/dues";

export async function POST(request: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ ok: false, error: "PayPal is not configured." }, { status: 503 });
    }

    const { paypalOrderId, context, recordId } = (await request.json()) as {
      paypalOrderId: string;
      context: "donation" | "dues" | "order";
      recordId: string;
    };

    if (!paypalOrderId || !context || !recordId) {
      return NextResponse.json({ ok: false, error: "paypalOrderId, context, and recordId are required" }, { status: 400 });
    }

    // Dues captures are bound to the authenticated owner and a server-priced invoice.
    const duesCol = await getCollection("duesPayments");
    const boundDues = await duesCol.findOne({ $or: [{ id: recordId }, { paypalOrderId }] });
    if (context === "dues" || boundDues) {
      const user = await getSessionUser(request);
      if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      if (!boundDues || context !== "dues" || boundDues.id !== recordId || boundDues.userId !== user.id || boundDues.paypalOrderId !== paypalOrderId || boundDues.schemaVersion !== 2) return NextResponse.json({ ok: false, error: "Payment does not match this invoice" }, { status: 403 });
      if (boundDues.status === "paid") return NextResponse.json({ ok: true, data: { captureId: boundDues.paypalCaptureId, status: "completed" } });
      if (boundDues.status !== "pending") return NextResponse.json({ ok: false, error: "Invoice is not pending" }, { status: 409 });
      let result: PayPalCaptureResult;
      try { result = await paypalCaptureOrder(paypalOrderId); }
      catch (error) {
        const recovered = await paypalGetOrder(paypalOrderId);
        if (recovered.status !== "COMPLETED") throw error;
        result = recovered;
      }
      const captures = result.purchase_units.flatMap(unit => unit.payments?.captures ?? []);
      const received = captures.reduce((sum, item) => sum + Math.round(Number(item.amount.value) * 100), 0);
      if (result.id !== paypalOrderId || result.status !== "COMPLETED" || !captures.length || captures.some(item => item.status !== "COMPLETED" || item.amount.currency_code !== "USD") || received !== Math.round(boundDues.amount * 100)) return NextResponse.json({ ok: false, error: "Payment amount or currency did not match the invoice. Contact the treasurer." }, { status: 402 });
      const paid = await settleDuesPayment(recordId, { paymentMethod: "paypal", reference: captures[0].id, paypalCaptureId: captures[0].id });
      if (!paid) throw new Error("Captured payment could not be settled");
      return NextResponse.json({ ok: true, data: { captureId: captures[0].id, status: "completed" } });
    }
    const capture = await paypalCaptureOrder(paypalOrderId);
    if (capture.status !== "COMPLETED") {
      return NextResponse.json({ ok: false, error: `PayPal payment not completed: ${capture.status}` }, { status: 402 });
    }

    const captureId = capture.purchase_units[0]?.payments?.captures?.[0]?.id ?? paypalOrderId;
    await ensureCoreIndexes();
    const now = new Date().toISOString();

    if (context === "donation") {
      const col = await getCollection("donations");
      const result = await col.findOneAndUpdate(
        { id: recordId },
        { $set: { status: "successful", paypalOrderId, paypalCaptureId: captureId, paymentMethod: "paypal", paymentReference: captureId, receiptSentAt: now, updatedAt: now } },
        { returnDocument: "after" }
      );
      const donation = serializeDocument(result);
      if (donation) sendDonationReceipt(donation).catch(console.error);
    }

    if (context === "order") {
      const col = await getCollection("orders");
      const result = await col.findOneAndUpdate(
        { id: recordId },
        { $set: { paymentStatus: "paid", paypalOrderId, paypalCaptureId: captureId, paymentMethod: "paypal", paymentReference: captureId, status: "confirmed", confirmedAt: now, updatedAt: now } },
        { returnDocument: "after" }
      );
      const order = serializeDocument(result);
      if (order) sendOrderReceipt(order).catch(console.error);
    }

    return NextResponse.json({ ok: true, data: { captureId, status: "completed" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Capture failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
