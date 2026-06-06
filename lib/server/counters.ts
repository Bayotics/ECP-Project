import { ReturnDocument } from "mongodb";
import { getDb } from "@/lib/server/mongodb";

interface CounterDocument {
  name: string;
  value: number;
}

const COUNTERS_COLLECTION = "counters";

export async function getNextSequence(name: string): Promise<number> {
  const db = await getDb();
  const collection = db.collection<CounterDocument>(COUNTERS_COLLECTION);

  const result = await collection.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    {
      upsert: true,
      returnDocument: ReturnDocument.AFTER,
    }
  );

  return result?.value ?? 1;
}

export function padSequence(value: number, width = 4): string {
  return String(value).padStart(width, "0");
}
