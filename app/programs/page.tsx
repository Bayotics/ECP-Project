"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/* ─── Program Data ───────────────────────────────────────── */
type SignupStatus = "open" | "opens-soon" | "closed" | "ongoing";

interface Program {
  id: string;
  name: string;
  month: string;           // human-readable month/season
  signupWindow: { start: string; end: string } | null; // MM-DD format, or null for ongoing
  activeYears: number[];   // which years this runs; empty = every year
  committee: string;
  committeeId: string;
  description: string;
  icon: string;
  accent: string;
  tags: string[];
}

const ACCENT = {
  green:  "#059669",
  red:    "#dc2626",
  blue:   "#2563eb",
  yellow: "#d97706",
  teal:   "#0d9488",
};

const ALL_YEARS = [2026, 2027, 2028, 2029, 2030];

const PROGRAMS: Program[] = [
  {
    id: "adopt-a-highway",
    name: "Adopt-a-Highway Cleanup",
    month: "May",
    signupWindow: { start: "04-01", end: "04-30" },
    activeYears: [],
    committee: "Community Service",
    committeeId: "community-service",
    description: "Each spring our members trade weekends for work gloves and roll out along our adopted stretch of highway, clearing litter and restoring the roadside our neighbors drive past every day. It is our most visible act of pride in the place we now call home.",
    icon: "🛣️",
    accent: ACCENT.green,
    tags: ["environment", "volunteer", "highway"],
  },
  {
    id: "scholarship-programs",
    name: "Scholarship Programs",
    month: "May",
    signupWindow: { start: "04-01", end: "04-30" },
    activeYears: [],
    committee: "Education & Youth",
    committeeId: "education-youth",
    description: "We close the academic year by celebrating outstanding students of Nigerian heritage whose drive deserves a runway. The evening turns a scholarship check into a moment of recognition the whole community shows up for.",
    icon: "🎓",
    accent: ACCENT.blue,
    tags: ["education", "scholarship", "youth"],
  },
  {
    id: "ronald-mcdonald-house",
    name: "Ronald McDonald House Meals",
    month: "June (or as needed)",
    signupWindow: { start: "05-01", end: "05-31" },
    activeYears: [],
    committee: "Health & Medical",
    committeeId: "health-medical",
    description: "Members fill the Ronald McDonald House kitchen with the smell of home-cooked meals for families whose children are receiving medical care. Quiet, hands-on service — comfort offered one plate at a time.",
    icon: "🍽️",
    accent: ACCENT.red,
    tags: ["health", "service", "families"],
  },
  {
    id: "back-to-school",
    name: "Back to School Initiatives",
    month: "August",
    signupWindow: { start: "07-01", end: "07-31" },
    activeYears: [],
    committee: "Education & Youth",
    committeeId: "education-youth",
    description: "As summer winds down we pack backpacks with the supplies that let a child walk into the first day of school standing a little taller. Hundreds of students across the Philadelphia area start the year ready and confident.",
    icon: "🎒",
    accent: ACCENT.blue,
    tags: ["education", "youth", "community"],
  },
  {
    id: "independence-day-parade",
    name: "Nigeria Independence Day Parade",
    month: "October",
    signupWindow: { start: "09-01", end: "09-30" },
    activeYears: [],
    committee: "Culture & Heritage",
    committeeId: "culture-heritage",
    description: "Green-white-green takes over the street as we march in the Nigeria Independence Day Parade — drums, agbada, gele, and an unmistakable sense of who we are. It is heritage you can hear from a block away.",
    icon: "🇳🇬",
    accent: ACCENT.green,
    tags: ["heritage", "culture", "parade"],
  },
  {
    id: "thanksgiving-turkey-drive",
    name: "Thanksgiving Turkey Drive",
    month: "November",
    signupWindow: { start: "10-01", end: "10-31" },
    activeYears: [],
    committee: "Community Service",
    committeeId: "community-service",
    description: "No table should sit empty in November. Members gather and distribute turkeys and trimmings so families across the area enjoy a full Thanksgiving meal — and a reminder that they are not alone.",
    icon: "🦃",
    accent: ACCENT.yellow,
    tags: ["thanksgiving", "community", "outreach"],
  },
  {
    id: "winter-coat-drive",
    name: "Winter Coat Drive",
    month: "November – January",
    signupWindow: { start: "10-01", end: "10-31" },
    activeYears: [],
    committee: "Community Service",
    committeeId: "community-service",
    description: "When the temperature drops, we collect and hand out coats, scarves, and gloves to neighbors facing the cold without them. Every coat donated is, as we like to say, a hug from the community.",
    icon: "🧥",
    accent: ACCENT.teal,
    tags: ["winter", "donations", "community"],
  },
  {
    id: "health-education",
    name: "Health Education Series",
    month: "Every other month",
    signupWindow: null,
    activeYears: [],
    committee: "Health & Medical",
    committeeId: "health-medical",
    description: "Through the year we bring in doctors and specialists for frank, practical talks and screenings — heart health, diabetes prevention, mental wellness, nutrition — knowledge that helps our community live longer and better.",
    icon: "🏥",
    accent: ACCENT.red,
    tags: ["health", "education", "wellness"],
  },
  {
    id: "medical-mission",
    name: "Medical Mission (Flagship)",
    month: "Biennial",
    signupWindow: null, // 6 months prior — handled below
    activeYears: [2026, 2028, 2030],
    committee: "Health & Medical",
    committeeId: "health-medical",
    description: "Our flagship. Every two years a team of medical professionals and volunteers travels to deliver free care, screenings, and supplies to communities that need them — the fullest expression of why this club exists.",
    icon: "🩺",
    accent: ACCENT.red,
    tags: ["medical", "mission", "flagship", "biennial"],
  },
];

/* ─── Helpers ─────────────────────────────────────────────── */
function getSignupStatus(program: Program, year: number): SignupStatus {
  if (program.signupWindow === null) return "ongoing";

  const now = new Date();
  const currentYear = now.getFullYear();
  if (year !== currentYear) return year > currentYear ? "opens-soon" : "closed";

  const [startM, startD] = program.signupWindow.start.split("-").map(Number);
  const [endM, endD] = program.signupWindow.end.split("-").map(Number);
  const openDate  = new Date(year, startM - 1, startD);
  const closeDate = new Date(year, endM - 1, endD, 23, 59, 59);

  if (now < openDate) return "opens-soon";
  if (now > closeDate) return "closed";
  return "open";
}

function isActiveInYear(program: Program, year: number) {
  return program.activeYears.length === 0 || program.activeYears.includes(year);
}

const STATUS_STYLES: Record<SignupStatus, { label: string; cls: string }> = {
  open:        { label: "Sign-ups open",  cls: "bg-green-100 text-green-800" },
  "opens-soon":{ label: "Opens soon",    cls: "bg-yellow-100 text-yellow-800" },
  closed:      { label: "Sign-ups closed", cls: "bg-gray-100 text-gray-600" },
  ongoing:     { label: "Ongoing",       cls: "bg-blue-100 text-blue-800" },
};

const COMMITTEES = ["All committees", "Health & Medical", "Education & Youth", "Community Service", "Culture & Heritage"];

/* ─── Page ─────────────────────────────────────────────────── */
export default function ProgramsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() < 2026 ? 2026 : Math.min(new Date().getFullYear(), 2030));
  const [committeeFilter, setCommitteeFilter] = useState("All committees");

  const visible = useMemo(() => {
    return PROGRAMS.filter(p => {
      const active = isActiveInYear(p, selectedYear);
      const matchesCommittee = committeeFilter === "All committees" || p.committee === committeeFilter;
      return active && matchesCommittee;
    });
  }, [selectedYear, committeeFilter]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="bg-[#059669] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-75 mb-3">What We Do</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Programs &amp; Initiatives</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Nine recurring programs run by our committees every year — from highway cleanups and scholarship nights to medical missions. Browse by year to see what&apos;s coming up.
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-3 items-center">
          {/* Year selector */}
          <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 p-1">
            {ALL_YEARS.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${selectedYear === y ? "bg-green-600 text-white shadow" : "text-neutral-600 hover:text-neutral-900"}`}>
                {y}
              </button>
            ))}
          </div>

          {/* Committee filter */}
          <select value={committeeFilter} onChange={e => setCommitteeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-neutral-200 rounded-xl bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-300">
            {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <p className="ml-auto text-sm text-neutral-500">{visible.length} program{visible.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Program grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {visible.length === 0 ? (
          <div className="text-center py-16 text-neutral-400">
            <p className="text-xl mb-2">No programs match these filters.</p>
            <button onClick={() => setCommitteeFilter("All committees")} className="text-sm text-green-600 hover:underline">Clear filter</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {visible.map(p => {
              const status = getSignupStatus(p, selectedYear);
              const { label: statusLabel, cls: statusCls } = STATUS_STYLES[status];

              return (
                <article key={p.id}
                  className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                  {/* Top color bar */}
                  <div className="h-1.5 w-full" style={{ background: p.accent }} />

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                        style={{ background: `${p.accent}14` }}>
                        {p.icon}
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-neutral-900 mb-1">{p.name}</h2>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                      {p.month}
                      {p.signupWindow && (
                        <span className="normal-case font-normal ml-1">
                          · Sign-ups: {p.signupWindow.start.replace("-", "/")} – {p.signupWindow.end.replace("-", "/")}
                        </span>
                      )}
                    </p>

                    <p className="text-sm text-neutral-600 leading-relaxed flex-1">{p.description}</p>

                    <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                      <Link href={`/member/committees`}
                        className="text-xs font-semibold text-neutral-500 hover:text-green-700 transition-colors">
                        {p.committee} →
                      </Link>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {p.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">#{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Medical mission callout for even years */}
        {[2026, 2028, 2030].includes(selectedYear) && (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
            <span className="text-3xl">🩺</span>
            <div>
              <p className="font-bold text-red-800 text-lg">ECI Medical Mission — {selectedYear} Flagship</p>
              <p className="text-sm text-red-700 mt-1">
                {selectedYear} is a Medical Mission year. Eko Club International&apos;s flagship biennial medical outreach is a highlight of the calendar. ECP rallies volunteers, supplies, and support behind the mission. Sign-ups open 6 months prior to the mission date.
              </p>
              <a href="https://ekoclubinternational.org" target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 text-sm font-semibold text-red-700 hover:underline">
                ECI Medical Mission details →
              </a>
            </div>
          </div>
        )}

        {/* ECI Convention callout for odd years */}
        {[2027, 2029].includes(selectedYear) && (
          <div className="mt-10 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 flex items-start gap-4">
            <span className="text-3xl">🌍</span>
            <div>
              <p className="font-bold text-indigo-800 text-lg">
                ECI Biennial Convention — {selectedYear === 2027 ? "London 2027" : selectedYear}
              </p>
              <p className="text-sm text-indigo-700 mt-1">
                {selectedYear} is an ECI Biennial Convention year. The worldwide family of Eko Club gathers for business, culture, and reunion. ECP joins delegates from across the globe to represent Philadelphia.
              </p>
              <a href="https://ekoclubinternational.org" target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 text-sm font-semibold text-indigo-700 hover:underline">
                ECI Convention details →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
