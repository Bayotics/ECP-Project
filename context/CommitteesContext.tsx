"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Committee, CommitteeMemberProfile, CommitteeJoinRequest, CreateCommitteeInput, UpdateCommitteeInput } from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface CommitteesContextValue {
  committees: Committee[];
  isLoading: boolean;
  getById: (id: string) => Committee | null;
  getBySlug: (slug: string) => Committee | null;
  getActive: () => Committee[];
  getByType: (type: Committee["type"]) => Committee[];
  add: (input: CreateCommitteeInput) => Promise<Committee>;
  update: (id: string, patch: UpdateCommitteeInput) => Promise<Committee | null>;
  addMember: (id: string, member: CommitteeMemberProfile) => Promise<Committee | null>;
  removeMember: (id: string, memberName: string) => Promise<Committee | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  requestToJoin: (committeeId: string, committeeName: string, userId: string, userName: string, userEmail: string, message?: string) => Promise<CommitteeJoinRequest>;
  getJoinRequests: (committeeId: string) => Promise<CommitteeJoinRequest[]>;
  reviewJoinRequest: (requestId: string, status: "approved" | "rejected", reviewedBy: string) => Promise<void>;
}

const CommitteesContext = createContext<CommitteesContextValue | null>(null);

export function CommitteesProvider({ children }: { children: React.ReactNode }) {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextCommittees = await apiRequest<Committee[]>("/api/committees");
      setCommittees(nextCommittees);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialCommittees() {
      try {
        const nextCommittees = await apiRequest<Committee[]>("/api/committees");
        if (isActive) {
          setCommittees(nextCommittees);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialCommittees();

    return () => {
      isActive = false;
    };
  }, []);

  const add = useCallback(async (input: CreateCommitteeInput): Promise<Committee> => {
    const created = await apiRequest<Committee>("/api/committees", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setCommittees((prev) => [created, ...prev.filter((committee) => committee.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateCommitteeInput): Promise<Committee | null> => {
    const updated = await apiRequest<Committee>(`/api/committees/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setCommittees((prev) => prev.map((committee) => (committee.id === id ? updated : committee)));
    return updated;
  }, []);

  const addMember = useCallback(async (id: string, member: CommitteeMemberProfile): Promise<Committee | null> => {
    const committee = committees.find((item) => item.id === id) ?? null;
    if (!committee) return null;

    const updated = await apiRequest<Committee>(`/api/committees/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ members: [...committee.members, member] }),
    });
    setCommittees((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [committees]);

  const removeMember = useCallback(async (id: string, memberName: string): Promise<Committee | null> => {
    const committee = committees.find((item) => item.id === id) ?? null;
    if (!committee) return null;

    const updated = await apiRequest<Committee>(`/api/committees/${id}`, {
      method: "PATCH",
      body: JSON.stringify({
        members: committee.members.filter((member) => member.name !== memberName),
      }),
    });
    setCommittees((prev) => prev.map((item) => (item.id === id ? updated : item)));
    return updated;
  }, [committees]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/committees/${id}`);
    setCommittees((prev) => prev.filter((committee) => committee.id !== id));
    return true;
  }, []);

  const getById = useCallback((id: string) => committees.find(c => c.id === id) ?? null, [committees]);
  const getBySlug = useCallback((slug: string) => committees.find(c => c.slug === slug) ?? null, [committees]);
  const getActive = useCallback(() => committees.filter(c => c.status === "active"), [committees]);
  const getByType = useCallback((type: Committee["type"]) => committees.filter(c => c.type === type), [committees]);

  const requestToJoin = useCallback(async (
    committeeId: string, committeeName: string,
    userId: string, userName: string, userEmail: string, message?: string
  ): Promise<CommitteeJoinRequest> => {
    return await apiRequest<CommitteeJoinRequest>("/api/committees/join-requests", {
      method: "POST",
      body: JSON.stringify({ committeeId, committeeName, userId, userName, userEmail, message }),
    });
  }, []);

  const getJoinRequests = useCallback(async (committeeId: string): Promise<CommitteeJoinRequest[]> => {
    return await apiRequest<CommitteeJoinRequest[]>(`/api/committees/join-requests?committeeId=${committeeId}`);
  }, []);

  const reviewJoinRequest = useCallback(async (requestId: string, status: "approved" | "rejected", reviewedBy: string): Promise<void> => {
    await apiRequest(`/api/committees/join-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, reviewedBy }),
    });
  }, []);

  return (
    <CommitteesContext.Provider
      value={{
        committees, isLoading,
        getById, getBySlug, getActive, getByType,
        add, update, addMember, removeMember, remove, refresh,
        requestToJoin, getJoinRequests, reviewJoinRequest,
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
