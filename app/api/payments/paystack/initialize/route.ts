import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { paystackInitialize, isPaystackConfigured } from "@/lib/server/paystack";
import { getSessionUser } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  try {
    if (!isPaystackConfigured()) {
      return NextResponse.json({ ok: false, error: "Paystack is not configured on this server." }, { status: 503 });
    }

    const body = (await request.json()) as {
      email: string;
      amountNGN: number;
      context: "donation" | "dues" | "order";
      metadata?: Record<string, unknown>;
      planCode?: string;
    };

    if (!body.email || !body.amountNGN || !body.context) {
      return NextResponse.json({ ok: false, error: "email, amountNGN, and context are required" }, { status: 400 });
    }

    const sessionUser = await getSessionUser(request);
    const reference = `ECP-${body.context.toUpperCase()}-${nanoid(10)}`;

    const data = await paystackInitialize({
      email: body.email,
      amount: Math.round(body.amountNGN * 100), // convert to kobo
      reference,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/callback`,
      metadata: {
        ...body.metadata,
        context: body.context,
        userId: sessionUser?.id,
      },
      planCode: body.planCode,
    });

    return NextResponse.json({ ok: true, data: { ...data, reference } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize payment";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
