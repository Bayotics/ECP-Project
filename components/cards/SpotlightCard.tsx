"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface SpotlightStat {
  label: string;
  value: string;
}

export interface SpotlightCTA {
  label: string;
  href: string;
  variant?: "primary" | "outline";
}

export interface SpotlightCardProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  stats?: SpotlightStat[];
  ctas?: SpotlightCTA[];
  /** Left accent color — "green" | "gold" | "neutral" */
  accentColor?: "green" | "gold" | "neutral";
  /** "light" | "dark" */
  theme?: "light" | "dark";
  className?: string;
  /** Extra className applied to the title h3 */
  titleClassName?: string;
}

/* ─── SpotlightCard ──────────────────────────────────── */
export default function SpotlightCard({
  title,
  subtitle,
  eyebrow,
  description,
  imageUrl,
  imageAlt,
  stats = [],
  ctas = [],
  accentColor = "green",
  theme = "light",
  className,
  titleClassName,
}: SpotlightCardProps) {
  const isDark = theme === "dark";

  const accentVars = {
    green: {
      bar: "bg-(--color-green-500)",
      eyebrow: "text-(--color-green-600)",
      eyebrowDark: "text-(--color-green-300)",
      statValue: "text-(--color-green-600)",
      statValueDark: "text-(--color-green-300)",
    },
    gold: {
      bar: "bg-(--color-gold-500)",
      eyebrow: "text-(--color-gold-600)",
      eyebrowDark: "text-(--color-gold-300)",
      statValue: "text-(--color-gold-600)",
      statValueDark: "text-(--color-gold-300)",
    },
    neutral: {
      bar: "bg-(--color-neutral-400)",
      eyebrow: "text-(--color-neutral-500)",
      eyebrowDark: "text-(--color-neutral-300)",
      statValue: "text-(--color-neutral-700)",
      statValueDark: "text-(--color-neutral-200)",
    },
  }[accentColor];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const, staggerChildren: 0.08 } },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <motion.article
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-lg flex flex-col md:flex-row gap-0",
        isDark ? "bg-(--color-green-950)" : "bg-white border border-(--color-neutral-200)",
        className,
      )}
    >
      {/* Accent bar */}
      <span className={cn("absolute top-0 left-0 h-1 w-full md:h-full md:w-1", accentVars.bar)} aria-hidden="true" />

      {/* Image */}
      {imageUrl && (
        <div className="relative md:w-2/5 min-h-64 overflow-hidden bg-(--color-neutral-100) flex-shrink-0">
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className={cn("flex flex-col gap-4 p-7 md:p-10 flex-1", imageUrl ? "md:pl-10" : "md:pl-12")}>
        {eyebrow && (
          <motion.p
            variants={childVariants}
            className={cn("text-xs font-bold uppercase tracking-widest", isDark ? accentVars.eyebrowDark : accentVars.eyebrow)}
          >
            {eyebrow}
          </motion.p>
        )}

        <motion.div variants={childVariants} className="flex flex-col gap-1">
          <h3 className={cn("text-2xl md:text-3xl font-extrabold leading-tight", titleClassName, isDark ? "text-white" : "text-green-600")}>
            {title}
          </h3>
          {subtitle && (
            <p className={cn("text-base font-medium", isDark ? "text-(--color-neutral-300)" : "text-(--color-neutral-500)")}>
              {subtitle}
            </p>
          )}
        </motion.div>

        <motion.p
          variants={childVariants}
          className={cn("leading-relaxed text-sm md:text-base", isDark ? "text-(--color-neutral-300)" : "text-(--color-neutral-600)")}
        >
          {description}
        </motion.p>

        {/* Stats */}
        {stats.length > 0 && (
          <motion.div variants={childVariants} className="flex flex-wrap gap-6 pt-2">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col gap-0.5">
                <span className={cn("text-2xl font-extrabold leading-none", isDark ? accentVars.statValueDark : accentVars.statValue)}>
                  {s.value}
                </span>
                <span className={cn("text-xs", isDark ? "text-(--color-neutral-400)" : "text-(--color-neutral-500)")}>
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* CTAs */}
        {ctas.length > 0 && (
          <motion.div variants={childVariants} className="flex flex-wrap gap-3 pt-2">
            {ctas.map((cta) => (
              <Link
                key={cta.href}
                href={cta.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2",
                  cta.variant === "outline"
                    ? isDark
                      ? "border border-white/30 text-white hover:bg-white/10 focus-visible:ring-white"
                      : "border border-(--color-green-600) text-(--color-green-600) hover:bg-(--color-green-50) focus-visible:ring-(--color-green-500)"
                    : "bg-(--color-green-600) text-white hover:bg-(--color-green-700) focus-visible:ring-(--color-green-500)",
                )}
              >
                {cta.label}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            ))}
          </motion.div>
        )}
      </div>
    </motion.article>
  );
}
