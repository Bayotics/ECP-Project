import nodemailer from "nodemailer";
import type { Donation, DuesPayment, Event, Order, RSVP } from "@/lib/models";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Recipient {
  email: string;
  name?: string;
  phone?: string;
}

export interface BatchResult {
  emailSent: number;
  emailFailed: number;
  smsSent: number;
  smsFailed: number;
}

// ─── Transport ────────────────────────────────────────────────────────────────

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getSMSClient(): { accountSid: string; authToken: string; from: string } | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !from) return null;
  return { accountSid, authToken, from };
}

// ─── Email helpers ────────────────────────────────────────────────────────────

const FROM_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "ECP Platform";
const FROM_EMAIL = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "noreply@ecp.org";

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}
  .wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
  .header{background:#059669;padding:28px 32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:22px;font-weight:700}
  .header p{color:#d1fae5;margin:4px 0 0;font-size:13px}
  .body{padding:28px 32px}
  .body p{color:#374151;font-size:15px;line-height:1.6;margin:0 0 14px}
  .highlight{background:#f0fdf4;border-left:4px solid #059669;padding:14px 16px;border-radius:4px;margin:18px 0}
  .highlight p{margin:0;font-size:14px;color:#065f46}
  .badge{display:inline-block;background:#059669;color:#fff;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600}
  .badge.red{background:#dc2626}
  .badge.blue{background:#2563eb}
  .btn{display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;font-size:14px;margin:8px 0}
  .footer{background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af}
  .footer a{color:#059669;text-decoration:none}
  hr{border:none;border-top:1px solid #e5e7eb;margin:20px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>${FROM_NAME}</h1>
    <p>Eko Club Philadelphia</p>
  </div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>© ${new Date().getFullYear()} Eko Club Philadelphia. All rights reserved.</p>
    <p>You are receiving this because you are a member or subscriber.
    <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ecp.org"}/unsubscribe">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
}

// ─── SMS helper ───────────────────────────────────────────────────────────────

async function sendSMS(to: string, body: string): Promise<boolean> {
  const creds = getSMSClient();
  if (!creds) return false;

  try {
    // Dynamic import keeps Twilio optional — no crash if not installed/configured
    const twilio = await import("twilio");
    const client = twilio.default(creds.accountSid, creds.authToken);
    await client.messages.create({ body, from: creds.from, to });
    return true;
  } catch (err) {
    console.error("[SMS] Failed to send to", to, err);
    return false;
  }
}

// ─── Single email ─────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP not configured — skipping email to", to);
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("[Email] Failed to send to", to, err);
    return false;
  }
}

// ─── RSVP Confirmation ────────────────────────────────────────────────────────

export async function sendRSVPConfirmation(rsvp: RSVP, event: Event): Promise<void> {
  const date = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const time = event.time ?? "";

  const emailHtml = emailWrapper(
    `Registration Confirmed — ${event.title}`,
    `<p>Hi <strong>${rsvp.name}</strong>,</p>
    <p>Your registration for <strong>${event.title}</strong> has been confirmed!</p>
    <div class="highlight">
      <p><strong>📅 Date:</strong> ${date}${time ? ` at ${time}` : ""}</p>
      <p><strong>📍 Location:</strong> ${event.location}${event.venue ? ` — ${event.venue}` : ""}</p>
      ${event.isOnline && event.meetingUrl ? `<p><strong>🔗 Meeting Link:</strong> <a href="${event.meetingUrl}">${event.meetingUrl}</a></p>` : ""}
      <p><strong>🎟 Confirmation ID:</strong> <code>${rsvp.id}</code></p>
      ${rsvp.guestCount ? `<p><strong>👥 Additional Guests:</strong> ${rsvp.guestCount}</p>` : ""}
    </div>
    <p>Please save this confirmation. We look forward to seeing you!</p>
    ${event.registrationDeadline ? `<p style="font-size:13px;color:#6b7280;">Registration deadline: ${new Date(event.registrationDeadline).toLocaleDateString()}</p>` : ""}
    <hr>
    <p style="font-size:13px;color:#6b7280;">If you need to cancel, please contact us at least 24 hours before the event.</p>`
  );

  await sendEmail(rsvp.email, `✅ You're registered for ${event.title}`, emailHtml);

  if (rsvp.phone) {
    const smsBody = `ECP: You're registered for "${event.title}" on ${date}${time ? ` at ${time}` : ""}. Location: ${event.location}. ID: ${rsvp.id}`;
    await sendSMS(rsvp.phone, smsBody);
  }
}

// ─── Batch event notifications ────────────────────────────────────────────────

export type NotificationType = "announcement" | "reminder" | "cancellation";

export async function sendEventNotifications(
  event: Event,
  recipients: Recipient[],
  type: NotificationType,
  channel: "email" | "sms" | "both"
): Promise<BatchResult> {
  const result: BatchResult = { emailSent: 0, emailFailed: 0, smsSent: 0, smsFailed: 0 };
  if (recipients.length === 0) return result;

  const date = new Date(event.date).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const time = event.time ?? "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const eventUrl = `${siteUrl}/events/${event.slug}`;

  let subject = "";
  let bodyHtml = "";
  let smsText = "";

  if (type === "announcement") {
    subject = `📣 New Event: ${event.title}`;
    bodyHtml = `
      <p>We have an exciting upcoming event and we'd love to see you there!</p>
      <div class="highlight">
        <p style="font-size:18px;font-weight:700;margin-bottom:8px">${event.title}</p>
        <p><strong>📅 Date:</strong> ${date}${time ? ` at ${time}` : ""}</p>
        <p><strong>📍 Location:</strong> ${event.location}${event.venue ? ` — ${event.venue}` : ""}</p>
        ${event.shortDescription ? `<p>${event.shortDescription}</p>` : ""}
        ${event.membersOnly ? `<p><span class="badge">Members Only</span></p>` : ""}
      </div>
      <p><a href="${eventUrl}" class="btn">View Event & Register →</a></p>
      ${event.maxAttendees ? `<p style="font-size:13px;color:#6b7280;">Limited to ${event.maxAttendees} attendees.</p>` : ""}
    `;
    smsText = `ECP EVENT: "${event.title}" on ${date}${time ? ` at ${time}` : ""}. ${event.location}. Register: ${eventUrl}`;
  } else if (type === "reminder") {
    subject = `⏰ Reminder: ${event.title} is coming up!`;
    bodyHtml = `
      <p>This is a friendly reminder about an upcoming event you may be interested in:</p>
      <div class="highlight">
        <p style="font-size:18px;font-weight:700;margin-bottom:8px">${event.title}</p>
        <p><strong>📅 Date:</strong> ${date}${time ? ` at ${time}` : ""}</p>
        <p><strong>📍 Location:</strong> ${event.location}${event.venue ? ` — ${event.venue}` : ""}</p>
        ${event.isOnline && event.meetingUrl ? `<p><strong>🔗 Meeting Link:</strong> <a href="${event.meetingUrl}">${event.meetingUrl}</a></p>` : ""}
      </div>
      <p><a href="${eventUrl}" class="btn">View Details →</a></p>
    `;
    smsText = `ECP REMINDER: "${event.title}" is on ${date}${time ? ` at ${time}` : ""}. ${event.location}. Details: ${eventUrl}`;
  } else {
    subject = `❌ Event Cancelled: ${event.title}`;
    bodyHtml = `
      <p>We regret to inform you that the following event has been <strong>cancelled</strong>:</p>
      <div class="highlight" style="border-left-color:#dc2626">
        <p style="font-size:18px;font-weight:700;margin-bottom:8px">${event.title}</p>
        <p><strong>📅 Originally Scheduled:</strong> ${date}${time ? ` at ${time}` : ""}</p>
        <p><strong>📍 Location:</strong> ${event.location}</p>
      </div>
      <p>We apologise for any inconvenience caused. Stay tuned for future events from Eko Club Philadelphia.</p>
    `;
    smsText = `ECP: "${event.title}" on ${date} has been CANCELLED. We apologise for the inconvenience.`;
  }

  const fullHtml = emailWrapper(subject, bodyHtml);

  const emailPromises: Promise<void>[] = [];
  const smsPromises: Promise<void>[] = [];

  for (const recipient of recipients) {
    if (channel === "email" || channel === "both") {
      emailPromises.push(
        sendEmail(recipient.email, subject, fullHtml).then((ok) => {
          if (ok) result.emailSent++; else result.emailFailed++;
        })
      );
    }
    if ((channel === "sms" || channel === "both") && recipient.phone) {
      smsPromises.push(
        sendSMS(recipient.phone, smsText).then((ok) => {
          if (ok) result.smsSent++; else result.smsFailed++;
        })
      );
    }
  }

  await Promise.allSettled([...emailPromises, ...smsPromises]);
  return result;
}

// ─── Shared receipt helpers ───────────────────────────────────────────────────

function adminEmail() {
  return process.env.ADMIN_EMAIL ?? process.env.SMTP_USER ?? "";
}

function fmtAmount(amount: number, currency = "₦") {
  return `${currency}${amount.toLocaleString("en-NG")}`;
}

// ─── Donation receipt ─────────────────────────────────────────────────────────

export async function sendDonationReceipt(donation: Donation): Promise<void> {
  if (!donation.donorEmail) return;

  const isRecurring = donation.type !== "one-time";
  const subject = `🧾 Donation Receipt — ${donation.referenceNumber}`;

  const html = emailWrapper(subject, `
    <p>Dear <strong>${donation.donorName}</strong>,</p>
    <p>Thank you for your generous donation to <strong>Eko Club Philadelphia</strong>. Here is your official receipt:</p>
    <div class="highlight">
      <p><strong>Reference:</strong> ${donation.referenceNumber}</p>
      <p><strong>Amount:</strong> ${fmtAmount(donation.amount)}${isRecurring ? ` / ${donation.type}` : ""}</p>
      <p><strong>Cause:</strong> ${donation.cause.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
      <p><strong>Payment Method:</strong> ${(donation.paymentMethod ?? "N/A").replace(/-/g, " ").toUpperCase()}</p>
      <p><strong>Status:</strong> <span style="color:#059669;font-weight:700">Successful</span></p>
      <p><strong>Date:</strong> ${new Date(donation.updatedAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      ${donation.paystackRef ? `<p><strong>Paystack Ref:</strong> ${donation.paystackRef}</p>` : ""}
      ${donation.paypalCaptureId ? `<p><strong>PayPal Capture:</strong> ${donation.paypalCaptureId}</p>` : ""}
    </div>
    ${isRecurring ? `<p>Your <strong>${donation.type}</strong> donation is now active. You may cancel at any time from your member portal.</p>` : ""}
    ${donation.message ? `<div class="highlight"><p><em>"${donation.message}"</em></p></div>` : ""}
    <p>Your donation helps fund civic education, youth empowerment, and community advocacy across Lagos. Thank you!</p>
    <hr>
    <p style="font-size:13px;color:#6b7280">This is an official receipt. Please retain it for your records.</p>
  `);

  const smsText = `ECP: Donation of ${fmtAmount(donation.amount)} received. Ref: ${donation.referenceNumber}. Thank you!`;

  await Promise.allSettled([
    sendEmail(donation.donorEmail, subject, html),
    donation.donorPhone ? sendSMS(donation.donorPhone, smsText) : Promise.resolve(),
  ]);

  // Admin notification
  const adminAddr = adminEmail();
  if (adminAddr) {
    const adminHtml = emailWrapper(`💰 New Donation — ${donation.referenceNumber}`, `
      <p>A new donation has been received:</p>
      <div class="highlight">
        <p><strong>Donor:</strong> ${donation.isAnonymous ? "Anonymous" : donation.donorName}</p>
        <p><strong>Email:</strong> ${donation.donorEmail}</p>
        <p><strong>Amount:</strong> ${fmtAmount(donation.amount)}${isRecurring ? ` / ${donation.type}` : ""}</p>
        <p><strong>Cause:</strong> ${donation.cause.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</p>
        <p><strong>Reference:</strong> ${donation.referenceNumber}</p>
        <p><strong>Method:</strong> ${(donation.paymentMethod ?? "N/A").toUpperCase()}</p>
      </div>
    `);
    sendEmail(adminAddr, `💰 New Donation: ${fmtAmount(donation.amount)} — ${donation.referenceNumber}`, adminHtml).catch(console.error);
  }
}

// ─── Order receipt ────────────────────────────────────────────────────────────

export async function sendOrderReceipt(order: Order): Promise<void> {
  if (!order.customerEmail) return;

  const subject = `🧾 Order Confirmed — ${order.orderNumber}`;
  const itemsHtml = order.items.map(item =>
    `<tr><td style="padding:6px 0;color:#374151">${item.productName}</td><td style="padding:6px 0;color:#374151;text-align:center">×${item.quantity}</td><td style="padding:6px 0;color:#374151;text-align:right;font-weight:600">${fmtAmount(item.subtotal)}</td></tr>`
  ).join("");

  const html = emailWrapper(subject, `
    <p>Dear <strong>${order.customerName}</strong>,</p>
    <p>Your order has been confirmed and is being processed. Here is your receipt:</p>
    <div class="highlight">
      <p><strong>Order Number:</strong> <span style="font-size:18px;font-weight:700">${order.orderNumber}</span></p>
      <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p><strong>Payment Method:</strong> ${(order.paymentMethod ?? "N/A").replace(/-/g, " ").toUpperCase()}</p>
      ${order.paystackRef ? `<p><strong>Paystack Ref:</strong> ${order.paystackRef}</p>` : ""}
      ${order.paypalCaptureId ? `<p><strong>PayPal Capture:</strong> ${order.paypalCaptureId}</p>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead><tr style="border-bottom:2px solid #e5e7eb">
        <th style="text-align:left;padding:6px 0;font-size:12px;color:#6b7280">Item</th>
        <th style="text-align:center;padding:6px 0;font-size:12px;color:#6b7280">Qty</th>
        <th style="text-align:right;padding:6px 0;font-size:12px;color:#6b7280">Subtotal</th>
      </tr></thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot><tr style="border-top:2px solid #e5e7eb">
        <td colspan="2" style="padding:8px 0;font-weight:700">Total</td>
        <td style="padding:8px 0;font-weight:700;text-align:right;color:#059669">${fmtAmount(order.total)}</td>
      </tr></tfoot>
    </table>
    ${order.shippingAddress ? `
    <div class="highlight">
      <p style="font-weight:600;margin-bottom:4px">Shipping Address</p>
      <p>${order.shippingAddress.fullName}<br>${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.country}</p>
      <p>${order.shippingAddress.phone}</p>
    </div>` : ""}
    <p>We will notify you when your order ships. Thank you for supporting Eko Club Philadelphia!</p>
  `);

  await sendEmail(order.customerEmail, subject, html);

  const adminAddr = adminEmail();
  if (adminAddr) {
    const adminHtml = emailWrapper(`🛒 New Order — ${order.orderNumber}`, `
      <p>A new order has been placed:</p>
      <div class="highlight">
        <p><strong>Order:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${order.customerName} &lt;${order.customerEmail}&gt;</p>
        <p><strong>Total:</strong> ${fmtAmount(order.total)}</p>
        <p><strong>Items:</strong> ${order.items.length}</p>
        <p><strong>Method:</strong> ${(order.paymentMethod ?? "N/A").toUpperCase()}</p>
      </div>
    `);
    sendEmail(adminAddr, `🛒 New Order: ${order.orderNumber} — ${fmtAmount(order.total)}`, adminHtml).catch(console.error);
  }
}

// ─── Dues receipt ─────────────────────────────────────────────────────────────

export async function sendDuesReceipt(dues: DuesPayment, memberName: string, memberEmail: string, memberPhone?: string): Promise<void> {
  const subject = `🧾 Dues Receipt — ${dues.year} Annual Membership`;

  const html = emailWrapper(subject, `
    <p>Dear <strong>${memberName}</strong>,</p>
    <p>Your <strong>${dues.year} annual membership dues</strong> have been successfully received. Thank you for staying current with your membership!</p>
    <div class="highlight">
      <p><strong>Member:</strong> ${memberName}</p>
      <p><strong>Year:</strong> ${dues.year}</p>
      <p><strong>Amount Paid:</strong> ${fmtAmount(dues.amount)}</p>
      <p><strong>Payment Method:</strong> ${(dues.paymentMethod ?? "N/A").replace(/-/g, " ").toUpperCase()}</p>
      <p><strong>Reference:</strong> ${dues.reference ?? "N/A"}</p>
      <p><strong>Date Paid:</strong> ${dues.paidDate ? new Date(dues.paidDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A"}</p>
      ${dues.paystackRef ? `<p><strong>Paystack Ref:</strong> ${dues.paystackRef}</p>` : ""}
      ${dues.paypalCaptureId ? `<p><strong>PayPal Capture:</strong> ${dues.paypalCaptureId}</p>` : ""}
      ${dues.autoRenew ? `<p style="color:#059669"><strong>✓ Auto-renewal:</strong> Active — your dues will be automatically renewed next year.</p>` : ""}
    </div>
    <p>Your membership is now active for <strong>${dues.year}</strong>. We look forward to your continued participation in Eko Club Philadelphia.</p>
    <hr>
    <p style="font-size:13px;color:#6b7280">This is an official receipt. Please retain it for your records.</p>
  `);

  const smsText = `ECP: ${dues.year} dues of ${fmtAmount(dues.amount)} received. Ref: ${dues.reference ?? "N/A"}. Your membership is active. Thank you!`;

  await Promise.allSettled([
    sendEmail(memberEmail, subject, html),
    memberPhone ? sendSMS(memberPhone, smsText) : Promise.resolve(),
  ]);

  const adminAddr = adminEmail();
  if (adminAddr) {
    const adminHtml = emailWrapper(`💳 Dues Payment — ${memberName}`, `
      <p>A member has paid their annual dues:</p>
      <div class="highlight">
        <p><strong>Member:</strong> ${memberName} &lt;${memberEmail}&gt;</p>
        <p><strong>Year:</strong> ${dues.year}</p>
        <p><strong>Amount:</strong> ${fmtAmount(dues.amount)}</p>
        <p><strong>Method:</strong> ${(dues.paymentMethod ?? "N/A").toUpperCase()}</p>
        <p><strong>Reference:</strong> ${dues.reference ?? "N/A"}</p>
        ${dues.autoRenew ? `<p><strong>Auto-renewal:</strong> Yes</p>` : ""}
      </div>
    `);
    sendEmail(adminAddr, `💳 Dues Paid: ${memberName} — ${dues.year}`, adminHtml).catch(console.error);
  }
}

// ─── Zelle pending notification ───────────────────────────────────────────────

export async function sendZellePendingNotification(params: {
  payerName: string;
  payerEmail: string;
  amount: number;
  reference: string;
  type: "donation" | "dues" | "order";
  details?: string;
}): Promise<void> {
  const subject = `⏳ Zelle Payment Pending — ${params.reference}`;

  const userHtml = emailWrapper(subject, `
    <p>Dear <strong>${params.payerName}</strong>,</p>
    <p>We have received your Zelle payment instructions for <strong>${fmtAmount(params.amount)}</strong>.</p>
    <div class="highlight">
      <p><strong>Reference:</strong> ${params.reference}</p>
      <p><strong>Amount:</strong> ${fmtAmount(params.amount)}</p>
      <p><strong>Type:</strong> ${params.type.charAt(0).toUpperCase() + params.type.slice(1)}</p>
      ${params.details ? `<p><strong>Details:</strong> ${params.details}</p>` : ""}
    </div>
    <p>Once your Zelle transfer is confirmed by our team, you will receive a receipt email. This usually takes 1–2 business days.</p>
    <div class="highlight" style="border-left-color:#2563eb">
      <p style="font-weight:600;margin-bottom:4px">Send your Zelle payment to:</p>
      <p><strong>Email/Phone:</strong> ${process.env.ZELLE_RECIPIENT ?? process.env.ADMIN_EMAIL ?? "payments@ecp.org"}</p>
      <p><strong>Name:</strong> Eko Club Philadelphia</p>
      <p><strong>Amount:</strong> $${(params.amount / (Number(process.env.USD_TO_NGN_RATE) || 1600)).toFixed(2)} USD</p>
      <p style="font-size:13px;color:#6b7280">Please include your reference number <strong>${params.reference}</strong> in the Zelle memo.</p>
    </div>
  `);

  await sendEmail(params.payerEmail, subject, userHtml);

  const adminAddr = adminEmail();
  if (adminAddr) {
    const adminHtml = emailWrapper(`💰 Zelle Payment Pending — ${params.reference}`, `
      <p>A user has initiated a Zelle payment. Please verify and confirm:</p>
      <div class="highlight">
        <p><strong>Name:</strong> ${params.payerName}</p>
        <p><strong>Email:</strong> ${params.payerEmail}</p>
        <p><strong>Amount:</strong> ${fmtAmount(params.amount)}</p>
        <p><strong>Reference:</strong> ${params.reference}</p>
        <p><strong>Type:</strong> ${params.type}</p>
        ${params.details ? `<p><strong>Details:</strong> ${params.details}</p>` : ""}
      </div>
      <p>Once confirmed, please mark the payment as successful in the admin portal to send the receipt to the user.</p>
    `);
    sendEmail(adminAddr, `⏳ Zelle Pending: ${params.payerName} — ${fmtAmount(params.amount)}`, adminHtml).catch(console.error);
  }
}
