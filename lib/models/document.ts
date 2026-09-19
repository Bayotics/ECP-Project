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
  fileType: "pdf" | "docx" | "doc" | "xlsx" | "img" | "other";
  /**
   * Where the file actually lives, on Cloudinary. Absent on records created
   * before real files were attached, which is why the download button has
   * to check for it rather than assume.
   */
  url?: string;
  /** Cloudinary public id, needed to replace or delete the file. */
  publicId?: string;
  /** Real size in bytes. `simulatedSize` is the old display-only string. */
  sizeBytes?: number;
  simulatedSize: string;
  description?: string;
  /** The meeting or period the document covers, e.g. "April 2026". */
  period?: string;
  uploadedAt: string;
  uploadedBy: string;
  updatedAt: string;
}

/** Human readable size from a byte count. */
export function formatFileSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export type CreateDocumentInput = Omit<OrgDocument, "id" | "uploadedAt" | "updatedAt">;
export type UpdateDocumentInput = Partial<Omit<OrgDocument, "id" | "uploadedAt">>;
