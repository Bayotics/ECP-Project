import { createHash } from "crypto";
import type { Collection } from "mongodb";
import type { User } from "@/lib/models";
import { getDb } from "@/lib/server/mongodb";

const CREDENTIALS_COLLECTION = "authCredentials";
const DEFAULT_PASSWORD = "ecp2024";

interface AuthCredential {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

const now = () => new Date().toISOString();

async function getCredentialsCollection(): Promise<Collection<AuthCredential>> {
  const db = await getDb();
  return db.collection<AuthCredential>(CREDENTIALS_COLLECTION);
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export async function ensureAuthIndexes(): Promise<void> {
  const collection = await getCredentialsCollection();
  await Promise.all([
    collection.createIndex({ userId: 1 }, { unique: true }),
    collection.createIndex({ email: 1 }, { unique: true }),
  ]);
}

export async function verifyCredentials(email: string, password: string): Promise<string | null> {
  const collection = await getCredentialsCollection();
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await collection.findOne({ email: normalizedEmail });

  if (!credential) return null;
  return credential.passwordHash === hashPassword(password) ? credential.userId : null;
}

export async function upsertCredential(userId: string, email: string, password: string): Promise<void> {
  const collection = await getCredentialsCollection();
  const normalizedEmail = email.trim().toLowerCase();

  await collection.updateOne(
    { userId },
    {
      $set: {
        userId,
        email: normalizedEmail,
        passwordHash: hashPassword(password),
        updatedAt: now(),
      },
      $setOnInsert: {
        createdAt: now(),
      },
    },
    { upsert: true }
  );
}

/** Checks one account's own password, for a signed-in password change. */
export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const collection = await getCredentialsCollection();
  const credential = await collection.findOne({ userId });
  if (!credential) return false;
  return credential.passwordHash === hashPassword(password);
}

/** Whether this account has a password at all. */
export async function hasCredential(userId: string): Promise<boolean> {
  const collection = await getCredentialsCollection();
  return (await collection.countDocuments({ userId }, { limit: 1 })) > 0;
}

export async function updateCredentialEmail(userId: string, email: string): Promise<void> {
  const collection = await getCredentialsCollection();
  await collection.updateOne({ userId }, { $set: { email: email.trim().toLowerCase(), updatedAt: now() } });
}

export async function deleteCredential(userId: string): Promise<void> {
  const collection = await getCredentialsCollection();
  await collection.deleteOne({ userId });
}

export async function createUserWithPassword(
  user: User,
  password: string = DEFAULT_PASSWORD
): Promise<User> {
  await upsertCredential(user.id, user.email, password);
  return user;
}
