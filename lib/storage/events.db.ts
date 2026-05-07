import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
} from "./storage";
import type { Event, CreateEventInput, UpdateEventInput } from "../models/event";

const KEY = STORAGE_KEYS.EVENTS;
const now = () => new Date().toISOString();

export const eventsDB = {
  getAll: (): Event[] => getAll<Event>(KEY),

  getById: (id: string): Event | null => getById<Event>(KEY, id),

  getBySlug: (slug: string): Event | null =>
    getWhere<Event>(KEY, (e) => e.slug === slug)[0] ?? null,

  getPublished: (): Event[] =>
    getWhere<Event>(KEY, (e) => e.status === "published" && e.isPublic),

  getFeatured: (): Event[] =>
    getWhere<Event>(KEY, (e) => e.isFeatured && e.status === "published"),

  getUpcoming: (): Event[] => {
    const today = new Date().toISOString();
    return getWhere<Event>(
      KEY,
      (e) => e.status === "published" && e.date >= today,
    ).sort((a, b) => a.date.localeCompare(b.date));
  },

  getPast: (): Event[] => {
    const today = new Date().toISOString();
    return getWhere<Event>(
      KEY,
      (e) => e.status !== "draft" && e.date < today,
    ).sort((a, b) => b.date.localeCompare(a.date));
  },

  getByOrganizer: (organizerId: string): Event[] =>
    getWhere<Event>(KEY, (e) => e.organizerId === organizerId),

  create: (input: CreateEventInput): Event =>
    createRecord<Event>(KEY, {
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateEventInput): Event | null =>
    updateRecord<Event>(KEY, id, { ...patch, updatedAt: now() }),

  publish: (id: string): Event | null =>
    updateRecord<Event>(KEY, id, { status: "published", updatedAt: now() }),

  cancel: (id: string): Event | null =>
    updateRecord<Event>(KEY, id, { status: "cancelled", updatedAt: now() }),

  delete: (id: string): boolean => deleteRecord<Event>(KEY, id),
};
