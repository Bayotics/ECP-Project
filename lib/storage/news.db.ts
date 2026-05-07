import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
} from "./storage";
import type { NewsPost, CreateNewsInput, UpdateNewsInput } from "../models/news";

const KEY = STORAGE_KEYS.NEWS;
const now = () => new Date().toISOString();

export const newsDB = {
  getAll: (): NewsPost[] => getAll<NewsPost>(KEY),

  getById: (id: string): NewsPost | null => getById<NewsPost>(KEY, id),

  getBySlug: (slug: string): NewsPost | null =>
    getWhere<NewsPost>(KEY, (n) => n.slug === slug)[0] ?? null,

  getPublished: (): NewsPost[] =>
    getWhere<NewsPost>(KEY, (n) => n.status === "published").sort(
      (a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt),
    ),

  getFeatured: (): NewsPost[] =>
    getWhere<NewsPost>(KEY, (n) => n.isFeatured && n.status === "published"),

  getBreaking: (): NewsPost[] =>
    getWhere<NewsPost>(KEY, (n) => n.isBreaking && n.status === "published"),

  getByCategory: (category: NewsPost["category"]): NewsPost[] =>
    getWhere<NewsPost>(KEY, (n) => n.category === category && n.status === "published"),

  getByAuthor: (authorId: string): NewsPost[] =>
    getWhere<NewsPost>(KEY, (n) => n.authorId === authorId),

  create: (input: CreateNewsInput): NewsPost =>
    createRecord<NewsPost>(KEY, {
      id: nanoid(),
      viewCount: 0,
      createdAt: now(),
      updatedAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateNewsInput): NewsPost | null =>
    updateRecord<NewsPost>(KEY, id, { ...patch, updatedAt: now() }),

  publish: (id: string): NewsPost | null =>
    updateRecord<NewsPost>(KEY, id, {
      status: "published",
      publishedAt: now(),
      updatedAt: now(),
    }),

  incrementViews: (id: string): void => {
    const post = getById<NewsPost>(KEY, id);
    if (post) updateRecord<NewsPost>(KEY, id, { viewCount: post.viewCount + 1 });
  },

  delete: (id: string): boolean => deleteRecord<NewsPost>(KEY, id),
};
