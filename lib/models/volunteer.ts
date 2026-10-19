import type { VolunteerSource } from "@/lib/volunteer-sources";

export interface Volunteer {
  id: string;
  name: string;
  /** Normalized email is the person's unique volunteer identity. */
  email: string;
  phone: string;
  interests: string;
  notes: string;
  generalRegisteredAt?: string;
  source?: VolunteerSource;
  sources?: VolunteerSource[];
  opportunityEmails?: boolean;
  importWelcomeQueuedAt?: string;
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
  source?: VolunteerSource;
  sources?: VolunteerSource[];
  status: VolunteerSignupStatus;
  registeredAt: string;
  queueOrder?: number;
  updatedAt: string;
}

export interface VolunteerAccessToken {
  tokenHash: string;
  volunteerId: string;
  createdAt: string;
  expiresAt: Date;
}

export interface VolunteerExternalRegistration {
  id: string;
  volunteerId: string;
  email: string;
  source: VolunteerSource;
  externalId: string;
  eventId?: string;
  createdAt: string;
}

export interface VolunteerImportBatch {
  id: string;
  source: VolunteerSource;
  eventId?: string;
  createdBy: string;
  createdAt: string;
  imported: number;
  updated: number;
  failed: number;
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
