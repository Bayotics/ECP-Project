"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Donation, CreateDonationInput, UpdateDonationInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface DonationsContextValue {
  donations: Donation[];
  isLoading: boolean;
  getById: (id: string) => Donation | null;
  getByUser: (userId: string) => Donation[];
  getByStatus: (status: Donation["status"]) => Donation[];
  getByCause: (cause: Donation["cause"]) => Donation[];
  getTotalSuccessful: () => number;
  getTotalByCause: () => Record<string, number>;
  add: (input: CreateDonationInput) => Promise<Donation>;
  update: (id: string, patch: UpdateDonationInput) => Promise<Donation | null>;
  markSuccessful: (id: string, paymentReference: string) => Promise<Donation | null>;
  markFailed: (id: string) => Promise<Donation | null>;
  acknowledge: (id: string, acknowledgedBy: string) => Promise<Donation | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const DonationsContext = createContext<DonationsContextValue | null>(null);

export function DonationsProvider({ children }: { children: React.ReactNode }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextDonations = await apiRequest<Donation[]>("/api/donations");
      setDonations(nextDonations);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialDonations() {
      try {
        const nextDonations = await apiRequest<Donation[]>("/api/donations");
        if (isActive) {
          setDonations(nextDonations);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialDonations();

    return () => {
      isActive = false;
    };
  }, []);

  const add = useCallback(async (input: CreateDonationInput): Promise<Donation> => {
    const created = await apiRequest<Donation>("/api/donations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setDonations((prev) => [created, ...prev.filter((donation) => donation.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateDonationInput): Promise<Donation | null> => {
    const updated = await apiRequest<Donation>(`/api/donations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setDonations((prev) => prev.map((donation) => (donation.id === id ? updated : donation)));
    return updated;
  }, []);

  const markSuccessful = useCallback(async (id: string, paymentReference: string): Promise<Donation | null> => {
    const updated = await apiRequest<Donation>(`/api/donations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "successful",
        paymentReference,
        receiptSentAt: new Date().toISOString(),
      }),
    });
    setDonations((prev) => prev.map((donation) => (donation.id === id ? updated : donation)));
    return updated;
  }, []);

  const markFailed = useCallback(async (id: string): Promise<Donation | null> => {
    const updated = await apiRequest<Donation>(`/api/donations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "failed" }),
    });
    setDonations((prev) => prev.map((donation) => (donation.id === id ? updated : donation)));
    return updated;
  }, []);

  const acknowledge = useCallback(async (id: string, acknowledgedBy: string): Promise<Donation | null> => {
    const updated = await apiRequest<Donation>(`/api/donations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy,
      }),
    });
    setDonations((prev) => prev.map((donation) => (donation.id === id ? updated : donation)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/donations/${id}`);
    setDonations((prev) => prev.filter((donation) => donation.id !== id));
    return true;
  }, []);

  const getById = useCallback((id: string) => donations.find(d => d.id === id) ?? null, [donations]);
  const getByUser = useCallback((userId: string) => donations.filter(d => d.userId === userId), [donations]);
  const getByStatus = useCallback((status: Donation["status"]) => donations.filter(d => d.status === status), [donations]);
  const getByCause = useCallback((cause: Donation["cause"]) => donations.filter(d => d.cause === cause), [donations]);
  const getTotalSuccessful = useCallback(() =>
    donations.filter(d => d.status === "successful").reduce((sum, d) => sum + d.amount, 0), [donations]);
  const getTotalByCause = useCallback(() =>
    donations.filter(d => d.status === "successful").reduce((acc, d) => {
      acc[d.cause] = (acc[d.cause] ?? 0) + d.amount;
      return acc;
    }, {} as Record<string, number>), [donations]);

  return (
    <DonationsContext.Provider
      value={{
        donations, isLoading,
        getById, getByUser, getByStatus, getByCause, getTotalSuccessful, getTotalByCause,
        add, update, markSuccessful, markFailed, acknowledge, remove, refresh,
      }}
    >
      {children}
    </DonationsContext.Provider>
  );
}

export function useDonations(): DonationsContextValue {
  const ctx = useContext(DonationsContext);
  if (!ctx) throw new Error("useDonations must be used within DonationsProvider");
  return ctx;
}
