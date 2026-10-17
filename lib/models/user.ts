import type { SocialProfiles } from "@/lib/social-profiles";
export type UserRole = "guest" | "applicant" | "member" | "admin" | "super-admin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

/** Which body of the club a member holds office in, for grouping the directory. */
export type UserOffice = "exco" | "trustees" | "patron";

export interface User extends SocialProfiles {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  /** Portal permissions. Separate from `title`, which is the club office. */
  role: UserRole;
  status: UserStatus;
  /**
   * The office this member holds in the club, exactly as the club's own
   * spotlight badge prints it: "President", "Secretary, Board of Trustees",
   * "Matron", or plain "Member". Not the same thing as `role`, which only
   * governs what they can do in the portal.
   */
  title?: string;
  office?: UserOffice;
  avatarUrl?: string;
  phone?: string;
  /** Where in Lagos the member's family is from. Not an address. */
  /** True once the member has followed the link sent to their address. */
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  /** One of the five IBILE divisions, as the member's roots in Lagos. */
  lagosOrigin?: string;
  ward?: string;
  occupation?: string;
  bio?: string;
  joinedAt: string;
  lastLoginAt?: string;
  /**
   * The club membership number, e.g. "ECP-2026-0004". Assigned by an
   * administrator when the membership committee approves an application,
   * and unique across the club.
   */
  membershipId?: string;
  /** When the membership number was issued. */
  membershipIdIssuedAt?: string;
  /**
   * True while the account is still on the password it was given rather
   * than one the member chose. A new member's first password is their
   * membership number, emailed to them in the clear, so the portal asks
   * them to replace it the moment they sign in.
   */
  mustChangePassword?: boolean;
}

/** The shape of a club membership number this site issues. */
export const MEMBERSHIP_ID_PATTERN = /^[A-Z0-9][A-Z0-9-]{3,31}$/;

/**
 * Tidies a typed membership number: trims, upper-cases, and collapses
 * runs of spaces or hyphens to a single hyphen, so "ecp 2026 0004" and
 * "ECP--2026-0004" both land on the same thing.
 */
export function normalizeMembershipId(value: string): string {
  return value.trim().toUpperCase().replace(/[\s-]+/g, "-").replace(/^-|-$/g, "");
}

export type CreateUserInput = Omit<User, "id" | "joinedAt">;
export type UpdateUserInput = Partial<Omit<User, "id" | "joinedAt">>;
