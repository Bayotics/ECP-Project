import type { Event, RSVP } from "@/lib/models";
import type { Recipient, BatchResult } from "@/lib/server/notifications";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { eventEmail } from "@/lib/server/email-templates";
import { adminRecipients } from "@/lib/server/admin-notifications";

export type NotificationType = "announcement" | "reminder" | "cancellation";

export async function sendRSVPConfirmation(rsvp: RSVP, event: Event) {
  const url = `${siteUrl()}/events/${encodeURIComponent(event.slug)}`;
  const confirmation = await sendEmail({ to: rsvp.email, ...eventEmail(event, "confirmation", url, rsvp), tags: { type: "event-registration", eventId: event.id, rsvpId: rsvp.id } });
  let adminEmailsSent = 0, adminEmailsFailed = 0;
  try {
    const admins = await adminRecipients();
    const results = await Promise.all(admins.map(admin => sendEmail({
      to: admin.email,
      ...eventEmail(event, "admin", `${siteUrl()}/admin/events`, rsvp),
      tags: { type: "admin-event-registration", eventId: event.id, rsvpId: rsvp.id },
    })));
    adminEmailsSent = results.filter(result => result.ok).length;
    adminEmailsFailed = results.length - adminEmailsSent;
  } catch (error) { console.error("[events] Admin notification failed", error); adminEmailsFailed++; }
  return { confirmationEmailSent: confirmation.ok, adminEmailsSent, adminEmailsFailed };
}

export async function sendEventNotifications(event: Event, recipients: Recipient[], type: NotificationType, channel: "email" | "sms" | "both"): Promise<BatchResult> {
  const result: BatchResult = { emailSent: 0, emailFailed: 0, smsSent: 0, smsFailed: 0 };
  const message = eventEmail(event, type, `${siteUrl()}/events/${encodeURIComponent(event.slug)}`);
  // Bound provider concurrency for large member/newsletter lists.
  for (let offset = 0; offset < recipients.length; offset += 10) {
    await Promise.all(recipients.slice(offset, offset + 10).map(async recipient => {
      if (channel === "email" || channel === "both") {
        const sent = await sendEmail({ to: recipient.email, ...message, tags: { type: `event-${type}`, eventId: event.id } });
        if (sent.ok) result.emailSent++; else result.emailFailed++;
      }
      // SMS remains handled by the existing optional Twilio integration.
      if ((channel === "sms" || channel === "both") && recipient.phone) {
        const { sendSMS } = await import("@/lib/server/notifications");
        const sent = await sendSMS(recipient.phone, `${message.subject}. ${event.date}${event.time ? ` at ${event.time}` : ""}. ${event.location}. ${siteUrl()}/events/${event.slug}`);
        if (sent) result.smsSent++; else result.smsFailed++;
      }
    }));
  }
  return result;
}
