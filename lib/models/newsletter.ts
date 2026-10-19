export type NewsletterSource = "website" | "footer" | "admin" | "rsvp" | "import";
export type NewsletterStatus = "active" | "unsubscribed";

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
}

export interface NewsletterMessage {
  id: string;
  subscriberId: string;
  subscriptionVersion: string;
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

export interface NewsletterAdminRow extends Omit<NewsletterSubscriber, "unsubscribeTokenHash"> {
  confirmationStatus: NewsletterMessage["status"] | "not-recorded";
  confirmationSentAt?: string;
  confirmationError?: string;
}

export type CreateSubscriberInput = Omit<NewsletterSubscriber, "id" | "subscribedAt" | "updatedAt" | "subscriptionVersion" | "unsubscribeTokenHash">;

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
