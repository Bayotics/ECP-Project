import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackWebhook } from "@/lib/server/paystack";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { sendDonationReceipt, sendDuesReceipt, sendOrderReceipt } from "@/lib/server/notifications";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-paystack-signature") ?? "";
    const rawBody = await request.text();

    if (!verifyPaystackWebhook(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody) as {
      event: string;
      data: {
        reference: string;
        status: string;
        amount: number;
        customer: { email: string };
        metadata?: { context?: string; recordId?: string; userId?: string };
        subscription?: { subscription_code: string };
      };
    };

    await ensureCoreIndexes();
    const now = new Date().toISOString();

    // Handle successful charge
    if (event.event === "charge.success") {
      const { reference, metadata, subscription } = event.data;
      const context = metadata?.context;
      const recordId = metadata?.recordId;

      if (context === "donation" && recordId) {
        const col = await getCollection("donations");
        const result = await col.findOneAndUpdate(
          { id: recordId },
          {
            $set: {
              status: "successful",
              paystackRef: reference,
              paymentReference: reference,
              paymentMethod: "paystack",
              paystackSubscriptionCode: subscription?.subscription_code,
              receiptSentAt: now,
              updatedAt: now,
            },
          },
          { returnDocument: "after" }
        );
        const donation = serializeDocument(result);
        if (donation) sendDonationReceipt(donation).catch(console.error);
      }

      if (context === "dues" && recordId) {
        const col = await getCollection("duesPayments");
        const result = await col.findOneAndUpdate(
          { id: recordId },
          {
            $set: {
              status: "paid",
              paystackRef: reference,
              reference,
              paymentMethod: "paystack",
              paystackSubscriptionCode: subscription?.subscription_code,
              paidDate: now,
              receiptSentAt: now,
              updatedAt: now,
            },
          },
          { returnDocument: "after" }
        );
        const dues = serializeDocument(result);
        if (dues) {
          const usersCol = await getCollection("users");
          const user = serializeDocument(await usersCol.findOne({ id: dues.userId }));
          if (user) sendDuesReceipt(dues, user.displayName, user.email, user.phone).catch(console.error);
        }
      }

      if (context === "order" && recordId) {
        const col = await getCollection("orders");
        const result = await col.findOneAndUpdate(
          { id: recordId },
          { $set: { paymentStatus: "paid", paystackRef: reference, paymentReference: reference, paymentMethod: "paystack", status: "confirmed", confirmedAt: now, updatedAt: now } },
          { returnDocument: "after" }
        );
        const order = serializeDocument(result);
        if (order) sendOrderReceipt(order).catch(console.error);
      }
    }

    // Handle subscription renewal (auto-pay for dues)
    if (event.event === "subscription.create" || event.event === "invoice.payment_failed") {
      // Log but don't block — handle in monitoring
      console.log(`[Paystack Webhook] ${event.event}:`, event.data.reference);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paystack Webhook] Error:", error);
    return NextResponse.json({ received: true }); // always return 200 to Paystack
  }
}

// Paystack requires this endpoint to be accessible without CSRF
export const runtime = "nodejs";
