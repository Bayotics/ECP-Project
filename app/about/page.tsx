"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { cn } from "@/utils/cn";

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


const STORY_PILLARS = [
  {
    title: "Mission",
    text: "To unite Lagosians, preserve our cultural heritage, promote fellowship, and serve our members and communities through charitable, educational, cultural, and humanitarian initiatives.",
    color: EKO_GREEN,
  },
  {
    title: "Vision",
    text: "To be a vibrant and sustainable organization that celebrates Lagosian heritage, strengthens our community, empowers future generations, and creates lasting positive impact.",
    color: EKO_RED,
  },
  {
    title: "Core Values",
    text: "Professionalism, discipline, and integrity guide the way we serve, lead, and represent Eko Club Philadelphia.",
    color: EKO_BLUE,
  },
];

/* Copy is unchanged; each entry just gains a photo now that these render as
   image panels rather than icon cards. Two of the four photographs show the
   thing they are captioned with — the Adopt-a-Highway sign and the
   Thanksgiving food drive. The other two are general ECP service turnouts:
   we have no photograph of a scholarship presentation or of assistance to a
   homeless family, and rather than pass an unrelated scene off as one, they
   sit under their captions as what they are — members out serving. */
const VALUES = [
  {
    image: "/gallery/event8.JPG",
    title: "Support in our communities",
    desc: "We provide a variety of services to underprivileged Lagosian Americans and other minorities in Philadelphia and the surrounding area.",
    color: EKO_GREEN,
  },
  {
    image: "/gallery/event3.JPG",
    title: "Scholarship support",
    desc: "We provide scholarships to minority high school and college students as part of our long-term investment in education.",
    color: EKO_RED,
  },
  {
    image: "/gallery/event4.JPG",
    title: "Humanitarian assistance",
    desc: "We assist homeless families with humanitarian services and practical care wherever help is needed most.",
    color: EKO_BLUE,
  },
  {
    image: "/gallery/about/right-about-hero-1.jpg",
    title: "Thanksgiving outreach",
    desc: "We provide an annual Thanksgiving food drive to the community as part of our commitment to consistent service.",
    color: EKO_YELLOW,
  },
];

const SERVICE_PROGRAMS = [
  {
    title: "Ronald McDonald House Make-A-Meal Program",
    text: "We provide breakfast at the PA-RMH for families staying at Ronald McDonald House, and the programme has remained a strong and consistent success over the past four years.",
    icon: "🍽️",
    accent: EKO_GREEN,
  },
  {
    title: "Back to School with HomeFront Program",
    text: "Our participants provide backpacks, school uniforms, school supplies, and monetary donations to children in need as families prepare for a new school year.",
    icon: "🎒",
    accent: EKO_RED,
  },
  {
    title: "ECP Scholarship Program",
    text: "We award scholarships to 2 high school graduates and 3 college students, extending educational support where it can make a lasting difference.",
    icon: "🏅",
    accent: EKO_BLUE,
  },
  {
    title: "PA Adopt-A-Highway Program",
    text: "We walk a two-mile stretch in Bucks County, Pennsylvania, picking up visible trash and waste as part of our environmental service commitment.",
    icon: "🛣️",
    accent: EKO_YELLOW,
  },
  {
    title: "Thanksgiving Basket Food Drive",
    text: "Each year, we host our annual Thanksgiving food drive to provide assistance to families in need within our community.",
    icon: "🦃",
    accent: EKO_GREEN,
  },
];

/* Real office holders, taken from the official portrait badges in
   /public/gallery/excos. Those source images carry the name and role baked
   into the artwork, which turns into an illegible smudge at card size — so
   each card crops to the portrait and renders the name and role as real
   text instead. The zoom (EXCO_ZOOM) is tight enough that the baked-in
   caption falls below the visible crop; `focusY` (a percentage down the
   source image) is the point that zoom centres on, tuned per photo so each
   face lands centred despite headwraps and caps sitting at different
   heights.

   Deliberately no bios: these are real people, and inventing career
   summaries for them would be putting words in their mouths. */
const EXCO_ZOOM = 2.6;

const EXCO_MEMBERS = [
  {
    name: "Hon. Olabisi Dabiri-Okoya",
    role: "President",
    image: "/gallery/excos/olabisi-dabiri-okoya.png",
    focusY: 26,
    color: EKO_GREEN,
  },
  {
    name: "Hon. Adebimpe Daniells",
    role: "Vice President",
    image: "/gallery/excos/adebimpe-daniells.png",
    focusY: 26,
    color: EKO_RED,
  },
  {
    name: "Hon. Olabisi Lawal",
    role: "Treasurer / Financial Secretary",
    image: "/gallery/excos/olabisi-lawal.png",
    focusY: 37,
    color: EKO_BLUE,
  },
  {
    name: "Hon. Folashade Adedeji",
    role: "PRO / Social Secretary",
    image: "/gallery/excos/folashade-adedeji.png",
    focusY: 37,
    color: EKO_YELLOW,
  },
  {
    name: "Hon. Bola Okoya",
    role: "Chairman, Board of Trustees",
    image: "/gallery/excos/bola-okoya.png",
    focusY: 21,
    color: EKO_GREEN,
  },
  {
    name: "Hon. Elder Modupe Mabinuori-Olageshin",
    role: "Vice Chairwoman / Treasurer, Board of Trustees",
    image: "/gallery/excos/modupe-mabinuori-olageshin.png",
    focusY: 26,
    color: EKO_RED,
  },
  {
    name: "Hon. Saheed Abdullateef",
    role: "Secretary, Board of Trustees",
    image: "/gallery/excos/saheed-abdullateef.png",
    focusY: 18,
    color: EKO_BLUE,
  },
];

/* Matrons and patrons. Same badge-artwork source format as the excos, so the
   same crop treatment applies (see the EXCO_MEMBERS note above). Only the two
   people who supplied a written biography carry a `bio` — the other two open
   nothing, because inventing a career summary for a real person is not ours
   to do. Bios are transcribed verbatim from the documents in
   /public/gallery/patrons. */
const PATRON_ZOOM = 2.4;

type Person = {
  name: string;
  role: string;
  image: string;
  /** Point down the SOURCE image, as a percentage, that the crop centres on. */
  focusY: number;
  color: string;
  bio?: string[];
};

const PATRONS: Person[] = [
  {
    name: "Otunba TJ Abass",
    role: "Grand Patron",
    image: "/gallery/patrons/tj-abass.png",
    focusY: 30,
    color: EKO_GREEN,
  },
  {
    name: "Dr. Ganiyu Mimiko",
    role: "Patron",
    image: "/gallery/patrons/ganiyu-mimiko.png",
    focusY: 30,
    color: EKO_BLUE,
    bio: [
      "Dr. Ganiyu Mimiko was born in Ondo City. He attended Ansar-Ud-Deen primary school, Okelisa from 1963 to 1969. He also attended Jubilee Secondary Modern School in 1970 and attended Independence Grammar School in 1971. He transferred to Ondo Boys High School (OHS) where he completed his secondary school from 1972 to 1975.",
      "Dr. Mimiko worked with Monier Construction Company (MCC) in Port Harcourt from 1975 to 1982 and was the Laboratory Technical Manager (Grade 1) before leaving for the United State America (USA). While in the USA, he attended the University of District of Columbia (UDC) and obtained his undergraduate (BS) diploma in Civil Engineering in 1988. He joined Connecticut Department of Transportation (CONNDOT) in 1989 till present. As a Project Manager, he oversees various aspects of construction projects. In his quest for more academic advancement, he attended University of New Haven (UNH) and obtained his graduate (MS) diploma in Environmental Engineering 1993. He bagged his doctoral (Ph.D.) degree in Engineering Management from National University in 2009.",
      "Dr. Mimiko received Certificate of Recognition from American Society of Civil Engineering (National Capital Section) in 1989. He received Certificate of Achievement from Government Institutes, Inc. Washington, DC. He was elected Affiliate Member by the American Society of Civil Engineering for the advancement of professional knowledge and the improvement of civil Engineering. In 2015, after the completion of his Pharmacy Technician Program, he was certified by Ashworth Career School Alpha of Georgia and was enlisted as a member of the International Honor society Delta Epsilon Tau.",
      "Dr. Mimiko is a former president of Yoruba Community Club (YCC). Also, he was a former president and currently the Treasurer of Ondo Elite Club (OEC) of Rhode Island. In addition, he is currently serving as a member of the Human Rights and Relations Commission in Hamden, CT.",
    ],
  },
  {
    name: "Chief (Dr.) Maryanne Onitolo",
    role: "Matron",
    image: "/gallery/patrons/maryanne-onitolo.png",
    focusY: 30,
    color: EKO_RED,
    bio: [
      "Maryanne Onitolo, MSN, FNP-BC, DNP, is a board-certified Family Nurse Practitioner licensed in New York and New Jersey. She is a graduate from Monmouth University in New Jersey.",
      "Known for her dedication, leadership, and commitment to serving others, Maryanne is also a passionate mentor, leader and educator. She is a proud mother of three children, all of whom have pursued careers in medicine. In recognition of her service and leadership, she was honored with the traditional chieftaincy title of Yeye Apesin of Ijora Kingdom, Lagos, Nigeria (by HRM, Oba Fatai Aremu Aromire, the Ojora of Lagos). Outside of work, she enjoys cooking, decorating, and spending time with her family.",
    ],
  },
  {
    name: "Alhaja Risikat Oshilaja",
    role: "Matron",
    image: "/gallery/patrons/risikat-oshilaja.png",
    focusY: 30,
    color: EKO_YELLOW,
  },
];

/* ── Shared leadership UI ─────────────────────────────────────────────────
   One presentation, rendered twice: matrons & patrons first, then the
   executive council. Left column is the heading, right column a portrait
   grid; a card belonging to someone with a biography gets an arrow
   affordance and opens the drawer below it. */

function PersonPortrait({ person, zoom, sizes }: { person: Person; zoom: number; sizes: string }) {
  /* The crop is done by sizing this inner box to `zoom`× the frame and
     offsetting it, never by CSS-scaling the <img>: a transform would upscale
     whatever small file next/image chose for the frame's own dimensions,
     which is what made these portraits look soft. `top` is expressed in
     percentages of the frame HEIGHT, hence the 0.8 factor — the box is square
     but the 4:5 frame is 1.25× as tall as it is wide. */
  const f = person.focusY / 100;
  return (
    <div
      className="absolute aspect-square"
      style={{
        width: `${zoom * 100}%`,
        left: `${50 - zoom * 50}%`,
        top: `${50 - f * zoom * 80}%`,
      }}
    >
      <Image
        src={person.image}
        alt={`${person.name}, ${person.role}`}
        fill
        className="object-cover"
        sizes={sizes}
        quality={100}
      />
    </div>
  );
}

function TwoToneHeading({ lead, tail }: { lead: string; tail: string }) {
  return (
    <h2 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-neutral-950 sm:text-5xl lg:text-[3.4rem]">
      {lead} <span className="text-neutral-950">{tail}</span>
    </h2>
  );
}

function PeopleSection({
  id,
  eyebrow,
  headingLead,
  headingTail,
  intro,
  people,
  zoom,
  className,
}: {
  id: string;
  eyebrow: string;
  headingLead: string;
  headingTail: string;
  intro: string;
  people: Person[];
  zoom: number;
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const active = openIndex === null ? null : people[openIndex];

  useEffect(() => setMounted(true), []);

  /* The drawer stays mounted and slides out of the viewport when closed.
     AnimatePresence exit transitions have proved unreliable in this app, and
     a plain CSS transform transition closes just as smoothly. */
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  return (
    <section id={id} className={cn("relative bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24", className)}>
      <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-700">{eyebrow}</p>
          <div className="mt-5">
            <TwoToneHeading lead={headingLead} tail={headingTail} />
          </div>
          <p className="mt-6 max-w-md text-base leading-7 text-neutral-700">{intro}</p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-x-2 gap-y-6 sm:grid-cols-2 xl:grid-cols-3"
        >
          {people.map((person, index) => {
            const hasBio = Boolean(person.bio?.length);
            return (
              <motion.article key={person.name} variants={riseIn} custom={index * 0.06} className="group">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
                  <PersonPortrait
                    person={person}
                    zoom={zoom}
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 45vw, 400px"
                  />
                  {/* Hover/focus is tracked in state rather than with a
                      `hover:` utility because the fill colour differs per
                      person — an arbitrary-value utility built around a CSS
                      variable didn't survive the Tailwind build here. */}
                  {hasBio && (
                    <button
                      type="button"
                      onClick={() => setOpenIndex(index)}
                      onMouseEnter={() => setHoverIndex(index)}
                      onMouseLeave={() => setHoverIndex((i) => (i === index ? null : i))}
                      onFocus={() => setHoverIndex(index)}
                      onBlur={() => setHoverIndex((i) => (i === index ? null : i))}
                      aria-label={`Read ${person.name}’s biography`}
                      style={
                        hoverIndex === index
                          ? {
                              background: person.color,
                              borderColor: person.color,
                              color: "#ffffff",
                            }
                          : undefined
                      }
                      className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-md border border-neutral-900/25 bg-white/70 text-neutral-900 backdrop-blur-sm transition-colors duration-200"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M7 17 17 7M9 7h8v8" />
                      </svg>
                    </button>
                  )}
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug tracking-[-0.01em] text-neutral-950">
                  {person.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-700">{person.role}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>

      {/* Biography drawer. Portalled to <body> because several ancestors up
          the About page are animated with transforms, and a transformed
          ancestor makes `position: fixed` resolve against that element
          instead of the viewport — which left the drawer clipped and the
          backdrop covering only part of the screen. */}
      {mounted &&
        createPortal(
          <div
            className={cn(
              "fixed inset-0 z-[60]",
              active ? "pointer-events-auto" : "pointer-events-none",
            )}
            aria-hidden={active ? undefined : true}
          >
            <div
              onClick={() => setOpenIndex(null)}
              className="absolute inset-0 bg-neutral-950/55 transition-opacity duration-500"
              style={{ opacity: active ? 1 : 0 }}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label={active ? `${active.name} biography` : undefined}
              data-lenis-prevent
              className="absolute inset-y-0 left-0 w-full max-w-xl overflow-y-auto bg-white px-6 py-16 shadow-[0_0_80px_rgba(15,23,42,0.25)] sm:px-12"
              style={{
                transform: active ? "translateX(0)" : "translateX(-100%)",
                transition: "transform 500ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(null)}
                aria-label="Close biography"
                className="absolute right-6 top-8 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-900 transition-colors hover:bg-neutral-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>

              {active && (
                <>
                  <TwoToneHeading
                    lead={active.name.split(" ").slice(0, -1).join(" ")}
                    tail={active.name.split(" ").slice(-1).join("")}
                  />
                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-neutral-700">
                    {active.role}
                  </p>
                  <div className="mt-8 h-px w-full bg-neutral-200" />
                  <div className="mt-8 space-y-5">
                    {active.bio?.map((paragraph) => (
                      <p key={paragraph.slice(0, 40)} className="text-[15px] leading-7 text-neutral-700">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="relative mt-10 aspect-[4/5] w-full max-w-sm overflow-hidden bg-neutral-100">
                    <PersonPortrait person={active} zoom={zoom} sizes="420px" />
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

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
        className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-700"
      >
        {eyebrow}
      </motion.span>
      <motion.h2
        variants={riseIn}
        custom={0.16}
        className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl"
      >
        {title}
      </motion.h2>
      <motion.p
        variants={riseIn}
        custom={0.24}
        className="mt-4 text-base leading-8 text-neutral-700 sm:text-lg"
      >
        {text}
      </motion.p>
    </motion.div>
  );
}

/* ─── "What drives us" carousel ─────────────────────── */
const DRIVES_SLIDE_MS = 4000;
const DRIVES_FADE_MS = 400;

/* Captions are drawn from copy already on this page (the mission and vision
   statements, the hero paragraph, and the Thanksgiving entry under our
   service areas) rather than written fresh, so nothing here claims anything
   the rest of the page doesn't already say. */
const DRIVES_SLIDES = [
  {
    image: "/gallery/about/right-about-hero-3.jpg",
    title: "Heritage",
    text: "We preserve our cultural heritage and keep the story of Lagos alive through fellowship, outreach, and visible impact.",
    position: "center",
  },
  {
    image: "/gallery/about/right-about-hero-1.jpg",
    title: "Service",
    text: "We provide an annual Thanksgiving food drive to the community as part of our commitment to consistent service.",
    position: "center",
  },
  {
    image: "/gallery/about/right-about-hero-2.jpg",
    title: "Fellowship",
    text: "To unite Lagosians, preserve our cultural heritage, promote fellowship, and serve our members and communities.",
    position: "center 40%",
  },
  {
    image: "/gallery/about/right-about-hero-4.jpg",
    /* 1600x1411, so a 4:3 frame crops top and bottom — biased upward to keep
       faces in view. The other three are already 4:3 and crop nothing. */
    title: "Vision",
    text: "To be a vibrant and sustainable organization that celebrates Lagosian heritage, strengthens our community, and empowers future generations.",
    position: "center 38%",
  },
];

function WhatDrivesUsCarousel() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  /* Advance on a timer that restarts whenever `active` changes — so picking a
     thumbnail resets the countdown as well as the slide. Skipped entirely
     under reduced-motion, matching how the homepage event timeline treats
     its own auto-advance. */
  useEffect(() => {
    if (reduceMotion || paused) return;
    const t = setTimeout(
      () => setActive((i) => (i + 1) % DRIVES_SLIDES.length),
      DRIVES_SLIDE_MS,
    );
    return () => clearTimeout(t);
  }, [active, paused, reduceMotion]);

  const fadeMs = reduceMotion ? 0 : DRIVES_FADE_MS;
  const slide = DRIVES_SLIDES[active];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">What drives us</p>

      {/* Thumbnails beside the active image; a row above it once the column
          is too narrow to sit them side by side. */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex gap-2 sm:flex-col">
          {DRIVES_SLIDES.map((s, i) => (
            <button
              key={s.image}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${s.title}`}
              aria-current={i === active}
              className={cn(
                "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl transition-opacity duration-300",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
                i === active ? "opacity-100" : "opacity-45 hover:opacity-80",
              )}
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
                style={{ objectPosition: s.position }}
              />
              {i === active && (
                <span className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                  {/* Keyed on `active` so each new slide mounts a fresh bar
                      that starts its run from zero. */}
                  <span
                    key={active}
                    className="block h-full origin-left [animation:drives-progress_4000ms_linear_forwards]"
                    style={{
                      background: EKO_GREEN,
                      animationPlayState: paused || reduceMotion ? "paused" : "running",
                    }}
                  />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Every slide stays mounted and cross-fades on opacity, which keeps
            the frame a fixed size instead of reflowing between images. */}
        <div className="relative aspect-[4/3] flex-1 overflow-hidden rounded-2xl">
          {DRIVES_SLIDES.map((s, i) => (
            <Image
              key={s.image}
              src={s.image}
              alt={i === active ? s.title : ""}
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover transition-opacity"
              style={{
                objectPosition: s.position,
                opacity: i === active ? 1 : 0,
                transitionDuration: `${fadeMs}ms`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Captions are stacked and absolutely positioned for the same reason:
          the panel keeps one height rather than jumping as text length
          changes. min-h holds room for the longest of them. */}
      <div className="relative mt-4 min-h-[7.5rem] sm:min-h-[6.5rem]">
        {DRIVES_SLIDES.map((s, i) => (
          <div
            key={s.image}
            aria-hidden={i !== active}
            className="absolute inset-0 transition-opacity"
            style={{ opacity: i === active ? 1 : 0, transitionDuration: `${fadeMs}ms` }}
          >
            <p className="text-xl font-semibold tracking-[-0.02em] text-white">{s.title}</p>
            <p className="mt-2 text-sm leading-7 text-white/65">{s.text}</p>
          </div>
        ))}
      </div>

      <span className="sr-only" aria-live="polite">{slide.title}</span>
    </div>
  );
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<HistoryTab>("origins");
  const activePanel = HISTORY_PANELS[activeTab];

  return (
    <div className="bg-white text-neutral-950">
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        {/* Eyo procession at an ECI street event, dark-overlaid so it reads
            as texture behind the headline rather than competing with it —
            the photo is bright (white agbada, daylight street), so the wash
            has to be heavy to keep white type legible. The animated colour
            blobs below still sit on top of it. */}
        <div className="absolute inset-0">
          <Image
            src="/gallery/about/hero-1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={100}
            className="object-cover"
          />
          {/* Weighted vertically rather than horizontally: the right half is
              already covered by the stats panel, so the left is the only
              place the photo actually reads — darkening that side would
              defeat the point. The bright white agbada and the body copy
              both sit low, so the wash deepens toward the bottom. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0.88) 100%)",
            }}
          />
        </div>

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
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                  About Eko Club Philadelphia
                </span>
              </motion.div>

              <motion.h1
                variants={riseIn}
                custom={0.08}
                className="mt-7 text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl"
              >
                Our <span style={{ color: EKO_GREEN }}>heritage</span>, our
                <span style={{ color: EKO_YELLOW }}> service</span>, our story.
              </motion.h1>

              <motion.p
                variants={riseIn}
                custom={0.16}
                className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg"
              >
                We are Eko Club Philadelphia. We preserve our cultural heritage, serve families and
                communities in need, and keep the story of Lagos alive through fellowship, outreach,
                and visible impact.
              </motion.p>

              <motion.div variants={riseIn} custom={0.24} className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/membership/apply"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}66` }}
                >
                  Join the community
                </Link>
                <Link
                  href="#lagos-history"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Explore Lagos history
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-4xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
            >
              <WhatDrivesUsCarousel />
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
        <div className="pointer-events-none absolute -right-10 top-0 select-none text-[8rem] font-semibold leading-none text-neutral-100">
          EKO
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <SectionIntro
            eyebrow="Why we exist"
            title="Our mission, vision, and values"
            text="We are guided by a clear purpose: to unite Lagosians, preserve our cultural heritage, promote fellowship, and serve our members and communities through charitable, educational, cultural, and humanitarian initiatives."
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
                  <h3 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-950">{pillar.title}</h3>
                  <span className="h-3 w-3 rounded-full" style={{ background: pillar.color }} />
                </div>
                <p className="mt-4 text-sm leading-7 text-neutral-700 sm:text-base">{pillar.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {/* Heading left, supporting line right — the eyebrow, bar and type
              scale are the same ones SectionIntro uses elsewhere on the page,
              just laid out in two columns here. */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16"
          >
            <div>
              <motion.div variants={riseIn} custom={0} className="flex">
                <QuadBar />
              </motion.div>
              <motion.span
                variants={riseIn}
                custom={0.08}
                className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-neutral-700"
              >
                Our focus
              </motion.span>
              <motion.h2
                variants={riseIn}
                custom={0.16}
                className="mt-5 text-3xl font-bold tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl"
              >
                How we turn our mission into practical service
              </motion.h2>
            </div>
            <motion.p
              variants={riseIn}
              custom={0.24}
              className="text-base leading-8 text-neutral-700 sm:text-lg"
            >
              Our work is not abstract. It is expressed through scholarships, humanitarian
              support, community outreach, and consistent service to families in
              Philadelphia and beyond.
            </motion.p>
          </motion.div>

          {/* One strip, panels butted edge to edge with the rounding on the
              outer container only — the photograph carries each panel and the
              caption sits over its base. */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid overflow-hidden rounded-[2rem] sm:grid-cols-2 xl:grid-cols-4"
          >
            {VALUES.map((value, index) => (
              <motion.article
                key={value.title}
                variants={riseIn}
                custom={index * 0.07}
                className="group relative aspect-[4/5] xl:aspect-[3/4]"
              >
                <Image
                  src={value.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.1) 35%, rgba(10,10,10,0.88) 100%)" }}
                  aria-hidden="true"
                />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="h-1.5 w-12 rounded-full" style={{ background: value.color }} aria-hidden="true" />
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">{value.desc}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <PeopleSection
        id="patrons"
        eyebrow=""
        headingLead="Matrons"
        headingTail="& patrons"
        intro="The elders who stand behind Eko Club Philadelphia, lending their name, counsel, and standing to the work we do in Lagos and in Philadelphia."
        people={PATRONS}
        zoom={PATRON_ZOOM}
      />

      <PeopleSection
        id="exco"
        eyebrow="Executive council"
        headingLead="Executive"
        headingTail="council"
        intro="The people responsible for leadership, continuity, and accountability anchoring planning, member communication, governance, and execution."
        people={EXCO_MEMBERS}
        zoom={EXCO_ZOOM}
        className="bg-neutral-50"
      />

      <section className="bg-[#0a0a0a] py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-start gap-12">
            <div className="lg:w-1/2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35 mb-4">Our Lagos roots</p>
              <h2 className="text-4xl font-semibold text-white leading-snug mb-5 tracking-tight">
                The five IBILE divisions — where we come from
              </h2>
              <p className="text-base text-white/55 leading-relaxed font-normal mb-6">
                Ikorodu, Badagry, Ikeja, Lagos Island, Epe — the five historic divisions
                of Lagos State that our members call home. This section will feature a
                short looping video montage of each locality. Content arriving soon.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Ikorodu", "Badagry", "Ikeja", "Lagos Island", "Epe"].map(d => (
                  <span key={d}
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/15 text-white/50">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 rounded-2xl bg-white/5 border border-white/10 aspect-video flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm font-medium text-white/30">Video montage</p>
                <p className="text-xs text-white/20 mt-1">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="lagos-history" className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-neutral-200" />

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
                    className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all"
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
                  className="rounded-full px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-950"
                  style={{ background: `${activePanel.accent}20` }}
                >
                  {activePanel.kicker}
                </span>
                <QuadBar />
              </div>

              <h3 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
                {activePanel.title}
              </h3>
              <p className="mt-5 max-w-3xl text-base leading-8 text-neutral-700 sm:text-lg">
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
                    <p className="text-sm leading-7 text-neutral-700 sm:text-base">{bullet}</p>
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
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">{item.era}</p>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/68">{item.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Annual service programs"
            title="The initiatives through which we serve each year"
            text="These programmes reflect the real work of our club: feeding families, supporting students, caring for children, keeping our environment clean, and showing up consistently for the community."
            align="center"
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          >
            {SERVICE_PROGRAMS.map((item, index) => (
              <motion.article
                key={item.title}
                variants={riseIn}
                custom={index * 0.06}
                className="rounded-[1.75rem] border border-neutral-200 bg-neutral-50 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${item.accent}12` }}>
                  {item.icon}
                </div>
                <div className="mt-5 h-2 w-16 rounded-full" style={{ background: item.accent }} />
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-neutral-700">{item.text}</p>
              </motion.article>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex justify-center"
          >
            <Link
              href="/projects"
              className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
              style={{ background: EKO_BLUE }}
            >
              View full projects page
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO_GREEN }} />
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
            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
              Keep the <span style={{ color: EKO_YELLOW }}>Eko spirit</span> moving.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Join a community that celebrates Lagos with depth, style, and action. From heritage to
              service, this is where memory becomes movement.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO_GREEN }}
              >
                Apply for membership
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/12"
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
