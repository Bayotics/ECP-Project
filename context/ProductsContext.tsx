"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product, CreateProductInput, UpdateProductInput } from "@/lib/models";
import { productsDB } from "@/lib/storage";

interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  getById: (id: string) => Product | null;
  getBySlug: (slug: string) => Product | null;
  getActive: () => Product[];
  getFeatured: () => Product[];
  getByCategory: (category: Product["category"]) => Product[];
  getInStock: () => Product[];
  add: (input: CreateProductInput) => Product;
  update: (id: string, patch: UpdateProductInput) => Product | null;
  adjustStock: (id: string, delta: number) => Product | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setProducts(productsDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateProductInput): Product => {
    const created = productsDB.create(input);
    setProducts(productsDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateProductInput): Product | null => {
    const updated = productsDB.update(id, patch);
    setProducts(productsDB.getAll());
    return updated;
  }, []);

  const adjustStock = useCallback((id: string, delta: number): Product | null => {
    const updated = productsDB.adjustStock(id, delta);
    setProducts(productsDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = productsDB.delete(id);
    setProducts(productsDB.getAll());
    return result;
  }, []);

  const getById = useCallback((id: string) => products.find(p => p.id === id) ?? null, [products]);
  const getBySlug = useCallback((slug: string) => products.find(p => p.slug === slug) ?? null, [products]);
  const getActive = useCallback(() => products.filter(p => p.status === "active"), [products]);
  const getFeatured = useCallback(() => products.filter(p => p.isFeatured && p.status === "active"), [products]);
  const getByCategory = useCallback((category: Product["category"]) => products.filter(p => p.category === category), [products]);
  const getInStock = useCallback(() => products.filter(p => p.stock > 0 && p.status === "active"), [products]);

  return (
    <ProductsContext.Provider
      value={{
        products, isLoading,
        getById, getBySlug, getActive, getFeatured, getByCategory, getInStock,
        add, update, adjustStock, remove, refresh,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts(): ProductsContextValue {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used within ProductsProvider");
  return ctx;
}
