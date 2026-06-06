"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Event, CreateEventInput, UpdateEventInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface EventsContextValue {
  events: Event[];
  isLoading: boolean;
  getById: (id: string) => Event | null;
  getBySlug: (slug: string) => Event | null;
  getPublished: () => Event[];
  getFeatured: () => Event[];
  getUpcoming: () => Event[];
  getPast: () => Event[];
  add: (input: CreateEventInput) => Promise<Event>;
  update: (id: string, patch: UpdateEventInput) => Promise<Event | null>;
  publish: (id: string) => Promise<Event | null>;
  cancel: (id: string) => Promise<Event | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiRequest<Event[]>("/api/events");
    setEvents(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await apiRequest<Event[]>("/api/events");
        if (!active) return;
        setEvents(data);
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

  const add = useCallback(async (input: CreateEventInput): Promise<Event> => {
    const created = await apiRequest<Event>("/api/events", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setEvents((prev) => [...prev, created]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateEventInput): Promise<Event | null> => {
    const updated = await apiRequest<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
    return updated;
  }, []);

  const publish = useCallback(async (id: string): Promise<Event | null> => {
    const updated = await apiRequest<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
    return updated;
  }, []);

  const cancel = useCallback(async (id: string): Promise<Event | null> => {
    const updated = await apiRequest<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/events/${id}`);
    setEvents((prev) => prev.filter((event) => event.id !== id));
    return true;
  }, []);

  const getById = useCallback((id: string) => events.find(e => e.id === id) ?? null, [events]);
  const getBySlug = useCallback((slug: string) => events.find(e => e.slug === slug) ?? null, [events]);
  const getPublished = useCallback(() => events.filter(e => e.status === "published"), [events]);
  const getFeatured = useCallback(() => events.filter(e => e.isFeatured && e.status === "published"), [events]);
  const getUpcoming = useCallback(() => {
    const today = new Date().toISOString();
    return events.filter(e => e.status === "published" && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);
  const getPast = useCallback(() => {
    const today = new Date().toISOString();
    return events.filter(e => e.status !== "draft" && e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [events]);

  return (
    <EventsContext.Provider
      value={{
        events, isLoading,
        getById, getBySlug, getPublished, getFeatured, getUpcoming, getPast,
        add, update, publish, cancel, remove, refresh,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents(): EventsContextValue {
  const ctx = useContext(EventsContext);
  if (!ctx) throw new Error("useEvents must be used within EventsProvider");
  return ctx;
}
