import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import type { MembershipApplication } from "@/lib/models";
import { APPLICATION_FEE_USD } from "@/lib/models/membership";

/* Records the $100 non-refundable application fee against an application.
 *
 * The two methods settle differently, and the status reflects that honestly:
 *
 *   paypal  the capture already succeeded on PayPal's side before this is
 *           called, so the fee is `paid`.
 *   zelle   the applicant says they have sent it; nothing has been verified.
 *           It is `pending-confirmation` until the treasurer checks the
 *           club's account. Marking it `paid` here would let anyone claim to
 *           have paid by typing a reference.
 */

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;

    const body = (await request.json().catch(() => ({}))) as {
      method?: "paypal" | "zelle";
      reference?: string;
    };

    if (body.method !== "paypal" && body.method !== "zelle") {
      return NextResponse.json(
        { ok: false, error: "Choose PayPal or Zelle." },
        { status: 400 },
      );
    }

    const collection = await getCollection("membershipApplications");
    const existing = await collection.findOne({ id });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Application not found" }, { status: 404 });
    }
    if (existing.feeStatus === "paid") {
      return NextResponse.json({ ok: true, data: serializeDocument(existing), alreadyPaid: true });
    }

    const now = new Date().toISOString();
    const feeStatus: MembershipApplication["feeStatus"] =
      body.method === "paypal" ? "paid" : "pending-confirmation";

    const note =
      body.method === "paypal"
        ? `Application fee of $${APPLICATION_FEE_USD} paid by PayPal.`
        : `Applicant reported a Zelle transfer of $${APPLICATION_FEE_USD}. Awaiting confirmation by the treasurer.`;

    const result = await collection.findOneAndUpdate(
      { id },
      {
        $set: {
          feeStatus,
          feeMethod: body.method,
          feeReference: body.reference?.trim(),
          feePaidAt: now,
        },
        $push: { statusHistory: { status: existing.status, date: now, message: note } },
      },
      { returnDocument: "after" },
    );

    return NextResponse.json({ ok: true, data: serializeDocument(result) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record the fee";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
