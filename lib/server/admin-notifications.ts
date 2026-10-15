import { getCollection } from "@/lib/server/collections";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { applicationFeeAdminEmail } from "@/lib/server/email-templates";
import { APPLICATION_FEE_USD, type MembershipApplication } from "@/lib/models/membership";

/* Telling the club's administrators that something needs their attention. */

const ADMIN_ROLES = ["admin", "super-admin"] as const;

export interface AdminRecipient {
  email: string;
  name: string;
}

/** Every active administrator with an email address. */
export async function adminRecipients(): Promise<AdminRecipient[]> {
  const users = await getCollection("users");
  const rows = await users
    .find({ role: { $in: ADMIN_ROLES }, status: { $ne: "suspended" } })
    .toArray();

  /* De-duplicated on the address, in case two accounts share one inbox. */
  const seen = new Map<string, AdminRecipient>();
  for (const u of rows) {
    const email = u.email?.trim().toLowerCase();
    if (!email) continue;
    if (!seen.has(email)) seen.set(email, { email, name: u.displayName ?? email });
  }
  return [...seen.values()];
}

/**
 * Tells every administrator that an applicant has settled, or says they
 * have settled, the application fee.
 *
 * One message per administrator rather than one with everybody in `to`:
 * it keeps the club's internal addresses from being shown to each other,
 * and one bad address cannot take the rest of the batch down with it.
 *
 * Never throws. This runs after the fee has already been recorded, so a
 * mail problem must not turn a successful payment into an error for the
 * applicant; it is reported in the result and logged instead.
 */
export async function notifyAdminsOfApplicationFee(
  application: MembershipApplication,
): Promise<{ sent: number; failed: number; recipients: number }> {
  try {
    const admins = await adminRecipients();
    if (admins.length === 0) {
      console.warn("[admin-notify] No administrator has an email address; nobody was told.");
      return { sent: 0, failed: 0, recipients: 0 };
    }

    const { subject, html } = applicationFeeAdminEmail({
      applicantName: application.fullName,
      applicantEmail: application.email,
      applicantPhone: application.phone,
      method: application.feeMethod === "zelle" ? "zelle" : "paypal",
      reference: application.feeReference,
      amountUSD: APPLICATION_FEE_USD,
      appliedAt: application.appliedAt,
      adminUrl: `${siteUrl()}/admin/applications`,
    });

    const results = await Promise.all(
      admins.map((a) =>
        sendEmail({
          to: a.email,
          subject,
          html,
          tags: { type: "admin-application-fee", applicationId: application.id },
        }),
      ),
    );

    const sent = results.filter((r) => r.ok).length;
    const failed = results.length - sent;
    if (failed) {
      const why = results.find((r) => !r.ok);
      console.error(
        `[admin-notify] ${failed} of ${results.length} admin emails failed:`,
        why && !why.ok ? why.error : "unknown",
      );
    }
    return { sent, failed, recipients: admins.length };
  } catch (caught) {
    console.error("[admin-notify] Could not notify administrators", caught);
    return { sent: 0, failed: 0, recipients: 0 };
  }
}
