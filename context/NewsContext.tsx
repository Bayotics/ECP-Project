"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { NewsPost, CreateNewsInput, UpdateNewsInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface NewsContextValue {
  posts: NewsPost[];
  isLoading: boolean;
  getById: (id: string) => NewsPost | null;
  getBySlug: (slug: string) => NewsPost | null;
  getPublished: () => NewsPost[];
  getFeatured: () => NewsPost[];
  getBreaking: () => NewsPost[];
  getByCategory: (category: NewsPost["category"]) => NewsPost[];
  add: (input: CreateNewsInput) => Promise<NewsPost>;
  update: (id: string, patch: UpdateNewsInput) => Promise<NewsPost | null>;
  publish: (id: string) => Promise<NewsPost | null>;
  incrementViews: (id: string) => Promise<void>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const NewsContext = createContext<NewsContextValue | null>(null);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiRequest<NewsPost[]>("/api/news");
    setPosts(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await apiRequest<NewsPost[]>("/api/news");
        if (!active) return;
        setPosts(data);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const add = useCallback(async (input: CreateNewsInput): Promise<NewsPost> => {
    const created = await apiRequest<NewsPost>("/api/news", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setPosts((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateNewsInput): Promise<NewsPost | null> => {
    const updated = await apiRequest<NewsPost>(`/api/news/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    return updated;
  }, []);

  const publish = useCallback(async (id: string): Promise<NewsPost | null> => {
    const current = posts.find((post) => post.id === id);
    const updated = await apiRequest<NewsPost>(`/api/news/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "published",
        publishedAt: current?.publishedAt ?? new Date().toISOString(),
      }),
    });
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    return updated;
  }, [posts]);

  const incrementViews = useCallback(async (id: string): Promise<void> => {
    const current = posts.find((post) => post.id === id);
    if (!current) return;

    const updated = await apiRequest<NewsPost>(`/api/news/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ viewCount: current.viewCount + 1 }),
    });
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
  }, [posts]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/news/${id}`);
    setPosts((prev) => prev.filter((post) => post.id !== id));
    return true;
  }, []);

  const getById = useCallback((id: string) => posts.find(p => p.id === id) ?? null, [posts]);
  const getBySlug = useCallback((slug: string) => posts.find(p => p.slug === slug) ?? null, [posts]);
  const getPublished = useCallback(() =>
    posts.filter(p => p.status === "published").sort((a, b) =>
      (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt)
    ), [posts]);
  const getFeatured = useCallback(() =>
    posts.filter(p => p.isFeatured && p.status === "published"), [posts]);
  const getBreaking = useCallback(() =>
    posts.filter(p => p.isBreaking && p.status === "published"), [posts]);
  const getByCategory = useCallback((category: NewsPost["category"]) =>
    posts.filter(p => p.category === category && p.status === "published"), [posts]);

  return (
    <NewsContext.Provider
      value={{
        posts, isLoading,
        getById, getBySlug, getPublished, getFeatured, getBreaking, getByCategory,
        add, update, publish, incrementViews, remove, refresh,
      }}
    >
      {children}
    </NewsContext.Provider>
  );
}

export function useNews(): NewsContextValue {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error("useNews must be used within NewsProvider");
  return ctx;
}
