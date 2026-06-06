"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product, CreateProductInput, UpdateProductInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface ProductsContextValue {
  products: Product[];
  isLoading: boolean;
  getById: (id: string) => Product | null;
  getBySlug: (slug: string) => Product | null;
  getActive: () => Product[];
  getFeatured: () => Product[];
  getByCategory: (category: Product["category"]) => Product[];
  getInStock: () => Product[];
  add: (input: CreateProductInput) => Promise<Product>;
  update: (id: string, patch: UpdateProductInput) => Promise<Product | null>;
  adjustStock: (id: string, delta: number) => Promise<Product | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextValue | null>(null);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextProducts = await apiRequest<Product[]>("/api/products");
      setProducts(nextProducts);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialProducts() {
      try {
        const nextProducts = await apiRequest<Product[]>("/api/products");
        if (isActive) {
          setProducts(nextProducts);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialProducts();

    return () => {
      isActive = false;
    };
  }, []);

  const add = useCallback(async (input: CreateProductInput): Promise<Product> => {
    const created = await apiRequest<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setProducts((prev) => [created, ...prev.filter((product) => product.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateProductInput): Promise<Product | null> => {
    const updated = await apiRequest<Product>(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setProducts((prev) => prev.map((product) => (product.id === id ? updated : product)));
    return updated;
  }, []);

  const adjustStock = useCallback(async (id: string, delta: number): Promise<Product | null> => {
    const product = products.find((item) => item.id === id) ?? null;
    if (!product) return null;

    const nextStock = Math.max(0, (product.stock ?? 0) + delta);
    const nextStatus = nextStock === 0 && product.status === "active" ? "out-of-stock" : product.status;
    const updated = await apiRequest<Product>(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ stock: nextStock, status: nextStatus }),
    });
    setProducts((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [products]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/products/${id}`);
    setProducts((prev) => prev.filter((product) => product.id !== id));
    return true;
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
