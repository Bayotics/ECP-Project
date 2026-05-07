"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Pagination ─────────────────────────────────────── */
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function PageButton({
  page,
  isActive,
  onClick,
  children,
  label,
  disabled,
}: {
  page?: number;
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-current={isActive ? "page" : undefined}
      disabled={disabled}
      className={cn(
        "flex h-9 min-w-9 px-2 items-center justify-center rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500) disabled:opacity-40 disabled:cursor-not-allowed",
        isActive
          ? "bg-(--color-green-600) text-white shadow-sm"
          : "border border-(--color-neutral-200) bg-white text-(--color-neutral-700) hover:bg-(--color-neutral-50)",
      )}
    >
      {children}
    </button>
  );
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (currentPage > 3) pages.push("…");
    for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
    if (currentPage < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  };

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1.5 flex-wrap justify-center", className)}>
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        label="Previous page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </PageButton>

      {getPages().map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="w-9 text-center text-(--color-neutral-400) select-none" aria-hidden="true">…</span>
        ) : (
          <PageButton
            key={p}
            page={p}
            isActive={p === currentPage}
            onClick={() => onPageChange(p as number)}
            label={`Page ${p}`}
          >
            {p}
          </PageButton>
        ),
      )}

      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        label="Next page"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </PageButton>
    </nav>
  );
}

/* ─── LoadMore ───────────────────────────────────────── */
export interface LoadMoreProps {
  onLoadMore: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  label?: string;
  className?: string;
}

export function LoadMore({ onLoadMore, isLoading, hasMore = true, label = "Load more", className }: LoadMoreProps) {
  if (!hasMore) return null;

  return (
    <div className={cn("flex justify-center", className)}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onLoadMore}
        disabled={isLoading}
        aria-label={isLoading ? "Loading…" : label}
        className="inline-flex items-center gap-2 rounded-xl border border-(--color-green-500) text-(--color-green-600) px-6 py-2.5 text-sm font-semibold hover:bg-(--color-green-50) transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)"
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </>
        ) : (
          <>
            {label}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </motion.button>
    </div>
  );
}

export default Pagination;
