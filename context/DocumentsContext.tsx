"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { OrgDocument, CreateDocumentInput, UpdateDocumentInput } from "@/lib/models/document";
import { documentsDB } from "@/lib/storage/documents.db";

interface DocumentsContextValue {
  documents: OrgDocument[];
  isLoading: boolean;
  getById: (id: string) => OrgDocument | null;
  add: (input: CreateDocumentInput) => OrgDocument;
  update: (id: string, patch: UpdateDocumentInput) => OrgDocument | null;
  remove: (id: string) => boolean;
  refresh: () => void;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

export function DocumentsProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<OrgDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    setDocuments(documentsDB.getAll());
    setIsLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback((input: CreateDocumentInput): OrgDocument => {
    const created = documentsDB.create(input);
    setDocuments(documentsDB.getAll());
    return created;
  }, []);

  const update = useCallback((id: string, patch: UpdateDocumentInput): OrgDocument | null => {
    const updated = documentsDB.update(id, patch);
    setDocuments(documentsDB.getAll());
    return updated;
  }, []);

  const remove = useCallback((id: string): boolean => {
    const result = documentsDB.delete(id);
    setDocuments(documentsDB.getAll());
    return result;
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
