import { timingSafeEqual } from "node:crypto";
import { clubDate } from "@/lib/dues";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { getMemberDues } from "@/lib/server/dues";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { escapeHtml } from "@/lib/server/email-templates";

export function validCronSecret(authorization: string | null) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Use Philadelphia's month-end, including the last day itself. Daily runs
 * retry failures for the latest closed month without producing early warnings. */
export function reminderCutoff(now = new Date()) {
  const today = clubDate(now);
  const nextDay = new Date(`${today}T12:00:00Z`);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  if (nextDay.getUTCDate() === 1) return today;
  const previous = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  previous.setUTCDate(0);
  return previous.toISOString().slice(0, 10);
}

export async function runDuesReminders(now = new Date()) {
  await ensureCoreIndexes();
  const cutoff = reminderCutoff(now);
  const month = cutoff.slice(0, 7);
  const users = await getCollection("users");
  const reminders = await getCollection("duesReminders");
  const result = { month, checked: 0, sent: 0, skipped: 0, failed: 0 };
  for await (const user of users.find({ role: { $in: ["member", "admin", "super-admin"] }, status: { $in: ["active", "suspended"] } })) {
    result.checked++;
    // Check both month-end eligibility and the current balance. A member who
    // caught up after month-end must not receive a stale warning on a retry.
    const [atCutoff, current] = await Promise.all([getMemberDues(user, new Date(`${cutoff}T17:00:00Z`)), getMemberDues(user, now)]);
    if (!atCutoff.summary.suspensionWarning || !current.summary.suspensionWarning) { result.skipped++; continue; }
    const id = `${user.id}:${month}`;
    const timestamp = now.toISOString();
    const leaseUntil = new Date(now.getTime() + 10 * 60_000).toISOString();
    let claimed;
    try {
      claimed = await reminders.findOneAndUpdate({ id, status: { $ne: "sent" }, $or: [{ leaseUntil: { $lte: timestamp } }, { status: "failed" }] }, {
        $set: { status: "sending", leaseUntil }, $inc: { attempts: 1 },
        $setOnInsert: { id, userId: user.id, month },
      }, { upsert: true, returnDocument: "after" });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) { result.skipped++; continue; }
      throw error;
    }
    if (!claimed) { result.skipped++; continue; }
    const summary = current.summary;
    const delivered = await sendEmail({
      to: user.email, subject: "Action required: your membership might be suspended",
      html: `<h1>Your membership might be suspended</h1><p>Hello ${escapeHtml(user.displayName)},</p><p>As of ${cutoff}, your dues were unpaid for at least three completed months.</p><p>Months with unpaid dues: ${escapeHtml(summary.overdueMonths.join(", "))}.</p><p>Your outstanding balance is <strong>$${(summary.outstandingCents / 100).toFixed(2)}</strong>. Please cover your payment deficit to bring your membership up to date and avoid possible suspension.</p><p>Pending transfers count only after the treasurer confirms them.</p><p><a href="${siteUrl()}/member/dues">Review your dues and pay</a></p>`,
      tags: { kind: "dues-arrears", month },
    });
    if (delivered.ok) {
      await reminders.updateOne({ id, status: "sending", leaseUntil }, { $set: { status: "sent", sentAt: new Date().toISOString() }, $unset: { error: "" } });
      result.sent++;
    } else {
      await reminders.updateOne({ id, status: "sending", leaseUntil }, { $set: { status: "failed", error: delivered.error } });
      result.failed++;
    }
  }
  return result;
}
