"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";
import {
  COMMITTEES,
  ECI_FLAGSHIP,
  EKO,
  MONTHS,
  PROGRAMS,
  PROGRAM_YEARS,
  formatWindow,
  isActiveIn,
  monthsIn,
  signupStatus,
  type Committee,
  type Program,
  type SignupStatus,
} from "@/lib/content/programs";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

const COMMITTEE_COLOR: Record<Committee, string> = {
  "Community Service": EKO.green,
  "Health & Medical": EKO.red,
  "Education & Youth": EKO.blue,
  "Culture & Heritage": EKO.yellow,
};

/* Today's date, known only in the browser. Sign-up status depends on it,
   and computing it during server rendering could disagree with the
   visitor's own clock — so status pills appear once the page hydrates.
   The snapshot is a date string, which stays identical all day. */
const noop = () => () => {};
function useToday(): Date | null {
  const day = useSyncExternalStore(noop, () => new Date().toDateString(), () => null);
  return useMemo(() => (day ? new Date(day) : null), [day]);
}

const clampYear = (y: number) => Math.min(Math.max(y, PROGRAM_YEARS[0]), PROGRAM_YEARS[PROGRAM_YEARS.length - 1]);

const STATUS_LABEL: Record<Exclude<SignupStatus, "none">, string> = {
  open: "Sign-ups open",
  upcoming: "Sign-ups soon",
  closed: "Sign-ups closed",
};

function StatusPill({ program, year, today, className }: { program: Program; year: number; today: Date | null; className?: string }) {
  const status = signupStatus(program, year, today);
  if (status === "none") {
    if (!program.signupNote) return null;
    return (
      <span className={cn("rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-neutral-800 backdrop-blur", className)}>
        {program.signupNote}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold backdrop-blur",
        status === "open" && "bg-green-600 text-white",
        status === "upcoming" && "bg-white/90 text-neutral-900",
        status === "closed" && "bg-neutral-900/70 text-white/85",
        className,
      )}
    >
      {status === "open" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

function ProgramCard({ program, year, today }: { program: Program; year: number; today: Date | null }) {
  const committeeColor = COMMITTEE_COLOR[program.committee];
  return (
    <article data-program-card className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        {program.image ? (
          <>
            <Image
              src={program.image.src}
              alt={program.image.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" aria-hidden="true" />
          </>
        ) : (
          /* No photograph of this program has been supplied — a typographic
             panel rather than an unrelated stand-in photo. */
          <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: `linear-gradient(135deg, ${program.accent} 0%, #0a0a0a 120%)` }}>
            <p className="text-5xl font-semibold tracking-[-0.04em] text-white/90">{program.when}</p>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <StatusPill program={program} year={year} today={today} />
          {program.flagship && (
            <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white">Flagship</span>
          )}
        </div>
        {program.image && (
          <p className="absolute bottom-4 left-5 text-sm font-semibold uppercase tracking-[0.18em] text-white">{program.when}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          <span className="h-2 w-2 rounded-full" style={{ background: committeeColor }} aria-hidden="true" />
          {program.committee}
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">{program.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-neutral-700">{program.blurb}</p>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-neutral-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 11h18" />
          </svg>
          <p className="text-xs text-neutral-700">
            <span className="font-semibold text-neutral-900">Sign-up window: </span>
            {formatWindow(program)}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-neutral-100 pt-4 text-sm font-semibold">
          {program.projectId && (
            <Link href={`/projects#${program.projectId}`} className="group/link inline-flex items-center gap-1.5 text-green-700 hover:text-green-800">
              See it in action
              <span className="transition-transform duration-300 group-hover/link:translate-x-0.5" aria-hidden="true">→</span>
            </Link>
          )}
          <Link href="/member/committees" className="text-neutral-500 transition-colors hover:text-neutral-900">
            Join this committee
          </Link>
        </div>
      </div>
    </article>
  );
}

function CalendarView({ programs, year, today }: { programs: Program[]; year: number; today: Date | null }) {
  const thisMonth = today && today.getFullYear() === year ? today.getMonth() : -1;
  return (
    <div className="overflow-x-auto rounded-[1.75rem] border border-neutral-200 bg-white">
      <table className="w-full min-w-[56rem] border-collapse text-left">
        <caption className="sr-only">Programs by month, {year}</caption>
        <thead>
          <tr className="border-b border-neutral-200">
            <th scope="col" className="w-64 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Program
            </th>
            {MONTHS.map((m, i) => (
              <th
                key={m}
                scope="col"
                className={cn(
                  "px-1 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.12em]",
                  i === thisMonth ? "text-green-700" : "text-neutral-500",
                )}
              >
                {m}
                {i === thisMonth && <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-green-600" aria-hidden="true" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => {
            const runs = monthsIn(p, year);
            const signupMonth = p.signup ? Number(p.signup.start.split("-")[0]) : null;
            return (
              <tr key={p.id} className="border-b border-neutral-100 last:border-0">
                <th scope="row" className="px-5 py-3 align-middle">
                  <span className="block text-sm font-semibold text-neutral-950">{p.name}</span>
                  <span className="mt-0.5 block text-xs font-normal text-neutral-500">{formatWindow(p)}</span>
                </th>
                {runs.length === 0 ? (
                  <td colSpan={12} className="px-1 py-3">
                    <div
                      className="flex h-9 items-center justify-center rounded-lg border border-dashed text-xs font-semibold"
                      style={{ borderColor: `${p.accent}66`, color: p.accent, background: `${p.accent}0d` }}
                    >
                      {p.monthNote}
                    </div>
                  </td>
                ) : (
                  MONTHS.map((m, i) => {
                    const month = i + 1;
                    const running = runs.includes(month);
                    const signing = signupMonth === month;
                    return (
                      <td key={m} className="px-1 py-3">
                        <div
                          className={cn("h-9 rounded-lg", !running && !signing && "bg-neutral-50")}
                          style={
                            running
                              ? { background: p.accent }
                              : signing
                                ? {
                                    background: `repeating-linear-gradient(135deg, ${p.accent}33 0 6px, transparent 6px 12px)`,
                                    boxShadow: `inset 0 0 0 1.5px ${p.accent}`,
                                  }
                                : undefined
                          }
                          title={running ? `${p.name} — ${m}` : signing ? `${p.name} sign-ups — ${m}` : undefined}
                        />
                      </td>
                    );
                  })
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center gap-5 border-t border-neutral-100 px-5 py-4 text-xs text-neutral-600">
        <span className="flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-neutral-800" aria-hidden="true" /> Program runs
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-3 w-6 rounded"
            style={{ background: "repeating-linear-gradient(135deg, #26262655 0 4px, transparent 4px 8px)", boxShadow: "inset 0 0 0 1.5px #262626" }}
            aria-hidden="true"
          />
          Sign-up window opens
        </span>
      </div>
    </div>
  );
}

function flagshipFor(year: number) {
  if (ECI_FLAGSHIP[year]) return ECI_FLAGSHIP[year];
  return year % 2 === 0
    ? {
        title: `ECI Medical Mission — ${year}`,
        text: "Eko Club International’s flagship medical outreach. As a chapter, ECP rallies volunteers, supplies, and support behind the mission.",
      }
    : {
        title: `ECI Biennial Convention — ${year}`,
        text: "The worldwide family of Eko Club gathers for business, culture, and reunion. ECP joins delegates from across the globe to represent Philadelphia.",
      };
}

export default function ProgramsPage() {
  const today = useToday();
  const [year, setYear] = useState(() => clampYear(new Date().getFullYear()));
  const [committee, setCommittee] = useState<Committee | "All">("All");
  const [view, setView] = useState<"cards" | "calendar">("cards");

  const active = useMemo(() => PROGRAMS.filter((p) => isActiveIn(p, year)), [year]);
  const visible = useMemo(
    () => active.filter((p) => committee === "All" || p.committee === committee),
    [active, committee],
  );

  const openNow = active.filter((p) => signupStatus(p, year, today) === "open");
  const nextUp = active
    .filter((p) => signupStatus(p, year, today) === "upcoming")
    .sort((a, b) => (a.signup!.start < b.signup!.start ? -1 : 1))[0];
  const flagship = flagshipFor(year);

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const calHeadRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const flagshipRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaLeftRef = useRef<HTMLDivElement>(null);
  const ctaRightRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after, queue }) => {
    // Hero — on screen at load: text from the left and the year panel from
    // the right together, then the buttons fade in.
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    // Calendar — heading from the left, then the controls, the ECI banner,
    // and finally the program cards one at a time.
    gsap.set(calHeadRef.current, { x: -SHIFT });
    gsap.set([controlsRef.current, flagshipRef.current], { y: 24 });
    const head = timeline();
    head.tl
      .to(calHeadRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(controlsRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3")
      .to(flagshipRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3");
    after([entered(calHeadRef.current)], () => head.tl.play());

    gsap.set(gridRef.current, { opacity: 1 });
    queue(gsap.utils.toArray<HTMLElement>("[data-program-card]", gridRef.current), { opacity: 0, y: SHIFT }, head.done);

    // Closing call to action.
    gsap.set(ctaLeftRef.current, { x: -SHIFT });
    gsap.set(ctaRightRef.current, { x: SHIFT });
    const cta = timeline();
    cta.tl
      .to(ctaTextRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(ctaLeftRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE })
      .to(ctaRightRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE }, "<");
    after([entered(ctaTextRef.current)], () => cta.tl.play());
  });

  /* The scroll reveal above only covers the first render. When the year,
     committee or view changes, the new set of cards/rows animates in here —
     but only on an actual change (compared against the previous selection,
     which also keeps React's development double-run of effects from
     triggering it on mount), so the two never fight over the same elements. */
  const lastSelection = useRef<string | null>(null);
  useEffect(() => {
    const selection = `${year}|${committee}|${view}`;
    const previous = lastSelection.current;
    lastSelection.current = selection;
    if (previous === null || previous === selection) return;
    const grid = gridRef.current;
    if (!grid || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      const targets = grid.querySelectorAll("[data-program-card], tbody tr");
      gsap.fromTo(targets, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: EASE, stagger: 0.05 });
    }, grid);
    return () => ctx.revert();
  }, [year, committee, view]);

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/projects/parade/contingent.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0.88) 100%)" }}
          />
        </div>

        {QUAD.map((color, index) => (
          <motion.div
            key={color}
            className="pointer-events-none absolute rounded-full blur-3xl"
            style={{ background: color, opacity: 0.16, width: 260, height: 260, left: `${8 + index * 20}%`, top: index % 2 === 0 ? "10%" : "52%" }}
            animate={{ y: [0, -24, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 }}
          />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div ref={heroTextRef} data-reveal style={HIDDEN}>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                  {QUAD.map((color) => (
                    <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                  ))}
                  <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                    Programs calendar {PROGRAM_YEARS[0]}–{PROGRAM_YEARS[PROGRAM_YEARS.length - 1]}
                  </span>
                </div>
                <h1 className="mt-7 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
                  <span style={{ color: EKO.green }}>Nine programs</span>. One
                  <span style={{ color: EKO.yellow }}> year-round</span> rhythm of service.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                  From the Adopt-a-Highway cleanup in May to the winter coat drive, these are the programs our
                  committees run every year — with the Medical Mission, our flagship, in even years. Pick a year to
                  see what&apos;s on and when sign-ups open.
                </p>
              </div>
              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#calendar"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Browse the calendar
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  See our projects
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{year} at a glance</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-4xl font-semibold tracking-[-0.04em]" style={{ color: EKO.green }}>
                    {active.length}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Programs running</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-4xl font-semibold tracking-[-0.04em]" style={{ color: EKO.yellow }}>
                    {today ? openNow.length : "–"}
                  </p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Sign-ups open now</p>
                </div>
              </div>
              <div className="mt-3 rounded-3xl border border-white/10 bg-black/20 p-5">
                {today && openNow.length > 0 ? (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Open now</p>
                    <ul className="mt-2 space-y-1">
                      {openNow.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-3 text-sm text-white">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-white/60">closes {formatWindow(p).split("–")[1]?.trim()}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Next to open</p>
                    <p className="mt-2 text-sm text-white">
                      {today && nextUp ? (
                        <>
                          <span className="font-semibold">{nextUp.name}</span>
                          <span className="text-white/60"> · opens {formatWindow(nextUp).split("–")[0].trim()}</span>
                        </>
                      ) : (
                        <span className="text-white/60">{today ? "No more sign-up windows this year." : "Checking the calendar…"}</span>
                      )}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      {/* ─── Calendar ─── */}
      <section id="calendar" className="scroll-mt-28 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div ref={calHeadRef} data-reveal style={HIDDEN}>
              <div className="flex h-1.5 w-28 overflow-hidden rounded-full" aria-hidden="true">
                {QUAD.map((color) => (
                  <div key={color} className="flex-1" style={{ background: color }} />
                ))}
              </div>
              <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-700">
                Programs calendar
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
                What&apos;s on in {year}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-700">
                Each program has a one-month sign-up window before it runs. Filter by committee to see who leads
                what, or switch to the month-by-month view to see the rhythm of the year.
              </p>
            </div>

            <div ref={controlsRef} data-reveal className="flex flex-col gap-3 lg:items-end" style={HIDDEN}>
              <div role="tablist" aria-label="Year" className="flex rounded-full border border-neutral-200 bg-white p-1">
                {PROGRAM_YEARS.map((y) => (
                  <button
                    key={y}
                    role="tab"
                    aria-selected={y === year}
                    onClick={() => setYear(y)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      y === year ? "bg-neutral-950 text-white" : "text-neutral-600 hover:text-neutral-950",
                    )}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <div role="tablist" aria-label="View" className="flex rounded-full border border-neutral-200 bg-white p-1">
                  {(["cards", "calendar"] as const).map((v) => (
                    <button
                      key={v}
                      role="tab"
                      aria-selected={v === view}
                      onClick={() => setView(v)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                        v === view ? "bg-green-700 text-white" : "text-neutral-600 hover:text-neutral-950",
                      )}
                    >
                      {v === "cards" ? "Programs" : "Month by month"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by committee">
            {(["All", ...COMMITTEES] as const).map((c) => {
              const on = c === committee;
              const color = c === "All" ? "#0a0a0a" : COMMITTEE_COLOR[c];
              return (
                <button
                  key={c}
                  onClick={() => setCommittee(c)}
                  aria-pressed={on}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors"
                  style={{
                    borderColor: on ? color : "#e5e5e5",
                    background: on ? `${color}14` : "#ffffff",
                    color: on ? "#0a0a0a" : "#525252",
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
                  {c === "All" ? "All committees" : c}
                </button>
              );
            })}
          </div>

          <div
            ref={flagshipRef}
            data-reveal
            className="relative mt-8 overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-neutral-950 p-6 text-white sm:p-8"
            style={HIDDEN}
          >
            <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: year % 2 === 0 ? EKO.red : EKO.blue }} aria-hidden="true" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">Parent body · Eko Club International</p>
                <p className="mt-2 text-xl font-semibold tracking-[-0.02em] sm:text-2xl">{flagship.title}</p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">{flagship.text}</p>
              </div>
              <a
                href="https://ekoclubinternational.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                ECI details →
              </a>
            </div>
          </div>

          <div ref={gridRef} data-reveal className="mt-8" style={HIDDEN}>
            {visible.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-semibold text-neutral-900">No programs match this filter in {year}.</p>
                <button onClick={() => setCommittee("All")} className="mt-3 text-sm font-semibold text-green-700 hover:underline">
                  Show all committees
                </button>
              </div>
            ) : view === "cards" ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {visible.map((p) => (
                  <ProgramCard key={p.id} program={p} year={year} today={today} />
                ))}
              </div>
            ) : (
              <CalendarView programs={visible} year={year} today={today} />
            )}
          </div>
        </div>
      </section>

      {/* ─── Call to action ─── */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO.green }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div ref={ctaTextRef} data-reveal style={HIDDEN}>
            <div className="flex justify-center">
              <div className="flex h-1.5 w-28 overflow-hidden rounded-full" aria-hidden="true">
                {QUAD.map((color) => (
                  <div key={color} className="flex-1" style={{ background: color }} />
                ))}
              </div>
            </div>
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Every program runs on <span style={{ color: EKO.yellow }}>our members</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Join the club, pick a committee, and sign up when a window opens — or see what these programs have
              already done on the ground.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftRef} data-reveal style={HIDDEN}>
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green }}
              >
                Apply for membership
              </Link>
            </div>
            <div ref={ctaRightRef} data-reveal style={HIDDEN}>
              <Link
                href="/projects"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                See our projects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
