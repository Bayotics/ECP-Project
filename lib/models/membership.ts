export type ApplicationStatus =
  | "pending"
  | "under-review"
  | "interview"
  | "approved"
  | "rejected";

export interface StatusTimelineEvent {
  status: ApplicationStatus;
  date: string; // ISO
  message?: string; // admin/system note shown on timeline
}

export interface AdminMessage {
  id: string;
  fromName: string; // admin display name
  content: string;
  sentAt: string; // ISO
  isRead?: boolean;
}

export interface ApplicationDocument {
  id: string;
  name: string;       // original filename
  label: string;      // e.g. "ID Document"
  uploadedAt: string; // ISO
  /** Simulated — no actual binary stored */
  simulatedSize?: string; // e.g. "1.2 MB"
}

export interface MembershipApplication {
  id: string;
  // Personal
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  // Location
  lga: string;
  ward?: string;
  address?: string;
  // Professional
  occupation: string;
  employer?: string;
  highestEducation?: string;
  // Application
  reasonForJoining: string;
  areasOfInterest: string[];
  hasVolunteered: boolean;
  referredBy?: string;
  // Documents (simulated)
  documents?: ApplicationDocument[];
  // Admin
  status: ApplicationStatus;
  statusHistory?: StatusTimelineEvent[];
  adminMessages?: AdminMessage[];
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string; // admin user id
  reviewNotes?: string;
  userId?: string; // set once account is created
}

export type CreateApplicationInput = Omit<
  MembershipApplication,
  "id" | "status" | "appliedAt" | "reviewedAt" | "reviewedBy" | "reviewNotes" | "userId"
>;

export type UpdateApplicationInput = Partial<
  Omit<MembershipApplication, "id" | "appliedAt">
>;
