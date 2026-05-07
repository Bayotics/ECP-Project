import { STORAGE_KEYS } from "./keys";
import {
  getAll, getById, getWhere, createRecord, updateRecord, deleteRecord, nanoid,
} from "./storage";
import type { Product, CreateProductInput, UpdateProductInput } from "../models/product";

const KEY = STORAGE_KEYS.PRODUCTS;
const now = () => new Date().toISOString();

export const productsDB = {
  getAll: (): Product[] => getAll<Product>(KEY),

  getById: (id: string): Product | null => getById<Product>(KEY, id),

  getBySlug: (slug: string): Product | null =>
    getWhere<Product>(KEY, (p) => p.slug === slug)[0] ?? null,

  getActive: (): Product[] =>
    getWhere<Product>(KEY, (p) => p.status === "active"),

  getFeatured: (): Product[] =>
    getWhere<Product>(KEY, (p) => p.isFeatured && p.status === "active"),

  getByCategory: (category: Product["category"]): Product[] =>
    getWhere<Product>(KEY, (p) => p.category === category),

  getInStock: (): Product[] =>
    getWhere<Product>(KEY, (p) => p.stock > 0 && p.status === "active"),

  create: (input: CreateProductInput): Product =>
    createRecord<Product>(KEY, {
      id: nanoid(),
      createdAt: now(),
      updatedAt: now(),
      ...input,
    }),

  update: (id: string, patch: UpdateProductInput): Product | null =>
    updateRecord<Product>(KEY, id, { ...patch, updatedAt: now() }),

  adjustStock: (id: string, delta: number): Product | null => {
    const product = getById<Product>(KEY, id);
    if (!product) return null;
    const newStock = Math.max(0, product.stock + delta);
    return updateRecord<Product>(KEY, id, {
      stock: newStock,
      status: newStock === 0 ? "out-of-stock" : "active",
      updatedAt: now(),
    });
  },

  delete: (id: string): boolean => deleteRecord<Product>(KEY, id),
};
