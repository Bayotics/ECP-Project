"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { RSVP, CreateRSVPInput, UpdateRSVPInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface RSVPContextValue {
  rsvps: RSVP[];
  isLoading: boolean;
  getById: (id: string) => RSVP | null;
  getByEvent: (eventId: string) => RSVP[];
  getByUser: (userId: string) => RSVP[];
  getConfirmedByEvent: (eventId: string) => RSVP[];
  countConfirmed: (eventId: string) => number;
  add: (input: CreateRSVPInput) => Promise<RSVP>;
  update: (id: string, patch: UpdateRSVPInput) => Promise<RSVP | null>;
  cancel: (id: string) => Promise<RSVP | null>;
  checkIn: (id: string) => Promise<RSVP | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const RSVPContext = createContext<RSVPContextValue | null>(null);

export function RSVPProvider({ children }: { children: React.ReactNode }) {
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextRsvps = await apiRequest<RSVP[]>("/api/rsvps");
      setRsvps(nextRsvps);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialRsvps() {
      try {
        const nextRsvps = await apiRequest<RSVP[]>("/api/rsvps");
        if (isActive) {
          setRsvps(nextRsvps);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialRsvps();

    return () => {
      isActive = false;
    };
  }, []);

  const add = useCallback(async (input: CreateRSVPInput): Promise<RSVP> => {
    const created = await apiRequest<RSVP>("/api/rsvps", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setRsvps((prev) => [created, ...prev.filter((rsvp) => rsvp.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateRSVPInput): Promise<RSVP | null> => {
    const updated = await apiRequest<RSVP>(`/api/rsvps/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setRsvps((prev) => prev.map((rsvp) => (rsvp.id === id ? updated : rsvp)));
    return updated;
  }, []);

  const cancel = useCallback(async (id: string): Promise<RSVP | null> => {
    const updated = await apiRequest<RSVP>(`/api/rsvps/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "cancelled" }),
    });
    setRsvps((prev) => prev.map((rsvp) => (rsvp.id === id ? updated : rsvp)));
    return updated;
  }, []);

  const checkIn = useCallback(async (id: string): Promise<RSVP | null> => {
    const updated = await apiRequest<RSVP>(`/api/rsvps/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ checkedInAt: new Date().toISOString() }),
    });
    setRsvps((prev) => prev.map((rsvp) => (rsvp.id === id ? updated : rsvp)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/rsvps/${id}`);
    setRsvps((prev) => prev.filter((rsvp) => rsvp.id !== id));
    return true;
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
