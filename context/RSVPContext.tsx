"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { RSVP, CreateRSVPInput, UpdateRSVPInput } from "@/lib/models";
import { rsvpsDB } from "@/lib/storage";

interface RSVPContextValue {
  rsvps: RSVP[];
  isLoading: boolean;
  getById: (id: string) => RSVP | null;
  getByEvent: (eventId: string) => RSVP[];
  getByUser: (userId: string) => RSVP[];
  getConfirmedByEvent: (eventId: string) => RSVP[];
  countConfirmed: (eventId: string) => number;
  add: (input: CreateRSVPInput) => RSVP;
  update: (id: string, patch: UpdateRSVPInput) => RSVP | null;
  cancel: (id: string) => RSVP | null;
  checkIn: (id: string) => RSVP | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const RSVPContext = createContext<RSVPContextValue | null>(null);

export function RSVPProvider({ children }: { children: React.ReactNode }) {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setRsvps(rsvpsDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateRSVPInput): RSVP => {
    const created = rsvpsDB.create(input);
    setRsvps(rsvpsDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateRSVPInput): RSVP | null => {
    const updated = rsvpsDB.update(id, patch);
    setRsvps(rsvpsDB.getAll());
    return updated;
  }, []);

  const cancel = useCallback((id: string): RSVP | null => {
    const updated = rsvpsDB.cancel(id);
    setRsvps(rsvpsDB.getAll());
    return updated;
  }, []);

  const checkIn = useCallback((id: string): RSVP | null => {
    const updated = rsvpsDB.checkIn(id);
    setRsvps(rsvpsDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = rsvpsDB.delete(id);
    setRsvps(rsvpsDB.getAll());
    return result;
  }, []);

  const getById = useCallback((id: string) => rsvps.find(r => r.id === id) ?? null, [rsvps]);
  const getByEvent = useCallback((eventId: string) => rsvps.filter(r => r.eventId === eventId), [rsvps]);
  const getByUser = useCallback((userId: string) => rsvps.filter(r => r.userId === userId), [rsvps]);
  const getConfirmedByEvent = useCallback((eventId: string) => rsvps.filter(r => r.eventId === eventId && r.status === "confirmed"), [rsvps]);
  const countConfirmed = useCallback((eventId: string) => rsvps.filter(r => r.eventId === eventId && r.status === "confirmed").length, [rsvps]);

  return (
    <RSVPContext.Provider
      value={{
        rsvps, isLoading,
        getById, getByEvent, getByUser, getConfirmedByEvent, countConfirmed,
        add, update, cancel, checkIn, remove, refresh,
      }}
    >
      {children}
    </RSVPContext.Provider>
  );
}

export function useRSVP(): RSVPContextValue {
  const ctx = useContext(RSVPContext);
  if (!ctx) throw new Error("useRSVP must be used within RSVPProvider");
  return ctx;
}
