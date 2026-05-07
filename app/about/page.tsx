"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

/* ─── Animation helpers ───────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

/* ─── Data ────────────────────────────────────────── */
const CORE_VALUES = [
  {
    icon: "🤝",
    title: "Unity",
    desc: "We promote solidarity among Lagosians in the diaspora, building bonds that transcend distance.",
  },
  {
    icon: "🌍",
    title: "Service",
    desc: "Every initiative we undertake is driven by genuine service to our community here and back home.",
  },
  {
    icon: "🏛️",
    title: "Heritage",
    desc: "We celebrate and preserve the rich cultural identity of Lagos for future generations.",
  },
  {
    icon: "🎓",
    title: "Empowerment",
    desc: "We invest in education, skills, and civic engagement to uplift our community.",
  },
  {
    icon: "🔊",
    title: "Advocacy",
    desc: "We amplify the voice of displaced Lagosians and advocate for inclusive policy at every level.",
  },
  {
    icon: "💡",
    title: "Innovation",
    desc: "We embrace modern ideas and technology to make our programmes more impactful.",
  },
];

const TIMELINE = [
  {
    year: "1998",
    title: "Foundation",
    desc: "A group of Lagos-born professionals in Philadelphia founded Eko Club Philadelphia as a chapter of Eko Club International.",
  },
  {
    year: "2003",
    title: "First Cultural Gala",
    desc: "Hosted our inaugural Annual Cultural Gala, celebrating Lagos heritage and raising funds for community projects.",
  },
  {
    year: "2008",
    title: "Youth Wing Launched",
    desc: "Established the Youth Empowerment Committee to mentor second-generation Lagosians in the Delaware Valley.",
  },
  {
    year: "2012",
    title: "Scholarship Programme",
    desc: "Launched the ECP Merit Scholarship, awarding annual bursaries to outstanding students of Lagos heritage.",
  },
  {
    year: "2017",
    title: "Community Centre Partnership",
    desc: "Partnered with the Philadelphia African Cultural Centre to create a permanent home for our monthly events.",
  },
  {
    year: "2020",
    title: "Digital Pivot",
    desc: "Transitioned fully to digital membership and virtual events, growing our reach across the entire East Coast.",
  },
  {
    year: "2024",
    title: "500+ Members",
    desc: "Hit 500 registered members across the Delaware Valley — our largest membership milestone yet.",
  },
];

const LEADERSHIP = [
  {
    name: "Chief Adebayo Olatunde",
    title: "President",
    bio: "A two-term president with 20+ years in community leadership. Chief Olatunde is a Senior Partner at Olatunde & Associates Law Firm.",
    img: "",
    initials: "AO",
  },
  {
    name: "Mrs. Yetunde Adewale",
    title: "Vice President",
    bio: "A healthcare executive and advocate for diaspora economic inclusion. Mrs. Adewale chairs our Healthcare Outreach Committee.",
    img: "",
    initials: "YA",
  },
  {
    name: "Mr. Folake Bello",
    title: "General Secretary",
    bio: "A certified accountant and governance specialist who has served as secretary since 2018.",
    img: "",
    initials: "FB",
  },
  {
    name: "Dr. Kemi Adeleke",
    title: "Treasurer",
    bio: "An economist and financial analyst ensuring transparent stewardship of club resources.",
    img: "",
    initials: "KA",
  },
  {
    name: "Mr. Rotimi Ogunleye",
    title: "Director of Projects",
    bio: "Civil engineer and urban planner overseeing all community development and infrastructure advocacy projects.",
    img: "",
    initials: "RO",
  },
  {
    name: "Mrs. Sola Afolabi",
    title: "Welfare Officer",
    bio: "Social worker and community counsellor dedicated to the well-being of every ECP member and their families.",
    img: "",
    initials: "SA",
  },
];

const COMMITTEES = [
  { icon: "🎭", name: "Cultural Affairs", desc: "Preserving and celebrating Lagos culture through events, arts, and festivals." },
  { icon: "🎓", name: "Youth Empowerment", desc: "Mentorship, skills training, and civic education for young Lagosians." },
  { icon: "🏥", name: "Healthcare Outreach", desc: "Free health screenings, mental health awareness, and insurance literacy drives." },
  { icon: "🌿", name: "Environment", desc: "Clean waterway advocacy and environmental awareness campaigns." },
  { icon: "📚", name: "Education", desc: "Scholarships, school outreach, and academic support for members' children." },
  { icon: "🏗️", name: "Infrastructure Advocacy", desc: "Lobbying for improved roads, drainage, and public facilities in Lagos." },
];

/* ─── Page ────────────────────────────────────────── */
export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<"mission" | "vision" | "values">("mission");

  return (
    <div className="bg-white text-(--color-neutral-900)">

      {/* ── Hero ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 md:py-32"
        style={{ background: "var(--color-green-900)" }}
      >
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--color-gold-400)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "var(--color-green-300)" }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.span
            variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-block rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ background: "var(--color-gold-500)", color: "#fff" }}
          >
            Who We Are
          </motion.span>
          <motion.h1
            variants={fadeUp} initial="hidden" animate="show" custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight"
          >
            About{" "}
            <span style={{ color: "var(--color-gold-400)" }}>Eko Club Philadelphia</span>
          </motion.h1>
          <motion.p
            variants={fadeUp} initial="hidden" animate="show" custom={2}
            className="mt-6 max-w-2xl mx-auto text-lg text-white/75 leading-relaxed"
          >
            A proud chapter of Eko Club International — uniting Lagosians across
            the Delaware Valley since 1998 through culture, service, and solidarity.
          </motion.p>

          {/* Quick stats */}
          <motion.div
            variants={fadeUp} initial="hidden" animate="show" custom={3}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6"
          >
            {[
              { value: "500+", label: "Members" },
              { value: "25+", label: "Years Active" },
              { value: "12", label: "Committees" },
              { value: "₦50M+", label: "Raised for Projects" },
            ].map((s) => (
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

      {/* ── Mission / Vision / Values tabs ───────────── */}
      <section className="py-20" style={{ background: "var(--color-neutral-50)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Tab nav */}
          <div className="flex justify-center mb-10 gap-2 flex-wrap">
            {(["mission", "vision", "values"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? "text-white shadow-sm"
                    : "bg-white border border-(--color-neutral-200) text-(--color-neutral-600) hover:border-(--color-green-400) hover:text-(--color-green-600)"
                }`}
                style={
                  activeTab === tab
                    ? { background: "var(--color-green-600)" }
                    : {}
                }
              >
                {tab === "mission" ? "🎯 Mission" : tab === "vision" ? "🔭 Vision" : "💎 Values"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "mission" && (
              <motion.div
                key="mission"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--color-green-700)" }}>
                  Our Mission
                </h2>
                <p className="text-lg text-(--color-neutral-700) leading-relaxed">
                  To foster unity, cultural pride, and social responsibility among Lagosians
                  living in Philadelphia and the broader Delaware Valley — while actively
                  contributing to the development of our communities both here and in Lagos State.
                </p>
              </motion.div>
            )}
            {activeTab === "vision" && (
              <motion.div
                key="vision"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
                className="max-w-3xl mx-auto text-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: "var(--color-green-700)" }}>
                  Our Vision
                </h2>
                <p className="text-lg text-(--color-neutral-700) leading-relaxed">
                  A world where every Lagosian in the diaspora is connected, empowered, and
                  actively building bridges between their heritage and their adopted home —
                  creating lasting impact on both sides of the Atlantic.
                </p>
              </motion.div>
            )}
            {activeTab === "values" && (
              <motion.div
                key="values"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center" style={{ color: "var(--color-green-700)" }}>
                  Our Core Values
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {CORE_VALUES.map((v, i) => (
                    <motion.div
                      key={v.title}
                      variants={fadeUp}
                      initial="hidden"
                      animate="show"
                      custom={i}
                      className="bg-white rounded-2xl p-6 border border-(--color-neutral-200) hover:shadow-md transition-shadow"
                    >
                      <span className="text-3xl">{v.icon}</span>
                      <h3 className="mt-3 font-bold text-lg text-(--color-neutral-900)">{v.title}</h3>
                      <p className="mt-1 text-sm text-(--color-neutral-600) leading-relaxed">{v.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Story / History Timeline ──────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ background: "var(--color-green-100)", color: "var(--color-green-700)" }}
            >
              Our Journey
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--color-neutral-900)">
              A History of{" "}
              <span style={{ color: "var(--color-green-600)" }}>Community &amp; Impact</span>
            </h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-0 bottom-0 w-0.5 md:left-1/2"
              style={{ background: "var(--color-green-200)" }}
            />

            <div className="flex flex-col gap-10">
              {TIMELINE.map((item, i) => (
                <motion.div
                  key={item.year}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-60px" }}
                  custom={i % 4}
                  className={`relative flex gap-6 md:w-1/2 ${
                    i % 2 === 0 ? "md:self-start md:pl-0 md:pr-8" : "md:self-end md:pl-8 md:pr-0"
                  }`}
                >
                  {/* Dot */}
                  <div
                    className={`absolute top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm flex-shrink-0 left-4 md:left-auto ${
                      i % 2 === 0 ? "md:-right-2.5" : "md:-left-2.5"
                    }`}
                    style={{ background: "var(--color-green-500)" }}
                  />
                  <div className="pl-8 md:pl-0">
                    <span
                      className="inline-block text-xs font-bold rounded-full px-3 py-0.5 mb-2"
                      style={{
                        background: "var(--color-gold-100)",
                        color: "var(--color-gold-700)",
                      }}
                    >
                      {item.year}
                    </span>
                    <h3 className="font-bold text-lg text-(--color-neutral-900)">{item.title}</h3>
                    <p className="mt-1 text-sm text-(--color-neutral-600) leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Leadership ────────────────────────────────── */}
      <section className="py-20" style={{ background: "var(--color-neutral-50)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ background: "var(--color-green-100)", color: "var(--color-green-700)" }}
            >
              Leadership
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--color-neutral-900)">
              Meet the{" "}
              <span style={{ color: "var(--color-green-600)" }}>Executive Council</span>
            </h2>
            <p className="mt-3 text-(--color-neutral-600) max-w-xl mx-auto">
              Dedicated servants of the community elected to guide Eko Club Philadelphia
              towards its vision.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {LEADERSHIP.map((person, i) => (
              <motion.div
                key={person.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                custom={i % 3}
                className="bg-white rounded-2xl p-6 border border-(--color-neutral-200) hover:shadow-md transition-shadow flex flex-col items-center text-center"
              >
                {/* Avatar */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-sm mb-4"
                  style={{ background: "var(--color-green-600)" }}
                >
                  {person.initials}
                </div>
                <h3 className="font-bold text-lg text-(--color-neutral-900)">{person.name}</h3>
                <span
                  className="mt-1 text-xs font-semibold uppercase tracking-wide px-3 py-0.5 rounded-full"
                  style={{ background: "var(--color-gold-100)", color: "var(--color-gold-700)" }}
                >
                  {person.title}
                </span>
                <p className="mt-3 text-sm text-(--color-neutral-600) leading-relaxed">{person.bio}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Committees ────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ background: "var(--color-green-100)", color: "var(--color-green-700)" }}
            >
              Committees
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-(--color-neutral-900)">
              How We{" "}
              <span style={{ color: "var(--color-green-600)" }}>Organise Our Work</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMMITTEES.map((c, i) => (
              <motion.div
                key={c.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-60px" }}
                custom={i % 3}
                className="group rounded-2xl p-6 border border-(--color-neutral-200) hover:border-(--color-green-300) hover:shadow-md transition-all bg-white"
              >
                <span className="text-3xl">{c.icon}</span>
                <h3 className="mt-3 font-bold text-lg text-(--color-neutral-900) group-hover:text-(--color-green-700) transition-colors">
                  {c.name}
                </h3>
                <p className="mt-1 text-sm text-(--color-neutral-600) leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partners / Affiliation strip ─────────────── */}
      <section className="border-y border-(--color-neutral-200) py-12" style={{ background: "var(--color-neutral-50)" }}>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-(--color-neutral-400) mb-6">
            Affiliated With &amp; Recognised By
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-(--color-neutral-500)">
            {[
              "Eko Club International",
              "Lagos State Government Diaspora Office",
              "Nigerian Community of Philadelphia",
              "African Cultural Council — PA",
              "Consulate General of Nigeria — New York",
            ].map((org) => (
              <span
                key={org}
                className="px-4 py-2 rounded-full bg-white border border-(--color-neutral-200) shadow-xs"
              >
                {org}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
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
            Ready to Join the{" "}
            <span style={{ color: "var(--color-gold-400)" }}>Community?</span>
          </motion.h2>
          <motion.p
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}
            className="mt-4 text-white/70 text-lg"
          >
            Become part of a vibrant network of Lagosians making a difference in
            Philadelphia and beyond.
          </motion.p>
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={2}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/membership/apply"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-sm transition-all text-white"
              style={{ background: "var(--color-gold-500)" }}
            >
              Apply for Membership
            </Link>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-semibold text-sm border-2 border-white/40 text-white hover:bg-white/10 transition-all"
            >
              See Upcoming Events
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
