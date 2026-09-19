import { NextRequest, NextResponse } from "next/server";
import { paypalCreateOrder, isPayPalConfigured } from "@/lib/server/paypal";

/* The club charges in US dollars, so amounts arrive as dollars and go to
   PayPal unchanged. This used to take naira and divide by a hard-coded
   exchange rate, which meant the amount a donor was charged drifted with
   whatever USD_TO_NGN_RATE happened to be set to. */

export async function POST(request: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ ok: false, error: "PayPal is not configured on this server." }, { status: 503 });
    }

    const { amountUSD, description, invoiceId } = (await request.json()) as {
      amountUSD: number;
      description: string;
      invoiceId?: string;
    };

    if (!amountUSD || amountUSD <= 0 || !description) {
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
