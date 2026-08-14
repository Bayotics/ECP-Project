"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useSpring,
  useMotionValue,
  useInView,
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
    volunteer:       "/gallery/event8.JPG",
    meetup:          "/gallery/event3.JPG",
    health:          "/gallery/event6.JPG",
    workshop:        "/gallery/event9.JPG",
    townHall:        "/gallery/event5.JPG",
    seminar:         "/gallery/event7.JPG",
    pressConference: "/gallery/event2.JPG",
    other:           "/gallery/event1.JPG",
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
          <h3 className="text-3xl sm:text-4xl font-semibold text-white leading-tight mb-5">
            {label}
          </h3>
          <p className="text-white/60 leading-relaxed max-w-lg mb-8">
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
                <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight tabular-nums">
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
    image: "/gallery/event4.JPG",
  },
  {
    color: "#dc2626",
    title: "Committees",
    description: "Join the people behind the programs. Our committees are how the work gets done and how members find their place.",
    href: "/member/committees",
    label: "Browse committees",
    image: "/gallery/event1.JPG",
  },
  {
    color: "#2563eb",
    title: "Events",
    description: "Cultural galas, volunteer drives, town halls, and community gatherings — one authoritative calendar.",
    href: "/events",
    label: "See all events",
    image: "/gallery/event5.JPG",
  },
  {
    color: "#d97706",
    title: "Donate",
    description: "Every dollar funds programs, scholarships, and outreach. Give once or set up monthly support.",
    href: "/donate",
    label: "Make a gift",
    image: "/gallery/event6.JPG",
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
      {/* Legibility overlay — solid, no gradient */}
      <div className="absolute inset-0 bg-[#0a0a0a]/55" />

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
     static, un-animated bottom layer; it's cleared once the push finishes. */
  const prevActiveRef = useRef(active);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);

  useEffect(() => {
    if (prevActiveRef.current !== active) {
      setPrevIndex(prevActiveRef.current);
      prevActiveRef.current = active;
    }
  }, [active]);

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
              <span className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-white/60">What We Do</span>
              <span className="h-px w-8 bg-white/30" aria-hidden="true" />
            </div>
            <h2 id="what-we-do-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight">
              Four pillars.<br />One community.
            </h2>
            <p className="mt-6 text-base text-white/50 leading-relaxed max-w-md">
              Every step, done right. From programs to donations —
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
            <div className="relative mt-8 rounded-[2rem] bg-black/40 p-2 sm:mt-10">
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

function TimelineCard({ item, now }: { item: TItem; now: number }) {
  const meta = T_STYLES[item.type] ?? T_STYLES.other;
  const d = new Date(item.date);
  const upcoming = d.getTime() >= now && item.status !== "completed";

  return (
    <Link
      href={`/events/${item.slug}`}
      className="timeline-card group h-full bg-white border border-l-2 border-neutral-200 rounded-2xl p-7 flex flex-col gap-4 transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
      style={{ borderLeftColor: meta.color }}
    >
      {/* Type + status row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: upcoming ? "rgba(5,150,105,0.1)" : "#f5f5f5",
            color: upcoming ? "#047857" : "#737373",
          }}
        >
          {upcoming ? "Upcoming" : "Past"}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-[#0a0a0a] leading-snug transition-colors group-hover:text-[#059669]">
        {item.title}
      </h3>

      {/* Date / location */}
      <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide">
        {dateFmt.format(d)} · {item.isOnline ? "Online" : item.location}
      </p>

      {/* Body */}
      <p className="text-sm text-neutral-600 leading-relaxed font-normal">
        {item.description}
      </p>

      {/* Footer link */}
      <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-[#059669]">
        View details
        <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </Link>
  );
}

function EventTimelineSection() {
  const { events } = useEvents();
  const [now] = useState(() => Date.now());

  const items = useMemo(() => {
    const src = events.length > 0
      ? events.filter(e => e.status !== "draft" && e.isPublic).map(e => ({
          id: e.id, slug: e.slug, title: e.title,
          description: e.shortDescription ?? e.description,
          date: e.date, location: e.location, type: e.type, status: e.status,
          organizerName: e.organizerName, tags: e.tags, imageUrl: e.imageUrl, isOnline: e.isOnline,
        }))
      : FALLBACK_EVENTS;
    return [...src].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  }, [events]);

  return (
    <section className="bg-[#f7f7f5] py-24 px-6 sm:px-10 lg:px-16" aria-labelledby="timeline-heading">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-3">Event timeline</p>
          <h2 id="timeline-heading" className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0a0a0a] leading-snug">
            A Living Archive of Our Signature{" "}
            <span style={{ color: "#059669" }}>Gatherings</span>
          </h2>
        </div>

        {/* Responsive grid — all four events visible, no page overflow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <TimelineCard item={item} now={now} />
            </motion.div>
          ))}
        </div>

        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#059669] hover:underline mt-8"
        >
          View full calendar
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   7. NEWSLETTER / COMMUNITY JOIN — two-column: newsletter + membership
   ══════════════════════════════════════════════════════ */
function NewsletterSignup() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(leftRef.current,
        { opacity: 0, x: -32 },
        { opacity: 1, x: 0, duration: 0.75, ease: "power3.out",
          scrollTrigger: { trigger: leftRef.current, start: "top 82%" } });
      gsap.fromTo(rightRef.current,
        { opacity: 0, x: 32 },
        { opacity: 1, x: 0, duration: 0.75, ease: "power3.out", delay: 0.1,
          scrollTrigger: { trigger: rightRef.current, start: "top 82%" } });
    });
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!firstName.trim() || !trimmedEmail) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) { setError(true); return; }
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: firstName.trim(), source: "website" }),
      });
      // 409 = already subscribed; treat as success from the visitor's point of view.
      if (res.ok || res.status === 409) {
        setSubmitted(true);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-white border-t border-neutral-150 py-24 px-6 sm:px-10 lg:px-16"
      aria-label="Join the community or become a member">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x lg:divide-neutral-150">

        {/* LEFT — Join the community (email list) */}
        <div ref={leftRef} className="pr-0 lg:pr-16 pb-16 lg:pb-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Free · Instant</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a] leading-snug mb-3">
            Join the community
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-sm">
            Get our newsletter with event announcements, program updates, and
            chapter news. Unsubscribe anytime.
          </p>

          {submitted ? (
            <div className="bg-[#f0fdf4] border border-[#059669]/20 rounded-xl px-5 py-4">
              <p className="text-sm font-medium text-[#059669]">
                You're in — check your inbox for a confirmation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 max-w-sm" noValidate>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First name"
                required
                disabled={submitting}
                className="w-full px-4 py-3 text-sm text-neutral-800 bg-[#f7f7f5] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-colors disabled:opacity-60"
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                required
                disabled={submitting}
                className="w-full px-4 py-3 text-sm text-neutral-800 bg-[#f7f7f5] border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#059669]/30 focus:border-[#059669] transition-colors disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#059669] text-white text-sm font-semibold rounded-xl hover:bg-[#047857] transition-colors disabled:opacity-60"
              >
                {submitting ? "Subscribing…" : "Subscribe to updates"}
              </button>
              {error ? (
                <p className="text-xs text-[#dc2626] mt-1">
                  Something went wrong. Please check your email and try again.
                </p>
              ) : (
                <p className="text-xs text-neutral-400 mt-1">
                  We'll email you events and news. Unsubscribe anytime.
                </p>
              )}
            </form>
          )}
        </div>

        {/* RIGHT — Become a member */}
        <div ref={rightRef} className="pl-0 lg:pl-16 pt-16 lg:pt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400 mb-4">Full membership</p>
          <h2 className="text-3xl font-bold tracking-tight text-[#0a0a0a] leading-snug mb-3">
            Become a member
          </h2>
          <p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-sm">
            Formal membership means voting rights, committee seats, directory
            listing, and the full Eko Club Philadelphia experience. Apply in
            minutes — our team reviews every application personally.
          </p>

          <ul className="space-y-3 mb-10">
            {[
              "Join a committee and help run programs",
              "Vote at chapter meetings",
              "Access the full member directory",
              "Attend members-only events",
            ].map(item => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-[#059669]/10 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-[#059669]" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                <span className="text-sm text-neutral-600 font-normal">{item}</span>
              </li>
            ))}
          </ul>

          <Link
            href="/membership/apply"
            className="inline-flex items-center gap-2 bg-[#0a0a0a] text-white text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-neutral-800 transition-colors"
          >
            Apply for membership
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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

      {/* Join the community / newsletter */}
      <NewsletterSignup />
    </>
  );
}
