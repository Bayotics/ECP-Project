"use client";

/* Shared furniture for the member and admin portals.

   The public pages lead with a full-bleed hero; a portal cannot, so these
   pieces carry the same typography instead: weight 400 everywhere except a
   500 page title, the four-colour quad rule, uppercase tracked labels, and
   the same rounded panels and pill controls. */

import Link from "next/link";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

export const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

export function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1 w-20 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-neutral-200 pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <QuadBar />
        <p className="mt-4 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-500">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-4xl">{title}</h1>
        {lede && <p className="mt-3 text-sm leading-7 text-neutral-700">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded-[1.5rem] border border-neutral-200 bg-white", padded && "p-6", className)}>
      {children}
    </section>
  );
}

export function PanelHeading({
  title,
  note,
  action,
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">{title}</h2>
        {note && <p className="mt-1 text-sm text-neutral-600">{note}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  value,
  label,
  color = EKO.green,
  note,
}: {
  value: React.ReactNode;
  label: string;
  color?: string;
  note?: string;
}) {
  return (
    <div className="rounded-[1.25rem] border border-neutral-200 bg-white p-5">
      <p className="text-3xl font-normal tracking-[-0.04em]" style={{ color }}>
        {value}
      </p>
      <p className="mt-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-600">{label}</p>
      {note && <p className="mt-2 text-xs leading-5 text-neutral-500">{note}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 focus:ring-green-200";

export const selectClass =
  "rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-normal text-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-200";

export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-neutral-400" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </span>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={cn(inputClass, "pl-11")}
      />
    </div>
  );
}

export function Chip({
  active,
  color = "#0a0a0a",
  onClick,
  children,
  count,
}: {
  active: boolean;
  color?: string;
  onClick: () => void;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-normal transition-colors"
      style={{
        borderColor: active ? color : "#e5e5e5",
        background: active ? `${color}14` : "#ffffff",
        color: active ? "#0a0a0a" : "#525252",
      }}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {children}
      {typeof count === "number" && count > 0 && <span className="text-neutral-400">{count}</span>}
    </button>
  );
}

const TONE: Record<string, string> = {
  green: "bg-green-50 text-green-800 border-green-200",
  red: "bg-red-50 text-red-800 border-red-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  yellow: "bg-amber-50 text-amber-800 border-amber-200",
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

export function Pill({
  tone = "neutral",
  children,
  dot,
}: {
  tone?: keyof typeof TONE;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-normal", TONE[tone])}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  href,
  disabled,
  type = "button",
  color = EKO.green,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  color?: string;
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-normal text-white transition-opacity disabled:opacity-60",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls} style={{ background: color }}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={{ background: color }}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  href,
  type = "button",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  className?: string;
}) {
  const cls = cn(
    "inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 bg-white px-6 py-2.5 text-sm font-normal text-neutral-800 transition-colors hover:border-neutral-400",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function EmptyPanel({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      <p className="text-lg font-normal text-neutral-900">{title}</p>
      {body && <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-neutral-600">{body}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-neutral-200 bg-white p-4", className)}>
      {children}
    </div>
  );
}
