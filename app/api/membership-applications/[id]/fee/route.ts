import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import type { MembershipApplication } from "@/lib/models";
import { APPLICATION_FEE_USD } from "@/lib/models/membership";
import { notifyAdminsOfApplicationFee } from "@/lib/server/admin-notifications";
import { notifyApplicantOfApplicationFee } from "@/lib/server/applicant-notifications";

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
      /* Already settled: a reload or a double click must not send the
         administrators the same application a second time. */
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

    const application = serializeDocument(result);

    /* Tell the administrators, and give the applicant their receipt. Both
       run after the fee is already recorded and neither can throw, so a
       mail problem never turns a settled payment into an error for the
       applicant: they are told it went through, because it did, and the
       failure goes to the server log.

       Sent together because they describe the same moment, and the two
       audiences need different words for it: the applicant is told what
       they have to do next, the administrators what they have to check. */
    const [notified, receipt] = application
      ? await Promise.all([
          notifyAdminsOfApplicationFee(application),
          notifyApplicantOfApplicationFee(application),
        ])
      : [{ sent: 0, failed: 0, recipients: 0 }, { sent: false }];

    return NextResponse.json({
      ok: true,
      data: application,
      adminsNotified: notified.sent,
      applicantNotified: receipt.sent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record the fee";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
