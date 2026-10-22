export type NewsletterSource = "website" | "footer" | "admin" | "rsvp" | "import";
export type NewsletterStatus = "pending" | "active" | "unsubscribed";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  source: NewsletterSource;
  status: NewsletterStatus;
  tags: string[];
  subscribedAt: string;
  unsubscribedAt?: string;
  updatedAt?: string;
  subscriptionVersion?: string;
  /** Never returned by public or admin APIs. */
  unsubscribeTokenHash?: string;
  confirmationTokenHash?: string;
  confirmationExpiresAt?: string;
  confirmationRequestedAt?: string;
  confirmedAt?: string;
}

export interface NewsletterMessage {
  id: string;
  subscriberId: string;
  subscriptionVersion: string;
  kind?: "opt-in" | "welcome";
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

export interface NewsletterAdminRow extends Omit<NewsletterSubscriber, "unsubscribeTokenHash" | "confirmationTokenHash" | "subscriptionVersion"> {
  confirmationStatus: NewsletterMessage["status"] | "not-recorded";
  confirmationSentAt?: string;
  confirmationError?: string;
}

export type CreateSubscriberInput = Pick<NewsletterSubscriber, "email" | "name" | "phone" | "source" | "tags">;

export interface NotificationLog {
  id: string;
  eventId?: string;
  type: "announcement" | "reminder" | "cancellation" | "rsvp-confirmation" | "broadcast";
  channel: "email" | "sms" | "both";
  targetAudience: "all" | "members" | "newsletter" | "rsvps" | "custom";
  recipientCount: number;
  successCount: number;
  failureCount: number;
  sentAt: string;
  sentBy: string;
  subject?: string;
  summary?: string;
}
