"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface CTAButton {
  label: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "white";
}

export interface CTASectionProps {
  eyebrow?: string;
  heading: string;
  headingAccent?: string;
  description?: string;
  buttons?: CTAButton[];
  /** "green" = dark green bg, "gold" = gold bg, "split" = green left + image right */
  variant?: "green" | "gold" | "neutral" | "minimal";
  /** Decorative background pattern */
  pattern?: boolean;
  className?: string;
  /** Trust/social proof line, e.g. "Joined by 12,000+ Lagosians" */
  trustLabel?: string;
}

/* ─── Animation ──────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.1 } } };

/* ─── CTASection ─────────────────────────────────────── */
export default function CTASection({
  eyebrow,
  heading,
  headingAccent,
  description,
  buttons = [],
  variant = "green",
  pattern = true,
  trustLabel,
  className,
}: CTASectionProps) {
  const isDark = variant === "green" || variant === "gold";

  const bgStyle: React.CSSProperties =
    variant === "green"
      ? { background: "var(--color-green-900)" }
      : variant === "gold"
      ? { background: "var(--color-gold-600)" }
      : variant === "neutral"
      ? { background: "var(--color-neutral-50)" }
      : {};

  const buttonStyles: Record<CTAButton["variant"] & string, string> = {
    primary:
      "bg-(--color-green-500) text-white hover:bg-(--color-green-600) focus-visible:ring-(--color-green-300)",
    secondary:
      "bg-(--color-gold-500) text-white hover:bg-(--color-gold-600) focus-visible:ring-(--color-gold-300)",
    outline: isDark
      ? "border-2 border-white/50 text-white hover:bg-white/10 focus-visible:ring-white/50"
      : "border-2 border-(--color-green-500) text-(--color-green-600) hover:bg-(--color-green-50) focus-visible:ring-(--color-green-300)",
    white:
      "bg-white text-(--color-green-700) hover:bg-(--color-green-50) focus-visible:ring-white",
  };

  return (
    <section
      className={cn("relative overflow-hidden py-20 px-4", className)}
      style={bgStyle}
      aria-label="Call to action"
    >
      {/* Decorative SVG pattern */}
      {pattern && isDark && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="cta-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cta-dots)" />
        </svg>
      )}

      {/* Decorative blob */}
      {isDark && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full blur-3xl opacity-20"
            style={{
              background:
                variant === "green"
                  ? "var(--color-gold-400)"
                  : "var(--color-green-400)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl opacity-15"
            style={{
              background:
                variant === "green"
                  ? "var(--color-green-300)"
                  : "var(--color-gold-200)",
            }}
          />
        </>
      )}

      <div className="container-app relative z-10 flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="flex flex-col items-center gap-4"
        >
          {eyebrow && (
            <motion.p
              variants={fadeUp}
              className={cn(
                "text-xs font-bold uppercase tracking-[0.15em]",
                isDark ? "text-(--color-gold-300)" : "text-(--color-green-500)"
              )}
            >
              {eyebrow}
            </motion.p>
          )}

          <motion.h2
            variants={fadeUp}
            className={cn(
              "text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl",
              isDark ? "text-white" : "text-(--foreground)"
            )}
          >
            {heading}
            {headingAccent && (
              <>
                {" "}
                <span
                  style={{
                    color:
                      variant === "green"
                        ? "var(--color-gold-300)"
                        : "var(--color-green-500)",
                  }}
                >
                  {headingAccent}
                </span>
              </>
            )}
          </motion.h2>

          {description && (
            <motion.p
              variants={fadeUp}
              className={cn(
                "text-base leading-relaxed max-w-xl",
                isDark ? "text-white/75" : "text-(--color-neutral-500)"
              )}
            >
              {description}
            </motion.p>
          )}

          {buttons.length > 0 && (
            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3 pt-2">
              {buttons.map((btn) => (
                <Link
                  key={btn.href}
                  href={btn.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                    buttonStyles[btn.variant ?? (isDark ? "white" : "primary")]
                  )}
                >
                  {btn.icon && <span aria-hidden="true">{btn.icon}</span>}
                  {btn.label}
                </Link>
              ))}
            </motion.div>
          )}

          {trustLabel && (
            <motion.p
              variants={fadeUp}
              className={cn(
                "text-xs font-medium",
                isDark ? "text-white/50" : "text-(--color-neutral-400)"
              )}
            >
              {trustLabel}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
