import { MongoClient, ServerApiVersion } from "mongodb";

const DEFAULT_DB_NAME = "ecp_platform";

declare global {
  var __ecpMongoClientPromise__: Promise<MongoClient> | undefined;
}

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("Missing MONGODB_URI. Add it to your .env.local file.");
  }

  return uri;
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB ?? DEFAULT_DB_NAME;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!global.__ecpMongoClientPromise__) {
    const client = new MongoClient(getMongoUri(), {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    global.__ecpMongoClientPromise__ = client.connect();
  }

  return global.__ecpMongoClientPromise__;
}

export async function getDb() {
  const client = await getMongoClient();
  return client.db(getMongoDbName());
}

export async function pingMongo(): Promise<void> {
  const db = await getDb();
  await db.command({ ping: 1 });
}
