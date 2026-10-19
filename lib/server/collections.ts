import type { EmailVerificationToken } from "@/lib/server/email-verification";
import type { PasswordResetToken } from "@/lib/server/password-reset";
import type { Collection, IndexDescription } from "mongodb";
import type {
  Cart,
  Committee,
  CommitteeMembership,
  CommitteeMembershipChange,
  CommitteeMessage,
  CommitteeJoinRequest,
  Donation,
  DuesPayment,
  DuesReminder,
  Event,
  MembershipApplication,
  NewsPost,
  NewsletterSubscriber,
  NewsletterMessage,
  GalleryAlbum,
  GalleryMedia,
  NotificationLog,
  Order,
  OrgDocument,
  Product,
  RSVP,
  User,
  Volunteer,
  VolunteerChange,
  VolunteerSignup,
  VolunteerMessage,
  VolunteerAccessToken,
  VolunteerExternalRegistration,
  VolunteerImportBatch,
  EventProposal,
  ProposalMessage,
  ProposalRecipientsSettings,
  VolunteerIntegrationSettings,
} from "@/lib/models";
import { getDb } from "@/lib/server/mongodb";
import type { WhatWeDoDocument } from "@/lib/content/what-we-do";
import type { ConventionsDocument } from "@/lib/content/conventions";

export const COLLECTIONS = {
  siteContent: "siteContent",
  volunteers: "volunteers",
  volunteerChanges: "volunteerChanges",
  volunteerSignups: "volunteerSignups",
  volunteerMessages: "volunteerMessages",
  volunteerAccessTokens: "volunteerAccessTokens",
  volunteerExternalRegistrations: "volunteerExternalRegistrations",
  volunteerImportBatches: "volunteerImportBatches",
  proposals: "proposals",
  proposalMessages: "proposalMessages",
  clubSettings: "clubSettings",
  users: "users",
  membershipApplications: "membershipApplications",
  events: "events",
  rsvps: "rsvps",
  news: "news",
  committees: "committees",
  committeeMemberships: "committeeMemberships",
  committeeMembershipChanges: "committeeMembershipChanges",
  committeeMessages: "committeeMessages",
  products: "products",
  orders: "orders",
  donations: "donations",
  documents: "documents",
  carts: "carts",
  newsletterSubscribers: "newsletterSubscribers",
  newsletterMessages: "newsletterMessages",
  galleryAlbums: "galleryAlbums",
  galleryMedia: "galleryMedia",
  notificationLogs: "notificationLogs",
  duesPayments: "duesPayments",
  duesReminders: "duesReminders",
  committeeJoinRequests: "committeeJoinRequests",
  emailVerificationTokens: "emailVerificationTokens",
  passwordResetTokens: "passwordResetTokens",
} as const;

export interface AppCollections {
  siteContent: WhatWeDoDocument | ConventionsDocument;
  volunteers: Volunteer;
  volunteerChanges: VolunteerChange;
  volunteerSignups: VolunteerSignup;
  volunteerMessages: VolunteerMessage;
  volunteerAccessTokens: VolunteerAccessToken;
  volunteerExternalRegistrations: VolunteerExternalRegistration;
  volunteerImportBatches: VolunteerImportBatch;
  proposals: EventProposal;
  proposalMessages: ProposalMessage;
  clubSettings: ProposalRecipientsSettings | VolunteerIntegrationSettings;
  users: User;
  membershipApplications: MembershipApplication;
  events: Event;
  rsvps: RSVP;
  news: NewsPost;
  committees: Committee;
  committeeMemberships: CommitteeMembership;
  committeeMembershipChanges: CommitteeMembershipChange;
  committeeMessages: CommitteeMessage;
  products: Product;
  orders: Order;
  donations: Donation;
  documents: OrgDocument;
  carts: Cart;
  newsletterSubscribers: NewsletterSubscriber;
  newsletterMessages: NewsletterMessage;
  galleryAlbums: GalleryAlbum;
  galleryMedia: GalleryMedia;
  notificationLogs: NotificationLog;
  duesPayments: DuesPayment;
  duesReminders: DuesReminder;
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
  galleryAlbums: [{ key: { id: 1 }, unique: true }, { key: { status: 1, updatedAt: -1 } }, { key: { eventId: 1 } }],
  galleryMedia: [{ key: { id: 1 }, unique: true }, { key: { status: 1, addedAt: -1, id: -1 } }, { key: { albumId: 1, status: 1, addedAt: -1, id: -1 } }, { key: { albumId: 1, contentHash: 1 }, unique: true, partialFilterExpression: { contentHash: { $type: "string" } } }],
  newsletterMessages: [{ key: { id: 1 }, unique: true }, { key: { subscriberId: 1, subscriptionVersion: 1 }, unique: true }, { key: { status: 1, createdAt: 1 } }],
  committeeMemberships: [{ key: { id: 1 }, unique: true }, { key: { committeeId: 1, userId: 1 }, unique: true, partialFilterExpression: { userId: { $type: "string" } } }, { key: { committeeId: 1, volunteerId: 1 }, unique: true, partialFilterExpression: { volunteerId: { $type: "string" } } }],
  committeeMembershipChanges: [{ key: { id: 1 }, unique: true }, { key: { userId: 1, at: -1 } }, { key: { volunteerId: 1, at: -1 } }, { key: { committeeId: 1, at: -1 } }],
  committeeMessages: [{ key: { id: 1 }, unique: true }, { key: { status: 1, createdAt: 1 } }],
  volunteerAccessTokens: [{ key: { tokenHash: 1 }, unique: true }, { key: { volunteerId: 1 } }, { key: { expiresAt: 1 }, expireAfterSeconds: 0 }],
  volunteerExternalRegistrations: [{ key: { id: 1 }, unique: true }],
  volunteerImportBatches: [{ key: { id: 1 }, unique: true }, { key: { createdAt: -1 } }],
  proposals: [{ key: { id: 1 }, unique: true }, { key: { submissionId: 1 }, unique: true }, { key: { status: 1, createdAt: -1 } }],
  proposalMessages: [{ key: { id: 1 }, unique: true }, { key: { status: 1, createdAt: 1 } }, { key: { proposalId: 1 } }],
  clubSettings: [{ key: { id: 1 }, unique: true }],
  siteContent: [{ key: { id: 1 }, unique: true }],
  volunteerChanges: [{ key: { id: 1 }, unique: true }, { key: { volunteerId: 1, at: -1 } }],
  volunteers: [{ key: { id: 1 }, unique: true }, { key: { email: 1 }, unique: true }, { key: { userId: 1 }, unique: true, partialFilterExpression: { userId: { $type: "string" } } }, { key: { committeeIds: 1 } }, { key: { status: 1, resumeDate: 1 } }],
  volunteerSignups: [
    { key: { id: 1 }, unique: true },
    { key: { eventId: 1, volunteerId: 1 }, unique: true },
    { key: { eventId: 1, status: 1, registeredAt: 1 } },
    { key: { volunteerId: 1, registeredAt: -1 } },
  ],
  volunteerMessages: [
    { key: { id: 1 }, unique: true },
    { key: { status: 1, createdAt: 1 } },
    { key: { volunteerId: 1, status: 1 } },
  ],
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
    { key: { proposalId: 1 }, unique: true, partialFilterExpression: { proposalId: { $type: "string" } } },
    { key: { date: 1 } },
    { key: { status: 1 } },
    { key: { type: 1 } },
  ],
  rsvps: [
    { key: { id: 1 }, unique: true },
    { key: { eventId: 1 } },
    { key: { userId: 1 } },
    { key: { registrationKey: 1 }, unique: true, partialFilterExpression: { registrationKey: { $type: "string" }, status: { $in: ["confirmed", "waitlisted"] } } },
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
    { key: { unsubscribeTokenHash: 1 }, unique: true, partialFilterExpression: { unsubscribeTokenHash: { $type: "string" } } },
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
    { key: { userId: 1, year: 1 } },
    { key: { userId: 1, status: 1 }, unique: true, name: "one_open_dues_invoice", partialFilterExpression: { schemaVersion: 2, status: "pending" } },
    { key: { paypalOrderId: 1 }, unique: true, partialFilterExpression: { paypalOrderId: { $type: "string" } } },
    { key: { paypalCaptureId: 1 }, unique: true, partialFilterExpression: { paypalCaptureId: { $type: "string" } } },
    { key: { status: 1 } },
    { key: { year: 1 } },
  ],
  duesReminders: [
    { key: { id: 1 }, unique: true },
    { key: { userId: 1, month: 1 }, unique: true },
    { key: { status: 1, leaseUntil: 1 } },
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
          if (name === "duesPayments") {
            // The annual-only index prevents multiple installments in a year.
            const existing = await collection.listIndexes().toArray().catch((error: { code?: number }) => {
              if (error.code === 26) return [];
              throw error;
            });
            for (const index of existing) {
              if (index.unique && Object.keys(index.key).join(",") === "userId,year" && index.name) await collection.dropIndex(index.name);
            }
          }
          await Promise.all(indexes.map((index) => collection.createIndex(index.key, index)));
          // Before external imports existed, all volunteer records came from
          // the club website. Backfill that known origin once, never overwrite it.
          if (name === "volunteers" || name === "volunteerSignups") {
            await (await getCollection(name)).updateMany({ source: { $exists: false } }, { $set: { source: "website", sources: ["website"] } });
          }
        })
      );
    })().catch(error => { indexesPromise = null; throw error; });
  }

  await indexesPromise;
}
