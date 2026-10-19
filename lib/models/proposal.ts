export const PROPOSAL_STATUSES = ["new", "under-review", "approved", "declined"] as const;
export type ProposalStatus = typeof PROPOSAL_STATUSES[number];
export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = { new: "New", "under-review": "Under review", approved: "Approved", declined: "Declined" };

export interface EventProposal {
  id: string;
  submissionId: string;
  contentHash: string;
  name: string;
  email: string;
  title: string;
  description: string;
  proposedDate: string;
  location: string;
  estimatedBudgetCents?: number;
  notes: string;
  status: ProposalStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  draftEventId?: string;
  draftEventSlug?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalMessage {
  id: string;
  proposalId: string;
  audience: "submitter" | "admin";
  to: string;
  subject: string;
  html: string;
  status: "pending" | "sending" | "failed" | "sent";
  attempts: number;
  createdAt: string;
  leaseUntil?: string;
  sentAt?: string;
  error?: string;
}

export interface ProposalRecipientsSettings {
  id: "proposal-recipients";
  recipients: Array<{ name: string; email: string }>;
  updatedAt: string;
  updatedBy: string;
}

export interface VolunteerIntegrationMapping {
  id: string;
  source: "eventbrite" | "partiful" | "other";
  externalEventId: string;
  eventId: string;
  volunteerTicketClassIds: string[];
}

export interface VolunteerIntegrationSettings {
  id: "volunteer-integrations";
  connectorKeyHash?: string;
  mappings: VolunteerIntegrationMapping[];
  updatedAt: string;
  updatedBy: string;
}
