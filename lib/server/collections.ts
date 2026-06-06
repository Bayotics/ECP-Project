import type { Collection, IndexDescription } from "mongodb";
import type {
  Cart,
  Committee,
  Donation,
  Event,
  MembershipApplication,
  NewsPost,
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
