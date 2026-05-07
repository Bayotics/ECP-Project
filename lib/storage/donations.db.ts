import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord,
  nanoid, nextSequence, padSequence,
} from "./storage";
import type { Donation, CreateDonationInput, UpdateDonationInput } from "../models/donation";

const KEY = STORAGE_KEYS.DONATIONS;
const COUNTER_KEY = "ecp_donation_seq";
const now = () => new Date().toISOString();

export const donationsDB = {
  getAll: (): Donation[] => getAll<Donation>(KEY),

  getById: (id: string): Donation | null => getById<Donation>(KEY, id),

  getByUser: (userId: string): Donation[] =>
    getWhere<Donation>(KEY, (d) => d.userId === userId),

  getByStatus: (status: Donation["status"]): Donation[] =>
    getWhere<Donation>(KEY, (d) => d.status === status),

  getByCause: (cause: Donation["cause"]): Donation[] =>
    getWhere<Donation>(KEY, (d) => d.cause === cause),

  getTotalSuccessful: (): number =>
    getWhere<Donation>(KEY, (d) => d.status === "successful").reduce(
      (sum, d) => sum + d.amount,
      0,
    ),

  getTotalByCause: (): Record<string, number> => {
    const all = getWhere<Donation>(KEY, (d) => d.status === "successful");
    return all.reduce(
      (acc, d) => {
        acc[d.cause] = (acc[d.cause] ?? 0) + d.amount;
        return acc;
      },
      {} as Record<string, number>,
    );
  },

  create: (input: CreateDonationInput): Donation => {
    const seq = nextSequence(COUNTER_KEY);
    const referenceNumber = `DON-${new Date().getFullYear()}-${padSequence(seq)}`;
    // Destructure so isRecurring doesn't appear twice in the object literal
    const { isRecurring: inputIsRecurring, ...rest } = input;
    const isRecurring = inputIsRecurring ?? input.type !== "one-time";
    return createRecord<Donation>(KEY, {
      id: nanoid(),
      referenceNumber,
      status: "pending",
      isRecurring,
      createdAt: now(),
      updatedAt: now(),
      ...rest,
    });
  },

  update: (id: string, patch: UpdateDonationInput): Donation | null =>
    updateRecord<Donation>(KEY, id, { ...patch, updatedAt: now() }),

  markSuccessful: (id: string, paymentReference?: string): Donation | null =>
    updateRecord<Donation>(KEY, id, {
      status: "successful",
      paymentReference,
      updatedAt: now(),
    }),

  markFailed: (id: string): Donation | null =>
    updateRecord<Donation>(KEY, id, { status: "failed", updatedAt: now() }),

  acknowledge: (id: string, adminId: string): Donation | null =>
    updateRecord<Donation>(KEY, id, {
      acknowledgedAt: now(),
      acknowledgedBy: adminId,
      updatedAt: now(),
    }),

  delete: (id: string): boolean => deleteRecord<Donation>(KEY, id),
};
