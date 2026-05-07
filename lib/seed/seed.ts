/**
 * Seeder — loads all mock data into localStorage on first app launch.
 * Safe to call repeatedly; it checks the SEEDED flag first.
 */

import { STORAGE_KEYS } from "../storage/keys";
import { storageRead, storageWrite, storageReadOne, storageWriteOne } from "../storage/storage";
import { setUserPassword } from "../storage/users.db";
import {
  SEED_USERS,
  SEED_APPLICATIONS,
  SEED_EVENTS,
  SEED_RSVPS,
  SEED_NEWS,
  SEED_COMMITTEES,
  SEED_PRODUCTS,
  SEED_ORDERS,
  SEED_DONATIONS,
  SEED_DOCUMENTS,
} from "./seedData";

export function runSeed(): void {
  if (typeof window === "undefined") return;

  // Check if already seeded
  const alreadySeeded = storageReadOne<boolean>(STORAGE_KEYS.SEEDED);
  if (alreadySeeded) return;

  // Seed all entities (only if they're currently empty — extra safety)
  const seedIfEmpty = <T>(key: string, data: T[]): void => {
    const existing = storageRead<T>(key);
    if (!existing || existing.length === 0) {
      storageWrite(key, data);
    }
  };

  seedIfEmpty(STORAGE_KEYS.USERS, SEED_USERS);
  seedIfEmpty(STORAGE_KEYS.MEMBERSHIP_APPLICATIONS, SEED_APPLICATIONS);
  seedIfEmpty(STORAGE_KEYS.EVENTS, SEED_EVENTS);
  seedIfEmpty(STORAGE_KEYS.RSVPS, SEED_RSVPS);
  seedIfEmpty(STORAGE_KEYS.NEWS, SEED_NEWS);
  seedIfEmpty(STORAGE_KEYS.COMMITTEES, SEED_COMMITTEES);
  seedIfEmpty(STORAGE_KEYS.PRODUCTS, SEED_PRODUCTS);
  seedIfEmpty(STORAGE_KEYS.ORDERS, SEED_ORDERS);
  seedIfEmpty(STORAGE_KEYS.DONATIONS, SEED_DONATIONS);
  seedIfEmpty(STORAGE_KEYS.DOCUMENTS, SEED_DOCUMENTS);

  // Set default logged-in user (first admin) for demo purposes
  const currentAuthUserId = storageReadOne<string>(STORAGE_KEYS.AUTH_USER_ID);
  if (!currentAuthUserId) {
    storageWriteOne(STORAGE_KEYS.AUTH_USER_ID, "u-admin-001");
  }

  // Seed default passwords for all seeded accounts (demo password: ecp2024)
  const passwords = storageReadOne<Record<string, string>>(STORAGE_KEYS.USER_PASSWORDS) ?? {};
  const seedUserIds = SEED_USERS.map((u) => u.id);
  let passwordsChanged = false;
  for (const uid of seedUserIds) {
    if (!passwords[uid]) {
      setUserPassword(uid, "ecp2024");
      passwordsChanged = true;
    }
  }
  void passwordsChanged; // used indirectly via setUserPassword

  // Mark as seeded
  storageWriteOne(STORAGE_KEYS.SEEDED, true);

  if (process.env.NODE_ENV === "development") {
    console.info("[ECP Seed] localStorage seeded successfully.");
  }
}

/** Wipe all ECP data from localStorage (dev utility). */
export function clearSeed(): void {
  if (typeof window === "undefined") return;
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
  if (process.env.NODE_ENV === "development") {
    console.info("[ECP Seed] localStorage cleared.");
  }
}
