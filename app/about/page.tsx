"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

const EKO_GREEN = "#059669";
const EKO_RED = "#dc2626";
const EKO_BLUE = "#2563eb";
const EKO_YELLOW = "#d97706";
const QUAD = [EKO_GREEN, EKO_RED, EKO_BLUE, EKO_YELLOW];

const riseIn = {
  hidden: { opacity: 0, y: 32 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const IMPACT_STATS = [
  { value: "500+", label: "Members connected", color: EKO_GREEN },
  { value: "25+", label: "Years of community", color: EKO_RED },
  { value: "1690s", label: "Recorded royal era", color: EKO_BLUE },
  { value: "5", label: "Core Lagos island divisions", color: EKO_YELLOW },
];

const STORY_PILLARS = [
  {
    title: "Mission",
    text: "We unite Lagosians in Philadelphia through service, advocacy, fellowship, and visible cultural pride.",
    color: EKO_GREEN,
  },
  {
    title: "Vision",
    text: "We are building a diaspora community that keeps Eko heritage alive while investing in people at home and abroad.",
    color: EKO_RED,
  },
  {
    title: "Promise",
    text: "We represent Lagos with dignity, modern energy, and deep respect for the city’s royal, civic, and communal traditions.",
    color: EKO_BLUE,
  },
];

const VALUES = [
  {
    icon: "🤝",
    title: "Unity in the diaspora",
    desc: "We create a trusted home for Lagosians across generations, professions, and neighbourhoods.",
    color: EKO_GREEN,
  },
  {
    icon: "🏛️",
    title: "Heritage with depth",
    desc: "We preserve the story of Eko beyond slogans, honouring the monarchy, land-owning lineages, and civic memory.",
    color: EKO_RED,
  },
  {
    icon: "🌍",
    title: "Service that travels",
    desc: "Our work connects Philadelphia to Lagos through outreach, support, and practical impact.",
    color: EKO_BLUE,
  },
  {
    icon: "💡",
    title: "Modern Eko spirit",
    desc: "We pair tradition with innovation, presenting Lagos as historic, ambitious, and globally relevant.",
    color: EKO_YELLOW,
  },
];

const EXCO_MEMBERS = [
  {
    name: "Taiwo Adesanya",
    role: "Chairperson",
    bio: "Provides strategic leadership for the club and helps shape major partnerships, advocacy priorities, and long-range direction.",
    initials: "TA",
    color: EKO_GREEN,
  },
  {
    name: "Folake Bello",
    role: "Secretary-General",
    bio: "Coordinates administration, records, and day-to-day execution so programmes move from vision to delivery with discipline.",
    initials: "FB",
    color: EKO_RED,
  },
  {
    name: "Kemi Adewale",
    role: "Legal Advisor",
    bio: "Supports governance, compliance, and policy review, helping the organisation act with clarity and institutional confidence.",
    initials: "KA",
    color: EKO_BLUE,
  },
  {
    name: "Yetunde Adewale",
    role: "Vice Chair",
    bio: "Supports executive coordination, member welfare initiatives, and cross-committee alignment across programmes and events.",
    initials: "YA",
    color: EKO_YELLOW,
  },
  {
    name: "Rotimi Ogunleye",
    role: "Projects Director",
    bio: "Oversees project delivery and community-facing initiatives, ensuring ideas are translated into measurable impact.",
    initials: "RO",
    color: EKO_GREEN,
  },
  {
    name: "Sola Afolabi",
    role: "Welfare Officer",
    bio: "Champions member care, solidarity, and the supportive culture that keeps the Eko family connected.",
    initials: "SA",
    color: EKO_RED,
  },
];

const EXCO_PILLARS = [
  { label: "Strategy", color: EKO_GREEN },
  { label: "Governance", color: EKO_RED },
  { label: "Delivery", color: EKO_BLUE },
  { label: "Care", color: EKO_YELLOW },
];

const HISTORY_PANELS = {
  origins: {
    label: "Origins of Eko",
    title: "A lagoon city first known as Eko",
    summary:
      "In telling our story, we begin with Eko itself: Lagos Island, known to the indigenes as Eko, and later called Lagos through Portuguese contact and the city’s lagoon geography.",
    bullets: [
      "We present Eko as the cultural heart of metropolitan Lagos and the traditional seat of the Oba of Lagos.",
      "We connect the name Lagos to the wetlands, waterways, and lagoon network around the island settlement.",
      "We want readers to see Lagos not just as a city, but as a layered space of monarchy, commerce, migration, and coastal identity.",
    ],
    accent: EKO_GREEN,
    kicker: "Identity",
  },
  monarchy: {
    label: "Royal lineage",
    title: "Succession shaped the political history of Lagos",
    summary:
      "We trace the line of rulers from Oba Ashipa, Oba Ado, and Oba Gabaro through Akinsemoyin, Ologun Kutere, Akitoye, Kosoko, Dosunmu, Oyekan, Esugbayi Eleko, and later monarchs.",
    bullets: [
      "We highlight the importance of Erelu Kuti’s line in succession after disputes around Akinsemoyin’s descendants.",
      "We bring forward the palace politics, exile, return, and shifting balance between royal authority and influential chiefs.",
      "We place major nineteenth-century struggles, including the contest between Akitoye and Kosoko, inside the longer story of Lagos state formation.",
    ],
    accent: EKO_RED,
    kicker: "Dynasty",
  },
  city: {
    label: "City and commerce",
    title: "From island core to economic nerve-centre",
    summary:
      "We describe the Lagos core as a highly urbanised chain centred on Lagos Island, Lagos Mainland, Surulere, Apapa, and Eti-Osa, with the city at the pivot of an expanding megacity.",
    bullets: [
      "We present Lagos as Nigeria’s chief commercial, financial, and maritime centre.",
      "We single out Apapa and Tin Can Island as key seaport spaces linked to trade and migration.",
      "We show how settlements across the island and coastal belt extend the Lagos story far beyond a single historic core.",
    ],
    accent: EKO_BLUE,
    kicker: "Urban power",
  },
  chieftaincies: {
    label: "Traditional institutions",
    title: "Chiefs, landowners, and civic authority",
    summary:
      "We close this history with recognised Lagos chieftaincies, showing how White Cap chiefs, Idejo land-owning families, Ogalade leaders, and war chiefs formed part of the city’s civic structure.",
    bullets: [
      "We highlight the White Cap hierarchy, including titled groups such as Eletu Odibo and other palace-linked chiefs.",
      "We present the Idejo class as the land-owning authority structure tied to major Lagos families and settlements.",
      "We include Abagbon war chiefs and other titled offices to reveal the institutional depth behind the city’s traditional order.",
    ],
    accent: EKO_YELLOW,
    kicker: "Institutions",
  },
} as const;

type HistoryTab = keyof typeof HISTORY_PANELS;

const ROYAL_TIMELINE = [
  {
    era: "c. 1680 - 1767",
    title: "Ashipa, Ado, and Gabaro",
    text: "We root early Lagos rulership in the sequence of Oba Ashipa, Oba Ado, and Oba Gabaro.",
    color: EKO_GREEN,
  },
  {
    era: "18th century",
    title: "Akinsemoyin and Erelu Kuti’s line",
    text: "We show how succession disputes and the elevation of Erelu Kuti’s descendants became central to the royal history that followed.",
    color: EKO_RED,
  },
  {
    era: "1806 - 1853",
    title: "Ologun Kutere to Akitoye",
    text: "We cover Adele Ajosun, Eshinlokun, Idewu Ojulari, Oluwole, Akitoye, and the struggle with Kosoko in this period.",
    color: EKO_BLUE,
  },
  {
    era: "1853 - 1965",
    title: "Dosunmu to Adeniji-Adele II",
    text: "We follow the line through Dosunmu, Oyekan I, Esugbayi Eleko, Ibikunle Akitoye, Sanusi Olusi, Falolu, and Adeniji-Adele II.",
    color: EKO_YELLOW,
  },
  {
    era: "1965 - present lineage",
    title: "Adeyinka Oyekan II to Riliwanu Akiolu I",
    text: "We connect modern Lagos memory to the later reigns that carried the throne into the contemporary era.",
    color: EKO_GREEN,
  },
];

const EKO_TODAY = [
  {
    title: "Culture",
    text: "Eko remains a cultural watershed where monarchy, chieftaincy, and modern city identity continue to meet.",
    color: EKO_GREEN,
  },
  {
    title: "Commerce",
    text: "We present Lagos as the commercial, financial, and maritime nerve-centre of Nigeria.",
    color: EKO_RED,
  },
  {
    title: "Mobility",
    text: "Ports, coastlines, and migration patterns made Lagos a gateway city drawing people from across Nigeria and beyond.",
    color: EKO_BLUE,
  },
  {
    title: "Community",
    text: "Eko Club Philadelphia carries that cosmopolitan energy into diaspora organising, fellowship, and collective uplift.",
    color: EKO_YELLOW,
  },
];

function QuadBar() {
  return (
    <div className="flex h-1.5 w-28 overflow-hidden rounded-full" aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  text,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  text: string;
  align?: "left" | "center";
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      <motion.div variants={riseIn} custom={0} className={align === "center" ? "flex justify-center" : "flex"}>
        <QuadBar />
      </motion.div>
      <motion.span
        variants={riseIn}
        custom={0.08}
        className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-neutral-500"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        variants={riseIn}
        custom={0.16}
        className="mt-5 text-3xl font-black tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
      <motion.p
        variants={riseIn}
        custom={0.24}
        className="mt-4 text-base leading-8 text-neutral-600 sm:text-lg"
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("origins");
  const activePanel = HISTORY_PANELS[activeTab];

  return (
    <div className="bg-white text-neutral-950">
      <section className="relative isolate overflow-hidden bg-neutral-950">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top left, rgba(5,150,105,0.28), transparent 28%), radial-gradient(circle at top right, rgba(37,99,235,0.20), transparent 24%), linear-gradient(135deg, rgba(10,10,10,0.98), rgba(18,18,18,0.92))",
          }}
        />

        {QUAD.map((color, index) => (
          <motion.div
            key={color}
            className="pointer-events-none absolute rounded-full blur-3xl"
            style={{
              background: color,
              opacity: 0.18,
              width: 260,
              height: 260,
              left: `${8 + index * 20}%`,
              top: index % 2 === 0 ? "10%" : "52%",
            }}
            animate={{ y: [0, -24, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 7 + index,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.45,
            }}
          />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="grid items-end gap-14 lg:grid-cols-[1.2fr_0.8fr]">
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
              <motion.div
                variants={riseIn}
                custom={0}
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md"
              >
                {QUAD.map((color) => (
                  <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                ))}
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white/80">
                  About Eko Club Philadelphia
                </span>
              </motion.div>

              <motion.h1
                variants={riseIn}
                custom={0.08}
                className="mt-7 text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl lg:text-7xl"
              >
                Built on the <span style={{ color: EKO_GREEN }}>spirit of Eko</span>, shaped by
                <span style={{ color: EKO_YELLOW }}> history</span>, service, and community.
              </motion.h1>

              <motion.p
                variants={riseIn}
                custom={0.16}
                className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg"
              >
                We are a modern diaspora home for Lagosians, and we present our story as part of the
                larger history of Lagos itself, from royal succession and traditional institutions to
                the rise of the city as Nigeria’s commercial heartbeat.
              </motion.p>

              <motion.div variants={riseIn} custom={0.24} className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/membership/apply"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-black text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}66` }}
                >
                  Join the community
                </Link>
                <Link
                  href="#lagos-history"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Explore Lagos history
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-4 rounded-4xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
            >
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">What drives us</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
                  Preserving Lagos identity with a home-page level experience.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Here, we present our history and the history of Lagos in clear sections, with the
                  same modern visual energy that defines our home page.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {IMPACT_STATS.map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                    <div className="text-3xl font-black tracking-[-0.04em]" style={{ color: item.color }}>
                      {item.value}
                    </div>
                    <div className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -right-10 top-0 select-none text-[14rem] font-black leading-none text-neutral-100">
          EKO
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <SectionIntro
            eyebrow="Why we exist"
            title="A diaspora chapter with roots deep in Lagos memory"
            text="We are sharing more than the story of a club. We are presenting a story of belonging: a community shaped by the heritage of Eko and committed to carrying that heritage into new generations in Philadelphia."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-5"
          >
            {STORY_PILLARS.map((pillar, index) => (
              <motion.article
                key={pillar.title}
                variants={riseIn}
                custom={index * 0.08}
                className="group rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-neutral-950">{pillar.title}</h3>
                  <span className="h-3 w-3 rounded-full" style={{ background: pillar.color }} />
                </div>
                <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">{pillar.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Eko values"
            title="The principles behind our programmes, partnerships, and presence"
            text="Everything we do is anchored in community trust, visible culture, and practical service. As we present our history, we also show the values that keep our movement alive."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {VALUES.map((value, index) => (
              <motion.article
                key={value.title}
                variants={riseIn}
                custom={index * 0.07}
                className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${value.color}12` }}>
                  {value.icon}
                </div>
                <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-neutral-950">{value.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{value.desc}</p>
                <div className="mt-6 h-1.5 w-16 rounded-full" style={{ background: value.color }} />
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-neutral-50 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:gap-16">
          <div>
            <SectionIntro
              eyebrow="Executive council"
              title="Meet the exco behind the direction of ECP"
              text="We also want you to meet the people responsible for leadership, continuity, and accountability. This is our executive team, presented with the same care and polish as the rest of our story."
            />

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-8 rounded-4xl border border-neutral-200 bg-neutral-50 p-6"
            >
              <motion.p variants={riseIn} custom={0} className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">
                How the exco leads
              </motion.p>
              <motion.div variants={riseIn} custom={0.08} className="mt-5 grid gap-3 sm:grid-cols-2">
                {EXCO_PILLARS.map((pillar) => (
                  <div key={pillar.label} className="rounded-3xl border border-white bg-white px-4 py-4">
                    <div className="h-2 w-14 rounded-full" style={{ background: pillar.color }} />
                    <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-neutral-700">
                      {pillar.label}
                    </p>
                  </div>
                ))}
              </motion.div>
              <motion.p variants={riseIn} custom={0.16} className="mt-5 text-sm leading-7 text-neutral-600">
                Our exco anchors planning, member communication, governance, and execution. It is the
                leadership layer that keeps Eko Club Philadelphia organised, responsive, and visibly aligned
                with our mission.
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          >
            {EXCO_MEMBERS.map((member, index) => (
              <motion.article
                key={member.name}
                variants={riseIn}
                custom={index * 0.06}
                className="group rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black text-white"
                    style={{ background: member.color }}
                  >
                    {member.initials}
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-900"
                    style={{ background: `${member.color}18` }}
                  >
                    {member.role}
                  </span>
                </div>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-neutral-950">{member.name}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{member.bio}</p>
                <div className="mt-6 h-1.5 w-16 rounded-full" style={{ background: member.color }} />
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="lagos-history" className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-neutral-200 to-transparent" />

        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-24">
            <SectionIntro
              eyebrow="History of Lagos"
              title="How we present the history of Lagos"
              text="We have brought the Lagos history we preserve into clear, animated sections so readers can understand how Eko evolved through identity, monarchy, commerce, and traditional institutions."
            />

            <div className="mt-8 flex flex-wrap gap-2">
              {(Object.entries(HISTORY_PANELS) as [HistoryTab, (typeof HISTORY_PANELS)[HistoryTab]][]).map(
                ([key, panel]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all"
                    style={{
                      borderColor: activeTab === key ? panel.accent : "#e5e7eb",
                      background: activeTab === key ? `${panel.accent}14` : "#ffffff",
                      color: activeTab === key ? "#0a0a0a" : "#525252",
                    }}
                  >
                    {panel.label}
                  </button>
                ),
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-4xl border border-neutral-200 bg-neutral-50 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.08)] sm:p-8"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-neutral-950"
                  style={{ background: `${activePanel.accent}20` }}
                >
                  {activePanel.kicker}
                </span>
                <QuadBar />
              </div>

              <h3 className="mt-6 text-3xl font-black tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                {activePanel.title}
              </h3>
              <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-600 sm:text-lg">
                {activePanel.summary}
              </p>

              <div className="mt-8 grid gap-4">
                {activePanel.bullets.map((bullet, index) => (
                  <motion.div
                    key={bullet}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: index * 0.08 }}
                    className="flex gap-4 rounded-[1.25rem] border border-white bg-white p-5"
                  >
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: activePanel.accent }} />
                    <p className="text-sm leading-7 text-neutral-600 sm:text-base">{bullet}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section className="bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Royal succession"
            title="How we trace the royal lineage of Lagos"
            text="We present the genealogical record and the line of Obas of Lagos in a clear, modern timeline without losing the weight and dignity of the original history."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 lg:grid-cols-5"
          >
            {ROYAL_TIMELINE.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.07}
                className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur-md"
              >
                <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: item.color }} />
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">{item.era}</p>
                <h3 className="mt-4 text-2xl font-black tracking-[-0.03em] text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/68">{item.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Lagos now"
            title="Why this history still matters to the Eko story today"
            text="For us, this history does not stay in the past. It helps explain why Lagos still carries unusual cultural weight, institutional memory, and economic magnetism, and why communities like ours continue to organise around that identity."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {EKO_TODAY.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.06}
                className="rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-6"
              >
                <div className="h-2 w-16 rounded-full" style={{ background: item.color }} />
                <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-neutral-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{item.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, ${EKO_GREEN} 0%, ${EKO_RED} 33%, ${EKO_BLUE} 66%, ${EKO_YELLOW} 100%)`,
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex justify-center">
              <QuadBar />
            </div>
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
              Keep the <span style={{ color: EKO_YELLOW }}>Eko spirit</span> moving.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Join a community that celebrates Lagos with depth, style, and action. From heritage to
              service, this is where memory becomes movement.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-black text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO_GREEN }}
              >
                Apply for membership
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                See upcoming events
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
