import { NextRequest, NextResponse } from "next/server";
import { paypalCaptureOrder, isPayPalConfigured } from "@/lib/server/paypal";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { sendDonationReceipt, sendDuesReceipt, sendOrderReceipt } from "@/lib/server/notifications";

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

    if (context === "dues") {
      const col = await getCollection("duesPayments");
      const result = await col.findOneAndUpdate(
        { id: recordId },
        { $set: { status: "paid", paypalOrderId, paypalCaptureId: captureId, paymentMethod: "paypal", reference: captureId, paidDate: now, receiptSentAt: now, updatedAt: now } },
        { returnDocument: "after" }
      );
      const dues = serializeDocument(result);
      if (dues) {
        const usersCol = await getCollection("users");
        const user = serializeDocument(await usersCol.findOne({ id: dues.userId }));
        if (user) sendDuesReceipt(dues, user.displayName, user.email, user.phone).catch(console.error);
      }
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
