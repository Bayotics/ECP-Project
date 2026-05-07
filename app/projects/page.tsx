"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ─── Animation helpers ───────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

/* ─── Types ───────────────────────────────────────── */
type ProjectStatus = "active" | "completed" | "planned";
type ProjectCategory =
  | "all"
  | "youth"
  | "healthcare"
  | "environment"
  | "education"
  | "infrastructure"
  | "culture";

interface Project {
  id: string;
  title: string;
  category: Exclude<ProjectCategory, "all">;
  status: ProjectStatus;
  year: string;
  description: string;
  impact: string;
  icon: string;
  raised?: string;
  goal?: string;
  beneficiaries?: string;
  featured?: boolean;
}

/* ─── Data ────────────────────────────────────────── */
const PROJECTS: Project[] = [
  {
    id: "youth-mentorship-2024",
    title: "Youth Mentorship Programme",
    category: "youth",
    status: "active",
    year: "2024",
    description:
      "A 12-month structured mentorship scheme pairing young Lagosians (16–25) in the Delaware Valley with established professionals in law, medicine, technology, and finance.",
    impact: "Matched 48 mentees with senior professionals across 8 industries.",
    icon: "🎓",
    beneficiaries: "48 young people",
    raised: "₦3.2M",
    goal: "₦5M",
    featured: true,
  },
  {
    id: "free-health-screening-2024",
    title: "Free Community Health Screening",
    category: "healthcare",
    status: "active",
    year: "2024",
    description:
      "Monthly free health screenings for blood pressure, diabetes, and HIV — held at the Philadelphia African Cultural Centre every last Saturday.",
    impact: "Over 320 community members screened, 14 referred for urgent care.",
    icon: "🏥",
    beneficiaries: "320+ residents",
    raised: "₦1.8M",
    goal: "₦2.5M",
    featured: true,
  },
  {
    id: "clean-waterway-lagos-2023",
    title: "Lagos Waterway Clean-Up Initiative",
    category: "environment",
    status: "completed",
    year: "2023",
    description:
      "Partnered with Lagos State Ministry of Environment to sponsor a two-week waterway clean-up project targeting the Isale-Eko lagoon frontage.",
    impact: "12 tonnes of waste removed; 200 volunteer hours contributed.",
    icon: "🌿",
    beneficiaries: "Isale-Eko community",
    raised: "₦6M",
    goal: "₦6M",
    featured: true,
  },
  {
    id: "ecp-merit-scholarship-2024",
    title: "ECP Merit Scholarship",
    category: "education",
    status: "active",
    year: "2024",
    description:
      "Annual merit-based bursary awarded to children of ECP members attending accredited colleges and universities in the United States.",
    impact: "12 scholarships awarded worth $1,500 each since programme inception.",
    icon: "✏️",
    beneficiaries: "12 university students",
    raised: "₦4.5M",
    goal: "₦5M",
  },
  {
    id: "ileya-festival-2024",
    title: "Annual Ileya Cultural Festival",
    category: "culture",
    status: "completed",
    year: "2024",
    description:
      "Philadelphia's biggest Lagos-themed cultural celebration featuring food, music, traditional attire, and a business expo.",
    impact: "900+ attendees; 22 Lagos-owned businesses showcased.",
    icon: "🎭",
    beneficiaries: "900+ attendees",
    raised: "₦8M",
    goal: "₦8M",
  },
  {
    id: "drainage-advocacy-2023",
    title: "Lagos Island Drainage Advocacy",
    category: "infrastructure",
    status: "completed",
    year: "2023",
    description:
      "Lobbied Lagos State Government and engaged international donors for drainage upgrades in flood-prone Lagos Island neighbourhoods.",
    impact: "Official commitment secured from LASG for 3 drainage projects.",
    icon: "🏗️",
    beneficiaries: "4,000+ residents",
    raised: "₦2M",
    goal: "₦2M",
  },
  {
    id: "civic-literacy-drive-2025",
    title: "Civic Literacy Drive",
    category: "youth",
    status: "planned",
    year: "2025",
    description:
      "A six-week civic education curriculum delivered to secondary schools in Philadelphia, covering voting rights, community advocacy, and governance.",
    impact: "Target: 200 students across 4 schools.",
    icon: "📖",
    beneficiaries: "200 students (target)",
    raised: "₦0",
    goal: "₦3.5M",
  },
  {
    id: "mental-health-awareness-2025",
    title: "Mental Health Awareness Campaign",
    category: "healthcare",
    status: "planned",
    year: "2025",
    description:
      "A social-media-driven and in-person campaign de-stigmatising mental health conversations in the Nigerian-American community.",
    impact: "Target: 1,000 engagements; 3 community workshops.",
    icon: "🧠",
    beneficiaries: "1,000+ (target)",
    goal: "₦2M",
    raised: "₦500K",
  },
  {
    id: "school-supplies-drive-2024",
    title: "Back-to-School Supplies Drive",
    category: "education",
    status: "completed",
    year: "2024",
    description:
      "Collected and distributed school supplies to 150 children from low-income Lagos-heritage families in the Philadelphia area.",
    impact: "150 children equipped for the new academic year.",
    icon: "🎒",
    beneficiaries: "150 children",
    raised: "₦1.2M",
    goal: "₦1.2M",
  },
];

const CATEGORIES: { value: ProjectCategory; label: string; icon: string }[] = [
  { value: "all", label: "All Projects", icon: "🗂️" },
  { value: "youth", label: "Youth", icon: "🎓" },
  { value: "healthcare", label: "Healthcare", icon: "🏥" },
  { value: "environment", label: "Environment", icon: "🌿" },
  { value: "education", label: "Education", icon: "✏️" },
  { value: "infrastructure", label: "Infrastructure", icon: "🏗️" },
  { value: "culture", label: "Culture", icon: "🎭" },
];

const STATUS_STYLES: Record<ProjectStatus, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
  completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Completed" },
  planned: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Planned" },
};

const IMPACT_STATS = [
  { value: "15+", label: "Projects Launched" },
  { value: "5,000+", label: "Community Beneficiaries" },
  { value: "₦30M+", label: "Invested in Projects" },
  { value: "8", label: "Focus Areas" },
];

/* ─── Progress bar ────────────────────────────────── */
function ProgressBar({ raised, goal }: { raised?: string; goal?: string }) {
  if (!raised || !goal) return null;
  const parse = (s: string) =>
    parseFloat(s.replace(/[₦,KM]/g, "").trim()) *
    (s.includes("M") ? 1_000_000 : s.includes("K") ? 1_000 : 1);
  const pct = Math.min(100, Math.round((parse(raised) / parse(goal)) * 100));
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-(--color-neutral-500) mb-1">
        <span>Raised: <strong className="text-(--color-neutral-700)">{raised}</strong></span>
        <span>Goal: <strong className="text-(--color-neutral-700)">{goal}</strong></span>
      </div>
      <div className="h-1.5 rounded-full bg-(--color-neutral-100) overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "var(--color-green-500)" }}
        />
      </div>
      <p className="text-xs text-(--color-neutral-400) mt-0.5 text-right">{pct}% funded</p>
    </div>
  );
}

/* ─── Project Card ────────────────────────────────── */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const status = STATUS_STYLES[project.status];
  return (
    <motion.div
      layout
      variants={fadeUp}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, scale: 0.96 }}
      custom={index % 4}
      className="bg-white rounded-2xl border border-(--color-neutral-200) hover:shadow-md transition-shadow flex flex-col overflow-hidden"
    >
      {/* Card header */}
      <div
        className="px-6 pt-6 pb-4"
        style={{ background: "var(--color-neutral-50)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="text-3xl" aria-hidden="true">{project.icon}</span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}
          >
            {status.label}
          </span>
        </div>
        <h3 className="mt-3 font-bold text-lg leading-snug text-(--color-neutral-900)">
          {project.title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-(--color-neutral-400)">{project.year}</span>
          <span className="text-(--color-neutral-300)">·</span>
          <span className="text-xs capitalize text-(--color-neutral-500)">{project.category}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 pb-6 flex flex-col flex-1">
        <p className="text-sm text-(--color-neutral-600) leading-relaxed mt-2">{project.description}</p>

        {/* Impact */}
        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "var(--color-green-50)", color: "var(--color-green-800)" }}
        >
          <span className="font-semibold">Impact: </span>{project.impact}
        </div>

        {/* Beneficiaries */}
        {project.beneficiaries && (
          <p className="mt-2 text-xs text-(--color-neutral-500)">
            👥 <strong>{project.beneficiaries}</strong>
          </p>
        )}

        {/* Progress */}
        <ProgressBar raised={project.raised} goal={project.goal} />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Donate CTA for active projects */}
        {project.status === "active" && (
          <Link
            href="/donate"
            className="mt-5 inline-flex justify-center items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "var(--color-green-600)" }}
          >
            Support This Project
          </Link>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>("all");
  const [activeStatus, setActiveStatus] = useState<ProjectStatus | "all">("all");

  const filtered = PROJECTS.filter((p) => {
    const catMatch = activeCategory === "all" || p.category === activeCategory;
    const statusMatch = activeStatus === "all" || p.status === activeStatus;
    return catMatch && statusMatch;
  });

  const featuredProjects = PROJECTS.filter((p) => p.featured);

  return (
    <div className="bg-white text-(--color-neutral-900)">

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 md:py-32"
        style={{ background: "var(--color-green-900)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-gold-400) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-80 w-80 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--color-gold-400)" }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest mb-4 text-white"
            style={{ background: "var(--color-gold-500)" }}
          >
            Our Impact
          </motion.span>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            Projects &amp;{" "}
            <span style={{ color: "var(--color-gold-400)" }}>Initiatives</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/75 leading-relaxed"
          >
            From youth mentorship to environmental advocacy — every project we run
            is powered by the generosity and dedication of the ECP community.
          </motion.p>

          {/* Stats */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {IMPACT_STATS.map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <span
                  className="text-3xl font-extrabold"
                  style={{ color: "var(--color-gold-400)" }}
                >
                  {s.value}
                </span>
                <span className="mt-1 text-sm text-white/60">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Featured Projects ─────────────────────────── */}
      <section className="py-20" style={{ background: "var(--color-neutral-50)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ background: "var(--color-green-100)", color: "var(--color-green-700)" }}
            >
              Spotlight
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--color-neutral-900)">
              Featured{" "}
              <span style={{ color: "var(--color-green-600)" }}>Projects</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                className="relative bg-white rounded-2xl border-2 overflow-hidden hover:shadow-lg transition-shadow"
                style={{ borderColor: "var(--color-green-200)" }}
              >
                {/* Featured badge */}
                <div
                  className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ background: "var(--color-gold-500)" }}
                >
                  Featured
                </div>

                <div className="p-6">
                  <span className="text-4xl" aria-hidden="true">{project.icon}</span>
                  <h3 className="mt-4 font-bold text-xl text-(--color-neutral-900) leading-snug">
                    {project.title}
                  </h3>
                  <p className="mt-2 text-sm text-(--color-neutral-600) leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  <div
                    className="mt-4 rounded-xl px-4 py-3 text-sm"
                    style={{ background: "var(--color-green-50)", color: "var(--color-green-800)" }}
                  >
                    <span className="font-semibold">Impact: </span>{project.impact}
                  </div>

                  <ProgressBar raised={project.raised} goal={project.goal} />

                  {project.status === "active" && (
                    <Link
                      href="/donate"
                      className="mt-5 inline-flex justify-center w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: "var(--color-green-600)" }}
                    >
                      Support This Project
                    </Link>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── All Projects ──────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--color-neutral-900)">
              All{" "}
              <span style={{ color: "var(--color-green-600)" }}>Projects</span>
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-4 mb-10">
            {/* Category filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === cat.value
                      ? "text-white shadow-sm"
                      : "bg-(--color-neutral-50) border border-(--color-neutral-200) text-(--color-neutral-600) hover:border-(--color-green-300) hover:text-(--color-green-700)"
                  }`}
                  style={
                    activeCategory === cat.value
                      ? { background: "var(--color-green-600)" }
                      : {}
                  }
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Status filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(["all", "active", "completed", "planned"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveStatus(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                    activeStatus === s
                      ? "text-white"
                      : "bg-(--color-neutral-100) text-(--color-neutral-600) hover:bg-(--color-neutral-200)"
                  }`}
                  style={
                    activeStatus === s
                      ? { background: "var(--color-green-500)" }
                      : {}
                  }
                >
                  {s === "all" ? "All Statuses" : STATUS_STYLES[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-(--color-neutral-500) mb-6 text-center">
            Showing <strong>{filtered.length}</strong> project{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Grid */}
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              <motion.div
                layout
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filtered.map((project, i) => (
                  <ProjectCard key={project.id} project={project} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="py-20 text-center text-(--color-neutral-400)"
              >
                <p className="text-5xl mb-4">🗂️</p>
                <p className="text-lg font-medium">No projects found for the selected filters.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Get Involved CTA ──────────────────────────── */}
      <section
        className="py-20 text-center relative overflow-hidden"
        style={{ background: "var(--color-green-900)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--color-gold-400) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
          <motion.h2
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-white"
          >
            Help Us Make a{" "}
            <span style={{ color: "var(--color-gold-400)" }}>Bigger Impact</span>
          </motion.h2>
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="mt-4 text-white/70 text-lg"
          >
            Your donation, time, or skills can transform a community.
            Every contribution — large or small — matters.
          </motion.p>
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/donate"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "var(--color-gold-500)" }}
            >
              Donate Now
            </Link>
            <Link
              href="/membership/apply"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-sm border-2 border-white/40 text-white hover:bg-white/10 transition-all"
            >
              Volunteer / Join Us
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
