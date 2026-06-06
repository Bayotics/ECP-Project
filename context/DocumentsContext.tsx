"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { OrgDocument, CreateDocumentInput, UpdateDocumentInput } from "@/lib/models/document";
import { apiDelete, apiRequest } from "@/lib/client/api";

interface DocumentsContextValue {
  documents: OrgDocument[];
  isLoading: boolean;
  getById: (id: string) => OrgDocument | null;
  add: (input: CreateDocumentInput) => Promise<OrgDocument>;
  update: (id: string, patch: UpdateDocumentInput) => Promise<OrgDocument | null>;
  remove: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextDocuments = await apiRequest<OrgDocument[]>("/api/documents");
      setDocuments(nextDocuments);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialDocuments() {
      try {
        const nextDocuments = await apiRequest<OrgDocument[]>("/api/documents");
        if (isActive) {
          setDocuments(nextDocuments);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialDocuments();

    return () => {
      isActive = false;
    };
  }, []);

  const add = useCallback(async (input: CreateDocumentInput): Promise<OrgDocument> => {
    const created = await apiRequest<OrgDocument>("/api/documents", {
      method: "POST",
      body: JSON.stringify(input),
    });
    setDocuments((prev) => [created, ...prev.filter((document) => document.id !== created.id)]);
    return created;
  }, []);

  const update = useCallback(async (id: string, patch: UpdateDocumentInput): Promise<OrgDocument | null> => {
    const updated = await apiRequest<OrgDocument>(`/api/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setDocuments((prev) => prev.map((document) => (document.id === id ? updated : document)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    await apiDelete(`/api/documents/${id}`);
    setDocuments((prev) => prev.filter((document) => document.id !== id));
    return true;
  }, []);

  const getById = useCallback((id: string) => documents.find(d => d.id === id) ?? null, [documents]);

  return (
    <DocumentsContext.Provider value={{ documents, isLoading, getById, add, update, remove, refresh }}>
      {children}
    </DocumentsContext.Provider>
  );
}

export function useDocuments(): DocumentsContextValue {
  const ctx = useContext(DocumentsContext);
  if (!ctx) throw new Error("useDocuments must be used within DocumentsProvider");
  return ctx;
}
