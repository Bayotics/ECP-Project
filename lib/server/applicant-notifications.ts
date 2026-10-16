import { sendEmail, siteUrl } from "@/lib/server/email";
import {
  applicationReceivedEmail,
  applicationStatusEmail,
  membershipApprovedEmail,
} from "@/lib/server/email-templates";
import {
  APPLICATION_FEE_USD,
  MEMBERSHIP_CONTACT_EMAIL,
  type ApplicationStatus,
  type MembershipApplication,
} from "@/lib/models/membership";
import { formatClubDateTime } from "@/lib/club-time";

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
  rescheduled = false,
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
      /* Always rendered in club time, never the server's: this runs on a
         host that is almost certainly set to UTC. */
      interview:
        status === "interview" && application.interviewAt
          ? {
              when: formatClubDateTime(application.interviewAt),
              location: application.interviewLocation,
              rescheduled,
            }
          : undefined,
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

/**
 * The approval email, carrying the new member's club number.
 *
 * Separate from the plain status note because it is the only copy of
 * something they need to keep, and because it has to explain that the
 * number is their first password and should not stay that way.
 */
export async function notifyApplicantOfApproval(options: {
  application: MembershipApplication;
  membershipId: string;
  /** False when an existing password was deliberately left in place. */
  passwordSet: boolean;
}): Promise<{ sent: boolean }> {
  const { application, membershipId, passwordSet } = options;
  try {
    if (!application.email?.trim()) {
      console.warn("[applicant-notify] Application has no email address; approval not sent.");
      return { sent: false };
    }

    const { subject, html } = membershipApprovedEmail({
      name: application.fullName,
      membershipId,
      email: application.email,
      loginUrl: `${siteUrl()}/auth/login`,
      contactEmail: MEMBERSHIP_CONTACT_EMAIL,
      passwordSet,
    });

    const result = await sendEmail({
      to: application.email,
      subject,
      html,
      tags: { type: "membership-approved", applicationId: application.id },
    });

    if (!result.ok) {
      console.error(
        `[applicant-notify] Approval to ${application.email} failed: ${result.error}`,
      );
    }
    return { sent: result.ok };
  } catch (caught) {
    console.error("[applicant-notify] Could not send the approval email", caught);
    return { sent: false };
  }
}
