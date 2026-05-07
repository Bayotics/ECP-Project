import { STORAGE_KEYS } from "./keys";
import { getAll, getById, createRecord, updateRecord, deleteRecord, nanoid } from "./storage";
import type { OrgDocument, CreateDocumentInput, UpdateDocumentInput } from "../models/document";

const KEY = STORAGE_KEYS.DOCUMENTS;
const now = () => new Date().toISOString();

export const documentsDB = {
  getAll: (): OrgDocument[] => getAll<OrgDocument>(KEY),

  getById: (id: string): OrgDocument | null => getById<OrgDocument>(KEY, id),

  create: (input: CreateDocumentInput): OrgDocument =>
    createRecord<OrgDocument>(KEY, {
      id: nanoid(),
      uploadedAt: now(),
      updatedAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateDocumentInput): OrgDocument | null =>
    updateRecord<OrgDocument>(KEY, id, { ...patch, updatedAt: now() }),

  delete: (id: string): boolean => deleteRecord<OrgDocument>(KEY, id),
};
