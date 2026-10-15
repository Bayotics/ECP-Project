import { sendEmail, siteUrl } from "@/lib/server/email";
import { applicationReceivedEmail, applicationStatusEmail } from "@/lib/server/email-templates";
import {
  APPLICATION_FEE_USD,
  MEMBERSHIP_CONTACT_EMAIL,
  type ApplicationStatus,
  type MembershipApplication,
} from "@/lib/models/membership";

/* Telling the applicant what has happened to their own application.
 *
 * Both functions here never throw. They run after the database has already
 * been written, so a mail provider having a bad minute must not turn a
 * recorded payment or a completed review into an error: the failure is
 * logged and reported in the return value, and the record stands.
 */

/**
 * The applicant's receipt, sent at the same moment the administrators are
 * notified: their application arrived, and so did their fee.
 */
export async function notifyApplicantOfApplicationFee(
  application: MembershipApplication,
): Promise<{ sent: boolean }> {
  try {
    if (!application.email?.trim()) {
      console.warn("[applicant-notify] Application has no email address; no receipt was sent.");
      return { sent: false };
    }

    const { subject, html } = applicationReceivedEmail({
      name: application.fullName,
      method: application.feeMethod === "zelle" ? "zelle" : "paypal",
      amountUSD: APPLICATION_FEE_USD,
      reference: application.feeReference,
      statusUrl: `${siteUrl()}/membership/status`,
      referencesEmail: MEMBERSHIP_CONTACT_EMAIL,
    });

    const result = await sendEmail({
      to: application.email,
      subject,
      html,
      tags: { type: "applicant-application-received", applicationId: application.id },
    });

    if (!result.ok) {
      console.error(`[applicant-notify] Receipt to ${application.email} failed: ${result.error}`);
    }
    return { sent: result.ok };
  } catch (caught) {
    console.error("[applicant-notify] Could not send the application receipt", caught);
    return { sent: false };
  }
}

/**
 * Tells the applicant that their application has moved on.
 *
 * The internal review notes are deliberately not passed in. They are
 * written for the committee, and an administrator typing a frank note has
 * every right to assume it stays inside the club.
 */
export async function notifyApplicantOfStatus(
  application: MembershipApplication,
  status: ApplicationStatus,
): Promise<{ sent: boolean }> {
  try {
    if (!application.email?.trim()) {
      console.warn("[applicant-notify] Application has no email address; status not sent.");
      return { sent: false };
    }

    const { subject, html } = applicationStatusEmail({
      name: application.fullName,
      status,
      statusUrl: `${siteUrl()}/membership/status`,
      portalUrl: `${siteUrl()}/auth/login`,
      contactEmail: MEMBERSHIP_CONTACT_EMAIL,
    });

    const result = await sendEmail({
      to: application.email,
      subject,
      html,
      tags: { type: "applicant-status", status, applicationId: application.id },
    });

    if (!result.ok) {
      console.error(
        `[applicant-notify] Status "${status}" to ${application.email} failed: ${result.error}`,
      );
    }
    return { sent: result.ok };
  } catch (caught) {
    console.error("[applicant-notify] Could not send the status email", caught);
    return { sent: false };
  }
}
