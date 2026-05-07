"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Donation, CreateDonationInput, UpdateDonationInput } from "@/lib/models";
import { donationsDB } from "@/lib/storage";

interface DonationsContextValue {
  donations: Donation[];
  isLoading: boolean;
  getById: (id: string) => Donation | null;
  getByUser: (userId: string) => Donation[];
  getByStatus: (status: Donation["status"]) => Donation[];
  getByCause: (cause: Donation["cause"]) => Donation[];
  getTotalSuccessful: () => number;
  getTotalByCause: () => Record<string, number>;
  add: (input: CreateDonationInput) => Donation;
  update: (id: string, patch: UpdateDonationInput) => Donation | null;
  markSuccessful: (id: string, paymentReference: string) => Donation | null;
  markFailed: (id: string) => Donation | null;
  acknowledge: (id: string, acknowledgedBy: string) => Donation | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const DonationsContext = createContext<DonationsContextValue | null>(null);

export function DonationsProvider({ children }: { children: React.ReactNode }) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setDonations(donationsDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateDonationInput): Donation => {
    const created = donationsDB.create(input);
    setDonations(donationsDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateDonationInput): Donation | null => {
    const updated = donationsDB.update(id, patch);
    setDonations(donationsDB.getAll());
    return updated;
  }, []);

  const markSuccessful = useCallback((id: string, paymentReference: string): Donation | null => {
    const updated = donationsDB.markSuccessful(id, paymentReference);
    setDonations(donationsDB.getAll());
    return updated;
  }, []);

  const markFailed = useCallback((id: string): Donation | null => {
    const updated = donationsDB.markFailed(id);
    setDonations(donationsDB.getAll());
    return updated;
  }, []);

  const acknowledge = useCallback((id: string, acknowledgedBy: string): Donation | null => {
    const updated = donationsDB.acknowledge(id, acknowledgedBy);
    setDonations(donationsDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = donationsDB.delete(id);
    setDonations(donationsDB.getAll());
    return result;
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
