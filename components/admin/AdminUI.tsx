"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

/* ─── Badge ───────────────────────────────────────── */
const BADGE_COLORS: Record<string, string> = {
  // Application statuses
  pending:       "bg-yellow-100 text-yellow-800",
  "under-review":"bg-blue-100 text-blue-800",
  interview:     "bg-purple-100 text-purple-800",
  approved:      "bg-green-100 text-green-800",
  rejected:      "bg-red-100 text-red-800",
  // User statuses
  active:        "bg-green-100 text-green-800",
  inactive:      "bg-gray-100 text-gray-600",
  suspended:     "bg-red-100 text-red-800",
  // User roles
  member:        "bg-blue-100 text-blue-800",
  admin:         "bg-orange-100 text-orange-800",
  "super-admin": "bg-red-100 text-red-800",
  applicant:     "bg-yellow-100 text-yellow-800",
  guest:         "bg-gray-100 text-gray-600",
  // Event / News / Product statuses
  published:     "bg-green-100 text-green-800",
  draft:         "bg-gray-100 text-gray-600",
  archived:      "bg-gray-100 text-gray-600",
  cancelled:     "bg-red-100 text-red-800",
  completed:     "bg-blue-100 text-blue-800",
  "out-of-stock":"bg-orange-100 text-orange-800",
  discontinued:  "bg-red-100 text-red-800",
  // Event types
  "town-hall":   "bg-teal-100 text-teal-800",
  workshop:      "bg-cyan-100 text-cyan-800",
  volunteer:     "bg-lime-100 text-lime-800",
  meetup:        "bg-violet-100 text-violet-800",
  seminar:       "bg-pink-100 text-pink-800",
  "press-conference": "bg-indigo-100 text-indigo-800",
  other:         "bg-gray-100 text-gray-600",
  // News categories
  news:              "bg-blue-100 text-blue-800",
  announcement:      "bg-green-100 text-green-800",
  report:            "bg-yellow-100 text-yellow-800",
  opinion:           "bg-purple-100 text-purple-800",
  "press-release":   "bg-orange-100 text-orange-800",
  blog:              "bg-pink-100 text-pink-800",
  // Product categories
  apparel:       "bg-blue-100 text-blue-800",
  accessories:   "bg-teal-100 text-teal-800",
  stationery:    "bg-lime-100 text-lime-800",
  publications:  "bg-yellow-100 text-yellow-800",
  digital:       "bg-violet-100 text-violet-800",
};

export function Badge({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const color = BADGE_COLORS[value] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", color, className)}>
      {value.replace(/-/g, " ")}
    </span>
  );
}

/* ─── Modal ───────────────────────────────────────── */
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

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        className={cn("relative w-full bg-white rounded-2xl shadow-2xl mt-8 mb-8", widths[size])}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-(--color-neutral-200)">
          <h2 className="text-base font-bold text-(--color-neutral-900)">{title}</h2>
          <button
            onClick={onClose}
            className="text-(--color-neutral-400) hover:text-(--color-neutral-700) text-xl leading-none transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-bold text-(--color-neutral-900) flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-sm font-normal bg-(--color-neutral-200) text-(--color-neutral-600) px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </h1>
        {subtitle && <p className="text-sm text-(--color-neutral-500) mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
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
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="relative flex-1 max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-400) text-sm">🔍</span>
        <input
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search…"
          className="w-full pl-8 pr-4 py-2 text-sm text-(--color-neutral-900) placeholder:text-(--color-neutral-400) caret-(--color-green-600) border border-(--color-neutral-300) rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-400)"
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
      onChange={e => onChange(e.target.value)}
      className={cn(
        "text-sm text-(--color-neutral-900) border border-(--color-neutral-300) rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-400)",
        className
      )}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
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
    <div className="bg-white rounded-2xl border border-(--color-neutral-200) overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-(--color-neutral-50) border-b border-(--color-neutral-200)">
              {headers.map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-3 text-xs font-bold text-(--color-neutral-500) uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {React.Children.count(children) === 0 ? (
              <tr>
                <td colSpan={headers.length} className="text-center py-12 text-(--color-neutral-400) text-sm">
                  {empty ?? "No records found."}
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
        "border-b border-(--color-neutral-100) last:border-0 transition-colors",
        onClick && "cursor-pointer hover:bg-(--color-neutral-50)",
        className
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
    <td className={cn(compact ? "px-4 py-2" : "px-4 py-3", "text-(--color-neutral-700) align-middle", className)}>
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
      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, className, ...rest } = props;
  return (
    <input
      className={cn(
        "w-full px-3 py-2 text-sm text-(--color-neutral-900) placeholder:text-(--color-neutral-400) caret-(--color-green-600) border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) transition-shadow",
        hasError ? "border-red-400 bg-red-50" : "border-(--color-neutral-300) bg-white",
        className
      )}
      {...rest}
    />
  );
}

export function FormSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return (
    <select
      className={cn(
        "w-full px-3 py-2 text-sm text-(--color-neutral-900) border border-(--color-neutral-300) rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-400)",
        className
      )}
      {...rest}
    />
  );
}

export function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full px-3 py-2 text-sm text-(--color-neutral-900) placeholder:text-(--color-neutral-400) caret-(--color-green-600) border border-(--color-neutral-300) rounded-xl bg-white resize-none focus:outline-none focus:ring-2 focus:ring-(--color-green-400)",
        className
      )}
      {...rest}
    />
  );
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
    primary:   "bg-(--color-green-600) hover:bg-(--color-green-700) text-white",
    secondary: "bg-white border border-(--color-neutral-300) hover:bg-(--color-neutral-50) text-(--color-neutral-700)",
    danger:    "bg-red-600 hover:bg-red-700 text-white",
    ghost:     "hover:bg-(--color-neutral-100) text-(--color-neutral-600)",
    success:   "bg-green-600 hover:bg-green-700 text-white",
    warning:   "bg-yellow-500 hover:bg-yellow-600 text-white",
  };
  const sizes = {
    xs: "px-2.5 py-1 text-xs",
    sm: "px-3.5 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
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
  const colors = {
    green:  "border-l-4 border-l-(--color-green-500)  bg-(--color-green-50)",
    blue:   "border-l-4 border-l-blue-500   bg-blue-50",
    yellow: "border-l-4 border-l-yellow-500 bg-yellow-50",
    red:    "border-l-4 border-l-red-500    bg-red-50",
    purple: "border-l-4 border-l-purple-500 bg-purple-50",
  };
  return (
    <div className={cn("rounded-2xl p-5", colors[color])}>
      <p className="text-xs font-bold text-(--color-neutral-500) uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-(--color-neutral-900)">{value}</p>
      {sub && <p className="text-xs text-(--color-neutral-500) mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Divider ─────────────────────────────────────── */
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="text-xs font-bold text-(--color-neutral-400) uppercase tracking-widest mt-5 mb-2">{label}</div>
  );
}

/* ─── No results ──────────────────────────────────── */
export function EmptyState({ icon = "📂", message }: { icon?: string; message: string }) {
  return (
    <div className="text-center py-16 text-(--color-neutral-400)">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="font-semibold">{message}</p>
    </div>
  );
}
