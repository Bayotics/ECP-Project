"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export type FieldType = "text" | "email" | "tel" | "textarea" | "select" | "checkbox";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  validation?: (value: string) => string | null;
  colSpan?: 1 | 2;
}

export interface FormBlockProps {
  fields: FormField[];
  submitLabel?: string;
  successMessage?: string;
  onSubmit?: (data: Record<string, string>) => Promise<void> | void;
  className?: string;
}

/* ─── FormBlock ──────────────────────────────────────── */
export default function FormBlock({
  fields,
  submitLabel = "Submit",
  successMessage = "Thank you! Your message has been received.",
  onSubmit,
  className,
}: FormBlockProps) {
  const initial = Object.fromEntries(fields.map((f) => [f.id, ""]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    for (const field of fields) {
      const val = values[field.id] ?? "";
      if (field.required && !val.trim()) {
        newErrors[field.id] = `${field.label} is required.`;
        continue;
      }
      if (field.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        newErrors[field.id] = "Please enter a valid email address.";
        continue;
      }
      if (field.validation) {
        const msg = field.validation(val);
        if (msg) newErrors[field.id] = msg;
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      await onSubmit?.(values);
      setStatus("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred. Please try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("rounded-2xl border border-(--color-green-200) bg-(--color-green-50) p-8 text-center flex flex-col items-center gap-3", className)}
        role="status"
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--color-green-100)">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-(--color-green-600)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="font-semibold text-(--color-green-900)">{successMessage}</p>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4", className)}
      aria-label="Contact form"
    >
      {fields.map((field) => (
        <div
          key={field.id}
          className={cn("flex flex-col gap-1.5", field.colSpan === 2 || field.type === "textarea" ? "sm:col-span-2" : "")}
        >
          <label htmlFor={field.id} className="text-sm font-semibold text-(--foreground)">
            {field.label}
            {field.required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </label>

          {field.type === "textarea" ? (
            <textarea
              id={field.id}
              value={values[field.id]}
              onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              aria-invalid={!!errors[field.id]}
              aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
              rows={4}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm resize-y text-(--foreground) placeholder:text-(--color-neutral-400) focus:outline-none focus:ring-2 focus:ring-(--color-green-500) focus:border-transparent transition-shadow",
                errors[field.id] ? "border-red-400 bg-red-50" : "border-(--color-neutral-200) bg-white",
              )}
            />
          ) : field.type === "select" ? (
            <select
              id={field.id}
              value={values[field.id]}
              onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
              required={field.required}
              aria-invalid={!!errors[field.id]}
              aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm text-(--foreground) focus:outline-none focus:ring-2 focus:ring-(--color-green-500) focus:border-transparent transition-shadow cursor-pointer",
                errors[field.id] ? "border-red-400 bg-red-50" : "border-(--color-neutral-200) bg-white",
              )}
            >
              <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
              {field.options?.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : field.type === "checkbox" ? (
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id={field.id}
                type="checkbox"
                checked={values[field.id] === "true"}
                onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.checked ? "true" : "" }))}
                className="mt-0.5 h-4 w-4 rounded border-(--color-neutral-300) accent-(--color-green-600) focus-visible:ring-2 focus-visible:ring-(--color-green-500)"
              />
              <span className="text-sm text-(--color-neutral-600)">{field.placeholder ?? field.label}</span>
            </label>
          ) : (
            <input
              id={field.id}
              type={field.type}
              value={values[field.id]}
              onChange={(e) => setValues((v) => ({ ...v, [field.id]: e.target.value }))}
              placeholder={field.placeholder}
              required={field.required}
              aria-invalid={!!errors[field.id]}
              aria-describedby={errors[field.id] ? `${field.id}-error` : undefined}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm text-(--foreground) placeholder:text-(--color-neutral-400) focus:outline-none focus:ring-2 focus:ring-(--color-green-500) focus:border-transparent transition-shadow",
                errors[field.id] ? "border-red-400 bg-red-50" : "border-(--color-neutral-200) bg-white",
              )}
            />
          )}

          <AnimatePresence>
            {errors[field.id] && (
              <motion.p
                id={`${field.id}-error`}
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-red-600"
              >
                {errors[field.id]}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Global error */}
      {status === "error" && (
        <p role="alert" className="sm:col-span-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200">
          {errorMsg}
        </p>
      )}

      {/* Submit */}
      <div className="sm:col-span-2">
        <motion.button
          type="submit"
          disabled={status === "loading"}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-2 rounded-xl bg-(--color-green-600) px-6 py-3 text-sm font-semibold text-white hover:bg-(--color-green-700) transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)"
        >
          {status === "loading" ? (
            <>
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending…
            </>
          ) : submitLabel}
        </motion.button>
      </div>
    </form>
  );
}
