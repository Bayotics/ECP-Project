import type { EmailVerificationToken } from "@/lib/server/email-verification";
import type { PasswordResetToken } from "@/lib/server/password-reset";
import type { Collection, IndexDescription } from "mongodb";
import type {
  Cart,
  Committee,
  CommitteeJoinRequest,
  Donation,
  DuesPayment,
  Event,
  MembershipApplication,
  NewsPost,
  NewsletterSubscriber,
  NotificationLog,
  Order,
  OrgDocument,
  Product,
  RSVP,
  User,
} from "@/lib/models";
import { getDb } from "@/lib/server/mongodb";

export const COLLECTIONS = {
  users: "users",
  membershipApplications: "membershipApplications",
  events: "events",
  rsvps: "rsvps",
  news: "news",
  committees: "committees",
  products: "products",
  orders: "orders",
  donations: "donations",
  documents: "documents",
  carts: "carts",
  newsletterSubscribers: "newsletterSubscribers",
  notificationLogs: "notificationLogs",
  duesPayments: "duesPayments",
  committeeJoinRequests: "committeeJoinRequests",
  emailVerificationTokens: "emailVerificationTokens",
  passwordResetTokens: "passwordResetTokens",
} as const;

export interface AppCollections {
  users: User;
  membershipApplications: MembershipApplication;
  events: Event;
  rsvps: RSVP;
  news: NewsPost;
  committees: Committee;
  products: Product;
  orders: Order;
  donations: Donation;
  documents: OrgDocument;
  carts: Cart;
  newsletterSubscribers: NewsletterSubscriber;
  notificationLogs: NotificationLog;
  duesPayments: DuesPayment;
  committeeJoinRequests: CommitteeJoinRequest;
  emailVerificationTokens: EmailVerificationToken;
  passwordResetTokens: PasswordResetToken;
}

type CollectionName = keyof AppCollections;
type AppDocument<T> = T & { _id?: unknown };

type CollectionIndexMap = {
  [K in CollectionName]: IndexDescription[];
};

const COLLECTION_INDEXES: CollectionIndexMap = {
  users: [
    { key: { id: 1 }, unique: true },
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } },
    /* No two members may hold the same club number. Partial rather than
       sparse: a sparse unique index still indexes nulls, and a second
       account with `membershipId: null` would collide with the first. This
       indexes only the accounts that actually carry a number. */
    {
      key: { membershipId: 1 },
      unique: true,
      partialFilterExpression: { membershipId: { $type: "string" } },
    },
  ],
  membershipApplications: [
    { key: { id: 1 }, unique: true },
    { key: { email: 1 } },
    { key: { status: 1 } },
    { key: { userId: 1 } },
  ],
  events: [
    { key: { id: 1 }, unique: true },
    { key: { slug: 1 }, unique: true },
    { key: { date: 1 } },
    { key: { status: 1 } },
    { key: { type: 1 } },
  ],
  rsvps: [
    { key: { id: 1 }, unique: true },
    { key: { eventId: 1 } },
    { key: { userId: 1 } },
  ],
  news: [
    { key: { id: 1 }, unique: true },
    { key: { slug: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { category: 1 } },
  ],
  committees: [
    { key: { id: 1 }, unique: true },
    { key: { slug: 1 }, unique: true },
  ],
  products: [
    { key: { id: 1 }, unique: true },
    { key: { slug: 1 }, unique: true },
    { key: { status: 1 } },
  ],
  orders: [
    { key: { id: 1 }, unique: true },
    { key: { userId: 1 } },
    { key: { status: 1 } },
  ],
  donations: [
    { key: { id: 1 }, unique: true },
    { key: { donorEmail: 1 } },
    { key: { status: 1 } },
  ],
  documents: [
    { key: { id: 1 }, unique: true },
    { key: { category: 1 } },
  ],
  carts: [
    { key: { id: 1 }, unique: true },
    { key: { userId: 1 }, unique: true, sparse: true },
    { key: { sessionId: 1 }, unique: true, sparse: true },
  ],
  newsletterSubscribers: [
    { key: { id: 1 }, unique: true },
    { key: { email: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { source: 1 } },
  ],
  notificationLogs: [
    { key: { id: 1 }, unique: true },
    { key: { eventId: 1 } },
    { key: { sentAt: -1 } },
    { key: { type: 1 } },
  ],
  duesPayments: [
    { key: { id: 1 }, unique: true },
    { key: { userId: 1 } },
    { key: { userId: 1, year: 1 }, unique: true },
    { key: { status: 1 } },
    { key: { year: 1 } },
  ],
  emailVerificationTokens: [
    { key: { id: 1 }, unique: true },
    { key: { tokenHash: 1 }, unique: true },
    { key: { userId: 1 } },
    /* MongoDB drops each token an hour past its expiry, so spent and stale
       rows do not pile up and nothing has to sweep them. It indexes
       `expiresAtDate` rather than `expiresAt`, because a TTL index only
       acts on a real BSON date and ignores an ISO string entirely. */
    { key: { expiresAtDate: 1 }, expireAfterSeconds: 3600 },
  ],
  committeeJoinRequests: [
    { key: { id: 1 }, unique: true },
    { key: { committeeId: 1 } },
    { key: { userId: 1 } },
    { key: { status: 1 } },
  ],
  passwordResetTokens: [
    { key: { id: 1 }, unique: true },
    { key: { tokenHash: 1 }, unique: true },
    { key: { userId: 1 } },
    /* Dropped an hour past expiry, so spent links do not accumulate. On
       `expiresAtDate`, because a TTL index ignores an ISO string. */
    { key: { expiresAtDate: 1 }, expireAfterSeconds: 3600 },
  ],
};

let indexesPromise: Promise<void> | null = null;

export async function getCollection<K extends CollectionName>(name: K): Promise<Collection<AppCollections[K]>> {
  const db = await getDb();
  return db.collection<AppCollections[K]>(COLLECTIONS[name]);
}

export function serializeDocument<T extends { _id?: unknown }>(doc: AppDocument<T> | null): T | null {
  if (!doc) return null;

  return Object.fromEntries(
    Object.entries(doc).filter(([key]) => key !== "_id")
  ) as T;
}

export function serializeDocuments<T extends { _id?: unknown }>(docs: AppDocument<T>[]): T[] {
  return docs.map((doc) => serializeDocument(doc)).filter((doc): doc is T => Boolean(doc));
}

export async function ensureCoreIndexes(): Promise<void> {
  if (!indexesPromise) {
    indexesPromise = (async () => {
      await Promise.all(
        (Object.keys(COLLECTIONS) as CollectionName[]).map(async (name) => {
          const collection = await getCollection(name);
          const indexes = COLLECTION_INDEXES[name];
          await Promise.all(indexes.map((index) => collection.createIndex(index.key, index)));
        })
      );
    })();
  }

  await indexesPromise;
}
