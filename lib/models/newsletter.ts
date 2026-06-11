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
}

export type CreateSubscriberInput = Omit<NewsletterSubscriber, "id" | "subscribedAt">;

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
