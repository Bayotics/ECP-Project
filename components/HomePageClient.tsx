"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useInView,
} from "framer-motion";
import type { Event as AppEvent } from "@/lib/models/event";

/* ─── Contexts ───────────────────────────────────────── */
import { useEvents } from "@/context/EventsContext";
import { useNews } from "@/context/NewsContext";

/* ─── Components ─────────────────────────────────────── */
import SectionHeader from "@/components/ui/SectionHeader";
import AlertBanner from "@/components/ui/AlertBanner";

/* ─── Utils ──────────────────────────────────────────── */
import { cn } from "@/utils/cn";
import { useToast } from "@/hooks/useToast";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/* ══════════════════════════════════════════════════════
   BRAND COLORS — green · red · blue · yellow
   ══════════════════════════════════════════════════════ */
const EKO_GREEN  = "#059669";
const EKO_RED    = "#dc2626";
const EKO_BLUE   = "#2563eb";
const EKO_YELLOW = "#d97706";
const QUAD = [EKO_GREEN, EKO_RED, EKO_BLUE, EKO_YELLOW];

const GALLERY_ASSETS = {
  hero: [
    { src: "/gallery/event1.JPG", alt: "Eko Club Philadelphia gallery highlight" },
    { src: "/gallery/event2.JPG", alt: "Eko Club Philadelphia members in community" },
    { src: "/gallery/event3.JPG", alt: "Eko Club Philadelphia event celebration" },
  ],
  mission: "/gallery/event4.JPG",
  timeline: {
    townHall: "/gallery/event5.JPG",
    health: "/gallery/event6.JPG",
    seminar: "/gallery/event7.JPG",
    volunteer: "/gallery/event8.JPG",
    workshop: "/gallery/event9.JPG",
    meetup: "/gallery/event3.JPG",
    pressConference: "/gallery/event2.JPG",
    other: "/gallery/event1.JPG",
  },
  sponsorsBackdrop: "/gallery/event2.JPG",
  donation: "/gallery/event6.JPG",
} as const;

/* ══════════════════════════════════════════════════════
   SHARED HELPERS
   ══════════════════════════════════════════════════════ */

/** Magnetic-feel button/link wrapper */
function MagneticButton({
  children,
  className,
  href,
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x  = useSpring(mx, { stiffness: 300, damping: 20 });
  const y  = useSpring(my, { stiffness: 300, damping: 20 });

  function onMove(e: React.MouseEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left - r.width  / 2) * 0.35);
    my.set((e.clientY - r.top  - r.height / 2) * 0.35);
  }
  function onLeave() { mx.set(0); my.set(0); }

  if (href) {
    return (
      <motion.a
        href={href}
        className={className}
        style={{ ...style, x, y }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.97 }}
      >
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      className={className}
      style={{ ...style, x, y }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

/** Animated count-up number */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setVal(Math.round(ease * to));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, to]);

  return <span ref={ref}>{val}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════
   1. ANNOUNCEMENT BAR
   ══════════════════════════════════════════════════════ */
function AnnouncementBar() {
  const { getBreaking, getPublished } = useNews();
  const [dismissed, setDismissed] = useState(false);

  const breaking = useMemo(() => {
    const items = getBreaking();
    return items[0] ?? getPublished().find((p) => p.isPinned) ?? null;
  }, [getBreaking, getPublished]);

  if (!breaking || dismissed) return null;

  return (
    <AlertBanner
      type="warning"
      title="Breaking"
      message={breaking.title}
      dismissible
      onDismiss={() => setDismissed(true)}
      action={{
        label: "Read more →",
        onClick: () => window.location.assign(`/news/${breaking.slug}`),
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   2. HERO — cinematic carousel · 4-colour identity
   ══════════════════════════════════════════════════════ */
const HERO_SLIDES = GALLERY_ASSETS.hero;

const HERO_WORDS = [
  { text: "EKO",          color: EKO_GREEN  },
  { text: "CLUB",         color: EKO_RED    },
  { text: "PHILADELPHIA", color: "#ffffff"  },
];

function HeroSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive(p => (p + 1) % HERO_SLIDES.length), 5800);
    return () => clearInterval(id);
  }, []);

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12 } },
  };
  const wordVariants = {
    hidden: { opacity: 0, y: 60, skewY: 6 },
    show:   { opacity: 1, y:  0, skewY: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number,number,number,number] } },
  };

  return (
    <section
      className="relative min-h-svh overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* ── Slides ── */}
      {HERO_SLIDES.map((slide, i) => (
        <motion.div
          key={slide.src}
          className="absolute inset-0"
          animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.04 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          aria-hidden={i !== active}
        >
          <Image src={slide.src} alt={slide.alt} fill priority={i === 0} className="object-cover object-center" sizes="100vw" />
        </motion.div>
      ))}

      {/* ── Overlays ── */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(115deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.45) 55%,rgba(0,0,0,0.15) 100%)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.7),transparent)" }} />

      {/* ── Floating orbs ── */}
      {QUAD.map((c, i) => (
        <motion.div
          key={c}
          className="pointer-events-none absolute rounded-full opacity-20 blur-3xl"
          style={{ background: c, width: 340, height: 340, left: `${10 + i * 22}%`, top: `${8 + (i % 2) * 40}%` }}
          animate={{ y: [0, -28, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 7 + i * 1.3, repeat: Infinity, ease: "easeInOut", delay: i * 1.1 }}
        />
      ))}

      {/* ── Content ── */}
      <div className="relative mx-auto flex min-h-svh max-w-7xl flex-col justify-center px-4 py-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 inline-flex items-center gap-2"
          >
            {QUAD.map(c => <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />)}
            <span className="ml-1 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
              Eko Club Philadelphia — Est. 1998
            </span>
          </motion.div>

          {/* Stacked title words */}
          <motion.div
            id="hero-heading"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {HERO_WORDS.map(w => (
              <motion.div key={w.text} variants={wordVariants} className="overflow-hidden">
                <span
                  className="block text-4xl font-black leading-none tracking-[-0.03em] sm:text-5xl lg:text-7xl"
                  style={{ color: w.color, textShadow: w.color !== "#ffffff" ? `0 0 40px ${w.color}55` : undefined }}
                >
                  {w.text}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Date badge + subtitle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            className="mt-5 flex flex-wrap items-center gap-3"
          >
            <span
              className="rounded-full px-4 py-1.5 text-sm font-black text-black shadow-lg"
              style={{ background: EKO_YELLOW }}
            >
              December 6, 2026
            </span>
            <span className="text-sm font-semibold text-white/80">
              Annual Gala &amp; Awards Night · Philadelphia, PA
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.68, duration: 0.55 }}
            className="mt-4 max-w-lg text-sm leading-relaxed text-white/70"
          >
            Our signature evening unites Lagosians across the Delaware Valley — honouring
            community leaders, celebrating culture, and building lasting connections.
            Join us for an unforgettable night.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <MagneticButton
              href="/events"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-black text-white shadow-2xl focus-visible:outline-none"
              style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}80` }}
            >
              Get Tickets
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </MagneticButton>
            <MagneticButton
              href="/membership/apply"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md focus-visible:outline-none"
            >
              Become a Member
            </MagneticButton>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="mt-12 flex flex-wrap gap-8 border-t border-white/15 pt-8"
          >
            {[
              { val: 500, suffix: "+", label: "Members" },
              { val: 25,  suffix: "+", label: "Years Active" },
              { val: 20,  suffix: "+", label: "Events / Year" },
            ].map((s, i) => (
              <div key={s.label} className="flex flex-col">
                <span className="text-3xl font-black text-white">
                  <CountUp to={s.val} suffix={s.suffix} />
                </span>
                <span className="mt-0.5 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: QUAD[i] }}>
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Slide dots ── */}
      <div className="absolute bottom-8 right-8 flex gap-2" role="tablist">
        {HERO_SLIDES.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className="transition-all duration-300 focus-visible:outline-none"
            style={{
              height: "0.5rem",
              width: i === active ? "2rem" : "0.5rem",
              borderRadius: "9999px",
              background: i === active ? EKO_YELLOW : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>

      {/* ── 4-colour flag bar at bottom ── */}
      <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
        {QUAD.map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   3. HIGHLIGHTS — editorial split layout
   ══════════════════════════════════════════════════════ */
function HighlightsSection() {
  return (
    <section
      className="relative overflow-hidden bg-white py-20 px-4 sm:px-6 lg:px-8"
      aria-labelledby="highlights-heading"
    >
      {/* Ghost numeral depth */}
      <div
        className="pointer-events-none absolute -right-4 top-0 select-none text-[20rem] font-black leading-none opacity-[0.04] text-neutral-900"
        aria-hidden="true"
      >
        2025
      </div>

      <div className="relative mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.4fr]">
          {/* Left text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="flex h-2 w-24 overflow-hidden rounded-full">
              {QUAD.map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
            </div>
            <h2
              id="highlights-heading"
              className="text-4xl font-black leading-tight tracking-tight text-neutral-950 sm:text-5xl"
            >
              2025 ECP Annual<br />
              <span style={{ color: EKO_GREEN }}>Gala Highlights</span>
            </h2>
            <p className="text-base leading-relaxed text-neutral-500">
              Relive the unforgettable moments from our most recent annual gathering —
              a night of culture, recognition, and community celebration in Philadelphia.
            </p>
            <Link
              href="/gallery"
              className="inline-flex w-fit items-center gap-2 text-sm font-bold transition-all hover:gap-3"
              style={{ color: EKO_GREEN }}
            >
              View full gallery
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </motion.div>

          {/* Right: video with 4-colour gradient border */}
          <motion.div
            initial={{ opacity: 0, x: 32, scale: 0.97 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-2xl p-0.75 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${EKO_GREEN} 0%, ${EKO_RED} 33%, ${EKO_BLUE} 66%, ${EKO_YELLOW} 100%)`,
              }}
            >
              <div className="overflow-hidden rounded-[14px] bg-black">
                <div className="relative aspect-video">
                  <iframe
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                    title="ECP Annual Gala 2025 Highlights"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   4A. COUNTDOWN TIMER HOOK
   ══════════════════════════════════════════════════════ */
function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function calculate() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

/* ══════════════════════════════════════════════════════
   4B. MISSION — dark split with 4-colour accents
   ══════════════════════════════════════════════════════ */
const TICKET_FEATURES = [
  { label: "All Access Pass — every event included",      color: EKO_GREEN  },
  { label: "Cultural dinner &amp; drinks reception",       color: EKO_RED    },
  { label: "Networking with Lagosians in the diaspora",   color: EKO_BLUE   },
  { label: "Awards ceremony &amp; live entertainment",    color: EKO_YELLOW },
];

function MissionSection() {
  return (
    <section
      className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#0d1a0f" }}
      aria-labelledby="mission-heading"
    >
      {/* Corner colour bars */}
      {QUAD.map((c, i) => (
        <div
          key={c}
          aria-hidden="true"
          className="pointer-events-none absolute h-1 w-32"
          style={{
            background: c,
            top:    i < 2 ? 0 : undefined,
            bottom: i < 2 ? undefined : 0,
            left:   i % 2 === 0 ? 0 : undefined,
            right:  i % 2 === 0 ? undefined : 0,
          }}
        />
      ))}

      <div className="relative mx-auto max-w-7xl">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Image with colour-border treatment */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <div
              className="rounded-2xl p-0.75"
              style={{ background: `linear-gradient(135deg,${EKO_GREEN} 0%,${EKO_RED} 33%,${EKO_BLUE} 66%,${EKO_YELLOW} 100%)` }}
            >
              <div className="relative overflow-hidden rounded-[14px]" style={{ aspectRatio: "4/3" }}>
                <Image
                  src={GALLERY_ASSETS.mission}
                  alt="Eko Club Philadelphia community members"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-5"
          >
            <div className="flex h-1.5 w-20 overflow-hidden rounded-full">
              {QUAD.map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
            </div>
            <h2
              id="mission-heading"
              className="text-3xl font-black leading-tight text-white sm:text-4xl"
            >
              Registration Tickets<br />
              <span style={{ color: EKO_YELLOW }}>Now Available</span>
            </h2>
            <p className="text-sm leading-relaxed text-white/70">
              Your ticket includes an Annual ECP keepsake, All-Access Pass for every
              event of the evening, premium networking with Lagosians across the
              Delaware Valley, plus a cultural dinner with drinks and live entertainment.
            </p>

            <ul className="space-y-2.5">
              {TICKET_FEATURES.map((f) => (
                <li key={f.label} className="flex items-center gap-3 text-sm text-white/80">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-black"
                    style={{ background: f.color }}
                    aria-hidden="true"
                  >✓</span>
                  <span dangerouslySetInnerHTML={{ __html: f.label }} />
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3 pt-2">
              <MagneticButton
                href="/events"
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-black text-black focus-visible:outline-none"
                style={{ background: EKO_YELLOW }}
              >
                Get Tickets Now
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </MagneticButton>
              <MagneticButton
                href="/about"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3.5 text-sm font-bold text-white focus-visible:outline-none hover:border-white/60"
              >
                About Us
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   4C. COUNTDOWN — 4-colour flip boxes
   ══════════════════════════════════════════════════════ */
function FlipDigit({ value, color }: { value: number; color: string }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div className="relative overflow-hidden" style={{ width: 80, height: 80 }}>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={padded}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: "0%",    opacity: 1 }}
          exit={{   y: "100%",   opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center text-4xl font-black"
          style={{ color: "#fff" }}
        >
          {padded}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CountdownSection() {
  const GALA_DATE = "2026-12-06T18:00:00.000Z";
  const { days, hours, minutes, seconds } = useCountdown(GALA_DATE);

  const units = [
    { value: days,    label: "Days",    color: EKO_GREEN  },
    { value: hours,   label: "Hours",   color: EKO_RED    },
    { value: minutes, label: "Minutes", color: EKO_BLUE   },
    { value: seconds, label: "Seconds", color: EKO_YELLOW },
  ];

  return (
    <section
      className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#08100a" }}
      aria-labelledby="countdown-heading"
    >
      {/* 4-colour top bar */}
      <div className="absolute inset-x-0 top-0 flex h-1" aria-hidden="true">
        {QUAD.map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: EKO_GREEN }}>Counting down to</p>
          <h2
            id="countdown-heading"
            className="text-3xl font-black leading-tight text-white sm:text-5xl"
          >
            ECP’s{" "}
            <span style={{ color: EKO_RED    }}>Annual</span>{" "}
            <span style={{ color: EKO_BLUE   }}>Gala</span>{" "}
            <span style={{ color: EKO_YELLOW }}>&amp; Awards</span>
          </h2>
          <p className="mt-2 text-sm text-white/50">December 6, 2026 · Philadelphia, PA</p>

          <div className="mt-12 flex flex-wrap justify-center gap-4 sm:gap-8">
            {units.map(u => (
              <div key={u.label} className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-2xl shadow-2xl"
                  style={{
                    background: u.color,
                    width: 96, height: 96,
                    boxShadow: `0 0 40px ${u.color}55`,
                  }}
                >
                  <FlipDigit value={u.value} color={u.color} />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white/60">
                  {u.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="absolute inset-x-0 bottom-0 flex h-1" aria-hidden="true">
        {[...QUAD].reverse().map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   6. EVENT TIMELINE
   ══════════════════════════════════════════════════════ */
type TimelineEventItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type: AppEvent["type"];
  status: AppEvent["status"];
  organizerName: string;
  tags: string[];
  imageUrl?: string;
  isOnline: boolean;
};

const TIMELINE_FALLBACK_EVENTS: TimelineEventItem[] = [
  {
    id: "ev-001",
    slug: "adopt-a-highway-2026",
    title: "Adopt-a-Highway Cleanup",
    description:
      "Each spring our members trade weekends for work gloves and roll out along our adopted stretch of highway, clearing litter and restoring the roadside our neighbors drive past every day. It is our most visible act of pride in the place we now call home.",
    date: "2026-05-10T08:00:00.000Z",
    location: "Bucks County, Pennsylvania",
    type: "volunteer",
    status: "published",
    organizerName: "Eko Club Philadelphia",
    tags: ["environment", "volunteer", "community"],
    imageUrl: GALLERY_ASSETS.timeline.volunteer,
    isOnline: false,
  },
  {
    id: "ev-002",
    slug: "scholarship-awards-night-2026",
    title: "Scholarship Awards Night",
    description:
      "We close the academic year by celebrating the scholars among us — outstanding students of Nigerian heritage whose drive deserves a runway. The evening turns a scholarship check into a moment of recognition the whole community shows up for.",
    date: "2026-05-17T18:00:00.000Z",
    location: "Philadelphia, PA",
    type: "meetup",
    status: "published",
    organizerName: "Eko Club Philadelphia",
    tags: ["scholarship", "education", "awards"],
    imageUrl: GALLERY_ASSETS.timeline.meetup,
    isOnline: false,
  },
  {
    id: "ev-003",
    slug: "ronald-mcdonald-house-meals-2026",
    title: "Ronald McDonald House Meals",
    description:
      "Members fill the Ronald McDonald House kitchen with the smell of home-cooked meals for families whose children are receiving medical care. Quiet, hands-on service — comfort offered one plate at a time.",
    date: "2026-06-14T10:00:00.000Z",
    location: "Philadelphia, PA",
    type: "volunteer",
    status: "published",
    organizerName: "Eko Club Philadelphia",
    tags: ["health", "community", "service"],
    imageUrl: GALLERY_ASSETS.timeline.health,
    isOnline: false,
  },
  {
    id: "ev-004",
    slug: "back-to-school-drive-2026",
    title: "Back-to-School Drive",
    description:
      "As summer winds down we pack backpacks with the supplies that let a child walk into the first day of school standing a little taller. Hundreds of students across the Philadelphia area start the year ready and confident.",
    date: "2026-08-15T09:00:00.000Z",
    location: "Philadelphia, PA",
    type: "volunteer",
    status: "published",
    organizerName: "Eko Club Philadelphia",
    tags: ["education", "youth", "community"],
    imageUrl: GALLERY_ASSETS.timeline.workshop,
    isOnline: false,
  },
  {
    id: "ev-005",
    slug: "nigeria-independence-day-parade-2026",
    title: "Nigeria Independence Day Parade",
    description:
      "Green-white-green takes over the street as we march in the Nigeria Independence Day Parade — drums, agbada, gele, and an unmistakable sense of who we are. It is heritage you can hear from a block away.",
    date: "2026-10-03T11:00:00.000Z",
    location: "Philadelphia, PA",
    type: "town-hall",
    status: "published",
    organizerName: "Eko Club Philadelphia",
    tags: ["heritage", "culture", "parade"],
    imageUrl: GALLERY_ASSETS.timeline.townHall,
    isOnline: false,
  },
  {
    id: "ev-006",
    slug: "thanksgiving-turkey-drive-2026",
    title: "Thanksgiving Turkey Drive",
    description:
      "No table should sit empty in November. Members gather and distribute turkeys and trimmings so families across the area enjoy a full Thanksgiving meal — and a reminder that they are not alone.",
    date: "2026-11-21T09:00:00.000Z",
    location: "Philadelphia, PA",
    type: "volunteer",
    status: "published",
    organizerName: "Eko Club Philadelphia",
    tags: ["thanksgiving", "community", "outreach"],
    imageUrl: GALLERY_ASSETS.timeline.seminar,
    isOnline: false,
  },
];

const TIMELINE_TYPE_STYLES: Record<
  AppEvent["type"],
  { label: string; badgeClassName: string; dotClassName: string; fallbackImage: string }
> = {
  "town-hall": {
    label: "Town Hall",
    badgeClassName: "bg-emerald-100 text-emerald-800",
    dotClassName: "bg-emerald-500",
    fallbackImage: GALLERY_ASSETS.timeline.townHall,
  },
  workshop: {
    label: "Workshop",
    badgeClassName: "bg-sky-100 text-sky-800",
    dotClassName: "bg-sky-500",
    fallbackImage: GALLERY_ASSETS.timeline.workshop,
  },
  volunteer: {
    label: "Volunteer",
    badgeClassName: "bg-amber-100 text-amber-800",
    dotClassName: "bg-amber-500",
    fallbackImage: GALLERY_ASSETS.timeline.volunteer,
  },
  meetup: {
    label: "Meetup",
    badgeClassName: "bg-fuchsia-100 text-fuchsia-800",
    dotClassName: "bg-fuchsia-500",
    fallbackImage: GALLERY_ASSETS.timeline.meetup,
  },
  seminar: {
    label: "Seminar",
    badgeClassName: "bg-violet-100 text-violet-800",
    dotClassName: "bg-violet-500",
    fallbackImage: GALLERY_ASSETS.timeline.seminar,
  },
  "press-conference": {
    label: "Press Conference",
    badgeClassName: "bg-rose-100 text-rose-800",
    dotClassName: "bg-rose-500",
    fallbackImage: GALLERY_ASSETS.timeline.pressConference,
  },
  other: {
    label: "Event",
    badgeClassName: "bg-slate-100 text-slate-800",
    dotClassName: "bg-slate-500",
    fallbackImage: GALLERY_ASSETS.timeline.other,
  },
};

const timelineDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timelineShortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function mapEventToTimelineItem(event: AppEvent): TimelineEventItem {
  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.shortDescription ?? event.description,
    date: event.date,
    location: event.location,
    type: event.type,
    status: event.status,
    organizerName: event.organizerName,
    tags: event.tags,
    imageUrl: event.imageUrl,
    isOnline: event.isOnline,
  };
}

function TimelineCard({
  item,
  align,
  currentTime,
}: {
  item: TimelineEventItem;
  align: "left" | "right";
  currentTime: number;
}) {
  const typeMeta = TIMELINE_TYPE_STYLES[item.type] ?? TIMELINE_TYPE_STYLES.other;
  const eventDate = new Date(item.date);
  const isUpcoming = eventDate.getTime() >= currentTime && item.status !== "completed";
  const href = `/events/${item.slug}`;

  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <motion.article
        whileHover={{ y: -6, scale: 1.01 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="relative overflow-visible"
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-10 hidden h-6 w-6 rotate-45 rounded-[6px] border shadow-sm lg:block",
            align === "left" ? "-right-3" : "-left-3"
          )}
          style={{
            borderColor: "rgba(255,255,255,0.7)",
            background: "rgba(255,255,255,0.94)",
          }}
        />

        <div
          className="relative overflow-hidden rounded-[30px] border p-4 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-5"
          style={{
            borderColor: "rgba(255,255,255,0.75)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(248,250,252,0.94) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-80"
            style={{
              background:
                align === "left"
                  ? "linear-gradient(135deg, rgba(16,185,129,0.18), rgba(16,185,129,0))"
                  : "linear-gradient(225deg, rgba(245,158,11,0.18), rgba(245,158,11,0))",
            }}
          />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn("inline-flex h-2.5 w-2.5 rounded-full", typeMeta.dotClassName)}
                  aria-hidden="true"
                />
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    background: "rgba(15,23,42,0.06)",
                    color: "var(--color-neutral-700)",
                  }}
                >
                  {eventDate.getFullYear()} • {timelineShortDateFormatter.format(eventDate)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", typeMeta.badgeClassName)}>
                  {typeMeta.label}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: isUpcoming ? "rgba(16,185,129,0.12)" : "rgba(15,23,42,0.06)",
                    color: isUpcoming ? "rgb(6 95 70)" : "var(--color-neutral-700)",
                  }}
                >
                  {isUpcoming ? "Upcoming" : item.status === "completed" ? "Past Event" : "Featured"}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
              <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                <Image
                  src={item.imageUrl ?? typeMeta.fallbackImage}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <h3
                  className="text-xl font-extrabold leading-tight transition-colors group-hover:text-(--color-green-700)"
                  style={{ color: "var(--color-green-950)" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-neutral-600)" }}>
                  {item.description}
                </p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--color-neutral-500)">
                    When
                  </p>
                  <p className="mt-1 font-semibold text-(--color-neutral-800)">
                    {timelineDateFormatter.format(eventDate)}
                  </p>
                </div>
                <div className="rounded-2xl border px-4 py-3" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--color-neutral-500)">
                    Where
                  </p>
                  <p className="mt-1 font-semibold text-(--color-neutral-800)">
                    {item.isOnline ? "Online Experience" : item.location}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border px-3 py-1 text-xs font-medium"
                    style={{
                      borderColor: "rgba(15,23,42,0.08)",
                      color: "var(--color-neutral-600)",
                      background: "rgba(255,255,255,0.7)",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4" style={{ borderColor: "rgba(15,23,42,0.08)" }}>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-(--color-neutral-500)">
                    Hosted by
                  </p>
                  <p className="mt-1 text-sm font-semibold text-(--color-neutral-800)">
                    {item.organizerName}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-(--color-green-700)">
                  View event details
                  <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}

function EventTimelineSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { events } = useEvents();
  const [currentTime] = useState(() => Date.now());

  const timelineEvents = useMemo(() => {
    const source = events.length > 0
      ? events
          .filter((event) => event.status !== "draft" && event.isPublic)
          .map(mapEventToTimelineItem)
      : TIMELINE_FALLBACK_EVENTS;

    return [...source]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [events]);

  const timelineStats = useMemo(() => {
    const years = new Set(timelineEvents.map((event) => new Date(event.date).getFullYear()));
    const formats = new Set(timelineEvents.map((event) => event.type));
    return [
      { label: "Featured moments", value: String(timelineEvents.length).padStart(2, "0") },
      { label: "Years represented", value: `${years.size}` },
      { label: "Event formats", value: `${formats.size}` },
    ];
  }, [timelineEvents]);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 0.72", "end 0.2"],
  });
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.35,
  });
  const progressOpacity = useTransform(progress, [0, 1], [0.35, 1]);
  const progressGlow = useTransform(
    progress,
    [0, 1],
    ["0 0 0 rgba(16,185,129,0)", "0 0 28px rgba(16,185,129,0.45)"]
  );
  const heroShift = useTransform(progress, [0, 1], [0, -28]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(16,185,129,0.10), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
      }}
      aria-labelledby="event-timeline-heading"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
      </div>

      <motion.div className="relative mx-auto max-w-7xl" style={{ y: heroShift }}>
        <SectionHeader
          eyebrow="Event Timeline"
          heading="A Living Archive of Our Signature"
          headingAccent="Gatherings"
          subheading="A richer homepage story: scroll the timeline to explore key Eko Club Philadelphia events, with a motion-driven progress beam that deepens as the section unfolds."
          align="center"
          withBar
          action={
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition hover:bg-white"
              style={{
                borderColor: "rgba(5, 150, 105, 0.3)",
                color: "var(--color-green-700)",
                background: "rgba(255,255,255,0.75)",
              }}
            >
              View full calendar
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          }
        />

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {timelineStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              className="rounded-3xl border px-5 py-4 shadow-sm backdrop-blur-sm"
              style={{
                borderColor: "rgba(255,255,255,0.8)",
                background: "rgba(255,255,255,0.74)",
              }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--color-neutral-500)">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-(--color-green-900)">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="relative mx-auto mt-16 max-w-6xl">
        <div className="pointer-events-none absolute bottom-0 left-6 top-0 w-px bg-black/10 lg:left-1/2 lg:-ml-px" />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-6 top-0 w-px origin-top bg-linear-to-b from-emerald-300 via-emerald-500 to-emerald-950 lg:left-1/2 lg:-ml-px"
          style={{
            scaleY: progress,
            opacity: progressOpacity,
            boxShadow: progressGlow,
          }}
        />

        <div className="space-y-10 lg:space-y-14">
          {timelineEvents.map((item, index) => {
            const align = index % 2 === 0 ? "left" : "right";

            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.06, ease: "easeOut" }}
              >
                <div className="grid grid-cols-[auto_1fr] gap-5 lg:hidden">
                  <div className="relative flex min-h-full flex-col items-center pt-6">
                    <motion.span
                      whileInView={{ scale: [0.85, 1.08, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                      className="relative z-10 block h-6 w-6 rounded-full border-[6px] border-black bg-white shadow-[0_0_0_10px_rgba(255,255,255,0.6)]"
                    />
                    <span className="mt-3 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-(--color-neutral-600) shadow-sm backdrop-blur-sm">
                      {new Date(item.date).getFullYear()}
                    </span>
                  </div>
                  <TimelineCard item={item} align="left" currentTime={currentTime} />
                </div>

                <div className="hidden items-start gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)]">
                  <div>{align === "left" ? <TimelineCard item={item} align="left" currentTime={currentTime} /> : null}</div>

                  <div className="relative flex flex-col items-center pt-6">
                    <motion.span
                      whileInView={{ scale: [0.8, 1.1, 1] }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="relative z-10 block h-8 w-8 rounded-full border-8 border-black bg-white shadow-[0_0_0_14px_rgba(255,255,255,0.65)]"
                    />
                    <span className="mt-4 rounded-full bg-white/85 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-(--color-neutral-700) shadow-sm backdrop-blur-sm">
                      {new Date(item.date).getFullYear()}
                    </span>
                  </div>

                  <div>{align === "right" ? <TimelineCard item={item} align="right" currentTime={currentTime} /> : null}</div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-14 flex justify-center"
        >
          <Link
            href="/events"
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-(--color-green-800)"
          >
            Explore more events
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   7. STATS STRIP — 4 full-colour cards
   ══════════════════════════════════════════════════════ */
const PLATFORM_STATS = [
  { label: "Active Members",   to: 500, prefix: "",  suffix: "+",  color: EKO_GREEN,  textDark: false },
  { label: "Years of Service", to: 25,  prefix: "",  suffix: "+",  color: EKO_RED,    textDark: false },
  { label: "Events Per Year",  to: 20,  prefix: "",  suffix: "+",  color: EKO_BLUE,   textDark: false },
  { label: "Raised for Lagos", to: 250, prefix: "$", suffix: "K+", color: EKO_YELLOW, textDark: true  },
];

function StatsStrip() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4" aria-label="Platform statistics">
      {PLATFORM_STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-center gap-2 py-14 px-6 text-center"
          style={{ background: stat.color }}
        >
          <span
            className="text-5xl font-black tracking-tight sm:text-6xl"
            style={{ color: stat.textDark ? "#000" : "#fff" }}
          >
            {stat.prefix}<CountUp to={stat.to} suffix={stat.suffix} />
          </span>
          <span
            className="text-xs font-black uppercase tracking-[0.2em]"
            style={{ color: stat.textDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.75)" }}
          >
            {stat.label}
          </span>
        </motion.div>
      ))}
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   9. SPONSORS BAND
   ══════════════════════════════════════════════════════ */
const SPONSORS = [
  { name: "Eko Club International", logo: null },
  { name: "Lagos State Government", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Lagos_State_Government_logo.svg/200px-Lagos_State_Government_logo.svg.png" },
  { name: "NIDO Philadelphia", logo: null },
  { name: "Nigerian Community PA", logo: null },
  { name: "Lagosians in Diaspora", logo: null },
  { name: "Lagos Diaspora Forum", logo: null },
];

/* ══════════════════════════════════════════════════════
   9. SPONSORS BAND — dark with quad-accented cards
   ══════════════════════════════════════════════════════ */
function SponsorsBand() {
  return (
    <section
      className="relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "#07130a" }}
      aria-label="Our partners and sponsors"
    >
      {/* Philadelphia city background */}
      <div className="absolute inset-0">
        <Image
          src={GALLERY_ASSETS.sponsorsBackdrop}
          alt=""
          fill
          className="object-cover object-center opacity-20"
          sizes="100vw"
          aria-hidden="true"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(7,19,10,0.7),rgba(7,19,10,0.92))" }} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12 text-center"
        >
          <div className="mx-auto mb-4 flex w-fit overflow-hidden rounded-full">
            {QUAD.map(c => <div key={c} className="h-1.5 w-10" style={{ background: c }} />)}
          </div>
          <h2 className="text-4xl font-black text-white sm:text-5xl">Past Partners &amp; Sponsors</h2>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[...SPONSORS, ...SPONSORS.slice(0, 6)].slice(0, 12).map((sponsor, i) => (
            <motion.div
              key={`${sponsor.name}-${i}`}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.38, delay: i * 0.045 }}
              whileHover={{ scale: 1.05 }}
              className="relative flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-white px-4 py-4 shadow-md"
            >
              {/* Top colour bar using QUAD */}
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: QUAD[i % 4] }} />
              {sponsor.logo ? (
                <Image src={sponsor.logo} alt={sponsor.name} width={100} height={40} className="h-8 w-auto object-contain" unoptimized />
              ) : (
                <span className="text-center text-xs font-bold leading-tight text-neutral-800">{sponsor.name}</span>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <MagneticButton
            href="/about"
            className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3 text-sm font-bold text-white focus-visible:outline-none hover:bg-white/10"
          >
            Become a Sponsor
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   10. DONATION CALLOUT — split layout
   ══════════════════════════════════════════════════════ */
function DonationCallout() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#060e08" }}
      aria-labelledby="donate-heading"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Image side */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-72 lg:min-h-full"
        >
          <Image
            src={GALLERY_ASSETS.donation}
            alt="Community members at an Eko Club Philadelphia event"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Green gradient border on right edge */}
          <div
            className="absolute inset-y-0 right-0 w-2"
            style={{ background: `linear-gradient(to bottom, ${EKO_GREEN}, ${EKO_BLUE})` }}
          />
        </motion.div>

        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col justify-center gap-6 px-8 py-20 lg:px-16"
        >
          <div className="flex h-1.5 w-24 overflow-hidden rounded-full">
            {QUAD.map(c => <div key={c} className="flex-1" style={{ background: c }} />)}
          </div>
          <h2
            id="donate-heading"
            className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl"
          >
            Your Support<br />
            <span style={{ color: EKO_GREEN }}>Creates Opportunity</span>
          </h2>
          <p className="text-sm leading-relaxed text-white/70">
            As a nonprofit, your donation supports cultural events, scholarship funds,
            community welfare initiatives, and programmes that uplift Lagosians both
            in Philadelphia and in Lagos State.
          </p>
          <p className="text-sm font-bold text-white/90">
            Every contribution helps us build a stronger future together.
          </p>
          <div className="flex flex-wrap gap-3">
            <MagneticButton
              href="/donate"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-black text-black focus-visible:outline-none"
              style={{ background: EKO_GREEN, boxShadow: `0 0 28px ${EKO_GREEN}55` }}
            >
              Donate Now
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </MagneticButton>
            <MagneticButton
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-7 py-4 text-sm font-bold text-white focus-visible:outline-none"
            >
              Learn More
            </MagneticButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   11. NEWSLETTER — animated quad dots
   ══════════════════════════════════════════════════════ */
function NewsletterSignup() {
  const { success, error } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, source: "website" }),
      });
      const json = await res.json();
      if (!res.ok && res.status !== 409) {
        error(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (res.status === 409) {
        error("This email is already subscribed.");
        return;
      }
      setEmail("");
      success("You're subscribed! Welcome to the Eko Club Philadelphia community. 🎉");
    } catch {
      error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8"
      style={{ background: "#f8faf8" }}
      aria-labelledby="newsletter-heading"
    >
      {/* Animated quad background dots */}
      {QUAD.map((c, i) => (
        <motion.div
          key={c}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full opacity-10"
          style={{ background: c, width: 200, height: 200, left: `${5 + i * 24}%`, top: `${-10 + (i % 2) * 60}%` }}
          animate={{ y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 8 + i, repeat: Infinity, ease: "easeInOut", delay: i * 1.5 }}
        />
      ))}
      <div className="relative mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <h2
            id="newsletter-heading"
            className="text-3xl font-black leading-tight sm:text-4xl"
            style={{ color: "#0a1a0b" }}
          >
            <span style={{ color: EKO_GREEN }}>Stay</span>{" "}
            <span style={{ color: EKO_RED   }}>Connected.</span>{" "}
            <span style={{ color: EKO_BLUE  }}>Stay</span>{" "}
            <span style={{ color: EKO_YELLOW }}>Engaged.</span>
          </h2>
          <p className="text-base leading-relaxed text-neutral-500">
            Get the Eko Club Philadelphia newsletter — cultural event updates,
            community news, and Lagos development highlights — delivered straight
            to your inbox. No spam. Unsubscribe anytime.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
            noValidate
            aria-label="Newsletter signup form"
          >
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={submitting}
              className="flex-1 rounded-full border px-4 py-3 text-sm shadow-sm outline-none transition focus:ring-2 disabled:opacity-60"
              style={{
                borderColor: "var(--color-neutral-300)",
                background: "#fff",
                color: "var(--color-neutral-900)",
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow transition hover:opacity-90 focus-visible:outline-none disabled:opacity-60"
              style={{ background: EKO_GREEN }}
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Joining…
                </>
              ) : (
                "Subscribe"
              )}
            </button>
          </form>

          <p className="text-xs" style={{ color: "var(--color-neutral-500)" }}>
            Join hundreds of Eko Club Philadelphia members already subscribed.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   ECI FLAGSHIP BAND — year-aware
   ══════════════════════════════════════════════════════ */
function ECIFlagshipBand() {
  const year = new Date().getFullYear();
  const isMissionYear = year % 2 === 0;

  const event = isMissionYear
    ? {
        icon: "🩺",
        label: `ECI Medical Mission ${year}`,
        tagline: "Biennial flagship · Even years",
        description:
          "Every two years Eko Club International deploys a team of medical professionals to deliver free care, screenings, and supplies to communities in need. ECP rallies volunteers, funds, and momentum behind the mission. Sign-ups open six months before departure.",
        pill: "Medical Mission Year",
        pillCls: "bg-red-100 text-red-700",
        accent: "#dc2626",
        linkLabel: "ECI Medical Mission details →",
        href: "https://ekoclubinternational.org",
      }
    : {
        icon: "🌍",
        label: year === 2027 ? "ECI Biennial Convention — London 2027" : `ECI Biennial Convention ${year}`,
        tagline: "Biennial flagship · Odd years",
        description:
          "Every two years the worldwide family of Eko Club International convenes for business, culture, and reunion. ECP delegates join members from chapters across the globe to represent Philadelphia at the highest level of the organisation.",
        pill: "Convention Year",
        pillCls: "bg-indigo-100 text-indigo-700",
        accent: "#4338ca",
        linkLabel: "ECI Convention details →",
        href: "https://ekoclubinternational.org",
      };

  return (
    <section className="py-10 px-4 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border bg-white shadow-sm overflow-hidden flex flex-col sm:flex-row items-stretch"
          style={{ borderColor: `${event.accent}33` }}
        >
          {/* Color stripe */}
          <div className="w-full sm:w-1.5 h-1.5 sm:h-auto flex-shrink-0" style={{ background: event.accent }} />

          <div className="flex-1 p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-5">
            {/* Icon */}
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ background: `${event.accent}14` }}
            >
              {event.icon}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${event.pillCls}`}>
                  {event.pill}
                </span>
                <span className="text-xs text-neutral-400 font-medium">{event.tagline}</span>
              </div>
              <h3 className="text-lg font-extrabold text-neutral-900 mb-2">{event.label}</h3>
              <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl">{event.description}</p>
              <a
                href={event.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-sm font-bold hover:underline transition-colors"
                style={{ color: event.accent }}
              >
                {event.linkLabel}
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   ROOT EXPORT
   ══════════════════════════════════════════════════════ */
export default function HomePageClient() {
  return (
    <>
      {/* 1. Announcement bar */}
      <AnnouncementBar />

      {/* 2. Full-bleed hero */}
      <HeroSection />

      {/* 2b. ECI flagship event band */}
      <ECIFlagshipBand />

      {/* 3. Highlights / video section */}
      <HighlightsSection />

      {/* 4. Countdown timer */}
      <CountdownSection />

      {/* 5. Registration / ticket split */}
      <MissionSection />

      {/* 6. Stats strip — 4-colour cards */}
      <StatsStrip />

      {/* 7. Event timeline — untouched */}
      <EventTimelineSection />

      {/* 9. Partners & sponsors on city background */}
      <SponsorsBand />

      {/* 10. Donation callout */}
      <DonationCallout />

      {/* 11. Newsletter */}
      <NewsletterSignup />
    </>
  );
}
