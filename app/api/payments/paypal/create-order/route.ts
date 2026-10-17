import { NextRequest, NextResponse } from "next/server";
import { paypalCreateOrder, isPayPalConfigured } from "@/lib/server/paypal";
import { getSessionUser } from "@/lib/server/session";
import { getCollection } from "@/lib/server/collections";

/* The club charges in US dollars, so amounts arrive as dollars and go to
   PayPal unchanged. This used to take naira and divide by a hard-coded
   exchange rate, which meant the amount a donor was charged drifted with
   whatever USD_TO_NGN_RATE happened to be set to. */

export async function POST(request: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ ok: false, error: "PayPal is not configured on this server." }, { status: 503 });
    }

    const { amountUSD, description, invoiceId, context } = (await request.json()) as {
      amountUSD: number;
      description: string;
      invoiceId?: string;
      context?: string;
    };

    // Detect dues by ID as well as context so omitting context cannot bypass validation.
    const duesCol = await getCollection("duesPayments");
    const dues = invoiceId ? await duesCol.findOne({ id: invoiceId }) : null;
    if (context === "dues" || dues) {
      const user = await getSessionUser(request);
      if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      if (!dues || dues.userId !== user.id) return NextResponse.json({ ok: false, error: "Payment not found" }, { status: 404 });
      if (dues.status !== "pending" || dues.schemaVersion !== 2 || dues.submittedAt) return NextResponse.json({ ok: false, error: "This invoice is not payable through PayPal" }, { status: 409 });
      const reservation = `creating:${dues.id}`;
      if (dues.paypalOrderId && dues.paypalOrderId !== reservation) return NextResponse.json({ ok: true, data: { orderId: dues.paypalOrderId, amountUSD: dues.amount.toFixed(2) } });
      const reserved = await duesCol.updateOne({ id: dues.id, status: "pending", submittedAt: { $exists: false }, $or: [{ paypalOrderId: { $exists: false } }, { paypalOrderId: reservation }] }, { $set: { paypalOrderId: reservation, paymentMethod: "paypal" } });
      if (!reserved.matchedCount) return NextResponse.json({ ok: false, error: "Payment changed. Refresh and try again." }, { status: 409 });
      const order = await paypalCreateOrder({ amountUSD: dues.amount.toFixed(2), description: `ECP dues ${dues.coverageStart} to ${dues.coverageEnd}`, invoiceId: dues.id, requestId: `dues-${dues.id}` });
      await duesCol.updateOne({ id: dues.id, paypalOrderId: reservation }, { $set: { paypalOrderId: order.id, updatedAt: new Date().toISOString() } });
      return NextResponse.json({ ok: true, data: { orderId: order.id, amountUSD: dues.amount.toFixed(2) } });
    }

    if (!Number.isFinite(amountUSD) || amountUSD <= 0 || !description) {
      return NextResponse.json({ ok: false, error: "amountUSD and description are required" }, { status: 400 });
    }

    const amount = amountUSD.toFixed(2);
    const order = await paypalCreateOrder({ amountUSD: amount, description, invoiceId });

    return NextResponse.json({ ok: true, data: { orderId: order.id, amountUSD: amount } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create PayPal order";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
