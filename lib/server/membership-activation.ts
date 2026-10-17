import { parseSocialProfiles } from "@/lib/social-profiles";
import { nanoid } from "nanoid";
import { getCollection, serializeDocument } from "@/lib/server/collections";
import { hasCredential, upsertCredential } from "@/lib/server/auth";
import { MEMBERSHIP_ID_PATTERN, normalizeMembershipId, type User } from "@/lib/models/user";
import type { MembershipApplication } from "@/lib/models/membership";

/* Turning an approved application into a member who can sign in.
 *
 * When the membership committee approves someone, an administrator issues
 * them a club membership number. That number is also their first password:
 * it is emailed to them, they sign in with it, and the portal then asks
 * them to replace it with one of their own. `mustChangePassword` is what
 * drives that prompt, and it is cleared the moment they set a new one.
 *
 * The number is emailed in the clear, which is exactly why it is temporary.
 */

const ADMIN_ROLES = ["admin", "super-admin"];

/** Makes a literal safe to drop into a regular expression. */
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits a single "full name" field into the two the user record wants. */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Member", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export type MembershipIdProblem = "empty" | "malformed" | "taken";

/**
 * Validates a membership number an administrator has typed.
 * Returns the tidied value, or which way it was wrong.
 */
export async function checkMembershipId(
  raw: string | undefined,
  options: { allowUserId?: string } = {},
): Promise<{ ok: true; value: string } | { ok: false; problem: MembershipIdProblem }> {
  const value = normalizeMembershipId(raw ?? "");
  if (!value) return { ok: false, problem: "empty" };
  if (!MEMBERSHIP_ID_PATTERN.test(value)) return { ok: false, problem: "malformed" };

  const users = await getCollection("users");
  /* Case-insensitive, and not just because "ecp-2026-0004" and
     "ECP-2026-0004" are the same number to a person: numbers issued before
     this screen existed were stored however they were typed, and an exact
     match would read one of those as free and hand it out twice. */
  const holder = await users.findOne({
    membershipId: { $regex: `^${escapeRegex(value)}$`, $options: "i" },
  });
  /* Re-issuing the same number to the same account is not a clash: an
     administrator correcting a typo elsewhere in the form should not be
     told the number is taken by the person they are looking at. */
  if (holder && holder.id !== options.allowUserId) return { ok: false, problem: "taken" };

  return { ok: true, value };
}

/** The sentence to show for each way a number can be wrong. */
export function membershipIdMessage(problem: MembershipIdProblem): string {
  switch (problem) {
    case "empty":
      return "A membership number is required to approve an application.";
    case "malformed":
      return "A membership number is 4 to 32 characters, using letters, numbers and hyphens.";
    case "taken":
      return "Another member already holds that membership number.";
  }
}

/**
 * The next number in this year's run, e.g. "ECP-2026-0007".
 *
 * Derived from the highest number already issued for the year rather than
 * from a counter, so cancelling the approval dialog does not burn a number
 * and leave a gap in the club's register. Two administrators approving at
 * the same instant would be handed the same suggestion; the unique index
 * on `membershipId` is what actually stops a duplicate being saved.
 */
export async function suggestMembershipId(year = new Date().getFullYear()): Promise<string> {
  const prefix = `ECP-${year}-`;
  const users = await getCollection("users");

  const issued = await users
    /* Case-insensitive for the same reason the uniqueness check is: an
       older record stored in lower case still occupies its number. */
    .find({ membershipId: { $regex: `^${escapeRegex(prefix)}\\d+$`, $options: "i" } })
    .project<{ membershipId: string }>({ membershipId: 1, _id: 0 })
    .toArray();

  const highest = issued.reduce((max, row) => {
    const n = Number.parseInt(row.membershipId.slice(prefix.length), 10);
    return Number.isFinite(n) && n > max ? n : max;
  }, 0);

  return `${prefix}${String(highest + 1).padStart(4, "0")}`;
}

export interface ActivationResult {
  user: User;
  /** True when no account existed for this applicant and one was made. */
  accountCreated: boolean;
  /**
   * False when the password was deliberately left alone: the application's
   * address belongs to an administrator, and silently replacing an
   * administrator's password with a membership number would be a way to
   * take over the portal through the application form.
   */
  passwordSet: boolean;
}

/**
 * Gives an approved applicant a membership number and an account they can
 * sign in to, creating the account when they never registered themselves.
 *
 * Returns the saved user. Throws only on a real database failure; the
 * caller has already validated the number with `checkMembershipId`.
 */
export async function activateMember(
  application: MembershipApplication,
  membershipId: string,
): Promise<ActivationResult> {
  const users = await getCollection("users");
  const applications = await getCollection("membershipApplications");
  const email = application.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const social = parseSocialProfiles(application);
  if (!social.ok) throw new Error(social.error);

  /* By linked account first, then by address: an applicant who registered
     on the site is the same person as the applicant on the form. */
  const existing = serializeDocument(
    (application.userId ? await users.findOne({ id: application.userId }) : null) ??
      (await users.findOne({ email })),
  );

  if (existing) {
    const isAdminAccount = ADMIN_ROLES.includes(existing.role);

    const updated = serializeDocument(
      await users.findOneAndUpdate(
        { id: existing.id },
        {
          $set: {
            ...Object.fromEntries(Object.entries(social.values).filter(([key, value]) => value && existing[key as keyof User] === undefined)),
            /* An administrator stays an administrator. Only a lesser role
               is promoted to member. */
            ...(isAdminAccount ? {} : { role: "member" as const }),
            status: "active" as const,
            membershipId,
            membershipIdIssuedAt: now,
            /* The number was delivered to this address and is what they
               sign in with, so using it proves they hold the mailbox. An
               unconfirmed address would otherwise be refused at login and
               the new member could not get in at all. */
            emailVerified: true,
            emailVerifiedAt: existing.emailVerifiedAt ?? now,
            ...(isAdminAccount ? {} : { mustChangePassword: true }),
          },
        },
        { returnDocument: "after" },
      ),
    );

    if (!updated) throw new Error("The member account could not be updated.");

    if (!isAdminAccount) {
      await upsertCredential(updated.id, updated.email, membershipId);
    }

    await applications.updateOne({ id: application.id }, { $set: { userId: updated.id } });

    return { user: updated, accountCreated: false, passwordSet: !isAdminAccount };
  }

  const { firstName, lastName } = splitName(application.fullName);
  const user: User = {
    ...social.values,
    id: nanoid(),
    email,
    firstName,
    lastName,
    displayName: application.fullName.trim(),
    role: "member",
    status: "active",
    phone: application.phone,
    occupation: application.occupation,
    lagosOrigin: application.ibileDivisions?.[0],
    joinedAt: now,
    membershipId,
    membershipIdIssuedAt: now,
    emailVerified: true,
    emailVerifiedAt: now,
    mustChangePassword: true,
  };

  await users.insertOne(user);
  await upsertCredential(user.id, user.email, membershipId);
  await applications.updateOne({ id: application.id }, { $set: { userId: user.id } });

  return { user, accountCreated: true, passwordSet: true };
}

/** Whether an account can sign in at all, for the approval screen's wording. */
export async function accountCanSignIn(userId: string): Promise<boolean> {
  return hasCredential(userId);
}
