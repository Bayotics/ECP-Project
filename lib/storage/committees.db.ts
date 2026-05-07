import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
} from "./storage";
import type { Committee, CreateCommitteeInput, UpdateCommitteeInput } from "../models/committee";

const KEY = STORAGE_KEYS.COMMITTEES;
const now = () => new Date().toISOString();

export const committeesDB = {
  getAll: (): Committee[] => getAll<Committee>(KEY),

  getById: (id: string): Committee | null => getById<Committee>(KEY, id),

  getBySlug: (slug: string): Committee | null =>
    getWhere<Committee>(KEY, (c) => c.slug === slug)[0] ?? null,

  getActive: (): Committee[] =>
    getWhere<Committee>(KEY, (c) => c.status === "active"),

  getByType: (type: Committee["type"]): Committee[] =>
    getWhere<Committee>(KEY, (c) => c.type === type),

  create: (input: CreateCommitteeInput): Committee =>
    createRecord<Committee>(KEY, {
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateCommitteeInput): Committee | null =>
    updateRecord<Committee>(KEY, id, { ...patch, updatedAt: now() }),

  addMember: (
    id: string,
    member: Committee["members"][number],
  ): Committee | null => {
    const committee = getById<Committee>(KEY, id);
    if (!committee) return null;
    return updateRecord<Committee>(KEY, id, {
      members: [...committee.members, member],
      updatedAt: now(),
    });
  },

  removeMember: (committeeId: string, userId: string): Committee | null => {
    const committee = getById<Committee>(KEY, committeeId);
    if (!committee) return null;
    return updateRecord<Committee>(KEY, committeeId, {
      members: committee.members.filter((m) => m.userId !== userId),
      updatedAt: now(),
    });
  },

  delete: (id: string): boolean => deleteRecord<Committee>(KEY, id),
};
