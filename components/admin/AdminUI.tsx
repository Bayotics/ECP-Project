"use client";

/* The shared furniture every admin screen is built from.

   Same house typography as the public pages: weight 400 throughout, a 500
   page title, uppercase tracked micro-labels, pill controls and rounded
   panels. Every export keeps the name and props it had before, so the admin
   pages themselves did not have to change to pick this up. */

import React, { useCallback, useEffect, useRef, useState } from "react";
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
  inactive: "border-neutral-200 bg-neutral-100 text-neutral-900",
  suspended: "border-red-200 bg-red-50 text-red-800",
  revoked: "border-red-300 bg-red-100 text-red-900",
  // User roles
  member: "border-blue-200 bg-blue-50 text-blue-800",
  admin: "border-amber-200 bg-amber-50 text-amber-800",
  "super-admin": "border-red-200 bg-red-50 text-red-800",
  applicant: "border-amber-200 bg-amber-50 text-amber-800",
  guest: "border-neutral-200 bg-neutral-100 text-neutral-900",
  // Event / news / product statuses
  published: "border-green-200 bg-green-50 text-green-800",
  draft: "border-neutral-200 bg-neutral-100 text-neutral-900",
  archived: "border-neutral-200 bg-neutral-100 text-neutral-900",
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
  other: "border-neutral-200 bg-neutral-100 text-neutral-900",
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
  dissolved: "border-neutral-200 bg-neutral-100 text-neutral-900",
  // Product categories
  apparel: "border-green-200 bg-green-50 text-green-800",
  accessories: "border-amber-200 bg-amber-50 text-amber-800",
  stationery: "border-blue-200 bg-blue-50 text-blue-800",
  publications: "border-red-200 bg-red-50 text-red-800",
  digital: "border-cyan-200 bg-cyan-50 text-cyan-800",
};

export function Badge({ value, className }: { value: string; className?: string }) {
  const color = BADGE_COLORS[value] ?? "border-neutral-200 bg-neutral-100 text-neutral-900";
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
  notice,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Shown pinned to the dialog's top right, over the scrolling body.
   * For work done inside the modal: a page-level toast at the bottom of
   * the window is easy to miss when you are looking at a dialog, and
   * worse, it is still sitting there after the dialog is closed.
   */
  notice?: React.ReactNode;
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
      /* data-lenis-prevent: Lenis listens for wheel events on the window and
         preventDefaults them, so without this opt-out a long form here never
         scrolls and only moves if you drag the scrollbar. */
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-neutral-950/60 p-4 backdrop-blur-sm [animation:viewer-in_220ms_ease-out] sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        /* Capped height with the body scrolling inside it, so the title and
           the close button stay put however long the form is. */
        className={cn(
          "relative my-8 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[1.5rem] bg-white text-neutral-900 shadow-2xl [color-scheme:light]",
          widths[size],
        )}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex h-1 w-full shrink-0" aria-hidden="true">
          {QUAD.map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-neutral-100 text-neutral-900 transition-colors hover:bg-neutral-200"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {notice}
        <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Toasts inside a modal ───────────────────────── */
/* The page-level toast container sits at the bottom right of the window.
   That is the wrong place for the result of something done inside a modal:
   the dialog has the administrator's attention and the toast does not, and
   if they close the dialog the toast is left behind on the page underneath,
   describing work on a record no longer on screen. These are pinned to the
   dialog itself and go with it. */

export type ModalToastKind = "success" | "error" | "warning";

export interface ModalToast {
  id: number;
  kind: ModalToastKind;
  title?: string;
  message: string;
}

const MODAL_TOAST_MS = 5000;

/**
 * A toast stack scoped to one modal. `show` returns nothing useful on
 * purpose: these are notices, not dialogs, and anything worth a decision
 * belongs in `ConfirmDialog`.
 */
export function useModalToasts() {
  const [toasts, setToasts] = useState<ModalToast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Dialogs are unmounted the moment they close, which would otherwise
     leave timers firing setState on a gone component. */
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ModalToastKind, message: string, title?: string) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, kind, title, message }]);
      timers.current.push(setTimeout(() => dismiss(id), MODAL_TOAST_MS));
    },
    [dismiss],
  );

  const clear = useCallback(() => setToasts([]), []);

  return { toasts, show, dismiss, clear };
}

const MODAL_TOAST_STYLE: Record<ModalToastKind, { border: string; icon: string; path: string }> = {
  success: { border: "border-green-300", icon: "text-green-600", path: "m5 13 4 4L19 7" },
  error: { border: "border-red-300", icon: "text-red-600", path: "M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" },
  warning: { border: "border-amber-300", icon: "text-amber-600", path: "M12 8v5M12 16h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" },
};

/** Pass to `AdminModal`'s `notice` prop. */
export function ModalToasts({
  toasts,
  onDismiss,
}: {
  toasts: ModalToast[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      /* Over the scrolling body and pinned to the dialog, so it stays in
         view however far down the form the administrator has scrolled. */
      className="pointer-events-none absolute right-4 top-[4.25rem] z-30 flex w-[min(21rem,calc(100%-2rem))] flex-col gap-2"
    >
      {toasts.map((t) => {
        const style = MODAL_TOAST_STYLE[t.kind];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-white px-3.5 py-3 shadow-lg [animation:viewer-in_180ms_ease-out]",
              style.border,
            )}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={cn("mt-0.5 h-4 w-4 shrink-0", style.icon)} aria-hidden="true">
              <path d={style.path} />
            </svg>
            <div className="min-w-0 flex-1">
              {t.title && <p className="text-sm font-normal text-neutral-950">{t.title}</p>}
              <p className="text-[13px] leading-5 text-neutral-700">{t.message}</p>
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss"
              className="shrink-0 cursor-pointer rounded p-0.5 text-neutral-400 transition-colors hover:text-neutral-700"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Confirmation ────────────────────────────────── */
/**
 * Asks before something that cannot be taken back quietly.
 *
 * Portalled above `AdminModal` (z-[10000] against its z-[9999]) so it can
 * be opened from inside one. Escape and the backdrop both cancel; neither
 * confirms, because the safe answer should be the easy one.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  /** A second line, for a consequence worth spelling out. */
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger" | "warning";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    };
    /* Capture: the modal underneath also closes on Escape, and the top
       dialog is the one that should take the key. */
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onCancel]);

  if (!open || !isClient) return null;

  const accent: Record<string, string> = {
    primary: EKO.green,
    danger: EKO.red,
    warning: EKO.yellow,
  };

  return createPortal(
    <div
      data-lenis-prevent
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-neutral-950/50 p-4 backdrop-blur-sm [animation:viewer-in_160ms_ease-out]"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm overflow-hidden rounded-[1.25rem] bg-white shadow-2xl"
      >
        <div className="h-1 w-full" style={{ background: accent[tone] }} aria-hidden="true" />
        <div className="px-6 py-5">
          <h3 className="text-base font-normal tracking-[-0.01em] text-neutral-950">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-neutral-700">{message}</p>
          {detail && <p className="mt-2 text-[13px] leading-6 text-neutral-500">{detail}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 px-6 py-4">
          <Btn size="sm" variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Btn>
          <Btn
            size="sm"
            variant={tone === "danger" ? "danger" : tone === "warning" ? "warning" : "primary"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </Btn>
        </div>
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
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-sm font-normal text-neutral-900">{count}</span>
          )}
        </h1>
        {subtitle && <p className="mt-2 text-sm leading-7 text-neutral-900">{subtitle}</p>}
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-neutral-800" aria-hidden="true">
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
          className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-11 pr-4 text-sm font-normal text-neutral-800 placeholder:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-200"
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
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
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
                  className="whitespace-nowrap px-5 py-4 text-left text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {React.Children.count(children) === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-14 text-center text-sm text-neutral-900">
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
    <td className={cn(compact ? "px-5 py-2.5" : "px-5 py-3.5", "align-middle font-normal text-neutral-900", className)}>
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
      <label className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-900">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

const fieldBase =
  "w-full rounded-xl border px-4 py-2.5 text-sm font-normal text-neutral-800 placeholder:text-neutral-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-200";

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
    ghost: "text-neutral-900 hover:bg-neutral-100",
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
        /* cursor-pointer: a <button> gets the default arrow, which on a pill
           that looks exactly like a link reads as "not clickable". */
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-normal transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
      <p className="mt-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900">{label}</p>
      {sub && <p className="mt-2 text-xs leading-5 text-neutral-900">{sub}</p>}
    </div>
  );
}

/* ─── Divider ─────────────────────────────────────── */
export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="mb-3 mt-6 flex items-center gap-3">
      <span className="text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-900">{label}</span>
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
