"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useIntroDone } from "@/components/layout/HomeIntro";
import type { Event as AppEvent } from "@/lib/models/event";

import { useEvents } from "@/context/EventsContext";
import { cn } from "@/utils/cn";

/* ══════════════════════════════════════════════════════
   BRAND
   ══════════════════════════════════════════════════════ */
const EKO_GREEN  = "#059669";
const EKO_RED    = "#dc2626";
const EKO_BLUE   = "#2563eb";
const EKO_YELLOW = "#d97706";
const QUAD = [EKO_GREEN, EKO_RED, EKO_BLUE, EKO_YELLOW];
/* Deep green used to blend the hero's bottom edge into the section below it
   (same "photo fades into a flat brand colour" technique as the reference,
   just in green instead of navy). */
const DEEP_GREEN = "#0c3b28";

const GALLERY = {
  hero:     "/gallery/hero-bgs/national-theatre_standard.jpg",
  eciLeft:  "/gallery/hero-bgs/lagos-island.jpg",
  eciRight: "/gallery/hero-bgs/eyo-2025.jpg",
  timeline: {
    volunteer:       "/gallery/eko/eko-1.jpeg",
    meetup:          "/gallery/eko/eko-2.jpeg",
    health:          "/gallery/eko/eko-3.jpeg",
    workshop:        "/gallery/eko/eko-4.jpeg",
    townHall:        "/gallery/eko/eko-5.jpeg",
    seminar:         "/gallery/eko/eko-6.jpeg",
    pressConference: "/gallery/eko/eko-1.jpeg",
    other:           "/gallery/eko/eko-2.jpeg",
  },
} as const;

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
function MagneticButton({
  children, className, href, style, onClick,
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
  if (href) return (
    <motion.a href={href} className={className} style={{ ...style, x, y }}
      onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }}>
      {children}
    </motion.a>
  );
  return (
    <motion.button className={className} style={{ ...style, x, y }}
      onMouseMove={onMove} onMouseLeave={onLeave} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.97 }} onClick={onClick}>
      {children}
    </motion.button>
  );
}

function CountUp({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const dur = 1400;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - t, 3)) * to));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

/* ══════════════════════════════════════════════════════
   2. HERO — cinematic Lagos backdrop · Ken Burns · parallax
   ══════════════════════════════════════════════════════ */
function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const introDone = useIntroDone();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // Ken Burns: slow infinite scale on the image
      gsap.to(imageRef.current, {
        scale: 1.07,
        duration: 8,
        ease: "none",
        yoyo: true,
        repeat: -1,
      });

      // Parallax: content drifts up slightly as user scrolls
      gsap.to(contentRef.current, {
        yPercent: -15,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[calc(90vh_+_20px)] min-h-[600px] overflow-hidden bg-[#0a0a0a] flex items-end"
      aria-label="Eko Club Philadelphia hero"
    >
      {/* Background image with Ken Burns */}
      <div
        ref={imageRef}
        className="absolute inset-0 will-change-transform"
        style={{ transformOrigin: "center center" }}
      >
        <Image
          src={GALLERY.hero}
          alt="Lagos Island skyline over Five Cowrie Creek, Nigeria"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Solid overlay */}
      <div className="absolute inset-0 bg-[#0a0a0a]/62" />

      {/* Bottom blend — fades the photo into the deep green of the section
          below so the two sections read as one continuous surface, no seam. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{ background: `linear-gradient(to bottom, transparent 0%, ${DEEP_GREEN} 100%)` }}
        aria-hidden="true"
      />

      {/* Content — anchored bottom-left */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-6  pb-8 sm:px-10 sm:pb-10 lg:px-16 lg:pb-12"
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/55 mb-4 sm:text-xs sm:tracking-[0.2em] sm:mb-5"
        >
          Eko Club Philadelphia · A Chapter of Eko Club International
        </motion.p>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl leading-[1.1] sm:text-5xl sm:leading-[1.08] lg:text-6xl lg:leading-[1.05] font-medium tracking-tight text-white max-w-3xl"
        >
          Heritage, community,{" "}
          <span style={{ color: "#059669" }}>and service</span>{" "}
          in Philadelphia.
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.75, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-sm sm:mt-6 sm:text-base lg:text-lg text-white/65 max-w-xl leading-relaxed font-normal"
        >
          Bringing the pride of Lagos to the heart of Philadelphia
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap"
        >
          <Link
            href="/events"
            className="inline-flex w-full items-center justify-center gap-2 bg-white text-[#0a0a0a] text-sm font-semibold px-6 py-3 sm:w-auto sm:px-7 sm:py-3.5 rounded-full hover:bg-white/90 transition-colors"
          >
            Upcoming events
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/donate"
            className="inline-flex w-full items-center justify-center gap-2 bg-[#059669] text-white text-sm font-semibold px-6 py-3 sm:w-auto sm:px-7 sm:py-3.5 rounded-full hover:bg-[#047857] transition-colors"
          >
            Donate
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={introDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        aria-hidden="true"
      >
        <span className="text-[10px] font-medium uppercase tracking-widest text-white/35">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-white/20"
        />
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   3. ECI INTRO + MEDICAL MISSION — blends out of the hero,
      deep-green section: centred org intro, then a two-image
      editorial block for the flagship mission/convention,
      with the impact stats folded into it.
   ══════════════════════════════════════════════════════ */
function EciIntroSection() {
  const year = new Date().getFullYear();
  const isMissionYear = year % 2 === 0;
  const introRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const { events } = useEvents();

  const pastCount = useMemo(() => {
    const now = new Date();
    return events.filter(e =>
      (e.status === "published" || e.status === "completed") &&
      new Date(e.date) < now
    ).length;
  }, [events]);

  const totalEvents = 40 + pastCount;
  const stats = [
    { value: totalEvents, suffix: "+",  label: "Events delivered" },
    { value: 9,           suffix: "",   label: "Annual programs" },
    { value: 2,           suffix: "mi", label: "Highway adopted" },
    { value: 5,           suffix: "",   label: "College scholarships" },
  ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(introRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: introRef.current, start: "top 85%" } }
      );
      gsap.fromTo(missionRef.current,
        { opacity: 0, y: 32 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: missionRef.current, start: "top 85%" } }
      );
      gsap.fromTo(
        missionRef.current?.querySelectorAll(".stat-item") ?? [],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out",
          scrollTrigger: { trigger: missionRef.current, start: "top 70%" } }
      );
    });
    return () => ctx.revert();
  }, []);

  const accent  = isMissionYear ? EKO_RED : EKO_BLUE;
  const label   = isMissionYear
    ? `ECI Medical Mission ${year}`
    : year === 2027 ? "ECI Biennial Convention — London 2027"
    : `ECI Biennial Convention ${year}`;
  const pill    = isMissionYear ? "Mission year" : "Convention year";
  const copy    = isMissionYear
    ? "Eko Club International's flagship medical outreach. ECP rallies volunteers, supplies, and momentum behind the mission — the headline event of this year's calendar."
    : "The worldwide family of Eko Club gathers for the biennial convention — business, culture, and reunion. ECP joins delegates from across the globe to represent Philadelphia.";

  return (
    <section style={{ backgroundColor: DEEP_GREEN }} className="w-full pt-4 pb-24 px-6 sm:px-10 sm:pb-28 lg:px-16 lg:pb-32">
      {/* ── Part A: Eko Club International intro ── */}
      <div ref={introRef} className="max-w-3xl mx-auto text-center mb-20 sm:mb-24 lg:mb-28">
        <div className="inline-flex items-center gap-3 mb-5">
          <span className="h-px w-8 bg-white/30" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white/60">
            A Global Network, Rooted in Lagos
          </span>
          <span className="h-px w-8 bg-white/30" aria-hidden="true" />
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.1]">
          Eko Club Philadelphia
        </h2>
        <p className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-xl mx-auto">
          Eko Club Philadelphia is one chapter within a worldwide family of Eko
          Clubs,uniting Lagosians across the diaspora in service, culture,
          and lasting community.
        </p>
      </div>

      {/* ── Part B: Medical Mission / Convention — two-image editorial ── */}
      <div ref={missionRef} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: two overlapping images */}
        <div className="relative h-[340px] sm:h-[420px] lg:h-[480px]">
          <div className="absolute left-0 top-0 h-[78%] w-[80%] overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={GALLERY.eciLeft}
              alt="Lagos Island skyline, Nigeria"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 80vw, 40vw"
            />
          </div>
          <div className="absolute bottom-0 right-0 h-[46%] w-[52%] overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={GALLERY.eciRight}
              alt="Eyo festival, Lagos"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 52vw, 26vw"
            />
          </div>
        </div>

        {/* Right: mission text + stats */}
        <div>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-8" style={{ background: accent }} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: accent }}>
              {pill}
            </span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-normal text-white leading-tight mb-5">
            {label}
          </h3>
          <p className="text-white/80 leading-relaxed max-w-lg mb-8">
            {copy}
          </p>
          <a
            href="https://ekoclubinternational.org" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold border rounded-full px-5 py-2.5 transition-colors hover:bg-white/10"
            style={{ color: accent, borderColor: `${accent}50` }}
          >
            Learn more
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Impact stats */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-8 pt-8 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.label} className="stat-item">
                <div className="text-3xl sm:text-4xl font-normal text-white tracking-tight tabular-nums">
                  <CountUp to={s.value} suffix={s.suffix} />
                </div>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   4. WHAT WE DO — 4 editorial tiles
   ══════════════════════════════════════════════════════ */
const WHAT_WE_DO = [
  {
    color: "#059669",
    title: "Programs",
    description: "Nine recurring community programs every year — highway cleanups, scholarship nights, medical missions, and more.",
    href: "/programs",
    label: "View programs",
    image: "/gallery/eko/eko-1.jpeg",
  },
  {
    color: "#dc2626",
    title: "Committees",
    description: "Join the people behind the programs. Our committees are how the work gets done and how members find their place.",
    href: "/member/committees",
    label: "Browse committees",
    image: "/gallery/eko/eko-2.jpeg",
  },
  {
    color: "#2563eb",
    title: "Events",
    description: "Cultural galas, volunteer drives, town halls, and community gatherings — one authoritative calendar.",
    href: "/events",
    label: "See all events",
    image: "/gallery/eko/eko-3.jpeg",
  },
  {
    color: "#d97706",
    title: "Donate",
    description: "Every dollar funds programs, scholarships, and outreach. Give once or set up monthly support.",
    href: "/donate",
    label: "Make a gift",
    image: "/gallery/eko/eko-4.jpeg",
  },
] as const;

/* Auto-advance dwell time per tab, in ms. The underline's fill animation
   duration is derived from this same constant so the two stay in sync. */
const TAB_DURATION_MS = 5000;

/* How long the "push" cover-transition itself takes. Deliberately separate
   from TAB_DURATION_MS (the auto-advance dwell time) — this only governs how
   slowly the new card slides down over the old one. */
const PUSH_DURATION_S = 0.85;

/* One carousel card's visual content (image + legibility overlay + text).
   Shared by both the static outgoing layer and the animated incoming layer
   so the two stay pixel-identical. */
function CarouselCardFace({ item }: { item: (typeof WHAT_WE_DO)[number] }) {
  return (
    <>
      <Image
        src={item.image}
        alt={item.title}
        fill
        className="object-cover"
        sizes="(max-width: 1024px) 100vw, 60vw"
      />

      {/* Overlay: transparent at the vertical midpoint, pitch black by the
          bottom edge — the text and CTA below sit inside it. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent 50%, #000000 100%)" }}
        aria-hidden="true"
      />

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
          {item.title}
        </h3>
        <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-md mb-5">
          {item.description}
        </p>
        <Link
          href={item.href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-[#059669] transition-colors"
        >
          {item.label}
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </>
  );
}

function WhatWeDoSection() {
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  /* PowerPoint-style "Push from top": the incoming card slides straight down
     over the outgoing one. The outgoing card does NOT animate or fade at
     all — it just sits there, fully visible, until the incoming card has
     slid all the way down and physically covers it. `prevIndex` is that
     static, un-animated bottom layer; it's cleared once the push finishes.

     This is deliberately set during render (React's sanctioned pattern for
     "adjusting state when a value changes"), NOT inside a useEffect. An
     effect only runs after the browser has already painted the new `active`
     value, and the incoming card's `key` changes the instant `active` does
     — so for one painted frame the outgoing card would already be unmounted
     while `prevIndex` was still unset behind it, showing a blink of empty
     background. Setting it synchronously during render lets React redo the
     render before anything paints, so that frame never happens. */
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [lastActive, setLastActive] = useState(active);
  if (active !== lastActive) {
    setPrevIndex(lastActive);
    setLastActive(active);
  }

  /* Auto-advance — stops permanently once the user manually picks a tab. */
  useEffect(() => {
    if (!autoPlay) return;
    const t = setTimeout(() => {
      setActive((a) => (a + 1) % WHAT_WE_DO.length);
    }, TAB_DURATION_MS);
    return () => clearTimeout(t);
  }, [active, autoPlay]);

  function selectTab(i: number) {
    setAutoPlay(false);
    setActive(i);
  }

  const current = WHAT_WE_DO[active];
  const previous = prevIndex !== null ? WHAT_WE_DO[prevIndex] : null;

  return (
    <section
      className="pt-24 pb-24 px-6 sm:px-10 sm:pt-28 sm:pb-28 lg:px-16 lg:pt-32 lg:pb-32"
      style={{ background: `linear-gradient(to bottom, ${DEEP_GREEN} 0%, #000000 38%)` }}
      aria-labelledby="what-we-do-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:items-center">
          {/* ── Left: intro ── */}
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-white/30" aria-hidden="true" />
              <span className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white/90">What We Do</span>
              <span className="h-px w-8 bg-white/30" aria-hidden="true" />
            </div>
            <h2 id="what-we-do-heading" className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.05] tracking-tight">
              Four pillars.<br />One community.
            </h2>
            <p className="mt-6 text-base text-white/90 leading-relaxed max-w-md">
              Every step, done right. From programs to donations, 
              structured, transparent, and built to serve.
            </p>
          </div>

          {/* ── Right: tab menu + carousel card ── */}
          <div>
            {/* Tab menu */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-8">
              {WHAT_WE_DO.map((item, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => selectTab(i)}
                    className="group flex flex-col gap-3 pb-3 focus-visible:outline-none"
                  >
                    <span
                      className={cn(
                        "text-sm sm:text-base font-medium transition-colors duration-300",
                        isActive ? "text-white" : "text-white/40 group-hover:text-white/70"
                      )}
                    >
                      {item.title}
                    </span>
                    {/* Underline track + animated fill */}
                    <span className="relative block h-0.5 w-full min-w-16 rounded-full bg-white/15 overflow-hidden">
                      {isActive && (
                        <motion.span
                          key={autoPlay ? `auto-${active}` : `manual-${active}`}
                          className="absolute inset-y-0 left-0 rounded-full bg-[#059669]"
                          initial={{ width: autoPlay ? "0%" : "100%" }}
                          animate={{ width: "100%" }}
                          transition={
                            autoPlay
                              ? { duration: TAB_DURATION_MS / 1000, ease: "linear" }
                              : { duration: 0 }
                          }
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Carousel card — PowerPoint-style "Push from top": the new
                card slides straight down and covers the old one, which sits
                completely still underneath until fully covered. */}
            <div className="relative mt-8 rounded-[2rem] border-2 border-green-200 bg-black/40 p-2 sm:mt-10">
              <div className="relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-[1.5rem]">
                {/* Static bottom layer — the outgoing card, no animation at all */}
                {previous && (
                  <div className="absolute inset-0 z-0">
                    <CarouselCardFace item={previous} />
                  </div>
                )}

                {/* Incoming card — pushes down from above, covering the old one */}
                <motion.div
                  key={current.title}
                  initial={{ y: "-100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: PUSH_DURATION_S, ease: [0.65, 0, 0.35, 1] }}
                  onAnimationComplete={() => setPrevIndex(null)}
                  className="absolute inset-0 z-10"
                >
                  <CarouselCardFace item={current} />
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   4. EVENT TIMELINE — capped at 4
   ══════════════════════════════════════════════════════ */
type TItem = {
  id: string; slug: string; title: string; description: string;
  date: string; location: string; type: AppEvent["type"]; status: AppEvent["status"];
  organizerName: string; tags: string[]; imageUrl?: string; isOnline: boolean;
};

/* Module-level (not component-instance-level) cache of the first non-empty
   `events` list this page load ever sees. See the long comment inside
   EventTimelineSection for why this exists and why a component-scoped ref
   wasn't enough. Module scope survives even a full remount of the
   component, unlike a ref or state living inside it. */
let cachedTimelineEvents: AppEvent[] | null = null;

const FALLBACK_EVENTS: TItem[] = [
  { id: "ev-001", slug: "adopt-a-highway-2026", title: "Adopt-a-Highway Cleanup",
    description: "Members trade weekends for work gloves and clear litter along our adopted stretch of highway — the most visible act of pride in the place we call home.",
    date: "2026-05-10T08:00:00.000Z", location: "Bucks County, Pennsylvania",
    type: "volunteer", status: "published", organizerName: "Eko Club Philadelphia",
    tags: ["environment", "volunteer"], imageUrl: GALLERY.timeline.volunteer, isOnline: false },
  { id: "ev-002", slug: "scholarship-awards-night-2026", title: "Scholarship Awards Night",
    description: "Celebrating outstanding students of Nigerian heritage. The evening turns a scholarship into a moment of recognition the whole community shows up for.",
    date: "2026-05-17T18:00:00.000Z", location: "Philadelphia, PA",
    type: "meetup", status: "published", organizerName: "Eko Club Philadelphia",
    tags: ["scholarship", "education"], imageUrl: GALLERY.timeline.meetup, isOnline: false },
  { id: "ev-003", slug: "ronald-mcdonald-house-meals-2026", title: "Ronald McDonald House Meals",
    description: "Members fill the Ronald McDonald House kitchen with home-cooked meals for families whose children are receiving medical care.",
    date: "2026-06-14T10:00:00.000Z", location: "Philadelphia, PA",
    type: "volunteer", status: "published", organizerName: "Eko Club Philadelphia",
    tags: ["health", "community"], imageUrl: GALLERY.timeline.health, isOnline: false },
  { id: "ev-004", slug: "back-to-school-drive-2026", title: "Back-to-School Drive",
    description: "Hundreds of students across Philadelphia start the year ready and confident as members pack backpacks full of the supplies they need.",
    date: "2026-08-15T09:00:00.000Z", location: "Philadelphia, PA",
    type: "volunteer", status: "published", organizerName: "Eko Club Philadelphia",
    tags: ["education", "youth"], imageUrl: GALLERY.timeline.workshop, isOnline: false },
];

const T_STYLES: Record<AppEvent["type"], { label: string; color: string; img: string }> = {
  "town-hall":        { label: "Town Hall",        color: "#059669", img: GALLERY.timeline.townHall },
  workshop:           { label: "Workshop",         color: "#2563eb", img: GALLERY.timeline.workshop },
  volunteer:          { label: "Volunteer",        color: "#d97706", img: GALLERY.timeline.volunteer },
  meetup:             { label: "Meetup",           color: "#dc2626", img: GALLERY.timeline.meetup },
  seminar:            { label: "Seminar",          color: "#7c3aed", img: GALLERY.timeline.seminar },
  "press-conference": { label: "Press Conference", color: "#e11d48", img: GALLERY.timeline.pressConference },
  other:              { label: "Event",            color: "#64748b", img: GALLERY.timeline.other },
};

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" });

/* Event-timeline accordion auto-advance interval. */
const AUTO_ADVANCE_MS = 10000;

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function StarIcon({ className, color }: { className?: string; color: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill={color} aria-hidden="true">
      <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.08.99 5.77L10 14.7l-5.18 2.74.99-5.77-4.19-4.08 5.79-.84z" />
    </svg>
  );
}

/* Ring geometry for PlusMinusIndicator's countdown sweep — box is 32px
   (h-8 w-8), 1px stroke centered on the edge to match the plain border used
   on inactive items. Keep RING_CIRCUMFERENCE's literal copy in
   app/globals.css (`clockwipe-dash` keyframes) in sync if this changes. */
const RING_SIZE = 32;
const RING_STROKE = 1;
const RING_RADIUS = RING_SIZE / 2 - RING_STROKE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/* Plus that morphs into a minus: the vertical stroke scales away on activation,
   leaving just the horizontal one. Small, thin-bordered circle — no giant icon.
   While active, the border starts gray and sweeps to solid black clockwise
   over AUTO_ADVANCE_MS (must match that constant), drawn via an SVG ring
   animating stroke-dashoffset — the standard, broadly-supported technique
   for a circular countdown (a conic-gradient + @property custom-property
   version was tried first and turned out not to animate reliably across
   browsers). Inactive items keep the plain solid-black border. */
function PlusMinusIndicator({ active }: { active: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <span
      className={cn(
        "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        active ? "" : "border border-[#0a0a0a]"
      )}
      aria-hidden="true"
    >
      {active && (
        <svg className="absolute inset-0 -rotate-90" viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            fill="none" stroke="#d4d4d4" strokeWidth={RING_STROKE}
          />
          <circle
            cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS}
            fill="none" stroke="#0a0a0a" strokeWidth={RING_STROKE}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={reduceMotion ? 0 : RING_CIRCUMFERENCE}
            className={reduceMotion ? "" : "[animation:clockwipe-dash_10s_linear_forwards]"}
          />
        </svg>
      )}
      <span className="absolute h-px w-3 bg-[#0a0a0a]" />
      <motion.span
        className="absolute h-3 w-px bg-[#0a0a0a]"
        animate={{ scaleY: active ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.65, 0, 0.35, 1] }}
      />
    </span>
  );
}

/* One row of the left accordion. The expand region (description, date,
   location, CTA) is shared by mobile + desktop; the event photo inside it
   is mobile-only, since desktop shows the photo in the visual panel instead. */
function EventAccordionItem({
  item, isActive, onSelect, buttonId, panelId,
}: {
  item: TItem;
  isActive: boolean;
  onSelect: () => void;
  buttonId: string;
  panelId: string;
}) {
  const meta = T_STYLES[item.type] ?? T_STYLES.other;
  const reduceMotion = useReducedMotion();

  /* max-height transition to a generous fixed cap, derived directly from
     `isActive` at render time — deliberately NOT the grid-template-rows
     0fr/1fr trick (this environment's browser engine doesn't animate `fr`
     interpolation on an intrinsic-sized track — it jumps straight to full
     content size), NOT Framer Motion's AnimatePresence exit (its exit
     animations on this page reliably started but never resolved, leaving
     every previously active item stuck open), and NOT a ref-measured
     scrollHeight held in its own `useState` (that extra state layer could
     itself fall a render behind `isActive` and briefly show the wrong
     item expanded). A value computed fresh from a prop every render can't
     desync from that prop. The one tradeoff: the transition timing is
     calibrated for the cap, not the actual content height, so shorter
     panels finish growing a little before the full transition duration
     elapses — an acceptable easing quirk for guaranteed correctness. */
  return (
    <div
      className={cn(
        "rounded-2xl bg-white px-6 transition-shadow duration-300 sm:px-7",
        isActive ? "shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : ""
      )}
    >
      <button
        id={buttonId}
        type="button"
        onClick={onSelect}
        aria-expanded={isActive}
        aria-controls={panelId}
        className="group flex w-full items-center justify-between gap-6 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-inset sm:py-7"
      >
        <span className="min-w-0">
          <span className="block text-lg sm:text-xl font-semibold leading-snug text-[#0a0a0a]">
            {item.title}
          </span>
        </span>
        <PlusMinusIndicator active={isActive} />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className="overflow-hidden transition-[max-height] ease-[cubic-bezier(0.65,0,0.35,1)]"
        style={{ maxHeight: isActive ? 480 : 0, transitionDuration: reduceMotion ? "0s" : "0.4s" }}
      >
        <div
          className="pb-7 transition-opacity ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{
            opacity: isActive ? 1 : 0,
            transitionDuration: reduceMotion ? "0s" : "0.3s",
          }}
        >
          <div className="flex flex-wrap items-start gap-x-5 gap-y-4">
            {/* Thumbnail — also the mobile route to the full event page,
                since the desktop visual panel (which carries the "View
                details" CTA) is hidden on mobile. */}
            <Link
              href={`/events/${item.slug}`}
              className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
            >
              <Image
                src={item.imageUrl ?? meta.img}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            </Link>
            <div className="min-w-[10rem]">
              <p className="text-sm font-semibold text-[#0a0a0a]">{meta.label}</p>
              <div className="mt-1.5 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} className="h-3.5 w-3.5" color={meta.color} />
                ))}
              </div>
            </div>
            <p className="max-w-sm flex-1 text-sm leading-relaxed text-neutral-600">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Title that reveals one character at a time — each letter its own span,
   staggered via transition-delay off the shared `visible` flag (the same
   flag driving the rest of the panel's crossfade), so it replays cleanly on
   every item change, manual or auto-advance, without needing a library.
   Words are grouped in their own inline-block wrapper so line-wrapping
   still breaks between words, not mid-word. Screen readers get the plain
   text via aria-label; the animated spans are hidden from them since
   splitting a string into single-character nodes reads badly aloud. */
function AnimatedTitle({
  text, visible, reduceMotion, className,
}: {
  text: string; visible: boolean; reduceMotion: boolean; className: string;
}) {
  const words = text.split(" ");
  let charIndex = -1;
  return (
    <h3 className={className} aria-label={text}>
      <span aria-hidden="true">
        {words.map((word, wi) => (
          <span key={wi} className="inline-block">
            {word.split("").map((char, ci) => {
              charIndex++;
              const delay = charIndex * 18;
              return (
                <span
                  key={ci}
                  className="inline-block transition-[opacity,transform] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(14px)",
                    transitionDuration: reduceMotion ? "0ms" : "420ms",
                    transitionDelay: reduceMotion ? "0ms" : `${delay}ms`,
                  }}
                >
                  {char}
                </span>
              );
            })}
            {wi < words.length - 1 ? " " : ""}
          </span>
        ))}
      </span>
    </h3>
  );
}

/* Right-hand visual panel — desktop only. Background stays a constant brand
   green regardless of which event is active (per-event colour lives only in
   the small accent details, not the whole panel); the photo underneath is
   tinted with a solid overlay, no gradients. */
function EventVisualPanel({ item }: { item: TItem }) {
  const reduceMotion = useReducedMotion();

  /* Plain CSS opacity cross-fade, driven by React state rather than Framer
     Motion's AnimatePresence exit/enter lifecycle. On this page, Framer
     Motion exit animations were observed (via computed-style inspection in
     a clean production build) to reliably start but never resolve, leaving
     content permanently stuck at its initial/exit values — invisible text,
     accordion panels that never collapsed. A CSS transition has no
     "did it complete" callback to get stuck waiting on: the browser drives
     it directly, so the new item is guaranteed to reach full opacity. */
  const [displayItem, setDisplayItem] = useState(item);
  const [visible, setVisible] = useState(true);
  const fadeMs = reduceMotion ? 0 : 700;

  useEffect(() => {
    if (item.id === displayItem.id) return;
    setVisible(false);
    const t = setTimeout(() => {
      setDisplayItem(item);
      setVisible(true);
    }, fadeMs);
    return () => clearTimeout(t);
  }, [item, displayItem.id, fadeMs]);

  const meta = T_STYLES[displayItem.type] ?? T_STYLES.other;

  return (
    <div
      className="relative hidden overflow-hidden rounded-[28px] lg:block"
      style={{ backgroundColor: EKO_GREEN, minHeight: 560 }}
    >
      <div
        className="absolute inset-0 transition-opacity ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ opacity: visible ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
      >
        <Image
          src={displayItem.imageUrl ?? meta.img}
          alt=""
          fill
          className="object-cover"
          sizes="50vw"
        />
      </div>

      {/* Overlay: transparent at the vertical midpoint, pitch black by the
          bottom edge — every text element and button sits inside it. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, transparent 50%, #000000 100%)" }}
        aria-hidden="true"
      />

      <div
        className="relative z-10 flex h-full flex-col justify-end gap-4 p-8 sm:p-10 lg:p-12"
        style={{ minHeight: 560 }}
      >
        {/* Title block. The heading animates itself, letter by letter (see
            AnimatedTitle) — it deliberately has no transform of its own
            here, since layering a block-level slide on top of a
            per-character reveal would fight the same motion twice. The
            label and description get a simple fade, timed so the sequence
            reads label → title (revealing) → description. */}
        <div>
          <span
            className="inline-flex items-center gap-2 transition-opacity ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ opacity: visible ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">{meta.label}</span>
          </span>
          <AnimatedTitle
            text={displayItem.title}
            visible={visible}
            reduceMotion={!!reduceMotion}
            className="mt-4 max-w-md text-2xl font-semibold leading-tight text-white sm:text-3xl"
          />
          <p
            className="mt-4 max-w-sm text-sm leading-relaxed text-white sm:text-base transition-[opacity,transform] ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transitionDuration: `${fadeMs}ms`,
              transitionDelay: visible && !reduceMotion ? "550ms" : "0ms",
            }}
          >
            {displayItem.description}
          </p>
        </div>

        {/* Metadata + CTA block — enters sliding up from the bottom,
            slightly after the title so the two feel sequenced rather than
            simultaneous. */}
        <div
          className="flex flex-wrap items-center gap-2 transition-[opacity,transform] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(32px)",
            transitionDuration: `${fadeMs}ms`,
            transitionDelay: visible && !reduceMotion ? "150ms" : "0ms",
          }}
        >
          <span className="rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-medium text-white/90">
            {dateFmt.format(new Date(displayItem.date))}
          </span>
          <span className="rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-medium text-white/90">
            {displayItem.isOnline ? "Online" : displayItem.location}
          </span>
          <Link
            href={`/events/${displayItem.slug}`}
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[11px] font-semibold transition-transform hover:scale-[1.03]"
            style={{ color: EKO_GREEN }}
          >
            View details
            <ArrowIcon className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EventTimelineSection() {
  const { events } = useEvents();

  /* `events` from the context genuinely oscillates between two DIFFERENT
     non-empty datasets across renders on a single, static page load with no
     user interaction (confirmed with console diagnostics printed inside
     both this component and the child consuming its output — parent and
     child always agreed with each other on every render, so this is not a
     prop-passing or rendering bug; the raw context value itself is
     unstable). Re-adopting "the latest non-empty value" doesn't help, since
     both alternating datasets are non-empty — it just mirrors the
     oscillation one render late. Instead we lock onto the FIRST non-empty
     dataset we ever see and never update again, which is the right
     trade-off for a homepage showcase section that doesn't need to react
     live to further changes. This is a defensive stabilization in this
     component only — the upstream oscillation itself lives in
     EventsContext, which is out of scope here and worth its own
     investigation. */
  if (cachedTimelineEvents === null && events.length > 0) {
    cachedTimelineEvents = events;
  }
  const effectiveEvents = cachedTimelineEvents ?? events;

  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo(() => {
    const src = effectiveEvents.length > 0
      ? effectiveEvents.filter(e => e.status !== "draft" && e.isPublic).map(e => ({
          id: e.id, slug: e.slug, title: e.title,
          description: e.shortDescription ?? e.description,
          date: e.date, location: e.location, type: e.type, status: e.status,
          organizerName: e.organizerName, tags: e.tags, imageUrl: e.imageUrl, isOnline: e.isOnline,
        }))
      : FALLBACK_EVENTS;
    return [...src].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  }, [effectiveEvents]);

  const safeIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));
  const activeItem = items[safeIndex];

  /* Auto-advance, infinitely — restarts on every change of safeIndex,
     whether that change came from this timer or from a manual click, so
     the countdown always tracks "time left on whichever item is active
     right now." Runs forever; unlike the What-We-Do carousel, manual
     interaction does not disable it. */
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (reduceMotion || items.length <= 1) return;
    const t = setTimeout(() => {
      setActiveIndex(safeIndex + 1 >= items.length ? 0 : safeIndex + 1);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [safeIndex, items.length, reduceMotion]);

  return (
    <section className="bg-[#f7f7f5] py-24 px-4 sm:px-6 lg:px-8" aria-labelledby="timeline-heading">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800 mb-3">Event timeline</p>
          <h2 id="timeline-heading" className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0a0a0a] leading-[1.08]">
            A Living Archive of Our Signature{" "}
            <span style={{ color: EKO_GREEN }}>Gatherings</span>
          </h2>
        </div>

        {/* Split accordion + visual panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch lg:gap-5">
          <div className="flex flex-col gap-3">
            {items.map((item, i) => (
              <EventAccordionItem
                key={item.id}
                item={item}
                isActive={i === safeIndex}
                buttonId={`timeline-tab-${item.id}`}
                panelId={`timeline-panel-${item.id}`}
                onSelect={() => setActiveIndex(i)}
              />
            ))}
          </div>

          {activeItem && <EventVisualPanel item={activeItem} />}
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#059669] hover:underline mt-10"
        >
          View full calendar
          <ArrowIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   7. MEMBERSHIP CTA 
 ═══════════════════════════════════ */
function MembershipCtaSection() {
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: cardRef.current, start: "top 85%" } });

      /* A static, cover-fit background inside a normally-flowing box moves
         in lockstep with the rest of the page, which reads as motionless —
         the box and the photo travel together as one rigid unit, so there's
         nothing visibly "scrolling" about it even though it technically is.
         This scrubs the photo (sized taller than its frame, so there's room
         to pan without exposing empty edges) against scroll progress through
         the section, so it visibly moves independently as the page scrolls —
         the standard GSAP ScrollTrigger parallax recipe, matching how scroll
         effects are already built elsewhere on this page. */
      if (!reduceMotion) {
        gsap.fromTo(imgRef.current,
          { yPercent: -12 },
          { yPercent: 12, ease: "none",
            scrollTrigger: { trigger: cardRef.current, start: "top bottom", end: "bottom top", scrub: true } });
      }
    });
    return () => ctx.revert();
  }, [reduceMotion]);

  return (
    <section className="bg-white py-24 px-6 sm:px-10 lg:px-16" aria-label="Become a member">
      <div
        ref={cardRef}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px]"
        style={{ minHeight: 340 }}
      >
        <div ref={imgRef} className="absolute inset-x-0" style={{ top: "-15%", height: "130%" }}>
          <Image
            src={GALLERY.eciRight}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Legibility overlay: solid on the left where the text sits,
            fading to transparent on the right so the photo still reads. */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(10,10,10,0.75) 0%, rgba(10,10,10,0.45) 42%, transparent 75%)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-[340px] flex-col justify-center gap-6 p-8 sm:p-12 lg:p-16">
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Ready to be part of the mission?
          </h2>
          <div>
            <Link
              href="/membership/apply"
              className="inline-flex items-center rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#0a0a0a] transition-transform hover:scale-[1.03]"
            >
              Become a member
            </Link>
          </div>
        </div>
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
      {/* Hero */}
      <HeroSection />

      {/* Eko Club International intro + Medical Mission (impact stats folded in) */}
      <EciIntroSection />

      {/* "What We Do" snapshot */}
      <WhatWeDoSection />

      {/* Event timeline — condensed to 4 items */}
      <EventTimelineSection />

      {/* Become a member */}
      <MembershipCtaSection />
    </>
  );
}
