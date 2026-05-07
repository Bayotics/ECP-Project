import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
  storageReadOne, storageWriteOne,
} from "./storage";
import type { User, CreateUserInput, UpdateUserInput } from "../models/user";

const KEY = STORAGE_KEYS.USERS;
const now = () => new Date().toISOString();

/** Default password used for all seeded demo accounts */
export const DEFAULT_SEED_PASSWORD = "ecp2024";

function getPasswordMap(): Record<string, string> {
  return storageReadOne<Record<string, string>>(STORAGE_KEYS.USER_PASSWORDS) ?? {};
}

function savePasswordMap(map: Record<string, string>): void {
  storageWriteOne(STORAGE_KEYS.USER_PASSWORDS, map);
}

export function setUserPassword(userId: string, password: string): void {
  const map = getPasswordMap();
  map[userId] = password;
  savePasswordMap(map);
}

export function checkUserPassword(userId: string, password: string): boolean {
  const map = getPasswordMap();
  // If no password stored (seed user), accept the default seed password
  const stored = map[userId];
  if (stored === undefined) return password === DEFAULT_SEED_PASSWORD;
  return stored === password;
}

export const usersDB = {
  getAll: (): User[] => getAll<User>(KEY),

  getById: (id: string): User | null => getById<User>(KEY, id),

  getByEmail: (email: string): User | null =>
    getWhere<User>(KEY, (u) => u.email.toLowerCase() === email.toLowerCase())[0] ?? null,

  getByRole: (role: User["role"]): User[] =>
    getWhere<User>(KEY, (u) => u.role === role),

  create: (input: CreateUserInput): User =>
    createRecord<User>(KEY, {
      id: nanoid(),
      joinedAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateUserInput): User | null =>
    updateRecord<User>(KEY, id, patch),

  delete: (id: string): boolean => deleteRecord<User>(KEY, id),

  setRole: (id: string, role: User["role"]): User | null =>
    updateRecord<User>(KEY, id, { role }),

  setStatus: (id: string, status: User["status"]): User | null =>
    updateRecord<User>(KEY, id, { status }),

  /** Authenticate by email + password. Returns user if valid, null otherwise. */
  findByCredentials: (email: string, password: string): User | null => {
    const user = usersDB.getByEmail(email);
    if (!user) return null;
    if (!checkUserPassword(user.id, password)) return null;
    return user;
  },

  /** Create a new user and store their password. */
  registerUser: (input: Omit<CreateUserInput, "role" | "status"> & { password: string }): User => {
    const { password, ...rest } = input;
    const user = createRecord<User>(KEY, {
      id: nanoid(),
      joinedAt: now(),
      role: "applicant",
      status: "pending",
      ...rest,
    });
    setUserPassword(user.id, password);
    return user;
  },
};
