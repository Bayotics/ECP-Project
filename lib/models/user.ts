export type UserRole = "guest" | "applicant" | "member" | "admin" | "super-admin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

/** Which body of the club a member holds office in, for grouping the directory. */
export type UserOffice = "exco" | "trustees" | "patron";

export interface User {
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
  /** One of the five IBILE divisions, as the member's roots in Lagos. */
  lagosOrigin?: string;
  ward?: string;
  occupation?: string;
  bio?: string;
  joinedAt: string;
  lastLoginAt?: string;
  membershipId?: string; // linked MembershipApplication id
}

export type CreateUserInput = Omit<User, "id" | "joinedAt">;
export type UpdateUserInput = Partial<Omit<User, "id" | "joinedAt">>;
