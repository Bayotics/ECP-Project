import type { AnyBulkWriteOperation, Filter } from "mongodb";
import {
  SEED_APPLICATIONS,
  SEED_COMMITTEES,
  SEED_DOCUMENTS,
  SEED_DONATIONS,
  SEED_EVENTS,
  SEED_NEWS,
  SEED_ORDERS,
  SEED_PRODUCTS,
  SEED_RSVPS,
  SEED_USERS,
} from "@/lib/seed/seedData";
import { ensureCoreIndexes, getCollection, type AppCollections } from "@/lib/server/collections";

const SEED_PAYLOAD = {
  users: SEED_USERS,
  membershipApplications: SEED_APPLICATIONS,
  events: SEED_EVENTS,
  rsvps: SEED_RSVPS,
  news: SEED_NEWS,
  committees: SEED_COMMITTEES,
  products: SEED_PRODUCTS,
  orders: SEED_ORDERS,
  donations: SEED_DONATIONS,
  documents: SEED_DOCUMENTS,
} satisfies { [K in keyof AppCollections]: AppCollections[K][] };

async function upsertCollection<K extends keyof AppCollections>(
  name: K,
  docs: AppCollections[K][]
) {
  const collection = await getCollection(name);

  if (docs.length === 0) {
    return { total: 0, upserted: 0, modified: 0, matched: 0 };
  }

  const operations: AnyBulkWriteOperation<AppCollections[K]>[] = docs.map((doc) => ({
    updateOne: {
      filter: { id: doc.id } as Filter<AppCollections[K]>,
      update: { $set: doc },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations, { ordered: false });

  return {
    total: docs.length,
    upserted: result.upsertedCount,
    modified: result.modifiedCount,
    matched: result.matchedCount,
  };
}

export async function seedMongoDatabase() {
  await ensureCoreIndexes();

  const results = await Promise.all(
    (Object.entries(SEED_PAYLOAD) as Array<[keyof AppCollections, AppCollections[keyof AppCollections][]]>).map(
      async ([name, docs]) => [name, await upsertCollection(name, docs)] as const
    )
  );

  return Object.fromEntries(results);
}
