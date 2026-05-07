"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export type SectionHeaderAlign = "left" | "center" | "right";

export interface SectionHeaderProps {
  /** Small overline label above heading */
  eyebrow?: string;
  heading: string;
  /** Accent word(s) within heading — rendered in brand colour */
  headingAccent?: string;
  subheading?: string;
  align?: SectionHeaderAlign;
  /** Show the decorative underline bar */
  withBar?: boolean;
  /** If provided, rendered as a right-side "View all" action */
  action?: React.ReactNode;
  /** Dark background variant */
  dark?: boolean;
  className?: string;
}

/* ─── Animations ─────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

/* ─── SectionHeader ──────────────────────────────────── */
export default function SectionHeader({
  eyebrow,
  heading,
  headingAccent,
  subheading,
  align = "center",
  withBar = false,
  action,
  dark = false,
  className,
}: SectionHeaderProps) {
  const alignClass = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }[align];

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        alignClass,
        action && align !== "center" && "sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className={cn("flex flex-col gap-2.5", alignClass, "flex-1")}>
        {eyebrow && (
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className={cn(
              "text-xs font-bold uppercase tracking-[0.15em]",
              dark ? "text-(--color-gold-400)" : "text-(--color-green-500)"
            )}
          >
            {eyebrow}
          </motion.p>
        )}

        <motion.h2
          custom={1}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className={cn(
            "text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl lg:text-4xl",
            dark ? "text-white" : "text-(--foreground)"
          )}
        >
          {heading}
          {headingAccent && (
            <>
              {" "}
              <span
                style={{
                  color: dark
                    ? "var(--color-gold-300)"
                    : "var(--color-green-500)",
                }}
              >
                {headingAccent}
              </span>
            </>
          )}
        </motion.h2>

        {withBar && (
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className={cn(
              "h-1 w-12 rounded-full",
              dark ? "bg-(--color-gold-500)" : "bg-(--color-green-500)",
              align === "center" && "self-center",
              align === "right" && "self-end"
            )}
            aria-hidden="true"
          />
        )}

        {subheading && (
          <motion.p
            custom={3}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className={cn(
              "text-base leading-relaxed max-w-2xl",
              dark ? "text-white/70" : "text-(--color-neutral-500)",
              align === "center" && "self-center"
            )}
          >
            {subheading}
          </motion.p>
        )}
      </div>

      {action && (
        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex-shrink-0"
        >
          {action}
        </motion.div>
      )}
    </div>
  );
}
