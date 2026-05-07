"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { MembershipApplication, CreateApplicationInput, UpdateApplicationInput } from "@/lib/models";
import { membershipDB } from "@/lib/storage";

interface MembershipContextValue {
  applications: MembershipApplication[];
  isLoading: boolean;
  getById: (id: string) => MembershipApplication | null;
  getByStatus: (status: MembershipApplication["status"]) => MembershipApplication[];
  getByEmail: (email: string) => MembershipApplication | null;
  getByUserId: (userId: string) => MembershipApplication | null;
  add: (input: CreateApplicationInput) => MembershipApplication;
  update: (id: string, patch: UpdateApplicationInput) => MembershipApplication | null;
  setUnderReview: (id: string, reviewedBy: string, notes?: string) => MembershipApplication | null;
  setInterview: (id: string, reviewedBy: string, notes?: string) => MembershipApplication | null;
  approve: (id: string, reviewedBy: string, notes?: string) => MembershipApplication | null;
  reject: (id: string, reviewedBy: string, notes?: string) => MembershipApplication | null;
  addAdminMessage: (id: string, fromName: string, content: string) => MembershipApplication | null;
  addDocument: (id: string, doc: { name: string; label: string; simulatedSize?: string }) => MembershipApplication | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const MembershipContext = createContext<MembershipContextValue | null>(null);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setApplications(membershipDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateApplicationInput): MembershipApplication => {
    const created = membershipDB.create(input);
    setApplications(membershipDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateApplicationInput): MembershipApplication | null => {
    const updated = membershipDB.update(id, patch);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const setUnderReview = useCallback((id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const updated = membershipDB.setUnderReview(id, reviewedBy, notes);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const setInterview = useCallback((id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const updated = membershipDB.setInterview(id, reviewedBy, notes);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const approve = useCallback((id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const updated = membershipDB.approve(id, reviewedBy, notes);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const reject = useCallback((id: string, reviewedBy: string, notes?: string): MembershipApplication | null => {
    const updated = membershipDB.reject(id, reviewedBy, notes);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const addAdminMessage = useCallback((id: string, fromName: string, content: string): MembershipApplication | null => {
    const updated = membershipDB.addAdminMessage(id, fromName, content);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const addDocument = useCallback((id: string, doc: { name: string; label: string; simulatedSize?: string }): MembershipApplication | null => {
    const updated = membershipDB.addDocument(id, doc);
    setApplications(membershipDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = membershipDB.delete(id);
    setApplications(membershipDB.getAll());
    return result;
  }, []);

  const getById = useCallback((id: string) => applications.find(a => a.id === id) ?? null, [applications]);
  const getByStatus = useCallback((status: MembershipApplication["status"]) => applications.filter(a => a.status === status), [applications]);
  const getByEmail = useCallback((email: string) => applications.find(a => a.email.toLowerCase() === email.toLowerCase()) ?? null, [applications]);
  const getByUserId = useCallback((userId: string) => applications.find(a => a.userId === userId) ?? null, [applications]);

  return (
    <MembershipContext.Provider
      value={{
        applications, isLoading,
        getById, getByStatus, getByEmail, getByUserId,
        add, update, setUnderReview, setInterview, approve, reject,
        addAdminMessage, addDocument, remove, refresh,
      }}
    >
      {children}
    </MembershipContext.Provider>
  );
}

export function useMembership(): MembershipContextValue {
  const ctx = useContext(MembershipContext);
  if (!ctx) throw new Error("useMembership must be used within MembershipProvider");
  return ctx;
}
