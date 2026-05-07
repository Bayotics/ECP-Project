"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export type FileType = "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "zip" | "csv" | "image" | "other";

export interface DownloadBlockProps {
  fileName: string;
  fileType: FileType;
  fileSizeKb?: number;
  url: string;
  title?: string;
  description?: string;
  className?: string;
}

/* ─── Helpers ────────────────────────────────────────── */
const FILE_META: Record<FileType, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  pdf: {
    label: "PDF",
    bg: "bg-red-50",
    color: "text-red-600",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 15h8v1H8v-1zm0-3h8v1H8v-1zm0-3h5v1H8v-1z" />
      </svg>
    ),
  },
  doc: { label: "DOC", bg: "bg-blue-50", color: "text-blue-600", icon: docIcon() },
  docx: { label: "DOCX", bg: "bg-blue-50", color: "text-blue-600", icon: docIcon() },
  xls: { label: "XLS", bg: "bg-green-50", color: "text-green-700", icon: xlsIcon() },
  xlsx: { label: "XLSX", bg: "bg-green-50", color: "text-green-700", icon: xlsIcon() },
  ppt: { label: "PPT", bg: "bg-orange-50", color: "text-orange-600", icon: genericIcon() },
  pptx: { label: "PPTX", bg: "bg-orange-50", color: "text-orange-600", icon: genericIcon() },
  zip: { label: "ZIP", bg: "bg-yellow-50", color: "text-yellow-700", icon: genericIcon() },
  csv: { label: "CSV", bg: "bg-teal-50", color: "text-teal-700", icon: genericIcon() },
  image: { label: "IMG", bg: "bg-purple-50", color: "text-purple-600", icon: imgIcon() },
  other: { label: "FILE", bg: "bg-(--color-neutral-100)", color: "text-(--color-neutral-600)", icon: genericIcon() },
};

function genericIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function docIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
function xlsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
    </svg>
  );
}
function imgIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function formatSize(kb: number) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/* ─── DownloadBlock ──────────────────────────────────── */
export default function DownloadBlock({ fileName, fileType, fileSizeKb, url, title, description, className }: DownloadBlockProps) {
  const meta = FILE_META[fileType] ?? FILE_META.other;

  const handleDownload = () => {
    // You can integrate analytics here
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn("flex items-center gap-4 rounded-xl border border-(--color-neutral-200) bg-white p-4 shadow-[var(--shadow-card)] hover:shadow-md transition-shadow", className)}
    >
      {/* File type icon */}
      <div className={cn("flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl", meta.bg, meta.color)}>
        {meta.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {title && <p className="text-xs font-semibold text-(--color-neutral-400) mb-0.5">{title}</p>}
        <p className="font-semibold text-(--foreground) truncate">{fileName}</p>
        <div className="flex items-center gap-1.5 text-xs text-(--color-neutral-400) mt-0.5">
          <span className={cn("font-bold uppercase", meta.color)}>{meta.label}</span>
          {fileSizeKb != null && (
            <>
              <span aria-hidden="true">·</span>
              <span>{formatSize(fileSizeKb)}</span>
            </>
          )}
        </div>
        {description && <p className="text-xs text-(--color-neutral-500) mt-1 line-clamp-1">{description}</p>}
      </div>

      {/* Download button */}
      <a
        href={url}
        download={fileName}
        onClick={handleDownload}
        aria-label={`Download ${fileName}`}
        className="flex-shrink-0 flex items-center gap-1.5 rounded-lg bg-(--color-green-600) px-4 py-2 text-xs font-semibold text-white hover:bg-(--color-green-700) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download
      </a>
    </motion.div>
  );
}
