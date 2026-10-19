export interface Volunteer {
  id: string;
  name: string;
  /** Normalized email is the person's unique volunteer identity. */
  email: string;
  phone: string;
  interests: string;
  notes: string;
  generalRegisteredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerMessage {
  id: string;
  volunteerId: string;
  signupId?: string;
  eventId?: string;
  signupStatus?: VolunteerSignupStatus;
  audience: "volunteer" | "staff";
  to: string;
  subject: string;
  html: string;
  status: "pending" | "sending" | "failed" | "sent" | "superseded";
  attempts: number;
  createdAt: string;
  sentAt?: string;
  leaseUntil?: string;
  error?: string;
}

export interface VolunteerOpportunity {
  id: string;
  slug: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  membersOnly: boolean;
  isFull: boolean;
  accepting: boolean;
  reason?: string;
}

export type VolunteerSignupStatus = "confirmed" | "waitlisted" | "cancelled";

export interface VolunteerSignup {
  id: string;
  volunteerId: string;
  eventId: string;
  status: VolunteerSignupStatus;
  registeredAt: string;
  queueOrder?: number;
  updatedAt: string;
}

export interface VolunteerAdminRow extends Volunteer {
  emailIssues?: number;
  signups: Array<VolunteerSignup & { eventTitle: string; eventSlug?: string; eventDate?: string }>;
}

export interface VolunteerAdminList {
  volunteers: VolunteerAdminRow[];
  page: number;
  pageSize: number;
  total: number;
}
