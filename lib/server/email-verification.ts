import crypto from "crypto";
import { nanoid } from "nanoid";
import { getCollection } from "@/lib/server/collections";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { verificationEmail } from "@/lib/server/email-templates";

/* Email verification tokens.
 *
 * The token is a 32-byte random value handed to the member in a link. Only
 * its SHA-256 hash is stored, the way a password would be: anyone who got a
 * copy of the database still could not confirm somebody else's address or
 * follow a link they never received. The lookup hashes the incoming token
 * and matches on that.
 *
 * A token is single use and expires. Issuing a new one invalidates the
 * previous ones for that user, so a forwarded old email cannot be replayed.
 */

export const TOKEN_TTL_HOURS = 24;

/** How often one account may ask for a fresh link. */
export const RESEND_COOLDOWN_SECONDS = 60;

export interface EmailVerificationToken {
  id: string;
  userId: string;
  /** The address being proven, which may differ from the user's current one. */
  email: string;
  tokenHash: string;
  expiresAt: string;
  /* The same instant as `expiresAt`, as a real Date. A TTL index only acts
     on a BSON date, and everything else in this codebase stores ISO
     strings, so the string stays for the app and this exists for MongoDB. */
  expiresAtDate: Date;
  createdAt: string;
  usedAt?: string;
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a fresh token, retiring any earlier ones for this user.
 * Returns the raw token, which is the only moment it exists in the clear.
 */
export async function issueVerificationToken(
  userId: string,
  email: string,
): Promise<{ token: string; expiresAt: string }> {
  const collection = await getCollection("emailVerificationTokens");

  /* Supersede outstanding tokens so only the newest link works. */
  await collection.deleteMany({ userId, usedAt: { $exists: false } });

  const token = crypto.randomBytes(32).toString("base64url");
  const now = new Date();
  const expiry = new Date(now.getTime() + TOKEN_TTL_HOURS * 3600 * 1000);

  await collection.insertOne({
    id: nanoid(),
    userId,
    email: email.toLowerCase(),
    tokenHash: hashToken(token),
    expiresAt: expiry.toISOString(),
    expiresAtDate: expiry,
    createdAt: now.toISOString(),
  });

  const expiresAt = expiry.toISOString();

  return { token, expiresAt };
}

export type ConsumeResult =
  | { status: "ok"; userId: string; email: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "already-used" };

/**
 * Checks a token and marks it spent. The states are kept distinct because
 * "this link expired, here is a new one" and "this link is not ours" call
 * for different things on screen.
 */
export async function consumeVerificationToken(token: string): Promise<ConsumeResult> {
  if (!token?.trim()) return { status: "invalid" };

  const collection = await getCollection("emailVerificationTokens");
  const record = await collection.findOne({ tokenHash: hashToken(token.trim()) });

  if (!record) return { status: "invalid" };
  if (record.usedAt) return { status: "already-used" };
  if (new Date(record.expiresAt) < new Date()) return { status: "expired" };

  /* Marked used before the caller acts on it, so a double-clicked link
     cannot run the follow-up work twice. */
  const claimed = await collection.findOneAndUpdate(
    { id: record.id, usedAt: { $exists: false } },
    { $set: { usedAt: new Date().toISOString() } },
    { returnDocument: "after" },
  );
  if (!claimed) return { status: "already-used" };

  return { status: "ok", userId: record.userId, email: record.email };
}

/** When this user last asked for a link, for the resend cooldown. */
export async function lastTokenIssuedAt(userId: string): Promise<Date | null> {
  const collection = await getCollection("emailVerificationTokens");
  const latest = await collection
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray();
  return latest[0] ? new Date(latest[0].createdAt) : null;
}

/**
 * Issues a token and emails the link.
 *
 * Deliberately does not throw: registration has already written the member
 * to the database by this point, and failing the request would leave them
 * with an account they were told they did not get.
 */
export async function sendVerificationEmail(user: {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const { token } = await issueVerificationToken(user.id, user.email);
    const verifyUrl = `${siteUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;

    const { subject, html } = verificationEmail({
      name: user.displayName ?? user.firstName ?? "",
      verifyUrl,
      expiresInHours: TOKEN_TTL_HOURS,
    });

    const result = await sendEmail({
      to: user.email,
      subject,
      html,
      tags: { type: "email-verification" },
    });

    return result.ok ? { sent: true } : { sent: false, error: result.error };
  } catch (caught) {
    const error = caught instanceof Error ? caught.message : "Could not send the verification email";
    console.error("[verify] issuing failed", caught);
    return { sent: false, error };
  }
}
