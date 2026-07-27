"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";
import Badge from "@/components/ui/Badge";

/* ─── Types ──────────────────────────────────────────── */
export interface HeroCTA {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
}

export interface HeroBannerProps {
  /** Pre-heading badge label */
  eyebrow?: string;
  /** Main headline (supports <br/> via array) */
  headline: string;
  /** Accent portion of headline (rendered in brand colour) */
  headlineAccent?: string;
  /** Subtext below headline */
  description?: string;
  /** CTA buttons (max 2 recommended) */
  ctas?: HeroCTA[];
  /** Right-side image URL */
  imageUrl?: string;
  imageAlt?: string;
  /** Inline stat bubbles rendered beneath description */
  stats?: Array<{ label: string; value: string }>;
  /** Full-bleed background variant */
  variant?: "gradient" | "dark" | "light" | "image";
  /** Background image for "image" variant */
  bgImageUrl?: string;
  /** Extra className on root element */
  className?: string;
  /** Children rendered inside the text column (below stats) */
  children?: React.ReactNode;
}

/* ─── Animation variants ────────────────────────────── */
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

/* ─── CTA button ────────────────────────────────────── */
function HeroButton({ cta, dark }: { cta: HeroCTA; dark: boolean }) {
  const v = cta.variant ?? "primary";
  return (
    <Link
      href={cta.href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        v === "primary" &&
          "bg-(--color-green-500) text-white hover:bg-(--color-green-600) focus-visible:ring-(--color-green-400)",
        v === "secondary" &&
          "bg-(--color-gold-500) text-white hover:bg-(--color-gold-600) focus-visible:ring-(--color-gold-400)",
        v === "outline" &&
          (dark
            ? "border-2 border-white/60 text-white hover:bg-white/10 focus-visible:ring-white"
            : "border-2 border-(--color-green-500) text-(--color-green-600) hover:bg-(--color-green-50) focus-visible:ring-(--color-green-400)")
      )}
    >
      {cta.label}
    </Link>
  );
}

/* ─── HeroBanner ────────────────────────────────────── */
export default function HeroBanner({
  eyebrow,
  headline,
  headlineAccent,
  description,
  ctas = [],
  imageUrl,
  imageAlt = "Hero illustration",
  stats = [],
  variant = "gradient",
  bgImageUrl,
  className,
  children,
}: HeroBannerProps) {
  const isDark = variant === "gradient" || variant === "dark" || variant === "image";

  const rootStyle =
    variant === "gradient"
      ? { background: "#059669" }
      : variant === "dark"
      ? { background: "var(--color-green-950)" }
      : variant === "image" && bgImageUrl
      ? { backgroundImage: `url(${bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
      : {};

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variant === "light" && "bg-(--color-neutral-50)",
        isDark && "text-white",
        className
      )}
      style={rootStyle}
      aria-label="Hero banner"
    >
      {/* Image overlay tint */}
      {variant === "image" && (
        <div className="absolute inset-0 bg-black/55 z-0" aria-hidden="true" />
      )}

      {/* Decorative blobs for dark variant */}
      {isDark && variant !== "image" && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full blur-3xl opacity-20"
            style={{ background: "var(--color-gold-300)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full blur-3xl opacity-15"
            style={{ background: "var(--color-green-300)" }}
          />
        </>
      )}

      <div
        className={cn(
          "container-app relative z-10 py-20 lg:py-28",
          imageUrl ? "grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center" : "max-w-3xl"
        )}
      >
        {/* ── Text column ── */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
          {eyebrow && (
            <motion.div variants={fadeUp}>
              <Badge color={isDark ? "gold" : "green"} dot>
                {eyebrow}
              </Badge>
            </motion.div>
          )}

          <motion.h1
            variants={fadeUp}
            className={cn(
              "text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            )}
          >
            {headline}
            {headlineAccent && (
              <>
                {" "}
                <span
                  style={{ color: isDark ? "var(--color-gold-300)" : "var(--color-green-500)" }}
                >
                  {headlineAccent}
                </span>
              </>
            )}
          </motion.h1>

          {description && (
            <motion.p
              variants={fadeUp}
              className={cn(
                "text-lg leading-relaxed max-w-xl",
                isDark ? "text-white/80" : "text-(--color-neutral-600)"
              )}
            >
              {description}
            </motion.p>
          )}

          {ctas.length > 0 && (
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3 pt-1">
              {ctas.map((cta) => (
                <HeroButton key={cta.href} cta={cta} dark={isDark} />
              ))}
            </motion.div>
          )}

          {stats.length > 0 && (
            <motion.div
              variants={fadeUp}
              className="mt-2 flex flex-wrap gap-6 border-t border-white/15 pt-5"
            >
              {stats.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      isDark ? "text-white" : "text-(--color-green-500)"
                    )}
                  >
                    {value}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium uppercase tracking-widest",
                      isDark ? "text-white/60" : "text-(--color-neutral-500)"
                    )}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          )}

          {children && <motion.div variants={fadeUp}>{children}</motion.div>}
        </motion.div>

        {/* ── Image column ── */}
        {imageUrl && (
          <motion.div
            variants={fadeRight}
            initial="hidden"
            animate="show"
            className="relative hidden lg:flex items-center justify-center"
          >
            <div className="relative h-[420px] w-full">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
