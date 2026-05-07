import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
} from "./storage";
import type { RSVP, CreateRSVPInput, UpdateRSVPInput } from "../models/rsvp";

const KEY = STORAGE_KEYS.RSVPS;
const now = () => new Date().toISOString();

export const rsvpsDB = {
  getAll: (): RSVP[] => getAll<RSVP>(KEY),

  getById: (id: string): RSVP | null => getById<RSVP>(KEY, id),

  getByEvent: (eventId: string): RSVP[] =>
    getWhere<RSVP>(KEY, (r) => r.eventId === eventId),

  getByUser: (userId: string): RSVP[] =>
    getWhere<RSVP>(KEY, (r) => r.userId === userId),

  getConfirmedByEvent: (eventId: string): RSVP[] =>
    getWhere<RSVP>(KEY, (r) => r.eventId === eventId && r.status === "confirmed"),

  getByEventAndEmail: (eventId: string, email: string): RSVP | null =>
    getWhere<RSVP>(
      KEY,
      (r) => r.eventId === eventId && r.email.toLowerCase() === email.toLowerCase(),
    )[0] ?? null,

  countConfirmed: (eventId: string): number =>
    getWhere<RSVP>(KEY, (r) => r.eventId === eventId && r.status === "confirmed").length,

  create: (input: CreateRSVPInput): RSVP =>
    createRecord<RSVP>(KEY, {
      id: nanoid(),
      status: "confirmed",
      registeredAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateRSVPInput): RSVP | null =>
    updateRecord<RSVP>(KEY, id, patch),

  cancel: (id: string): RSVP | null =>
    updateRecord<RSVP>(KEY, id, { status: "cancelled", cancelledAt: now() }),

  checkIn: (id: string): RSVP | null =>
    updateRecord<RSVP>(KEY, id, { checkedInAt: now() }),

  delete: (id: string): boolean => deleteRecord<RSVP>(KEY, id),
};
