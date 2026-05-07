/**
 * Generic localStorage CRUD utilities.
 *
 * All operations are synchronous and safe — they never throw;
 * errors are logged and a sensible fallback is returned.
 *
 * All entities must have an `id: string` field.
 */

import { nanoid } from "nanoid";
export { nanoid };

/* ─── Low-level read / write ─────────────────────────── */

export function storageRead<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch (err) {
    console.warn(`[storage] Failed to read "${key}"`, err);
    return [];
  }
}

export function storageWrite<T>(key: string, data: T[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[storage] Failed to write "${key}"`, err);
  }
}

export function storageReadOne<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function storageWriteOne<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] Failed to write single "${key}"`, err);
  }
}

export function storageRemoveKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key);
}

/* ─── CRUD helpers ───────────────────────────────────── */

export interface WithId {
  id: string;
}

/**
 * Returns all records for a given key.
 */
export function getAll<T extends WithId>(key: string): T[] {
  return storageRead<T>(key);
}

/**
 * Returns a single record by id, or null.
 */
export function getById<T extends WithId>(key: string, id: string): T | null {
  const all = storageRead<T>(key);
  return all.find((item) => item.id === id) ?? null;
}

/**
 * Returns records matching a predicate.
 */
export function getWhere<T extends WithId>(
  key: string,
  predicate: (item: T) => boolean,
): T[] {
  return storageRead<T>(key).filter(predicate);
}

/**
 * Inserts a new record. Generates an id if not provided.
 * Returns the created record.
 */
export function createRecord<T extends WithId>(
  key: string,
  data: Omit<T, "id"> & { id?: string },
): T {
  const item = { ...data, id: data.id ?? nanoid() } as T;
  const all = storageRead<T>(key);
  storageWrite(key, [...all, item]);
  return item;
}

/**
 * Updates fields of an existing record by id.
 * Returns the updated record, or null if not found.
 */
export function updateRecord<T extends WithId>(
  key: string,
  id: string,
  patch: Partial<Omit<T, "id">>,
): T | null {
  const all = storageRead<T>(key);
  let updated: T | null = null;
  const next = all.map((item) => {
    if (item.id !== id) return item;
    updated = { ...item, ...patch } as T;
    return updated;
  });
  if (!updated) return null;
  storageWrite(key, next);
  return updated;
}

/**
 * Deletes a record by id.
 * Returns true if a record was deleted.
 */
export function deleteRecord<T extends WithId>(key: string, id: string): boolean {
  const all = storageRead<T>(key);
  const next = all.filter((item) => item.id !== id);
  if (next.length === all.length) return false;
  storageWrite(key, next);
  return true;
}

/**
 * Replaces the entire collection with a new array.
 */
export function replaceAll<T extends WithId>(key: string, items: T[]): void {
  storageWrite(key, items);
}

/**
 * Writes seed data ONLY if the collection is empty.
 * Always-idempotent.
 */
export function seedIfEmpty<T extends WithId>(key: string, items: T[]): void {
  const existing = storageRead<T>(key);
  if (existing.length === 0) {
    storageWrite(key, items);
  }
}

/* ─── Counter helper for human-readable IDs ─────────── */

export function nextSequence(counterKey: string): number {
  if (typeof window === "undefined") return 1;
  const current = parseInt(localStorage.getItem(counterKey) ?? "0", 10);
  const next = current + 1;
  localStorage.setItem(counterKey, String(next));
  return next;
}

export function padSequence(n: number, length = 4): string {
  return String(n).padStart(length, "0");
}
