"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export type EmptyStateVariant = "no-results" | "error" | "coming-soon" | "no-access" | "empty";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "outline";
}

export interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actions?: EmptyStateAction[];
  className?: string;
}

/* ─── Default content per variant ───────────────────── */
const DEFAULTS: Record<EmptyStateVariant, { icon: React.ReactNode; title: string; description: string }> = {
  "no-results": {
    title: "No results found",
    description: "Try adjusting your search or filters to find what you're looking for.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  error: {
    title: "Something went wrong",
    description: "We encountered an error loading this content. Please try again.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  "coming-soon": {
    title: "Coming soon",
    description: "We're working on something exciting. Check back very soon!",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  "no-access": {
    title: "Access restricted",
    description: "You don't have permission to view this content. Please contact an administrator.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  empty: {
    title: "Nothing here yet",
    description: "Get started by adding your first item.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
  },
};

/* ─── EmptyState ─────────────────────────────────────── */
export default function EmptyState({
  variant = "empty",
  icon,
  title,
  description,
  actions = [],
  className,
}: EmptyStateProps) {
  const defaults = DEFAULTS[variant];
  const resolvedIcon = icon ?? defaults.icon;
  const resolvedTitle = title ?? defaults.title;
  const resolvedDesc = description ?? defaults.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="status"
      aria-label={resolvedTitle}
      className={cn("flex flex-col items-center justify-center text-center py-16 px-6 gap-4", className)}
    >
      <div className="text-(--color-neutral-300)">{resolvedIcon}</div>
      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="font-bold text-gray-500 text-lg">{resolvedTitle}</h3>
        <p className="text-sm text-(--color-neutral-500) leading-relaxed">{resolvedDesc}</p>
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mt-2">
          {actions.map((a, i) => {
            const Tag = a.href ? "a" : "button";
            return (
              <Tag
                key={i}
                href={a.href}
                onClick={a.onClick}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)",
                  a.variant === "outline"
                    ? "border border-(--color-green-500) text-(--color-green-600) hover:bg-(--color-green-50)"
                    : "bg-(--color-green-600) text-white hover:bg-(--color-green-700)",
                )}
              >
                {a.label}
              </Tag>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
