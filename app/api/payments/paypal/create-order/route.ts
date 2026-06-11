import { NextRequest, NextResponse } from "next/server";
import { paypalCreateOrder, isPayPalConfigured } from "@/lib/server/paypal";

const USD_RATE = Number(process.env.USD_TO_NGN_RATE) || 1600;

export async function POST(request: NextRequest) {
  try {
    if (!isPayPalConfigured()) {
      return NextResponse.json({ ok: false, error: "PayPal is not configured on this server." }, { status: 503 });
    }

    const { amountNGN, description, invoiceId } = (await request.json()) as {
      amountNGN: number;
      description: string;
      invoiceId?: string;
    };

    if (!amountNGN || !description) {
      return NextResponse.json({ ok: false, error: "amountNGN and description are required" }, { status: 400 });
    }

    const amountUSD = (amountNGN / USD_RATE).toFixed(2);
    const order = await paypalCreateOrder({ amountUSD, description, invoiceId });

    return NextResponse.json({ ok: true, data: { orderId: order.id, amountUSD } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create PayPal order";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
