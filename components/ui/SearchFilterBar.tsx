"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  /** "chip" shows options inline; "select" shows a dropdown */
  display?: "chip" | "select";
}

export interface SearchFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterGroup[];
  activeFilters?: Record<string, string | string[]>;
  onFilterChange?: (groupId: string, value: string | string[]) => void;
  onClear?: () => void;
  isLoading?: boolean;
  className?: string;
}

/* ─── SearchFilterBar ────────────────────────────────── */
export default function SearchFilterBar({
  value,
  onChange,
  placeholder = "Search…",
  filters = [],
  activeFilters = {},
  onFilterChange,
  onClear,
  isLoading,
  className,
}: SearchFilterBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search by 300ms
  const handleInput = (v: string) => {
    setLocalValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(v), 300);
  };

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const hasActiveFilters =
    Object.values(activeFilters).some((v) =>
      Array.isArray(v) ? v.length > 0 : Boolean(v),
    ) || value.trim().length > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)} role="search">
      {/* Search input */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-(--color-neutral-400)" aria-hidden="true">
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </span>
        <input
          type="search"
          value={localValue}
          onChange={(e) => handleInput(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-xl border border-(--color-neutral-200) bg-white pl-10 pr-10 py-2.5 text-sm text-(--foreground) placeholder:text-(--color-neutral-400) focus:outline-none focus:ring-2 focus:ring-(--color-green-500) focus:border-transparent transition-shadow"
        />
        {localValue && (
          <button
            onClick={() => handleInput("")}
            aria-label="Clear search"
            className="absolute inset-y-0 right-3 flex items-center text-(--color-neutral-400) hover:text-(--color-neutral-600) transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {filters.map((group) => {
            const active = activeFilters[group.id];

            if (group.display === "select") {
              return (
                <div key={group.id}>
                  <label htmlFor={`filter-${group.id}`} className="sr-only">{group.label}</label>
                  <select
                    id={`filter-${group.id}`}
                    value={(active as string) ?? ""}
                    onChange={(e) => onFilterChange?.(group.id, e.target.value)}
                    className="text-sm rounded-lg border border-(--color-neutral-200) bg-white px-3 py-2 text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--color-green-500) focus:border-transparent cursor-pointer"
                  >
                    <option value="">{group.label}</option>
                    {group.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              );
            }

            // chip display
            return (
              <div key={group.id} className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-(--color-neutral-500)">{group.label}:</span>
                {group.options.map((o) => {
                  const isActive = Array.isArray(active) ? active.includes(o.value) : active === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => onFilterChange?.(group.id, isActive ? "" : o.value)}
                      aria-pressed={isActive}
                      className={cn(
                        "text-xs rounded-full px-3 py-1 font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)",
                        isActive
                          ? "bg-(--color-green-600) border-(--color-green-600) text-white"
                          : "bg-white border-(--color-neutral-200) text-(--color-neutral-600) hover:border-(--color-green-400)",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {hasActiveFilters && onClear && (
            <button
              onClick={onClear}
              className="ml-auto text-xs text-(--color-neutral-500) hover:text-red-600 underline underline-offset-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
