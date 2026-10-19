import type { ClientSession } from "mongodb";
import { getMongoClient } from "@/lib/server/mongodb";

export async function volunteerTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = (await getMongoClient()).startSession();
  try {
    // A concurrent first sign-up may race on the person's unique email index.
    // Retry the whole transaction, then find that same person on the next attempt.
    for (let attempt = 0; ; attempt++) {
      try { return await session.withTransaction(() => work(session), { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } }); }
      catch (error) {
        if (attempt >= 2 || !error || typeof error !== "object" || !("code" in error) || error.code !== 11000) throw error;
      }
    }
  } finally { await session.endSession(); }
}
