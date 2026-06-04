import { NextResponse } from "next/server";
import { COLLECTIONS, ensureCoreIndexes } from "@/lib/server/collections";
import { getDb, getMongoDbName, pingMongo } from "@/lib/server/mongodb";

export async function GET() {
  try {
    await pingMongo();
    await ensureCoreIndexes();

    const db = await getDb();
    const collections = await Promise.all(
      Object.values(COLLECTIONS).map(async (name) => ({
        name,
        count: await db.collection(name).countDocuments(),
      }))
    );

    return NextResponse.json({
      ok: true,
      database: getMongoDbName(),
      collections,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach MongoDB";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
