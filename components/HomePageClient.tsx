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
import { PROGRAMS } from "@/lib/content/programs";
import { cn } from "@/utils/cn";
import { apiRequest } from "@/lib/client/api";
import { DEFAULT_WHAT_WE_DO, type WhatWeDoContent } from "@/lib/content/what-we-do";
import WhatWeDoCardFace from "@/components/home/WhatWeDoCardFace";
import ConventionsSection from "@/components/home/ConventionsSection";

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

/* The club's own photographs, each chosen to match what it sits beside
   rather than the interchangeable eko-1…6 set that was here before. A
   volunteer event now shows the highway crew, a seminar shows a health
   webinar flyer, and so on. */
const GALLERY = {
  hero:     "/gallery/hero-bgs/phily.jpg",
  eciLeft:  "/gallery/hero-bgs/lagos-island.jpg",
  eciRight: "/gallery/hero-bgs/eyo-2025.jpg",
  timeline: {
    volunteer:       "/gallery/projects/highway/group-at-sign.jpg",
    meetup:          "/gallery/projects/scholarship/2026-awardees.jpg",
    health:          "/gallery/projects/rmh/team-with-ronald.jpg",
    workshop:        "/gallery/projects/homefront/homefront-donation.jpg",
    townHall:        "/gallery/projects/scholarship/2026-members.jpg",
    seminar:         "/gallery/projects/health/flyer-heart-health-2025-01.jpg",
    pressConference: "/gallery/projects/parade/contingent.jpg",
    other:           "/gallery/projects/parade/eyo-procession.jpg",
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

/* ══════════════════════════════════════════════════════
   2. HERO — Philadelphia photograph with clear foreground lettering
   ══════════════════════════════════════════════════════ */
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

function HeroSection() {
  const introDone = useIntroDone();

  return (
    <section
      className="relative isolate overflow-hidden bg-[#071c16] lg:min-h-[max(620px,calc(22vw_+_320px))] lg:h-[100svh]"
      aria-label="Eko Club Philadelphia hero"
    >
      {/* One full-width photograph; its natural framing keeps the entire sign.
          Fading its upper edge removes any seam on taller screens. */}
      <div className="absolute inset-x-0 bottom-0 aspect-[16/9]" style={{ maskImage: "linear-gradient(to bottom, transparent, black 32%)" }}>
        <Image
          src={GALLERY.hero}
          alt="The I love Philly sculpture in front of Philadelphia City Hall"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{ background: "linear-gradient(to bottom, rgba(7,28,22,0.7) 0%, rgba(7,28,22,0.65) 38%, rgba(7,28,22,0.3) 53%, transparent 65%)" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6" style={{ background: `linear-gradient(to bottom, transparent, ${DEEP_GREEN})` }} aria-hidden="true" />

      {/* The introduction sits above the sculpture rather than across it. */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-28 pb-[calc(56.25vw_+_3rem)] text-center sm:px-10 sm:pt-36 lg:px-16 lg:pt-[176px] lg:pb-[max(260px,22vw)]">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-4 max-w-2xl text-[10px] font-semibold uppercase tracking-[0.15em] text-white/85 sm:text-xs sm:tracking-[0.2em] lg:mb-3"
        >
          Eko Club Philadelphia · A Chapter of Eko Club International
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
          transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-4xl text-[2.25rem] leading-[1.08] font-medium tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.3)] sm:text-5xl lg:max-w-none lg:whitespace-nowrap lg:text-[clamp(2rem,3vw,3rem)]"
        >
          <span className="block lg:inline">Heritage, community,</span>{" "}
          <span className="text-[#6ee7b7]">and service</span>{" "}in Philadelphia.
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={introDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.75, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mt-6 flex justify-center lg:mt-4"
        >
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <Link href="/events" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors hover:bg-white/90 sm:px-7 sm:py-3.5">
              Upcoming events
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
            <Link href="/donate" className="inline-flex items-center justify-center rounded-full bg-[#059669] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#047857] sm:px-7 sm:py-3.5">Donate</Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════
   DECORATIVE BACKGROUND LAYERS — kept out of the way of
   content (absolute, pointer-events-none, aria-hidden) and
   deliberately restrained to the site's existing green/black
   palette, so the dark sections read as art-directed rather
   than a flat fill without introducing new colors or fighting
   the green → black gradient blend between them.
   ══════════════════════════════════════════════════════ */

/* Faint dot-grid texture — the "halftone" ambient texture. */
function DotGridTexture({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `radial-gradient(rgba(255,255,255,${opacity}) 1px, transparent 1px)`,
        backgroundSize: "24px 24px",
      }}
      aria-hidden="true"
    />
  );
}

/* Minimal scattered "confetti" — a handful of small line-art shapes (one a
   loose hand-drawn swirl) plus a couple of tiny dots in colors already used
   elsewhere on the page, kept to each section's margins so nothing sits on
   top of readable text. Two presets so neighboring sections don't repeat
   the exact same scatter, while staying the same visual language. */
/* Reused hand-drawn accent shapes, all sized for a 0-12 viewBox. */
const SWIRL_A = <path d="M2,9 C2,4 6,2 9,4 C11,5.5 10,8 8,8 C6.5,8 6,6.5 7,6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />;
const SWIRL_B = <path d="M10,3 C10,7 7,10 4,8 C2,6.5 3,4 5,4 C6,4 6.5,5 6,6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />;
const SQUIGGLE = <path d="M4,1 C7,3 1,5 4,7 C7,9 1,11 4,12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />;
const SPARKLE = <path d="M6,0 L7.2,4.8 L12,6 L7.2,7.2 L6,12 L4.8,7.2 L0,6 L4.8,4.8 Z" />;
const RING = <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />;

function ConfettiScatter({ variant }: { variant: "mission" | "whatWeDo" }) {
  const presets = {
    mission: {
      shapes: [
        { style: { top: "4%", left: "91%" }, node: SWIRL_A },
        { style: { top: "50%", left: "95%" }, node: <rect width="8" height="8" transform="rotate(20)" /> },
        { style: { top: "90%", left: "68%" }, node: <polygon points="5,0 10,9 0,9" /> },
        { style: { top: "3%", left: "16%" }, node: <circle cx="4" cy="4" r="4" /> },
        { style: { top: "35%", left: "8%" }, node: SPARKLE },
        { style: { top: "80%", left: "14%" }, node: SWIRL_B },
        { style: { top: "62%", left: "90%" }, node: RING },
      ],
      dots: [
        { style: { top: "22%", left: "4%" }, color: EKO_RED },
        { style: { top: "76%", left: "97%" }, color: EKO_YELLOW },
        { style: { top: "10%", left: "60%" }, color: EKO_BLUE },
      ],
    },
    whatWeDo: {
      shapes: [
        { style: { top: "6%", left: "4%" }, node: <rect width="10" height="10" transform="rotate(15)" /> },
        { style: { top: "14%", left: "92%" }, node: <circle cx="5" cy="5" r="5" /> },
        { style: { top: "78%", left: "6%" }, node: <polygon points="6,0 12,10 0,10" /> },
        { style: { top: "88%", left: "88%" }, node: <rect width="8" height="8" transform="rotate(40)" /> },
        { style: { top: "40%", left: "2%" }, node: <circle cx="4" cy="4" r="4" /> },
        { style: { top: "8%", left: "48%" }, node: <polygon points="5,0 10,9 0,9" /> },
        { style: { top: "58%", left: "50%" }, node: SWIRL_A },
        { style: { top: "94%", left: "32%" }, node: SPARKLE },
        { style: { top: "30%", left: "96%" }, node: SQUIGGLE },
        { style: { top: "68%", left: "96%" }, node: RING },
      ],
      dots: [
        { style: { top: "24%", left: "96%" }, color: EKO_GREEN },
        { style: { top: "60%", left: "1%" }, color: EKO_YELLOW },
        { style: { top: "94%", left: "50%" }, color: EKO_RED },
        { style: { top: "3%", left: "70%" }, color: EKO_BLUE },
      ],
    },
  } as const;
  const { shapes, dots } = presets[variant];
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {shapes.map((s, i) => (
        <svg key={i} className="absolute h-3 w-3 text-white/15" style={s.style} viewBox="0 0 12 12" fill="currentColor">
          {s.node}
        </svg>
      ))}
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute h-1.5 w-1.5 rounded-full"
          style={{ ...d.style, background: d.color, opacity: 0.35 }}
        />
      ))}
    </div>
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
  const missionImagesRef = useRef<HTMLDivElement>(null);
  const missionTextRef = useRef<HTMLDivElement>(null);
  const { events } = useEvents();

  /* Events the club has actually run, counted from the calendar. This used
     to be `40 + pastCount`: a real count with an invented 40 added on top,
     which is how the page came to claim "64+". The number now rises on its
     own as events pass, and never says more than the club has done. */
  const eventsDelivered = useMemo(() => {
    const now = new Date();
    return events.filter(
      (e) => e.status !== "draft" && new Date(e.endDate ?? e.date) < now,
    ).length;
  }, [events]);

  const stats = [
    { value: eventsDelivered, suffix: "",   label: "Events delivered" },
    /* Read from the programmes themselves so the two can never disagree. */
    { value: PROGRAMS.length, suffix: "",   label: "Annual programs" },
    /* The club's adopted stretch of Big Oak Road, Bucks County. */
    { value: 2,               suffix: "mi", label: "Highway adopted" },
    /* Two high school graduates and three college students every year. */
    { value: 5,               suffix: "",   label: "Scholarships a year" },
  ];

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(introRef.current,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: introRef.current, start: "top 85%", once: true } }
      );
      /* The two-image block and the mission text beside it were one shared
         reveal; split so each declares its own direction — images from the
         left, text from the bottom — but both still trigger at the same
         scroll position since neither depends on the other finishing. */
      gsap.fromTo(missionImagesRef.current,
        { opacity: 0, x: -48 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: missionImagesRef.current, start: "top 85%", once: true } }
      );
      gsap.fromTo(missionTextRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: missionTextRef.current, start: "top 85%", once: true } }
      );
      gsap.fromTo(
        missionTextRef.current?.querySelectorAll(".stat-item") ?? [],
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out",
          scrollTrigger: { trigger: missionTextRef.current, start: "top 70%", once: true } }
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
    <section style={{ backgroundColor: DEEP_GREEN }} className="relative w-full overflow-hidden pt-4 pb-24 px-6 sm:px-10 sm:pb-28 lg:px-16 lg:pb-32">
      <DotGridTexture />
      <ConfettiScatter variant="mission" />

      {/* ── Part A: Eko Club International intro ── */}
      <div ref={introRef} className="relative z-10 max-w-3xl mx-auto text-center mb-20 sm:mb-24 lg:mb-28">
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
      <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: two overlapping images */}
        <div ref={missionImagesRef} className="relative h-[340px] sm:h-[420px] lg:h-[480px]">
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
        <div ref={missionTextRef}>
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
/* Auto-advance dwell time per tab, in ms. The underline's fill animation
   duration is derived from this same constant so the two stay in sync. */
const TAB_DURATION_MS = 5000;

/* How long the "push" cover-transition itself takes. Deliberately separate
   from TAB_DURATION_MS (the auto-advance dwell time) — this only governs how
   slowly the new card slides down over the old one. */
const PUSH_DURATION_S = 0.85;

function WhatWeDoSection() {
  const [slides, setSlides] = useState(DEFAULT_WHAT_WE_DO);
  useEffect(() => {
    let mounted = true;
    apiRequest<WhatWeDoContent>("/api/site-content/what-we-do").then(content => {
      if (mounted && content.slides?.length === 4) setSlides(content.slides);
    }).catch(error => console.error("[homepage] Could not refresh carousel content", error));
    return () => { mounted = false; };
  }, []);
  const [active, setActive] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const introColRef = useRef<HTMLDivElement>(null);
  const carouselColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(introColRef.current,
        { opacity: 0, x: -48 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: introColRef.current, start: "top 85%", once: true } });
      gsap.fromTo(carouselColRef.current,
        { opacity: 0, y: 48 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: carouselColRef.current, start: "top 85%", once: true } });
    });
    return () => ctx.revert();
  }, []);

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
      setActive((a) => (a + 1) % slides.length);
    }, TAB_DURATION_MS);
    return () => clearTimeout(t);
  }, [active, autoPlay, slides.length]);

  function selectTab(i: number) {
    setAutoPlay(false);
    setActive(i);
  }

  const current = slides[active];
  const previous = prevIndex !== null ? slides[prevIndex] : null;

  return (
    <section
      className="relative overflow-hidden pt-24 pb-24 px-6 sm:px-10 sm:pt-28 sm:pb-28 lg:px-16 lg:pt-32 lg:pb-32"
      style={{ background: `linear-gradient(to bottom, ${DEEP_GREEN} 0%, #000000 38%)` }}
      aria-labelledby="what-we-do-heading"
    >
      <DotGridTexture opacity={0.05} />
      <ConfettiScatter variant="whatWeDo" />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:items-center">
          {/* ── Left: intro ── */}
          <div ref={introColRef}>
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
          <div ref={carouselColRef}>
            {/* Tab menu */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 sm:gap-x-8">
              {slides.map((item, i) => {
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
              <div className="relative grid overflow-hidden rounded-[1.5rem]">
                {/* Static bottom layer — the outgoing card, no animation at all */}
                {previous && (
                  <div className="col-start-1 row-start-1 z-0">
                    <WhatWeDoCardFace item={previous} />
                  </div>
                )}

                {/* Incoming card — pushes down from above, covering the old one */}
                <motion.div
                  key={current.title}
                  initial={{ y: "-100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: PUSH_DURATION_S, ease: [0.65, 0, 0.35, 1] }}
                  onAnimationComplete={() => setPrevIndex(null)}
                  className="col-start-1 row-start-1 z-10"
                >
                  <WhatWeDoCardFace item={current} />
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

/* Shown only if the events API cannot be reached, so the section is never
   empty. These are four of the club's genuine recurring programmes with
   their real dates, venues and photographs, matching what the seeded
   calendar holds; nothing here is invented to fill space. */
const FALLBACK_EVENTS: TItem[] = [
  { id: "ecp-evt-thanksgiving-turkey-drive-2026-11", slug: "thanksgiving-turkey-drive-2026-11",
    title: "Thanksgiving Turkey Giveaway 2026",
    description: "No table should sit empty in November. Members gather and distribute turkeys and trimmings so families across the area enjoy a full Thanksgiving meal.",
    date: "2026-11-21T10:00:00.000Z", location: "Philadelphia, Pennsylvania",
    type: "volunteer", status: "published", organizerName: "Hon. Bola Okoya",
    tags: ["community service", "food"],
    imageUrl: "/gallery/projects/thanksgiving/team-and-turkeys.jpg", isOnline: false },
  { id: "ecp-evt-independence-day-parade-2026-10", slug: "independence-day-parade-2026-10",
    title: "Nigeria Independence Day Parade 2026",
    description: "Green-white-green takes over the street as we march in the Nigeria Independence Day Parade: drums, agbada, gele, and an unmistakable sense of who we are.",
    date: "2026-10-03T11:00:00.000Z", location: "New York City, New York",
    type: "other", status: "published", organizerName: "Hon. Adebimpe Daniells",
    tags: ["culture", "heritage", "parade"],
    imageUrl: "/gallery/projects/parade/eyo-procession.jpg", isOnline: false },
  { id: "ecp-evt-scholarship-programs-2026-05", slug: "scholarship-programs-2026-05",
    title: "Scholarship Award Presentation 2026",
    description: "We close the academic year by celebrating the scholars among us, outstanding students of Nigerian heritage whose drive deserves a runway.",
    date: "2026-05-09T16:00:00.000Z", location: "Philadelphia, Pennsylvania",
    type: "other", status: "completed", organizerName: "Hon. Adebimpe Daniells",
    tags: ["education", "youth", "awards"],
    imageUrl: "/gallery/projects/scholarship/2026-awardees.jpg", isOnline: false },
  { id: "ecp-evt-adopt-a-highway-2026-05", slug: "adopt-a-highway-2026-05",
    title: "Adopt a Highway 2026",
    description: "Each spring our members trade weekends for work gloves and clear litter along our adopted stretch of Big Oak Road, restoring the roadside our neighbours drive past every day.",
    date: "2026-05-09T09:00:00.000Z", location: "Big Oak Road, Bucks County, Pennsylvania",
    type: "volunteer", status: "completed", organizerName: "Hon. Bola Okoya",
    tags: ["community service", "environment"],
    imageUrl: "/gallery/projects/highway/group-at-sign.jpg", isOnline: false },
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

    /* What is coming up next, soonest first.

       This used to sort newest-first and take four, which with a calendar
       seeded out to 2027 meant the homepage led with events fourteen months
       away. A visitor wants to know what they could turn up to next.

       If nothing is upcoming, the four most recent past events stand in, so
       the section still shows the club at work rather than emptying out. */
    const now = Date.now();
    const upcoming = src
      .filter((e) => new Date(e.date).getTime() >= now)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (upcoming.length >= 4) return upcoming.slice(0, 4);

    const recent = src
      .filter((e) => new Date(e.date).getTime() < now)
      .sort((a, b) => b.date.localeCompare(a.date));

    return [...upcoming, ...recent].slice(0, 4);
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

  /* Scroll-reveal sequence, one master timeline off a single trigger: the
     eyebrow slides in from the left, then the heading from the right, then
     the accordion and visual panel columns slide in from the left and right
     at the same time ("<" starts a tween alongside the one before it
     instead of after it). */
  const headerRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const accordionColRef = useRef<HTMLDivElement>(null);
  const panelColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      /* Pre-set every stage's hidden starting look before the timeline
         plays — see the matching note in MembershipCtaSection for why this
         (rather than leaning on each .fromTo()'s own "from" value) is what
         keeps later stages from flashing at full opacity for a frame while
         earlier stages are still animating. */
      gsap.set(eyebrowRef.current, { opacity: 0, x: -40 });
      gsap.set(headingRef.current, { opacity: 0, x: 40 });
      gsap.set(accordionColRef.current, { opacity: 0, x: -48 });
      gsap.set(panelColRef.current, { opacity: 0, x: 48 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: headerRef.current, start: "top 85%", once: true },
      });
      tl.to(eyebrowRef.current, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" })
        .to(headingRef.current, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" })
        .to(accordionColRef.current, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" })
        .to(panelColRef.current, { opacity: 1, x: 0, duration: 0.7, ease: "power3.out" }, "<");
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="bg-[#f7f7f5] py-24 px-4 sm:px-6 lg:px-8" aria-labelledby="timeline-heading">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div ref={headerRef} className="max-w-2xl mb-16">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-neutral-300" aria-hidden="true" />
            <p ref={eyebrowRef} className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-800">Event timeline</p>
            <span className="h-px w-8 bg-neutral-300" aria-hidden="true" />
          </div>
          <h2 ref={headingRef} id="timeline-heading" className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#0a0a0a] leading-[1.08]">
            A Living Archive of Our Signature{" "}
            <span style={{ color: EKO_GREEN }}>Gatherings</span>
          </h2>
        </div>

        {/* Split accordion + visual panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-stretch lg:gap-5">
          <div ref={accordionColRef} className="flex flex-col gap-3">
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

          <div ref={panelColRef}>
            {activeItem && <EventVisualPanel item={activeItem} />}
          </div>
        </div>

        <Link
          href="/programs"
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
  const headingRef = useRef<HTMLHeadingElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      /* Initial hidden states are set up front with gsap.set() rather than
         relying on each .fromTo()'s own "from" value — for tweens chained
         later in a timeline, GSAP only commits to that starting look right
         as the playhead reaches them, which can flash the heading/button at
         full opacity for a frame while stage 1 (the background) is still
         fading in. Setting everything hidden immediately removes that gap
         entirely, then the timeline only ever animates forward to "visible". */
      gsap.set(cardRef.current, { opacity: 0 });
      gsap.set(headingRef.current, { opacity: 0, x: -48 });
      gsap.set(buttonRef.current, { opacity: 0, x: -48 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: cardRef.current, start: "top 85%", once: true },
      });
      tl.to(cardRef.current, { opacity: 1, duration: 0.7, ease: "power2.out" })
        .to(headingRef.current, { opacity: 1, x: 0, duration: 0.6, ease: "power3.out" })
        .to(buttonRef.current, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" });

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
          <h2 ref={headingRef} className="max-w-md text-3xl font-semibold leading-tight text-white sm:text-4xl">
            Ready to be part of the mission?
          </h2>
          <div ref={buttonRef}>
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

      <ConventionsSection />

      {/* Become a member */}
      <MembershipCtaSection />
    </>
  );
}
