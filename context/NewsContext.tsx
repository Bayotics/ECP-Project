"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { NewsPost, CreateNewsInput, UpdateNewsInput } from "@/lib/models";
import { newsDB } from "@/lib/storage";

interface NewsContextValue {
  posts: NewsPost[];
  isLoading: boolean;
  getById: (id: string) => NewsPost | null;
  getBySlug: (slug: string) => NewsPost | null;
  getPublished: () => NewsPost[];
  getFeatured: () => NewsPost[];
  getBreaking: () => NewsPost[];
  getByCategory: (category: NewsPost["category"]) => NewsPost[];
  add: (input: CreateNewsInput) => NewsPost;
  update: (id: string, patch: UpdateNewsInput) => NewsPost | null;
  publish: (id: string) => NewsPost | null;
  incrementViews: (id: string) => void;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const NewsContext = createContext<NewsContextValue | null>(null);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setPosts(newsDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateNewsInput): NewsPost => {
    const created = newsDB.create(input);
    setPosts(newsDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateNewsInput): NewsPost | null => {
    const updated = newsDB.update(id, patch);
    setPosts(newsDB.getAll());
    return updated;
  }, []);

  const publish = useCallback((id: string): NewsPost | null => {
    const updated = newsDB.publish(id);
    setPosts(newsDB.getAll());
    return updated;
  }, []);

  const incrementViews = useCallback((id: string): void => {
    newsDB.incrementViews(id);
    setPosts(newsDB.getAll());
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = newsDB.delete(id);
    setPosts(newsDB.getAll());
    return result;
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
