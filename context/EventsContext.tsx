"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Event, CreateEventInput, UpdateEventInput } from "@/lib/models";
import { eventsDB } from "@/lib/storage";

interface EventsContextValue {
  events: Event[];
  isLoading: boolean;
  getById: (id: string) => Event | null;
  getBySlug: (slug: string) => Event | null;
  getPublished: () => Event[];
  getFeatured: () => Event[];
  getUpcoming: () => Event[];
  getPast: () => Event[];
  add: (input: CreateEventInput) => Event;
  update: (id: string, patch: UpdateEventInput) => Event | null;
  publish: (id: string) => Event | null;
  cancel: (id: string) => Event | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const EventsContext = createContext<EventsContextValue | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setEvents(eventsDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateEventInput): Event => {
    const created = eventsDB.create(input);
    setEvents(eventsDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateEventInput): Event | null => {
    const updated = eventsDB.update(id, patch);
    setEvents(eventsDB.getAll());
    return updated;
  }, []);

  const publish = useCallback((id: string): Event | null => {
    const updated = eventsDB.publish(id);
    setEvents(eventsDB.getAll());
    return updated;
  }, []);

  const cancel = useCallback((id: string): Event | null => {
    const updated = eventsDB.cancel(id);
    setEvents(eventsDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = eventsDB.delete(id);
    setEvents(eventsDB.getAll());
    return result;
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
