export type SocialPlatform = "twitter" | "linkedin" | "email" | "facebook" | "instagram";

export interface CommitteeMemberProfile {
  userId?: string; // link to user record if exists
  name: string;
  role: string; // "Chairperson", "Secretary", "Member", etc.
  bio?: string;
  imageUrl?: string;
  isChairperson: boolean;
  isViceChair: boolean;
  joinedCommitteeAt: string;
  socialLinks?: Array<{ platform: SocialPlatform; url: string }>;
}

export type CommitteeType =
  | "standing"
  | "ad-hoc"
  | "executive"
  | "advisory"
  | "technical";

export type CommitteeStatus = "active" | "inactive" | "dissolved";

export interface Committee {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: CommitteeType;
  status: CommitteeStatus;
  mandate?: string;
  members: CommitteeMemberProfile[];
  imageUrl?: string;
  establishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateCommitteeInput = Omit<Committee, "id" | "createdAt" | "updatedAt">;
export type UpdateCommitteeInput = Partial<Omit<Committee, "id" | "createdAt">>;

/* ─── Join Requests ──────────────────────────────────── */
export type JoinRequestStatus = "pending" | "approved" | "rejected";

export interface CommitteeJoinRequest {
  id: string;
  committeeId: string;
  committeeName: string;
  userId: string;
  userName: string;
  userEmail: string;
  message?: string;
  status: JoinRequestStatus;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
