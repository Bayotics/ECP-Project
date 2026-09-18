"use client";

/* The shared furniture every admin screen is built from.

   Same house typography as the public pages: weight 400 throughout, a 500
   page title, uppercase tracked micro-labels, pill controls and rounded
   panels. Every export keeps the name and props it had before, so the admin
   pages themselves did not have to change to pick this up. */

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { useIsClient } from "@/components/gsap/useReveal";
import { EKO } from "@/lib/content/programs";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

/* ─── Badge ───────────────────────────────────────── */
const BADGE_COLORS: Record<string, string> = {
  // Application statuses
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  "under-review": "border-blue-200 bg-blue-50 text-blue-800",
  interview: "border-violet-200 bg-violet-50 text-violet-800",
  approved: "border-green-200 bg-green-50 text-green-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  // User statuses
  active: "border-green-200 bg-green-50 text-green-800",
  inactive: "border-neutral-200 bg-neutral-100 text-neutral-600",
  suspended: "border-red-200 bg-red-50 text-red-800",
  // User roles
  member: "border-blue-200 bg-blue-50 text-blue-800",
  admin: "border-amber-200 bg-amber-50 text-amber-800",
  "super-admin": "border-red-200 bg-red-50 text-red-800",
  applicant: "border-amber-200 bg-amber-50 text-amber-800",
  guest: "border-neutral-200 bg-neutral-100 text-neutral-600",
  // Event / news / product statuses
  published: "border-green-200 bg-green-50 text-green-800",
  draft: "border-neutral-200 bg-neutral-100 text-neutral-600",
  archived: "border-neutral-200 bg-neutral-100 text-neutral-600",
  cancelled: "border-red-200 bg-red-50 text-red-800",
  completed: "border-blue-200 bg-blue-50 text-blue-800",
  "out-of-stock": "border-amber-200 bg-amber-50 text-amber-800",
  discontinued: "border-red-200 bg-red-50 text-red-800",
  // Event types
  "town-hall": "border-blue-200 bg-blue-50 text-blue-800",
  workshop: "border-amber-200 bg-amber-50 text-amber-800",
  volunteer: "border-green-200 bg-green-50 text-green-800",
  meetup: "border-green-200 bg-green-50 text-green-800",
  seminar: "border-red-200 bg-red-50 text-red-800",
  "press-conference": "border-blue-200 bg-blue-50 text-blue-800",
  other: "border-neutral-200 bg-neutral-100 text-neutral-600",
  // News categories
  news: "border-blue-200 bg-blue-50 text-blue-800",
  announcement: "border-green-200 bg-green-50 text-green-800",
  report: "border-amber-200 bg-amber-50 text-amber-800",
  opinion: "border-violet-200 bg-violet-50 text-violet-800",
  "press-release": "border-red-200 bg-red-50 text-red-800",
  blog: "border-cyan-200 bg-cyan-50 text-cyan-800",
  // Committee types
  standing: "border-green-200 bg-green-50 text-green-800",
  "ad-hoc": "border-amber-200 bg-amber-50 text-amber-800",
  executive: "border-red-200 bg-red-50 text-red-800",
  advisory: "border-blue-200 bg-blue-50 text-blue-800",
  technical: "border-violet-200 bg-violet-50 text-violet-800",
  dissolved: "border-neutral-200 bg-neutral-100 text-neutral-500",
  // Product categories
  apparel: "border-green-200 bg-green-50 text-green-800",
  accessories: "border-amber-200 bg-amber-50 text-amber-800",
  stationery: "border-blue-200 bg-blue-50 text-blue-800",
  publications: "border-red-200 bg-red-50 text-red-800",
  digital: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  const color = BADGE_COLORS[value] ?? "border-neutral-200 bg-neutral-100 text-neutral-600";
  return (
    <span className={cn("inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-normal capitalize", color, className)}>
      {value.replace(/-/g, " ")}
    </span>
  );
}

/* ─── Modal ───────────────────────────────────────── */
/* Portalled to <body>: the portal shell is a flex column with its own
   scrolling main, and a `fixed` overlay inside it can end up clipped. */
export function AdminModal({
  title,
  open,
  onClose,
  size = "md",
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !isClient) return null;

  const widths = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-neutral-950/60 p-4 backdrop-blur-sm [animation:viewer-in_220ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={cn("relative my-8 w-full overflow-hidden rounded-[1.5rem] bg-white shadow-2xl", widths[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-1 w-full" aria-hidden="true">
          {QUAD.map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Page header ─────────────────────────────────── */
export function AdminPageHeader({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end">
      <div>
        <div className="flex h-1 w-20 overflow-hidden rounded-full" aria-hidden="true">
          {QUAD.map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <h1 className="mt-4 flex items-center gap-3 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
          {title}
          {count !== undefined && (
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-sm font-normal text-neutral-600">{count}</span>
          )}
        </h1>
        {subtitle && <p className="mt-2 text-sm leading-7 text-neutral-700">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/* ─── Filters bar ─────────────────────────────────── */
export function AdminFilters({
  search,
  onSearchChange,
  filters,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  filters?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-neutral-200 bg-white p-4">
      <div className="relative w-full max-w-sm flex-1">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-neutral-400" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <label htmlFor="admin-search" className="sr-only">
          Search
        </label>
        <input
          id="admin-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search"
          className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-11 pr-4 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>
      {filters}
    </div>
  );
}

/* ─── Filter select ───────────────────────────────── */
export function FilterSelect({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-normal text-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-200",
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ─── Table ───────────────────────────────────────── */
export function AdminTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {headers.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {React.Children.count(children) === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-14 text-center text-sm text-neutral-500">
                  {empty ?? "Nothing here yet."}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Table row ───────────────────────────────────── */
export function TR({
  onClick,
  children,
  className,
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        "border-b border-neutral-100 transition-colors last:border-0",
        onClick && "cursor-pointer hover:bg-neutral-50",
        className,
      )}
    >
      {children}
    </tr>
  );
}

/* ─── Table cell ──────────────────────────────────── */
export function TD({
  children,
  className,
  compact,
}: {
  children?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <td className={cn(compact ? "px-5 py-2.5" : "px-5 py-3.5", "align-middle font-normal text-neutral-700", className)}>
      {children}
    </td>
  );
}

/* ─── Form helpers ────────────────────────────────── */
export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const fieldBase =
  "w-full rounded-xl border px-4 py-2.5 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-200";

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, className, ...rest } = props;
  return <input className={cn(fieldBase, hasError ? "border-red-400 bg-red-50" : "border-neutral-300 bg-white", className)} {...rest} />;
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={cn(fieldBase, "border-neutral-300 bg-white", className)} {...rest} />;
}

export function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea rows={3} className={cn(fieldBase, "resize-none border-neutral-300 bg-white leading-7", className)} {...rest} />;
}

/* ─── Button helpers ──────────────────────────────── */
export function Btn({
  variant = "primary",
  size = "sm",
  disabled,
  onClick,
  type = "button",
  className,
  children,
}: {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success" | "warning";
  size?: "xs" | "sm" | "md";
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  children: React.ReactNode;
}) {
  const variants = {
    primary: "text-white",
    secondary: "border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-400",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-600 hover:bg-neutral-100",
    success: "text-white",
    warning: "text-white",
  };
  const background: Record<string, string | undefined> = {
    primary: EKO.green,
    success: EKO.green,
    warning: EKO.yellow,
  };
  const sizes = {
    xs: "px-3 py-1 text-xs",
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-sm",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={background[variant] ? { background: background[variant] } : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ─── Stat card ───────────────────────────────────── */
export function AdminStat({
  label,
  value,
  sub,
  color = "green",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "blue" | "yellow" | "red" | "purple";
}) {
  const colors: Record<string, string> = {
    green: EKO.green,
    blue: EKO.blue,
    yellow: EKO.yellow,
    red: EKO.red,
    purple: "#7c3aed",
  };
  return (
    <div className="rounded-[1.25rem] border border-neutral-200 bg-white p-5">
      <p className="text-3xl font-normal tracking-[-0.04em]" style={{ color: colors[color] }}>
        {value}
      </p>
      <p className="mt-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-600">{label}</p>
      {sub && <p className="mt-2 text-xs leading-5 text-neutral-500">{sub}</p>}
    </div>
  );
}

/* ─── Divider ─────────────────────────────────────── */
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3">
      <span className="text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">{label}</span>
      <span className="h-px flex-1 bg-neutral-200" aria-hidden="true" />
    </div>
  );
}

/* ─── No results ──────────────────────────────────── */
export function EmptyState({ message }: { icon?: string; message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      <p className="text-base font-normal text-neutral-800">{message}</p>
    </div>
  );
}
