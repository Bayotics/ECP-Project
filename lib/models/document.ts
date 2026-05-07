export type DocumentCategory =
  | "constitution"
  | "minutes"
  | "report"
  | "handbook"
  | "newsletter"
  | "budget"
  | "policy"
  | "form"
  | "other";

export type DocumentAccess = "members-only" | "public" | "admin-only";

export interface OrgDocument {
  id: string;
  name: string;
  label: string;
  category: DocumentCategory;
  access: DocumentAccess;
  fileType: "pdf" | "docx" | "xlsx" | "img" | "other";
  simulatedSize: string;
  description?: string;
  uploadedAt: string;
  uploadedBy: string;
  updatedAt: string;
}

export type CreateDocumentInput = Omit<OrgDocument, "id" | "uploadedAt" | "updatedAt">;
export type UpdateDocumentInput = Partial<Omit<OrgDocument, "id" | "uploadedAt">>;
