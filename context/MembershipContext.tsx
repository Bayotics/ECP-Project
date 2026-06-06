"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type {
  AdminMessage,
  ApplicationDocument,
  MembershipApplication,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/lib/models";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface MembershipContextValue {
  applications: MembershipApplication[];
  isLoading: boolean;
  getById: (id: string) => MembershipApplication | null;
  getByStatus: (status: MembershipApplication["status"]) => MembershipApplication[];
  getByEmail: (email: string) => MembershipApplication | null;
  getByUserId: (userId: string) => MembershipApplication | null;
  add: (input: CreateApplicationInput) => Promise<MembershipApplication>;
  update: (id: string, patch: UpdateApplicationInput) => Promise<MembershipApplication | null>;
  setUnderReview: (id: string, reviewedBy: string, notes?: string) => Promise<MembershipApplication | null>;
  setInterview: (id: string, reviewedBy: string, notes?: string) => Promise<MembershipApplication | null>;
  approve: (id: string, reviewedBy: string, notes?: string) => Promise<MembershipApplication | null>;
  reject: (id: string, reviewedBy: string, notes?: string) => Promise<MembershipApplication | null>;
  addAdminMessage: (id: string, fromName: string, content: string) => Promise<MembershipApplication | null>;
  addDocument: (id: string, doc: { name: string; label: string; simulatedSize?: string }) => Promise<MembershipApplication | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const MembershipContext = createContext<MembershipContextValue | null>(null);

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await apiRequest<MembershipApplication[]>("/api/membership-applications");
    setApplications(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await apiRequest<MembershipApplication[]>("/api/membership-applications");
        if (!active) return;
        setApplications(data);
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

  const add = useCallback(async (input: CreateApplicationInput): Promise<MembershipApplication> => {
    const created = await apiRequest<MembershipApplication>("/api/membership-applications", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setApplications((prev) => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateApplicationInput): Promise<MembershipApplication | null> => {
    const updated = await apiRequest<MembershipApplication>(`/api/membership-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setApplications((prev) => prev.map((application) => (application.id === updated.id ? updated : application)));
    return updated;
  }, []);

  const applyStatusPatch = useCallback(async (
    id: string,
    status: MembershipApplication["status"],
    reviewedBy: string,
    notes: string | undefined,
    fallbackMessage: string
  ): Promise<MembershipApplication | null> => {
    const current = applications.find((application) => application.id === id);
    if (!current) return null;

    const patch: UpdateApplicationInput = {
      status,
      reviewedAt: new Date().toISOString(),
      reviewedBy,
      reviewNotes: notes,
      statusHistory: [
        ...(current.statusHistory ?? []),
        {
          status,
          date: new Date().toISOString(),
          message: notes ?? fallbackMessage,
        },
      ],
    };

    const updated = await apiRequest<MembershipApplication>(`/api/membership-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setApplications((prev) => prev.map((application) => (application.id === updated.id ? updated : application)));
    return updated;
  }, [applications]);

  const setUnderReview = useCallback((id: string, reviewedBy: string, notes?: string) =>
    applyStatusPatch(id, "under-review", reviewedBy, notes, "Application is now under review."),
  [applyStatusPatch]);

  const setInterview = useCallback((id: string, reviewedBy: string, notes?: string) =>
    applyStatusPatch(id, "interview", reviewedBy, notes, "You have been invited for an interview. Check your email for details."),
  [applyStatusPatch]);

  const approve = useCallback((id: string, reviewedBy: string, notes?: string) =>
    applyStatusPatch(id, "approved", reviewedBy, notes, "Congratulations! Your membership application has been approved."),
  [applyStatusPatch]);

  const reject = useCallback((id: string, reviewedBy: string, notes?: string) =>
    applyStatusPatch(id, "rejected", reviewedBy, notes, "We regret to inform you that your application was not successful at this time."),
  [applyStatusPatch]);

  const addAdminMessage = useCallback(async (id: string, fromName: string, content: string): Promise<MembershipApplication | null> => {
    const current = applications.find((application) => application.id === id);
    if (!current) return null;

    const message: AdminMessage = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `msg-${Date.now()}`,
      fromName,
      content,
      sentAt: new Date().toISOString(),
      isRead: false,
    };

    const updated = await apiRequest<MembershipApplication>(`/api/membership-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ adminMessages: [...(current.adminMessages ?? []), message] }),
    });
    setApplications((prev) => prev.map((application) => (application.id === updated.id ? updated : application)));
    return updated;
  }, [applications]);

  const addDocument = useCallback(async (id: string, doc: { name: string; label: string; simulatedSize?: string }): Promise<MembershipApplication | null> => {
    const current = applications.find((application) => application.id === id);
    if (!current) return null;

    const document: ApplicationDocument = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      ...doc,
    };

    const updated = await apiRequest<MembershipApplication>(`/api/membership-applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ documents: [...(current.documents ?? []), document] }),
    });
    setApplications((prev) => prev.map((application) => (application.id === updated.id ? updated : application)));
    return updated;
  }, [applications]);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/membership-applications/${id}`);
    setApplications((prev) => prev.filter((application) => application.id !== id));
    return true;
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
