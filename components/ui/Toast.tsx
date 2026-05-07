"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import type { ToastType } from "@/hooks/useToast";
import { cn } from "@/utils/cn";

/* ─── Styles ─────────────────────────────────────────── */
const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; iconColor: string; titleColor: string; textColor: string }> = {
  success: {
    bg: "bg-white",
    border: "border-(--color-green-300)",
    iconColor: "text-(--color-green-500)",
    titleColor: "text-(--color-green-900)",
    textColor: "text-(--color-neutral-600)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    bg: "bg-white",
    border: "border-red-300",
    iconColor: "text-red-500",
    titleColor: "text-red-900",
    textColor: "text-(--color-neutral-600)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-white",
    border: "border-(--color-gold-300)",
    iconColor: "text-(--color-gold-600)",
    titleColor: "text-(--color-gold-900)",
    textColor: "text-(--color-neutral-600)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    bg: "bg-white",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-900",
    textColor: "text-(--color-neutral-600)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

/* ─── ToastContainer ─────────────────────────────────── */
export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-4 z-[200] flex flex-col gap-2 items-end"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const styles = TOAST_STYLES[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="status"
              className={cn(
                "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg w-full max-w-xs sm:max-w-sm",
                styles.bg,
                styles.border,
              )}
            >
              <span className={cn("mt-0.5 flex-shrink-0", styles.iconColor)}>{styles.icon}</span>
              <div className="flex-1 min-w-0">
                {t.title && <p className={cn("font-semibold text-sm mb-0.5", styles.titleColor)}>{t.title}</p>}
                <p className={cn("text-sm", styles.textColor)}>{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 mt-0.5 rounded p-0.5 text-(--color-neutral-400) hover:text-(--color-neutral-600) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
