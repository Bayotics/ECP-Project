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

/** Whose line an applicant's Lagos root runs through (question 12). */
export const LAGOS_ROOT_OPTIONS = ["Mother", "Father", "Spouse", "Father & Mother"] as const;

/** The IBILE divisions, spelled as the club's own form spells them. */
export const IBILE_FORM_DIVISIONS = [
  "Ikorodu",
  "Badagary",
  "Ikeja",
  "Lagos Island",
  "Epe",
] as const;

/** The committees an applicant may ask to join (question 16). */
export const APPLICATION_COMMITTEES = [
  "Health Education Committee",
  "Scholarship/Educational Committee",
  "Professional Network Committee",
  "Technology/Media Committee",
  "Thanksgiving/Winter Coat Committee",
  "Welfare/Wellness",
  "Lagos Liaison Committee",
  "Social Committe",
  "Youth Committee",
] as const;

/** The non-refundable application fee, in US dollars. */
export const APPLICATION_FEE_USD = 100;

/** Where an applicant sends their references, and asks questions. */
export const MEMBERSHIP_CONTACT_EMAIL = "ekophillymembership@gmail.com";

export type ApplicationFeeStatus = "unpaid" | "pending-confirmation" | "paid";

export interface MembershipApplication {
  id: string;
  // Personal
  fullName: string;
  /** Question 2: only when applying jointly. */
  spouseName?: string;
  email: string;
  phone: string;
  /** Question 9: month and day, e.g. "January 7". The form asks for no year. */
  birthMonthDay?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  // Location (legacy — kept for backward compat)
  lga?: string;
  ward?: string;
  address?: string;
  // US/International address
  country?: string;
  streetAddress?: string;
  aptUnit?: string;
  city?: string;
  stateProvince?: string;
  zipPostal?: string;
  // Professional
  occupation: string;
  employer?: string;
  highestEducation?: string;
  /* ── The club's approved form ──────────────────────────────────────── */
  /** Question 11. More than one may apply, plus a free-text "Other". */
  ibileDivisions?: string[];
  ibileOther?: string;
  /** Question 12. */
  lagosRoot?: string;
  lagosRootOther?: string;
  /** Question 13. */
  streetAgbole?: string;
  /** Question 15. */
  otherOrganizations?: string;
  /** Question 16, plus a free-text "Other". */
  committeeInterests?: string[];
  committeeOther?: string;
  /** Questions 17 to 20. The first referral is required. */
  referral1Name?: string;
  referral1Phone?: string;
  referral2Name?: string;
  referral2Phone?: string;
  /** The declaration at the head of the form, accepted on submission. */
  agreedToConstitution?: boolean;

  /* ── The $100 non-refundable application fee ───────────────────────── */
  feeStatus?: ApplicationFeeStatus;
  feeMethod?: "paypal" | "zelle";
  feeReference?: string;
  feePaidAt?: string;

  // Application
  reasonForJoining: string;
  areasOfInterest: string[];
  hasVolunteered: boolean;
  referredBy?: string;
  // Documents (simulated)
  documents?: ApplicationDocument[];
  /* ── The interview ─────────────────────────────────────────────────── */
  /**
   * When the membership committee will see the applicant, as a real
   * instant. Set by the administrator when they send the invitation, and
   * always shown back in club time, so the applicant reads the same
   * clock the committee meant wherever they happen to be.
   */
  interviewAt?: string;
  /** Where or how: a room, an address, a video link. Optional. */
  interviewLocation?: string;

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
