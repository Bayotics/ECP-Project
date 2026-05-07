"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface CardGridProps<T = unknown> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Tailwind grid-cols class override.
   * Default: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
   */
  columns?: string;
  gap?: string;
  isLoading?: boolean;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Rendered when items array is empty and not loading */
  emptyState?: React.ReactNode;
  /** Stagger animation between cards */
  animate?: boolean;
  className?: string;
  /** aria-label for the grid region */
  label?: string;
}

/* ─── Skeleton card ──────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      className="rounded-xl border border-(--color-neutral-200) bg-white p-5 space-y-3 animate-pulse"
      aria-hidden="true"
    >
      <div className="h-40 rounded-lg bg-(--color-neutral-200)" />
      <div className="h-3 w-2/3 rounded bg-(--color-neutral-200)" />
      <div className="h-3 w-full rounded bg-(--color-neutral-100)" />
      <div className="h-3 w-4/5 rounded bg-(--color-neutral-100)" />
      <div className="mt-2 h-8 w-24 rounded-lg bg-(--color-neutral-200)" />
    </div>
  );
}

/* ─── CardGrid ───────────────────────────────────────── */
export default function CardGrid<T>({
  items,
  renderItem,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  gap = "gap-5",
  isLoading = false,
  skeletonCount = 6,
  emptyState,
  animate = true,
  className,
  label,
}: CardGridProps<T>) {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading content"
        className={cn("grid", columns, gap, className)}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (items.length === 0) {
    return <>{emptyState ?? null}</>;
  }

  return (
    <div
      role="list"
      aria-label={label}
      className={cn("grid", columns, gap, className)}
    >
      {items.map((item, index) =>
        animate ? (
          <motion.div
            key={index}
            role="listitem"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{
              duration: 0.45,
              delay: (index % 3) * 0.07,
              ease: "easeOut" as const,
            }}
          >
            {renderItem(item, index)}
          </motion.div>
        ) : (
          <div key={index} role="listitem">
            {renderItem(item, index)}
          </div>
        )
      )}
    </div>
  );
}
