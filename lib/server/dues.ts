import type { DuesPayment, User } from "@/lib/models";
import { calculateDues, splitDuesPlaceholders } from "@/lib/dues";
import { getCollection, serializeDocuments } from "@/lib/server/collections";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { escapeHtml } from "@/lib/server/email-templates";
import { adminRecipients } from "@/lib/server/admin-notifications";

export function isDuesMember(user: User) {
  return ["member", "admin", "super-admin"].includes(user.role);
}
export async function getMemberDues(user: User, now = new Date()) {
  const collection = await getCollection("duesPayments");
  const all = serializeDocuments(await collection.find({ userId: user.id }).sort({ createdAt: -1, id: -1 }).toArray());
  const { records } = splitDuesPlaceholders(all);
  return { records, summary: calculateDues(user, records, now) };
}
export async function sendMemberDuesReceipt(payment: DuesPayment) {
  const user = await (await getCollection("users")).findOne({ id: payment.userId });
  if (!user) return { ok: false as const, error: "Member no longer exists", retryable: false };
  const { summary } = await getMemberDues(user);
  const nextDue = summary.nextPaymentDue ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${summary.nextPaymentDue}T12:00:00Z`)) : "pending administrator review of your membership date";
  const outstandingBalance = summary.status === "needs-review" ? "Pending membership date review" : `$${(summary.outstandingCents / 100).toFixed(2)}`;
  const result = await sendEmail({
    to: user.email, subject: "Dues payment confirmed — your membership record has been updated",
    html: `<h1>Your dues record has been updated</h1><p>Hello ${escapeHtml(user.displayName)},</p><p>Your ${escapeHtml(payment.paymentMethod ?? "")} payment of <strong>$${payment.amount.toFixed(2)}</strong> has been confirmed, covering ${escapeHtml(payment.coverageStart ?? String(payment.year))} to ${escapeHtml(payment.coverageEnd ?? String(payment.year))}.</p><p>Reference: ${escapeHtml(payment.reference ?? payment.id)}</p><p><strong>Your next unpaid payment is due ${nextDue}.</strong></p><p>Current outstanding balance: <strong>${outstandingBalance}</strong>. ${summary.status === "needs-review" ? "An administrator needs to confirm your membership date before your account standing can be calculated." : summary.suspensionWarning ? "Your membership remains at risk of suspension until your dues deficit is reduced." : summary.outstandingCents ? "Earlier unpaid dues still need to be covered." : "Your dues are up to date."}</p><p><a href="${siteUrl()}/member/dues">View your updated dues and download your payment history</a>.</p>`,
  });
  if (result.ok) await (await getCollection("duesPayments")).updateOne({ id: payment.id }, { $set: { receiptSentAt: new Date().toISOString() } });
  return result;
}

/** Unsent confirmations and admin alerts are retried by the scheduled job. */
export async function retryDuesPaymentNotifications() {
  const payments = await getCollection("duesPayments");
  const users = await getCollection("users");
  const result = { sent: 0, failed: 0 };
  const pending = payments.find({ schemaVersion: 2, $or: [
    { status: "paid", receiptSentAt: { $exists: false } },
    { status: "pending", submittedAt: { $exists: true }, adminsNotifiedAt: { $exists: false } },
  ] });
  for await (const payment of pending) {
    if (payment.status === "paid") {
      const receipt = await sendMemberDuesReceipt(payment);
      if (receipt.ok) result.sent++; else result.failed++;
    } else {
      const member = await users.findOne({ id: payment.userId });
      if (!member) { result.failed++; continue; }
      const notified = await notifyAdminsOfDuesTransfer(payment, member);
      if (notified.sent && !notified.failed) result.sent++; else result.failed++;
    }
  }
  return result;
}

/** Notify all administrators, just like the membership application workflow. */
export async function notifyAdminsOfDuesTransfer(payment: DuesPayment, member: User) {
  const recipients = new Set((await adminRecipients()).map(admin => admin.email));
  if (process.env.ADMIN_EMAIL) recipients.add(process.env.ADMIN_EMAIL.trim().toLowerCase());
  const results = await Promise.all([...recipients].map(to => sendEmail({
    to, subject: `Dues transfer awaiting confirmation — ${member.displayName}`,
    html: `<h1>Member dues payment to verify</h1><p><strong>${escapeHtml(member.displayName)}</strong> (${escapeHtml(member.email)}; ${escapeHtml(member.membershipId ?? "membership number not assigned")}) reported a <strong>$${payment.amount.toFixed(2)} ${escapeHtml(payment.paymentMethod ?? "zelle")}</strong> transfer.</p><p>Coverage: ${escapeHtml(payment.coverageStart ?? "")} to ${escapeHtml(payment.coverageEnd ?? "")}. Portal reference: ${escapeHtml(payment.reference ?? payment.id)}.</p><p>Zelle confirmation number: ${escapeHtml(payment.transferReference || "Not provided")}.</p><p>Match this individual's transfer in the club bank account, then <a href="${siteUrl()}/admin/dues">confirm their payment in the admin portal</a>. The member has not yet been credited.</p>`,
    tags: { kind: "admin-dues-transfer", paymentId: payment.id },
  })));
  if (recipients.size && results.every(result => result.ok)) await (await getCollection("duesPayments")).updateOne({ id: payment.id }, { $set: { adminsNotifiedAt: new Date().toISOString() } });
  return { sent: results.filter(result => result.ok).length, failed: results.filter(result => !result.ok).length, recipients: recipients.size };
}

/** Atomic settlement: repeated captures cannot create additional coverage. */
export async function settleDuesPayment(id: string, patch: Pick<DuesPayment, "paymentMethod" | "reference"> & Partial<Pick<DuesPayment, "paypalCaptureId" | "confirmedBy">>) {
  const collection = await getCollection("duesPayments");
  const now = new Date().toISOString();
  const payment = await collection.findOneAndUpdate({ id, schemaVersion: 2, status: "pending", paymentMethod: patch.paymentMethod, ...(patch.confirmedBy ? { submittedAt: { $exists: true } } : {}) }, {
    $set: { ...patch, status: "paid", paidDate: now, updatedAt: now },
  }, { returnDocument: "after" });
  if (payment) await sendMemberDuesReceipt(payment).catch(console.error);
  return payment ?? collection.findOne({ id, status: "paid" });
}
