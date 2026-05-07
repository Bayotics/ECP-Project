"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Committee, CommitteeMemberProfile, CreateCommitteeInput, UpdateCommitteeInput } from "@/lib/models";
import { committeesDB } from "@/lib/storage";

interface CommitteesContextValue {
  committees: Committee[];
  isLoading: boolean;
  getById: (id: string) => Committee | null;
  getBySlug: (slug: string) => Committee | null;
  getActive: () => Committee[];
  getByType: (type: Committee["type"]) => Committee[];
  add: (input: CreateCommitteeInput) => Committee;
  update: (id: string, patch: UpdateCommitteeInput) => Committee | null;
  addMember: (id: string, member: CommitteeMemberProfile) => Committee | null;
  removeMember: (id: string, memberName: string) => Committee | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const CommitteesContext = createContext<CommitteesContextValue | null>(null);

export function CommitteesProvider({ children }: { children: React.ReactNode }) {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setCommittees(committeesDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateCommitteeInput): Committee => {
    const created = committeesDB.create(input);
    setCommittees(committeesDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateCommitteeInput): Committee | null => {
    const updated = committeesDB.update(id, patch);
    setCommittees(committeesDB.getAll());
    return updated;
  }, []);

  const addMember = useCallback((id: string, member: CommitteeMemberProfile): Committee | null => {
    const updated = committeesDB.addMember(id, member);
    setCommittees(committeesDB.getAll());
    return updated;
  }, []);

  const removeMember = useCallback((id: string, memberName: string): Committee | null => {
    const updated = committeesDB.removeMember(id, memberName);
    setCommittees(committeesDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = committeesDB.delete(id);
    setCommittees(committeesDB.getAll());
    return result;
  }, []);

  const getById = useCallback((id: string) => committees.find(c => c.id === id) ?? null, [committees]);
  const getBySlug = useCallback((slug: string) => committees.find(c => c.slug === slug) ?? null, [committees]);
  const getActive = useCallback(() => committees.filter(c => c.status === "active"), [committees]);
  const getByType = useCallback((type: Committee["type"]) => committees.filter(c => c.type === type), [committees]);

  return (
    <CommitteesContext.Provider
      value={{
        committees, isLoading,
        getById, getBySlug, getActive, getByType,
        add, update, addMember, removeMember, remove, refresh,
      }}
    >
      {children}
    </CommitteesContext.Provider>
  );
}

export function useCommittees(): CommitteesContextValue {
  const ctx = useContext(CommitteesContext);
  if (!ctx) throw new Error("useCommittees must be used within CommitteesProvider");
  return ctx;
}
