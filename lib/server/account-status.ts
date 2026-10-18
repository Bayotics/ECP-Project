import { getCollection } from "@/lib/server/collections";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { accountStatusEmail } from "@/lib/server/email-templates";

/** Notification queue entries are written atomically with account status. */
export async function notifyAccountStatus(userId: string, changeId: string): Promise<boolean> {
  const users = await getCollection("users");
  const now = new Date().toISOString();
  const lease = new Date(Date.now() + 10 * 60_000).toISOString();
  const claimed = await users.findOneAndUpdate({ id: userId, accountStatusHistory: { $elemMatch: { id: changeId, $or: [
    { notificationStatus: { $in: ["pending", "failed"] } },
    { notificationStatus: "sending", notificationLeaseUntil: { $lte: now } },
  ] } } }, { $set: { "accountStatusHistory.$.notificationStatus": "sending", "accountStatusHistory.$.notificationLeaseUntil": lease } }, { returnDocument: "after" });
  const change = claimed?.accountStatusHistory?.find(entry => entry.id === changeId);
  if (!claimed || !change) return false;
  const filter = { id: userId, accountStatusHistory: { $elemMatch: { id: changeId, notificationLeaseUntil: lease } } };
  if (claimed.accountStatusHistory?.at(-1)?.id !== changeId || claimed.status !== change.toStatus) {
    await users.updateOne(filter, { $set: { "accountStatusHistory.$.notificationStatus": "superseded" } });
    return false;
  }
  const message = accountStatusEmail({ name: claimed.displayName, status: change.toStatus, reason: change.reason, loginUrl: `${siteUrl()}/auth/login` });
  const result = await sendEmail({ to: claimed.email, ...message, tags: { type: "account-status", status: change.toStatus } });
  await users.updateOne(filter, { $set: {
    "accountStatusHistory.$.notificationStatus": result.ok ? "sent" : "failed",
    ...(result.ok ? { "accountStatusHistory.$.notificationSentAt": new Date().toISOString() } : { "accountStatusHistory.$.notificationError": result.error }),
  } });
  return result.ok;
}

export async function retryAccountStatusNotifications() {
  const users = await getCollection("users");
  const now = new Date().toISOString();
  const result = { sent: 0, failed: 0 };
  for await (const user of users.find({ accountStatusHistory: { $elemMatch: { $or: [
    { notificationStatus: { $in: ["pending", "failed"] } },
    { notificationStatus: "sending", notificationLeaseUntil: { $lte: now } },
  ] } } })) {
    for (const change of user.accountStatusHistory ?? []) {
      if (change.notificationStatus === "sent" || change.notificationStatus === "superseded") continue;
      if (change.notificationStatus === "sending" && change.notificationLeaseUntil && change.notificationLeaseUntil > now) continue;
      if (await notifyAccountStatus(user.id, change.id)) result.sent++;
      else if (user.accountStatusHistory?.at(-1)?.id === change.id) result.failed++;
    }
  }
  return result;
}
