"use client";

import { createContext, useContext, useState, useCallback, useId } from "react";
import type { ReactNode } from "react";

/* ─── Types ──────────────────────────────────────────── */
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

/* ─── Context ────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue | null>(null);

let _counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((opts: Omit<Toast, "id">): string => {
    const id = `toast-${++_counter}`;
    setToasts((prev) => [...prev, { ...opts, id }]);
    const duration = opts.duration ?? 4500;
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => setToasts([]), []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
    </ToastContext.Provider>
  );
}

/* ─── Hook ───────────────────────────────────────────── */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");

  return {
    toasts: ctx.toasts,
    toast: ctx.toast,
    dismiss: ctx.dismiss,
    dismissAll: ctx.dismissAll,
    success: (message: string, title?: string, duration?: number) =>
      ctx.toast({ type: "success", message, title, duration }),
    error: (message: string, title?: string, duration?: number) =>
      ctx.toast({ type: "error", message, title, duration }),
    warning: (message: string, title?: string, duration?: number) =>
      ctx.toast({ type: "warning", message, title, duration }),
    info: (message: string, title?: string, duration?: number) =>
      ctx.toast({ type: "info", message, title, duration }),
  };
}
