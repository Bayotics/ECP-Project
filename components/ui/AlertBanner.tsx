"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export type AlertType = "info" | "success" | "warning" | "error";

export interface AlertBannerProps {
  type?: AlertType;
  title?: string;
  message: string;
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
  className?: string;
}

const ALERT_STYLES: Record<AlertType, { bg: string; border: string; icon: React.ReactNode; iconColor: string; titleColor: string; textColor: string }> = {
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
    titleColor: "text-blue-900",
    textColor: "text-blue-700",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  success: {
    bg: "bg-(--color-green-50)",
    border: "border-(--color-green-200)",
    iconColor: "text-(--color-green-600)",
    titleColor: "text-(--color-green-900)",
    textColor: "text-(--color-green-700)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    bg: "bg-(--color-gold-50)",
    border: "border-(--color-gold-200)",
    iconColor: "text-(--color-gold-600)",
    titleColor: "text-(--color-gold-900)",
    textColor: "text-(--color-gold-700)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
    titleColor: "text-red-900",
    textColor: "text-red-700",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

/* ─── AlertBanner ────────────────────────────────────── */
export default function AlertBanner({
  type = "info",
  title,
  message,
  dismissible = true,
  action,
  onDismiss,
  className,
}: AlertBannerProps) {
  const [visible, setVisible] = useState(true);
  const styles = ALERT_STYLES[type];

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  const ROLE_MAP: Record<AlertType, "alert" | "status"> = { error: "alert", warning: "alert", success: "status", info: "status" };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2 }}
          role={ROLE_MAP[type]}
          aria-live={type === "error" || type === "warning" ? "assertive" : "polite"}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            styles.bg,
            styles.border,
            className,
          )}
        >
          <span className={cn("mt-0.5 flex-shrink-0", styles.iconColor)}>{styles.icon}</span>

          <div className="flex-1 min-w-0">
            {title && <p className={cn("font-semibold mb-0.5", styles.titleColor)}>{title}</p>}
            <p className={styles.textColor}>{message}</p>
            {action && (
              <button
                onClick={action.onClick}
                className={cn("mt-1.5 font-semibold underline underline-offset-2 hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:no-underline focus-visible:ring-2 rounded-sm focus-visible:ring-current", styles.titleColor)}
              >
                {action.label}
              </button>
            )}
          </div>

          {dismissible && (
            <button
              onClick={dismiss}
              aria-label="Dismiss alert"
              className={cn("flex-shrink-0 rounded p-0.5 hover:opacity-60 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current", styles.iconColor)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
