export type UserRole = "guest" | "applicant" | "member" | "admin" | "super-admin";
export type UserStatus = "active" | "inactive" | "suspended" | "pending";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  lga?: string;
  ward?: string;
  occupation?: string;
  bio?: string;
  joinedAt: string;
  lastLoginAt?: string;
  membershipId?: string; // linked MembershipApplication id
}

export type CreateUserInput = Omit<User, "id" | "joinedAt">;
export type UpdateUserInput = Partial<Omit<User, "id" | "joinedAt">>;
