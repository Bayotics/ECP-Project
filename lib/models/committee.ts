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
  /** When the committee was formed. Empty when the club has not said. */
  establishedAt: string;
  /** When in the year this initiative runs, as the club's poll sheet words
      it: "May", "Summer", "Nov – Jan", "Bi-Monthly". */
  month?: string;
  /** Results of the club's volunteer poll: how many members put their name
      down, and out of how many who voted. */
  votes?: number;
  pollSize?: number;
  /** The programme on /programs this committee runs, where there is one. */
  programId?: string;
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
