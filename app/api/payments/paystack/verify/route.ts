import { NextRequest, NextResponse } from "next/server";
import { paystackVerify, isPaystackConfigured } from "@/lib/server/paystack";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { sendDonationReceipt, sendDuesReceipt, sendOrderReceipt } from "@/lib/server/notifications";

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json({ ok: false, error: "Paystack is not configured." }, { status: 503 });
    }

    const { reference, context, recordId } = (await request.json()) as {
      reference: string;
      context: "donation" | "dues" | "order";
      recordId: string;
    };

    if (!reference || !context || !recordId) {
      return NextResponse.json({ ok: false, error: "reference, context, and recordId are required" }, { status: 400 });
    }

    const txn = await paystackVerify(reference);
    if (txn.status !== "success") {
      return NextResponse.json({ ok: false, error: `Payment not successful: ${txn.status}` }, { status: 402 });
    }

    await ensureCoreIndexes();
    const now = new Date().toISOString();

    if (context === "donation") {
      const col = await getCollection("donations");
      const result = await col.findOneAndUpdate(
        { id: recordId },
        { $set: { status: "successful", paystackRef: reference, paymentReference: reference, paymentMethod: "paystack", receiptSentAt: now, updatedAt: now } },
        { returnDocument: "after" }
      );
      const donation = serializeDocument(result);
      if (donation) {
        sendDonationReceipt(donation).catch(console.error);
      }
      return NextResponse.json({ ok: true, data: { status: "successful", reference } });
    }

    if (context === "dues") {
      const col = await getCollection("duesPayments");
      const result = await col.findOneAndUpdate(
        { id: recordId },
        { $set: { status: "paid", paystackRef: reference, reference, paymentMethod: "paystack", paidDate: now, receiptSentAt: now, updatedAt: now } },
        { returnDocument: "after" }
      );
      const dues = serializeDocument(result);
      if (dues) {
        const usersCol = await getCollection("users");
        const user = serializeDocument(await usersCol.findOne({ id: dues.userId }));
        if (user) {
          sendDuesReceipt(dues, user.displayName, user.email, user.phone).catch(console.error);
        }
      }
      return NextResponse.json({ ok: true, data: { status: "paid", reference } });
    }

    if (context === "order") {
      const col = await getCollection("orders");
      const result = await col.findOneAndUpdate(
        { id: recordId },
        { $set: { paymentStatus: "paid", paystackRef: reference, paymentReference: reference, paymentMethod: "paystack", status: "confirmed", confirmedAt: now, updatedAt: now } },
        { returnDocument: "after" }
      );
      const order = serializeDocument(result);
      if (order) {
        sendOrderReceipt(order).catch(console.error);
      }
      return NextResponse.json({ ok: true, data: { status: "confirmed", reference } });
    }

    return NextResponse.json({ ok: false, error: "Unknown context" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
