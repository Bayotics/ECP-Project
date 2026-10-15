import crypto from "crypto";
import { nanoid } from "nanoid";
import { getCollection } from "@/lib/server/collections";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { passwordResetEmail } from "@/lib/server/email-templates";

/* Password reset tokens.
 *
 * Built the same way as the email verification tokens, and for the same
 * reason: the member is handed a 32-byte random value in a link, and only
 * its SHA-256 hash is kept. Somebody holding a copy of the database cannot
 * reset anybody's password with it.
 *
 * A token is single use, expires in an hour rather than a day (a reset link
 * is a live key to an account, where a confirmation link is not), and
 * issuing a new one retires the outstanding ones for that member.
 */

export const RESET_TTL_MINUTES = 60;

/** How often one account may ask for a fresh link. */
export const RESET_COOLDOWN_SECONDS = 60;

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  tokenHash: string;
  expiresAt: string;
  /* A TTL index only acts on a real BSON date, never on an ISO string, so
     the same instant is stored both ways: this one for MongoDB, the string
     above for the application. */
  expiresAtDate: Date;
  createdAt: string;
  usedAt?: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Issues a token, retiring any earlier ones. The raw value is returned once. */
export async function issueResetToken(
  userId: string,
  email: string,
): Promise<{ token: string; expiresAt: string }> {
  const collection = await getCollection("passwordResetTokens");

  await collection.deleteMany({ userId, usedAt: { $exists: false } });

  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expiry = new Date(now.getTime() + RESET_TTL_MINUTES * 60 * 1000);

  await collection.insertOne({
    id: nanoid(),
    userId,
    email: email.toLowerCase(),
    tokenHash: hashToken(token),
    expiresAt: expiry.toISOString(),
    expiresAtDate: expiry,
    createdAt: now.toISOString(),
  });

  return { token, expiresAt: expiry.toISOString() };
}

export type ConsumeResetResult =
  | { status: "ok"; userId: string; email: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already-used" };

/**
 * Checks a token and marks it spent.
 *
 * The states stay distinct because "this link has expired, here is a new
 * one" and "this link is not ours" need different things on screen.
 */
export async function consumeResetToken(token: string): Promise<ConsumeResetResult> {
  if (!token?.trim()) return { status: "invalid" };

  const collection = await getCollection("passwordResetTokens");
  const record = await collection.findOne({ tokenHash: hashToken(token.trim()) });

  if (!record) return { status: "invalid" };
  if (record.usedAt) return { status: "already-used" };
  if (new Date(record.expiresAt) < new Date()) return { status: "expired" };

  /* Claimed before the caller acts on it, so a link opened twice cannot
     set two different passwords. */
  const claimed = await collection.findOneAndUpdate(
    { id: record.id, usedAt: { $exists: false } },
    { $set: { usedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  if (!claimed) return { status: "already-used" };

  return { status: "ok", userId: record.userId, email: record.email };
}

/** Checks a token without spending it, for showing the form or an error. */
export async function inspectResetToken(token: string): Promise<ConsumeResetResult> {
  if (!token?.trim()) return { status: "invalid" };

  const collection = await getCollection("passwordResetTokens");
  const record = await collection.findOne({ tokenHash: hashToken(token.trim()) });

  if (!record) return { status: "invalid" };
  if (record.usedAt) return { status: "already-used" };
  if (new Date(record.expiresAt) < new Date()) return { status: "expired" };
  return { status: "ok", userId: record.userId, email: record.email };
}

/** When this account last asked for a link, for the cooldown. */
export async function lastResetRequestedAt(userId: string): Promise<Date | null> {
  const collection = await getCollection("passwordResetTokens");
  const latest = await collection.find({ userId }).sort({ createdAt: -1 }).limit(1).toArray();
  return latest[0] ? new Date(latest[0].createdAt) : null;
}

/** Issues a token and emails the link. Never throws. */
export async function sendPasswordResetEmail(user: {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const { token } = await issueResetToken(user.id, user.email);
    const resetUrl = `${siteUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

    const { subject, html } = passwordResetEmail({
      name: user.displayName ?? user.firstName ?? "",
      resetUrl,
      expiresInMinutes: RESET_TTL_MINUTES,
    });

    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      tags: { type: "password-reset" },
    });

    return result.ok ? { sent: true } : { sent: false, error: result.error };
  } catch (caught) {
    const error = caught instanceof Error ? caught.message : "Could not send the reset email";
    console.error("[reset] issuing failed", caught);
    return { sent: false, error };
  }
}
