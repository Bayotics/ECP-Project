"use client";

import Link from "next/link";
import { motion } from "framer-motion";

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

const PROJECT_STATS = [
  { value: "5", label: "Annual service programmes", color: EKO_GREEN },
  { value: "2", label: "High school awards", color: EKO_RED },
  { value: "3", label: "College awards", color: EKO_BLUE },
  { value: "2mi", label: "Bucks County clean-up", color: EKO_YELLOW },
];

const MISSION_VISION = [
  {
    title: "Our Mission",
    text: "We preserve and support our cultural heritage, render humanitarian assistance to those in need, encourage community development and outreach, and organise the family and friends of Lagos, Nigeria, for worthy causes.",
    color: EKO_GREEN,
  },
  {
    title: "Our Vision",
    text: "We envision a world where peace prevails and where abundant opportunities exist for our youth and for a strong, vibrant senior community.",
    color: EKO_RED,
  },
  {
    title: "Core Values",
    text: "Professionalism, discipline, and integrity shape the way we plan, serve, and deliver our initiatives.",
    color: EKO_BLUE,
  },
];

const FOCUS_AREAS = [
  {
    title: "Community services",
    text: "We provide a variety of services to underprivileged Lagosian Americans and other minorities in Philadelphia and the surrounding area.",
    icon: "🏙️",
    color: EKO_GREEN,
  },
  {
    title: "Scholarships",
    text: "We provide scholarships to minority high school and college students as part of our educational outreach.",
    icon: "🎓",
    color: EKO_RED,
  },
  {
    title: "Humanitarian support",
    text: "We assist homeless families with humanitarian services and practical support where it is most needed.",
    icon: "🤲",
    color: EKO_BLUE,
  },
  {
    title: "Thanksgiving outreach",
    text: "We provide an annual Thanksgiving food drive to the community as a recurring expression of service and care.",
    icon: "🧺",
    color: EKO_YELLOW,
  },
];

const SERVICE_PROGRAMS = [
  {
    title: "Ronald McDonald House Make-A-Meal Program",
    subtitle: "Family care through direct service",
    text: "We provide breakfast at the PA-RMH for families staying at Ronald McDonald House. The programme has remained a strong and consistent success over the past four years.",
    icon: "🍽️",
    accent: EKO_GREEN,
  },
  {
    title: "Back to School with HomeFront Program",
    subtitle: "Helping children start strong",
    text: "Our participants provide backpacks, school uniforms, school supplies, and monetary donations to children in need as families prepare for a new school year.",
    icon: "🎒",
    accent: EKO_RED,
  },
  {
    title: "ECP Scholarship Program",
    subtitle: "Opening doors through education",
    text: "We award scholarships to 2 high school graduates and 3 college students, extending educational support where it can make a lasting difference.",
    icon: "🏅",
    accent: EKO_BLUE,
  },
  {
    title: "PA Adopt-A-Highway Program",
    subtitle: "Visible environmental stewardship",
    text: "We walk a two-mile stretch in Bucks County, Pennsylvania, picking up visible trash and waste as part of our environmental service commitment.",
    icon: "🛣️",
    accent: EKO_YELLOW,
  },
  {
    title: "Thanksgiving Basket Food Drive",
    subtitle: "Seasonal support for families",
    text: "Each year, we host our annual Thanksgiving food drive to provide assistance to families in need within our community.",
    icon: "🦃",
    accent: EKO_GREEN,
  },
];

const IMPACT_POINTS = [
  {
    title: "Students supported",
    text: "Our scholarship programme specifically names awards for 2 high school graduates and 3 college students.",
    color: EKO_GREEN,
  },
  {
    title: "Families served",
    text: "From Ronald McDonald House service to the Thanksgiving drive, our work stays close to the needs of families.",
    color: EKO_RED,
  },
  {
    title: "Community presence",
    text: "Our initiatives stay visible in Philadelphia, Bucks County, and the surrounding region through recurring, practical outreach.",
    color: EKO_BLUE,
  },
  {
    title: "Service with discipline",
    text: "Professionalism, discipline, and integrity remain the standard behind every project we present and every programme we run.",
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

export default function ProjectsPage() {
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
            transition={{ duration: 7 + index, repeat: Infinity, ease: "easeInOut", delay: index * 0.45 }}
          />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
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
                  Projects & Initiatives
                </span>
              </motion.div>

              <motion.h1
                variants={riseIn}
                custom={0.08}
                className="mt-7 text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl lg:text-7xl"
              >
                The <span style={{ color: EKO_GREEN }}>work we do</span>, the
                <span style={{ color: EKO_YELLOW }}> people we serve</span>.
              </motion.h1>

              <motion.p
                variants={riseIn}
                custom={0.16}
                className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg"
              >
                Our projects page now reflects the real initiatives of Eko Club Philadelphia: direct
                family support, scholarships, community outreach, environmental service, and seasonal
                assistance carried out with discipline and purpose.
              </motion.p>

              <motion.div variants={riseIn} custom={0.24} className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="#service-programs"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-black text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}66` }}
                >
                  Explore service programmes
                </Link>
                <Link
                  href="/donate"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Support our work
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
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">What this page presents</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
                  Real club initiatives, not placeholder programmes.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  We now present the mission, focus areas, and annual service programmes drawn from the
                  club’s own initiative text, all in the same visual language as the home and about pages.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {PROJECT_STATS.map((item) => (
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
            eyebrow="Purpose"
            title="Our mission and vision guide every initiative we run"
            text="The club’s projects do not stand alone. They flow directly from our mission to preserve heritage, provide humanitarian assistance, strengthen community development and outreach, and bring family and friends of Lagos together for worthy causes."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-5"
          >
            {MISSION_VISION.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.08}
                className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-black tracking-[-0.03em] text-neutral-950">{item.title}</h3>
                  <span className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                </div>
                <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">{item.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Our focus"
            title="The areas that shape our projects and outreach"
            text="We focus our service on practical areas where the club can make a visible difference: community support, scholarships, humanitarian assistance, and recurring food outreach."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {FOCUS_AREAS.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.07}
                className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${item.color}12` }}>
                  {item.icon}
                </div>
                <h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-neutral-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-600">{item.text}</p>
                <div className="mt-6 h-1.5 w-16 rounded-full" style={{ background: item.color }} />
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="service-programs" className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Annual service programs"
            title="The initiatives we present as part of our recurring service"
            text="These programmes are the real initiatives of our club. They show how we support families, students, children, and neighbourhoods through direct and repeatable action."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 lg:grid-cols-2 xl:grid-cols-3"
          >
            {SERVICE_PROGRAMS.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.06}
                className="group rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: `${item.accent}12` }}>
                    {item.icon}
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-neutral-900"
                    style={{ background: `${item.accent}18` }}
                  >
                    Service
                  </span>
                </div>

                <div className="mt-5 h-1.5 w-16 rounded-full" style={{ background: item.accent }} />
                <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-neutral-950">{item.title}</h3>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-neutral-500">{item.subtitle}</p>
                <p className="mt-4 text-sm leading-7 text-neutral-600">{item.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="What this work delivers"
            title="How our initiatives create practical impact"
            text="Our projects are designed to be concrete, disciplined, and community-facing. We feed families, support students, show up for children, and remain present in the places where service is needed."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {IMPACT_POINTS.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.06}
                className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur-md"
              >
                <div className="h-2 w-16 rounded-full" style={{ background: item.color }} />
                <h3 className="mt-5 text-2xl font-black tracking-[-0.03em] text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/68">{item.text}</p>
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
              Help us keep <span style={{ color: EKO_YELLOW }}>these initiatives moving</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Support the projects that define our service: family care, scholarship, outreach, food
              support, and community responsibility delivered with the Eko spirit.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/donate"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-black text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO_GREEN }}
              >
                Donate now
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                Read our story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
