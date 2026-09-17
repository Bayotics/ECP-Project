"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useIsClient, useReveal } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";

const EKO_GREEN = "#059669";
const EKO_RED = "#dc2626";
const EKO_BLUE = "#2563eb";
const EKO_YELLOW = "#d97706";
const QUAD = [EKO_GREEN, EKO_RED, EKO_BLUE, EKO_YELLOW];


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
    image: "/gallery/programs/scholarship.jpg",
    title: "Scholarship support",
    desc: "We provide scholarships to minority high school and college students as part of our long-term investment in education.",
    color: EKO_RED,
  },
  {
    image: "/gallery/programs/back-to-school.jpg",
    title: "Humanitarian assistance",
    desc: "We assist less fortunate families with humanitarian services and practical care wherever help is needed most.",
    color: EKO_BLUE,
  },
  {
    image: "/gallery/about/right-about-hero-1.jpg",
    title: "Thanksgiving outreach",
    desc: "We provide an annual Thanksgiving food drive to the community as part of our commitment to consistent service.",
    color: EKO_YELLOW,
  },
];

/* The five annual programmes, as listed on the club's original website page
   (Website.jpg in the events hand-off). Each photo is from that same hand-off:
   the scholarship presentation, the HomeFront back-to-school drop-off, the
   Adopt-A-Highway crew at their road sign, and the Thanksgiving turkey
   table. There was no standalone Make-A-Meal photograph — its only image is
   the small round one on that old website page, cropped out here, so it is
   lower-resolution than the rest. */
const SERVICE_PROGRAMS = [
  {
    title: "Ronald McDonald House Make-A-Meal",
    text: "We cook breakfast for families staying at Philadelphia’s Ronald McDonald House.",
    image: "/gallery/programs/make-a-meal.jpg",
  },
  {
    title: "Back to School with HomeFront",
    text: "Backpacks, uniforms, and school supplies for children in need.",
    image: "/gallery/programs/back-to-school.jpg",
  },
  {
    title: "ECP Scholarship Program",
    text: "Awards to two high school graduates and three college students.",
    image: "/gallery/programs/scholarship.jpg",
  },
  {
    title: "PA Adopt-A-Highway",
    text: "Members clear litter from a two-mile stretch of road in Bucks County.",
    image: "/gallery/programs/adopt-a-highway.jpg",
  },
  {
    title: "Thanksgiving Basket Food Drive",
    text: "An annual food drive for families in need across our community.",
    image: "/gallery/programs/thanksgiving.jpg",
  },
];

/* Pentagon layout for the programme ring. Positions are percentages of a
   square box: five circles on a ring of radius RING_R around a centre
   emblem, starting at the top and going clockwise. The whole figure sits a
   little below centre because a point-up pentagon is top-heavy — the lower
   pair of circles doesn't reach as far down as the top one reaches up. */
const RING_R = 34;
const RING_CY = 53;
const RING_D = 30;
const RING_STEP = (2 * Math.PI) / SERVICE_PROGRAMS.length;
const RING_START = -Math.PI / 2;

/* Rounded so the server and the browser print identical numbers — trig
   results can differ in the last few bits between JS engines, which would
   otherwise surface as a hydration mismatch. */
const round3 = (n: number) => Math.round(n * 1000) / 1000;
const onRing = (angle: number) => ({
  x: round3(50 + RING_R * Math.cos(angle)),
  y: round3(RING_CY + RING_R * Math.sin(angle)),
});

const RING_POSITIONS = SERVICE_PROGRAMS.map((_, i) => onRing(RING_START + i * RING_STEP));

/* The dotted ring, split into the five arcs between neighbouring circles so
   each can be drawn in turn. Only the stretch actually visible between two
   circles gets dots: RING_COVER is the angle each circle (plus its 4px
   ring) hides either side of its own centre, measured at the ring's radius.
   Dots keep the original spacing (2.2) and size, centred in each gap. Arc i
   runs clockwise from circle i to circle i + 1; the last one closes the
   ring back to the first. */
const RING_DOT_GAP = 2.2;
const RING_DOT_R = 0.275;
const RING_COVER = 2 * Math.asin((RING_D / 2 + 1.3) / (2 * RING_R));
const RING_ARCS = RING_POSITIONS.map((_, i) => {
  const span = RING_STEP - 2 * RING_COVER;
  const count = Math.floor((span * RING_R) / RING_DOT_GAP) + 1;
  const used = ((count - 1) * RING_DOT_GAP) / RING_R;
  const first = RING_START + i * RING_STEP + RING_COVER + (span - used) / 2;
  return Array.from({ length: count }, (_, k) => onRing(first + (k * RING_DOT_GAP) / RING_R));
});

function ServiceProgramsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const figureRef = useRef<HTMLDivElement>(null);
  const centreRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  /* Centre emblem grows from a dot to full size; then, clockwise from the
     top, each programme circle grows the same way and the dotted arc to the
     next circle draws itself dot by dot — five times, the last arc closing
     the ring. Only once the ring is whole does the right-hand column start:
     heading, then each list item, then the button, each also waiting until
     it is on screen. Everything here runs at PROGRAMS_SPEED× the timings
     written below. */
  const PROGRAMS_SPEED = 2;
  useReveal(sectionRef, ({ timeline, entered, after, queue }) => {
    const figure = figureRef.current!;
    const circles = gsap.utils.toArray<HTMLElement>("[data-ring-circle]", figure);
    const arcs = RING_ARCS.map((_, i) => gsap.utils.toArray<SVGElement>(`[data-ring-arc="${i}"]`, figure));

    gsap.set([centreRef.current, ...circles], { scale: 0.04, transformOrigin: "50% 50%" });

    const ring = timeline();
    ring.tl.to(centreRef.current, { opacity: 1, scale: 1, duration: 0.7, ease: EASE });
    circles.forEach((circle, i) => {
      ring.tl
        .to(circle, { opacity: 1, scale: 1, duration: 0.55, ease: EASE })
        .to(arcs[i], { opacity: 1, duration: 0.12, stagger: 0.09, ease: "none" });
    });
    ring.tl.timeScale(PROGRAMS_SPEED);
    after([entered(figure)], () => ring.tl.play());

    gsap.set(headRef.current, { y: 32 });
    const head = timeline();
    head.tl.to(headRef.current, { opacity: 1, y: 0, duration: 0.8, ease: EASE });
    head.tl.timeScale(PROGRAMS_SPEED);
    after([ring.done, entered(headRef.current)], () => head.tl.play());

    const items = gsap.utils.toArray<HTMLElement>(listRef.current!.children);
    const listDone = queue(items, { y: 32 }, head.done, PROGRAMS_SPEED);

    gsap.set(buttonRef.current, { y: 32 });
    const button = timeline();
    button.tl.to(buttonRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE });
    button.tl.timeScale(PROGRAMS_SPEED);
    after([listDone, entered(buttonRef.current)], () => button.tl.play());
  });

  return (
    <section ref={sectionRef} className="relative bg-[#fbfaf4] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <div ref={figureRef} className="relative mx-auto aspect-square w-full max-w-[36rem]">
          {/* Dotted ring through the circle centres, as five separately
              drawn arcs (see RING_ARCS). */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {RING_ARCS.map((dots, i) =>
              dots.map((dot, k) => (
                <circle
                  key={`${i}-${k}`}
                  data-reveal
                  data-ring-arc={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={RING_DOT_R}
                  fill="#0f5e12"
                  style={HIDDEN}
                />
              )),
            )}
          </svg>

          {/* Centre emblem */}
          <div
            ref={centreRef}
            data-reveal
            className="absolute flex items-center justify-center rounded-full bg-green-700"
            style={{
              ...HIDDEN,
              width: `${RING_D}%`,
              height: `${RING_D}%`,
              left: `${50 - RING_D / 2}%`,
              top: `${RING_CY - RING_D / 2}%`,
            }}
          >
            <div className="relative h-[72%] w-[72%] overflow-hidden rounded-full bg-white">
              <Image src="/new-logo.png" alt="Eko Club Philadelphia" fill sizes="160px" className="object-contain p-1.5" />
            </div>
          </div>

          {SERVICE_PROGRAMS.map((program, i) => (
            /* The grow-in animates this wrapper, not the link: the link
               carries a CSS transform transition for its hover scale, which
               would otherwise chase every frame GSAP writes and lag behind. */
            <div
              key={program.title}
              data-reveal
              data-ring-circle
              className="absolute"
              style={{
                ...HIDDEN,
                width: `${RING_D}%`,
                height: `${RING_D}%`,
                left: `${round3(RING_POSITIONS[i].x - RING_D / 2)}%`,
                top: `${round3(RING_POSITIONS[i].y - RING_D / 2)}%`,
              }}
            >
            <Link
              href="/projects"
              aria-label={program.title}
              /* `isolate` keeps the sliding panel clipped to the circle in
                 Safari, which otherwise lets a transformed child escape a
                 rounded overflow-hidden parent while it animates. */
              className="group absolute inset-0 isolate block overflow-hidden rounded-full ring-4 ring-[#fbfaf4] transition-transform duration-300 hover:scale-105"
              style={{ containerType: "inline-size" }}
            >
              <Image
                src={program.image}
                alt=""
                fill
                sizes="(max-width: 640px) 30vw, 180px"
                className="object-cover"
              />
              {/* Glass panel: parked just below the circle and slid up to
                  cover the lower half on hover/focus. The circle's clipping
                  turns it into a half-disc that narrows quickly towards the
                  bottom, so the title hugs the midline where it's widest and
                  must stay within two lines there. The font is sized off the
                  circle itself (cqw — the link is a size container) so the
                  longest title, "Ronald McDonald House Make-A-Meal", still
                  fits as the ring shrinks; text-balance splits it evenly
                  instead of leaving a long first line and an orphan. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 flex h-1/2 translate-y-full items-start justify-center border-t border-white/30 bg-green-700/55 text-center backdrop-blur-md transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0"
                style={{ padding: "4% 8% 0" }}
              >
                <span
                  className="font-normal text-balance text-white"
                  style={{ fontSize: "clamp(9px, 7.6cqw, 12px)", lineHeight: 1.15 }}
                >
                  {program.title}
                </span>
              </span>
            </Link>
            </div>
          ))}
        </div>

        <div>
          <div ref={headRef} data-reveal style={HIDDEN}>
            <p className="text-lg font-medium text-neutral-700">Annual service programs</p>
            <h2 className="mt-4 text-4xl font-normal leading-[1.1] tracking-[-0.02em] text-black sm:text-5xl">
              Service that shows up every year
            </h2>
          </div>

          <ul ref={listRef} className="mt-10 divide-y divide-green-800/10 border-y border-green-800/10">
            {SERVICE_PROGRAMS.map((program) => (
              <li key={program.title} data-reveal style={HIDDEN}>
                <Link
                  href="/projects"
                  className="group flex items-center justify-between gap-6 py-4"
                >
                  <span>
                    <span className="block text-base font-normal text-black">{program.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-green-900/70">{program.text}</span>
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-green-700 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>

          <div ref={buttonRef} data-reveal className="mt-10" style={HIDDEN}>
            <Link
              href="/projects"
              className="inline-flex items-center rounded-full bg-green-700 px-8 py-4 text-base font-medium text-white transition-colors duration-300 hover:bg-green-800"
            >
              View More
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

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
    <h2 className="text-4xl font-normal leading-[1.05] tracking-[-0.03em] text-neutral-950 sm:text-5xl lg:text-[3.4rem]">
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
  const isClient = useIsClient();
  const active = openIndex === null ? null : people[openIndex];

  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  /* Eyebrow (when there is one), heading, then intro slide in from the left
     one at a time; once all three have landed, the cards slide in from the
     right one at a time. The trigger is the grid rather than the intro
     column itself — that column is sticky on large screens, and a sticky
     element's measured position shifts once it sticks. */
  useReveal(sectionRef, ({ timeline, entered, after, queue }) => {
    const lines = gsap.utils.toArray<HTMLElement>(introRef.current!.children);
    gsap.set(lines, { x: -SHIFT });
    const intro = timeline();
    intro.tl.to(lines, { opacity: 1, x: 0, duration: 0.7, ease: EASE, stagger: 0.3 });
    after([entered(gridRef.current)], () => intro.tl.play());

    queue(gsap.utils.toArray<HTMLElement>(cardsRef.current!.children), { x: SHIFT }, intro.done);
  });

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
    <section
      ref={sectionRef}
      id={id}
      className={cn("relative bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24", className)}
    >
      <div ref={gridRef} className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <div ref={introRef} className="lg:sticky lg:top-28 lg:self-start">
          {/* Omitted when empty, so an invisible line doesn't take a turn in
              the one-at-a-time sequence. The heading's own top margin keeps
              the layout identical either way. */}
          {eyebrow && (
            <p data-reveal className="text-xs font-normal uppercase tracking-[0.22em] text-black" style={HIDDEN}>
              {eyebrow}
            </p>
          )}
          <div data-reveal className="mt-5" style={HIDDEN}>
            <TwoToneHeading lead={headingLead} tail={headingTail} />
          </div>
          <p data-reveal className="mt-6 max-w-md text-base leading-7 text-black" style={HIDDEN}>
            {intro}
          </p>
        </div>

        <div ref={cardsRef} className="grid gap-x-2 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
          {people.map((person, index) => {
            const hasBio = Boolean(person.bio?.length);
            return (
              <article key={person.name} data-reveal className="group" style={HIDDEN}>
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
                <h3 className="mt-3 text-base font-normal leading-snug tracking-[-0.01em] text-neutral-950">
                  {person.name}
                </h3>
                <p className="mt-1 text-sm text-black">{person.role}</p>
              </article>
            );
          })}
        </div>
      </div>

      {/* Biography drawer. Portalled to <body> because several ancestors up
          the About page are animated with transforms, and a transformed
          ancestor makes `position: fixed` resolve against that element
          instead of the viewport — which left the drawer clipped and the
          backdrop covering only part of the screen. */}
      {isClient &&
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
                  <p className="mt-4 text-sm font-normal uppercase tracking-[0.18em] text-black">
                    {active.role}
                  </p>
                  <div className="mt-8 h-px w-full bg-neutral-200" />
                  <div className="mt-8 space-y-5">
                    {active.bio?.map((paragraph) => (
                      <p key={paragraph.slice(0, 40)} className="text-[15px] leading-7 text-black">
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
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <div className={align === "center" ? "flex justify-center" : "flex"}>
        <QuadBar />
      </div>
      <span className="mt-5 inline-flex rounded-full border border-neutral-400 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-black">
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-black sm:text-lg">{text}</p>
    </div>
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
            <p className="text-xl font-normal tracking-[-0.02em] text-white">{s.title}</p>
            <p className="mt-2 text-sm leading-7 text-white/65">{s.text}</p>
          </div>
        ))}
      </div>

      <span className="sr-only" aria-live="polite">{slide.title}</span>
    </div>
  );
}

/* The IBILE carousel: an overview plate first, then one slide per division.
   Slides crossfade rather than slide, exactly as the reference does — and
   plain CSS opacity transitions rather than framer-motion, since exit
   animations have proved unreliable elsewhere in this app. */
const IBILE_SLIDE_MS = 10000;

const IBILE_SLIDES = [
  {
    src: "/gallery/about/ibile/ibile-main.png",
    alt: "IBILE — the five divisions of Lagos State",
    name: null,
    video: null,
  },
  {
    src: "/gallery/about/ibile/ikeja-heritage.jpg",
    alt: "Ikeja heritage",
    name: "Ikeja",
    video: "https://www.youtube.com/watch?v=-962rOv3UfI",
  },
  {
    src: "/gallery/about/ibile/badagry-heritage.jpg",
    alt: "Badagry heritage",
    name: "Badagry",
    video: "https://www.youtube.com/watch?v=mG1ep9_8MMA",
  },
  {
    src: "/gallery/about/ibile/ikorodu-heritage.jpg",
    alt: "Ikorodu heritage",
    name: "Ikorodu",
    video: "https://www.youtube.com/watch?v=fYFbFmg3HAM",
  },
  {
    src: "/gallery/about/ibile/lagos-island-heritage.jpg",
    alt: "Lagos Island heritage",
    name: "Lagos Island",
    video: "https://www.youtube.com/watch?v=jrrOuiK5UHc",
  },
  {
    src: "/gallery/about/ibile/epe-heritage.jpg",
    alt: "Epe heritage",
    name: "Epe",
    video: "https://www.youtube.com/watch?v=u0FkwMpBgZs",
  },
];

function youTubeEmbedUrl(url: string) {
  let videoId = "";
  if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1].split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1].split("?")[0];
  } else if (url.includes("/embed/")) {
    videoId = url.split("/embed/")[1].split("?")[0];
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

function IbileCarousel() {
  const [current, setCurrent] = useState(0);
  const [video, setVideo] = useState<string | null>(null);

  const next = () => setCurrent((prev) => (prev + 1) % IBILE_SLIDES.length);
  const prev = () => setCurrent((prev) => (prev - 1 + IBILE_SLIDES.length) % IBILE_SLIDES.length);

  /* Restarting on `current` means a manual arrow or dot press also resets the
     dwell time, rather than leaving a slide up for whatever was left of the
     previous interval. Autoplay holds while a video is open so the slide
     behind the modal doesn't move on. */
  useEffect(() => {
    if (video) return;
    const interval = setInterval(next, IBILE_SLIDE_MS);
    return () => clearInterval(interval);
  }, [current, video]);

  useEffect(() => {
    if (!video) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVideo(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [video]);

  return (
    <div className="relative overflow-hidden rounded-lg shadow-2xl aspect-[4/3] sm:aspect-[16/11] md:aspect-[16/10]">
      {IBILE_SLIDES.map((slide, index) => (
        <div
          key={slide.src}
          aria-hidden={index !== current}
          /* pointer-events matters as much as opacity here: all six slides
             are stacked, and a transparent one still swallows clicks — which
             left the play button on the active slide unreachable behind the
             slides rendered after it. */
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === current ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={index === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

          {/* Only the visible slide's play button is rendered, so the hidden
              slides stacked on top of it can't swallow the click. */}
          {slide.video && index === current && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setVideo(slide.video);
                }}
                className="group bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-4 sm:p-5 md:p-6 rounded-full transition-all duration-300 hover:scale-110"
                aria-label={`Play ${slide.name} heritage video`}
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 fill-current transition-transform duration-300 group-hover:scale-110" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="6 3 20 12 6 21 6 3" />
                </svg>
              </button>
            </div>
          )}

          {slide.name && (
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
              <div
                className="text-center transition-all duration-500"
                style={{
                  opacity: index === current ? 1 : 0,
                  transform: index === current ? "translateY(0)" : "translateY(20px)",
                }}
              >
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-normal text-white drop-shadow-lg">
                  {slide.name}
                </h3>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={prev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-110"
        aria-label="Previous image"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        onClick={next}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-2 sm:p-3 rounded-full transition-all duration-200 hover:scale-110"
        aria-label="Next image"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {IBILE_SLIDES.map((slide, index) => (
          <button
            key={slide.src}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
              index === current ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Video modal. Portalled to <body> for the same reason as the
          biography drawer: this carousel sits inside transformed ancestors,
          and `position: fixed` resolves against those rather than the
          viewport, which would trap the overlay inside the carousel box. */}
      {video &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-2 sm:p-4"
            onClick={() => setVideo(null)}
          >
            <div
              className="relative aspect-video w-full max-w-4xl rounded-lg bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setVideo(null)}
                className="absolute -top-12 right-0 z-10 rounded-full bg-white/20 p-2 transition-colors hover:bg-white/30"
                aria-label="Close video"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>

              <iframe
                key={video}
                src={youTubeEmbedUrl(video)}
                title="Heritage video"
                className="h-full w-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/* ── History of Lagos ─────────────────────────────────────────────────────
   Transcribed verbatim from the club's own "History of Eko" booklet (pages
   14-20), which arrived as a scanned PDF. Spellings are left exactly as
   printed, including the places where the booklet renders the same name two
   ways (Eshinlokun / Eshilokun, Akintoye / Akitoye) — correcting a primary
   source is not ours to do.

   The booklet's two genealogical tree diagrams (pages 17-19) are not
   reproduced: they are drawn charts rather than prose, and the succession
   they encode is already carried by the genealogy table below. */
const LAGOS_HISTORY_INTRO =
  "Eko to its indigenes, grew from a lagoon settlement into the commercial and maritime nerve-centre of Nigeria. Four centuries of that story run through the Obas of Lagos: succession disputes, exile and return, Portuguese and British intervention, and a chieftaincy structure that still orders the city's traditional life.";

const LAGOS_HISTORY_NARRATIVE = [
  "Addo was the father of three children — namely: Gabaro, Akinsemoyin (probably a corruption of ‘Akisemoye’) and Erelu Kuti, a Princess, from whose line the sixth Oba of Lagos in direct line of succession emerged till today.",
  "The reason for this was explained by the fact that all Akinsemoyin’s children were females whose children were barred from succession with a curse placed on them for refusing to abide by their father’s wish, and settled succession on the children of his sister, Erelu Kuti.",
  "Oba Ashipa reigned in Lagos from circa 1680 to circa 1700, followed by Oba Addo from circa 1700 to 1735, succeeded by Oba Gabaro in circa 1735 to k. 1767. Policy disagreement between Oba Gabaro, apparently supported by the Chiefs over political concession to the Idejo Chiefs on their land, led to the banishment of Akinsemoyin to exile in Apa. There is evidence in the record of the Brazilian traders in Whydah to suggest that Akinsemoyin fought his way back to Lagos with arms and munitions supplied by the Portuguese traders in Whydah. Akinsemoyin reciprocated this support by granting them trade monopoly in Lagos.",
  "It was this factor which brought the British Government to break the Portuguese monopoly of trade in 1851 when they drove King Kosoko from the throne and replaced him with King Akitoye who had lost to King Kosoko in a military encounter in 1845.",
  "King Ologun Kutere, who succeeded Eletu Omo, son of Gabaro, died in 1806 according to Brazilian traders record. Ologun Kutere was a son of Erelu Kuti, who was succeeded by King Adele Ajosu who was deposed by King Eshinlokun, another son of Ologun Kutere in 1813, which Adele Ajosu fled to Badagry for safety. There he was in 1826 when Captain Clapperton and Richard Lander met him in 1826.",
  "When King Eshilokun died in November 1829, he was succeeded by his youngest son, Idewu Ojulari. Attempts by Adele Ajosu to fight his way back to the throne failed until a grand conspiracy by Adele Ajosu with the Egba and some palace officials led Idewu Ojulari to commit suicide in 1835. Adele was brought back to Lagos where he reigned for two years and died in 1837.",
  "King Oluwole, supported by Eletu Odibo Oshobule was put in power to succeed his father, Adele Ajosu. This man became tyrannical and he perished in a gun-powder explosion in 1841. He was succeeded by King Akitoye, another son of Ologun Kutere.",
  "King Akitoye lost his throne to Kosoko, an elder son of Eshilokun, and uncle of Akitoye, when he was defeated in a military engagement in 1845. Akitoye fled to Abeokuta, and afterwards in Badagry where he was assisted to stage a come back to the throne with the help of the British Navy in December 1851.",
  "Akitoye died in 1853. He reportedly poisoned himself, sensing his unpopularity with the people. His eldest son, Dosumu who signed a treaty of cession with Britain and started what resulted into British colonization of Nigeria in 1861.",
  "When Dosumu died in 1885, his son, Oyekan I succeeded him and ruled till his death in 1900. He was succeeded by Esugbayi Eleko who was deposed in 1920 for giving support to agitators against British rule in Lagos. In 1925, Esugbayi was banished to Oyo Province and Ibikunle Akitoye was installed Oba of Lagos. In 1928, Sanusi Olusi was installed Oba after Ibikunle Akitoye who died in that year in a mysterious and suspicious circumstance. When the British colonial authority lost the appeal of Esugbayi against his deportation in 1931, he (Esugbayi) was allowed to return to the throne but he died the following year — 1932.",
  "He was succeeded by Oba Falolu, who reigned for 17 years and died in 1949. His place was taken over in October 1949 by Oba Adeniji-Adele who reigned till 1964 when he died and was succeeded by Late Oba Adeyinka Oyekan II. Oba Riliwanu Akiolu I succeeded as the 21st Oba of Lagos. Long may he reign!",
];

const LAGOS_ISLAND_NARRATIVE = [
  "The core of Lagos State and a highly urbanized division consisting of five local government islets: Lagos Island, Lagos Mainland, Surulere, Apapa and Eti-Osa, with the City of Lagos being the pivot of an ever expanding Lagos Megacity and the divisional headquarters. The center and most developed of this Island chain, Lagos Island, is called ‘Eko’ by the indigenes. The name ‘Lagos’ is a derivative of a Portuguese imposition of ‘Lagos de Curamo’ or ‘Rio Lago’ on account of its wetland topography and network of lagoons.",
  "The Island is the cultural watershed of the White Cap (idejo) Chieftaincy and metropolitan Lagos with the Oba of Lagos as the paramount monarch and primus inter pares of the State traditional authorities. Lagos is the chief commercial, financial and maritime nerve-center of Nigeria with seaports at Apapa, Tin Can Island. As the economic capital and major port of Africa’s most populous nation, Lagos has attracted immigrants from all over Nigeria and beyond, as well as commercial entrepreneurs and industries from Africa, Europe, Asia and the Americans.",
  "Major settlements in the Division are Takwa Bay, Victoria Island (Iru), Lagos Island, Ikoyi, Obalende, Otto, Ijora, Apapa, Ebutte-Metta, Yaba, Iddo, Sangotedo, Mayegun, Ogombo, Ogoyo, Okun-Ibeju, Mopo-Akinlade, Moba, Alaguntan, Ado, Langbasa, Ilasan, Igbo-Efon, Ikota and Ikate-Elegushi, Ajiran, Ilasan, Tomaro, Abagbo, Igbo-Ejo (Snake Island), Igbo-Efon, etc.",
];

const OBAS_OF_LAGOS: [string, string, string, string][] = [
  ["Oba Asipa", "1603", "1630", "27"],
  ["Oba Ado", "1630", "1669", "39"],
  ["Oba Gabaro", "1669", "1704", "35"],
  ["Oba Akinsemoyin", "1704", "1749", "45"],
  ["Oba Ologunkutere", "1749", "1775", "26"],
  ["Oba Adele Ajosun", "1775", "1780", "5"],
  ["Oba Eshinlokun", "1780", "1819", "39"],
  ["Oba Idewu Ojulari", "1819", "1834", "15"],
  ["Oba Oluwole", "1834", "1841", "7"],
  ["Oba Akintoye", "1841", "1845", "4"],
  ["Oba Kosoko", "1845", "1851", "6"],
  ["Oba Akitoye (I)", "1851", "1853", "2"],
  ["Oba Dosumu", "1853", "1885", "32"],
  ["Oba Oyekan (I)", "1885", "1900", "15"],
  ["Oba Esugbayi Eleko", "1900", "1925", "25"],
  ["Oba Ibikunle Akitoye", "1925", "1928", "3"],
  ["Oba Sanusi Olusi", "1928", "1931", "3"],
  ["Oba Esugbayi Eleko", "1931", "1932", "1"],
  ["Oba Falolu", "1932", "1949", "17"],
  ["Oba (sir) Adeniji Adele (II)", "1949", "1964", "15"],
  ["Oba Adeyinka Oyekan (II)", "1965", "2003", "38"],
  ["Oba Riliwanu Akiolu", "2003", "—", "—"],
];

const LAGOS_CHIEFTAINCIES = [
  {
    title: "Akarigbere White Cap Chiefs",
    color: EKO_GREEN,
    names: [
      "Eletu Odibo (Head)", "Onilegbale", "Olorogun-Adodo", "Eletu Iwase",
      "Asajon-Oloja - Kosoko", "Ojon", "Eletu Ijebu", "Eletu Omo", "Eletu Ika",
      "Eletu-Awo", "Erelu Kuti", "Olorogun-Atebo", "Igbesodi", "Olorogun Ide",
      "Olorogun Agan",
    ],
  },
  {
    title: "Idejo White Cap Chiefs (the land owners)",
    color: EKO_RED,
    names: [
      "Olumegbon (Head)", "Oniru", "Onisiwo", "Oloto", "Ojora", "Onitolo",
      "Aromire", "Onitana", "Oluwa", "Onikoyi", "Elegushi",
    ],
  },
  {
    title: "Ogalade White Cap Chiefs (the spiritual heads)",
    color: EKO_BLUE,
    names: [
      "Opeluwa (Head)", "Obanikoro", "Onisemo", "Modile", "Alagbeji",
      "Onimole", "Alase", "Osunoba", "Olopon",
    ],
  },
  {
    title: "Abagbon (war chiefs)",
    color: EKO_YELLOW,
    names: [
      "Ashogbon (Head)", "Saba", "Bajulaiye", "Suenu", "Faji", "Bashua", "Sasi",
      "Sashore", "Bajulu", "Egbe", "Asesi", "Oshodi Tapa", "Oshodi Buku",
      "Salawe", "Kakawa", "Etti", "Aiyeomosan", "Aseran", "Okolo", "Iposu",
      "Erelu",
    ],
  },
];

function LagosHistorySection() {
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  /* Text column slides in from the left; the photo fades in once it has
     landed (and once the photo is on screen — below the text on phones). */
  useReveal(sectionRef, ({ timeline, entered, after }) => {
    gsap.set(textRef.current, { x: -SHIFT });
    const text = timeline();
    text.tl.to(textRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(textRef.current)], () => text.tl.play());

    const image = timeline();
    image.tl.to(imageRef.current, { opacity: 1, duration: 0.9, ease: "power2.out" });
    after([text.done, entered(imageRef.current)], () => image.tl.play());
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section ref={sectionRef} id="lagos-history" className="relative bg-white">
      <div className="grid lg:grid-cols-2">
        <div
          ref={textRef}
          data-reveal
          className="flex flex-col justify-center px-6 py-20 sm:px-10 lg:py-28 lg:pl-16 lg:pr-20 xl:pl-24"
          style={HIDDEN}
        >
          <p className="text-xs font-normal uppercase tracking-[0.2em] text-white/35 mb-4">
            HISTORY
          </p>

          <h2 className="mt-12 text-[2.6rem] font-normal leading-[1.08] tracking-[-0.02em] text-neutral-950 sm:text-5xl lg:text-[3.6rem]">
            A lagoon settlement that became a megacity
          </h2>

          <p className="mt-12 max-w-lg text-base leading-8 text-black">{LAGOS_HISTORY_INTRO}</p>

          <div className="mt-10">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group inline-flex items-center gap-4 rounded-full bg-green-700 py-3 pl-7 pr-3 text-base font-medium text-white transition-colors duration-300 hover:bg-green-900"
            >
              Read full history
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white transition-transform duration-300 group-hover:translate-x-1">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>
          </div>
        </div>

        <div ref={imageRef} data-reveal className="relative min-h-[24rem] lg:min-h-[42rem]" style={HIDDEN}>
          <Image
            src="/gallery/eko/eko-4.jpeg"
            alt="Lagos Island seen across the lagoon"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            quality={95}
            className="object-cover"
          />
        </div>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-start justify-center bg-neutral-950/70 p-0 sm:p-6"
            onClick={() => setOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="History of Eko"
              data-lenis-prevent
              onClick={(e) => e.stopPropagation()}
              className="relative flex max-h-full w-full max-w-4xl flex-col bg-white sm:rounded-2xl"
            >
              {/* The close button sits on the panel, not inside the scrolling
                  area — this content runs to several thousand pixels, and a
                  button that scrolls away with it strands the reader. */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close history"
                className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>

              <div className="overflow-y-auto px-6 py-14 sm:px-12 sm:py-16">
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-black">History of Eko</p>
              <h2 className="mt-4 text-3xl font-normal leading-tight tracking-[-0.02em] text-neutral-950 sm:text-4xl">
                The Obas of Lagos, and the city they ruled
              </h2>
              <div className="mt-6">
                <QuadBar />
              </div>

              <div className="mt-10 space-y-5">
                {LAGOS_HISTORY_NARRATIVE.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-[15px] leading-8 text-black">
                    {paragraph}
                  </p>
                ))}
              </div>

              <h3 className="mt-14 text-2xl font-normal tracking-[-0.02em] text-neutral-950">
                Lagos Island and the Division
              </h3>
              <div className="mt-6 space-y-5">
                {LAGOS_ISLAND_NARRATIVE.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="text-[15px] leading-8 text-black">
                    {paragraph}
                  </p>
                ))}
              </div>

              <h3 className="mt-14 text-2xl font-normal tracking-[-0.02em] text-neutral-950">
                Genealogy of the Obas of Lagos
              </h3>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-300">
                      <th className="py-3 pr-4 font-normal text-neutral-950">Name</th>
                      <th className="py-3 pr-4 font-normal text-neutral-950">From</th>
                      <th className="py-3 pr-4 font-normal text-neutral-950">To</th>
                      <th className="py-3 font-normal text-neutral-950">Years</th>
                    </tr>
                  </thead>
                  <tbody>
                    {OBAS_OF_LAGOS.map(([name, from, to, years], index) => (
                      <tr key={`${name}-${from}`} className={index % 2 ? "bg-neutral-50" : undefined}>
                        <td className="py-3 pr-4 text-neutral-800">{name}</td>
                        <td className="py-3 pr-4 text-neutral-600">{from}</td>
                        <td className="py-3 pr-4 text-neutral-600">{to}</td>
                        <td className="py-3 text-neutral-600">{years}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h3 className="mt-14 text-2xl font-normal tracking-[-0.02em] text-neutral-950">
                Recognised chieftaincies in the Lagos City Council area
              </h3>
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                {LAGOS_CHIEFTAINCIES.map((group) => (
                  <div key={group.title} className="rounded-2xl border border-neutral-200 p-6">
                    <div className="h-1.5 w-12 rounded-full" style={{ background: group.color }} aria-hidden="true" />
                    <h4 className="mt-4 text-base font-normal text-neutral-950">{group.title}</h4>
                    <ol className="mt-4 space-y-1.5 text-sm text-black">
                      {group.names.map((name, index) => (
                        <li key={name} className="flex gap-3">
                          <span className="w-5 shrink-0 text-neutral-400">{index + 1}.</span>
                          <span>{name}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

export default function AboutPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const whyTextRef = useRef<HTMLDivElement>(null);
  const whyCardsRef = useRef<HTMLDivElement>(null);
  const focusHeadingRef = useRef<HTMLDivElement>(null);
  const focusTextRef = useRef<HTMLParagraphElement>(null);
  const focusCardsRef = useRef<HTMLDivElement>(null);
  const rootsTextRef = useRef<HTMLDivElement>(null);
  const rootsCarouselRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaLeftButtonRef = useRef<HTMLDivElement>(null);
  const ctaRightButtonRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after, queue }) => {
    /* Hero — on screen at load, so it plays straight away rather than on
       scroll. Headline block from the left and the "What drives us" panel
       from the right together, then the buttons fade in. */
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    /* Why we exist — left from the left, right from the right, together.
       Each has its own trigger so that on phones, where they stack, the
       cards animate when they reach the screen. */
    gsap.set(whyTextRef.current, { x: -SHIFT });
    gsap.set(whyCardsRef.current, { x: SHIFT });
    const whyText = timeline();
    whyText.tl.to(whyTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(whyTextRef.current)], () => whyText.tl.play());
    const whyCards = timeline();
    whyCards.tl.to(whyCardsRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(whyCardsRef.current)], () => whyCards.tl.play());

    /* Our focus — heading from the left, supporting line from the right,
       then the four image cards rise one at a time. */
    gsap.set(focusHeadingRef.current, { x: -SHIFT });
    gsap.set(focusTextRef.current, { x: SHIFT });
    const focusHeading = timeline();
    focusHeading.tl.to(focusHeadingRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(focusHeadingRef.current)], () => focusHeading.tl.play());
    const focusText = timeline();
    focusText.tl.to(focusTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(focusTextRef.current)], () => focusText.tl.play());
    queue(
      gsap.utils.toArray<HTMLElement>(focusCardsRef.current!.children),
      { y: SHIFT },
      Promise.all([focusHeading.done, focusText.done]),
    );

    /* Our Lagos roots — text from the left, then the carousel fades in. */
    gsap.set(rootsTextRef.current, { x: -SHIFT });
    const rootsText = timeline();
    rootsText.tl.to(rootsTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(rootsTextRef.current)], () => rootsText.tl.play());
    const rootsCarousel = timeline();
    rootsCarousel.tl.to(rootsCarouselRef.current, { opacity: 1, duration: 0.9, ease: "power2.out" });
    after([rootsText.done, entered(rootsCarouselRef.current)], () => rootsCarousel.tl.play());

    /* Closing call to action — heading and paragraph fade in, then the two
       buttons slide in together from opposite sides. */
    gsap.set(ctaLeftButtonRef.current, { x: -SHIFT });
    gsap.set(ctaRightButtonRef.current, { x: SHIFT });
    const cta = timeline();
    cta.tl
      .to(ctaTextRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(ctaLeftButtonRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE })
      .to(ctaRightButtonRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE }, "<");
    after([entered(ctaTextRef.current)], () => cta.tl.play());
  });

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
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
            <div className="max-w-3xl">
              <div ref={heroTextRef} data-reveal style={HIDDEN}>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                  {QUAD.map((color) => (
                    <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                  ))}
                  <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-white">
                    About Eko Club Philadelphia
                  </span>
                </div>

                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  Our <span style={{ color: EKO_GREEN }}>heritage</span>, our
                  <span style={{ color: EKO_YELLOW }}> service</span>, our story.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  We are Eko Club Philadelphia. We preserve our cultural heritage, serve families and
                  communities in need, and keep the story of Lagos alive through fellowship, outreach,
                  and visible impact.
                </p>
              </div>

              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="/membership/apply"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}66` }}
                >
                  Join the community
                </Link>
                <Link
                  href="#lagos-history"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Explore Lagos history
                </Link>
              </div>
            </div>

            <div
              ref={heroPanelRef}
              data-reveal
              className="rounded-4xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
              style={HIDDEN}
            >
              <WhatDrivesUsCarousel />
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="pointer-events-none absolute -right-10 top-0 select-none text-[8rem] font-normal leading-none text-neutral-100">
          EKO
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div ref={whyTextRef} data-reveal style={HIDDEN}>
            <SectionIntro
              eyebrow="Why we exist"
              title="Our mission, vision, and values"
              text="We are guided by a clear purpose: to unite Lagosians, preserve our cultural heritage, promote fellowship, and serve our members and communities through charitable, educational, cultural, and humanitarian initiatives."
            />
          </div>

          <div ref={whyCardsRef} data-reveal className="grid gap-5" style={HIDDEN}>
            {STORY_PILLARS.map((pillar) => (
              <article
                key={pillar.title}
                className="group rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-normal tracking-[-0.03em] text-neutral-950">{pillar.title}</h3>
                  <span className="h-3 w-3 rounded-full" style={{ background: pillar.color }} />
                </div>
                <p className="mt-4 text-sm leading-7 text-black sm:text-base">{pillar.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          {/* Heading left, supporting line right — the eyebrow, bar and type
              scale are the same ones SectionIntro uses elsewhere on the page,
              just laid out in two columns here. */}
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16">
            <div ref={focusHeadingRef} data-reveal style={HIDDEN}>
              <div className="flex">
                <QuadBar />
              </div>
              <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-black">
                Our focus
              </span>
              <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
                How we turn our mission into practical service
              </h2>
            </div>
            <p
              ref={focusTextRef}
              data-reveal
              className="text-base leading-8 text-black sm:text-lg"
              style={HIDDEN}
            >
              Our work is not abstract. It is expressed through scholarships, humanitarian
              support, community outreach, and consistent service to families in
              Philadelphia and beyond.
            </p>
          </div>

          {/* One strip, panels butted edge to edge — the photograph carries
              each panel and the caption sits over its base. */}
          <div ref={focusCardsRef} className="mt-12 grid overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
            {VALUES.map((value) => (
              <article
                key={value.title}
                data-reveal
                className="group relative aspect-[4/5] xl:aspect-[3/4]"
                style={HIDDEN}
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
                  <h3 className="mt-4 text-xl font-normal tracking-[-0.02em] text-white">{value.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/75">{value.desc}</p>
                </div>
              </article>
            ))}
          </div>
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
            <div ref={rootsTextRef} data-reveal className="lg:w-1/2" style={HIDDEN}>
              <p className="text-xs font-normal uppercase tracking-[0.2em] text-white/35 mb-4">Our Lagos roots</p>
              <h2 className="text-4xl font-normal text-white leading-snug mb-5 tracking-tight">
                The five IBILE divisions where we come from
              </h2>
              <p className="text-base text-white leading-relaxed font-normal mb-6">
                Ikorodu, Badagry, Ikeja, Lagos Island, and Epe; the five historic divisions
                of Lagos State that our members call home. Each carries its own festivals,
                monuments, and traditions, and together they make up the Lagos we carry
                with us.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Ikorodu", "Badagry", "Ikeja", "Lagos Island", "Epe"].map(d => (
                  <span key={d}
                        className="text-xs font-medium px-3 py-1.5 rounded-full border border-white/50 text-white">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div ref={rootsCarouselRef} data-reveal className="lg:w-1/2 w-full" style={HIDDEN}>
              <IbileCarousel />
            </div>
          </div>
        </div>
      </section>

      <LagosHistorySection />

      <ServiceProgramsSection />

      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO_GREEN }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div ref={ctaTextRef} data-reveal style={HIDDEN}>
            <div className="flex justify-center">
              <QuadBar />
            </div>
            <h2 className="mt-6 text-4xl font-normal tracking-[-0.04em] text-white sm:text-5xl">
              Keep the <span style={{ color: EKO_YELLOW }}>Eko spirit</span> moving.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Join a community that celebrates Lagos with depth, style, and action. From heritage to
              service, this is where memory becomes movement.
            </p>
          </div>
          {/* Each button sits in its own wrapper, which is what slides: the
              first button has a CSS transform transition for its hover lift,
              and that would drag behind GSAP's frame-by-frame writes. */}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftButtonRef} data-reveal style={HIDDEN}>
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO_GREEN }}
              >
                Apply for membership
              </Link>
            </div>
            <div ref={ctaRightButtonRef} data-reveal style={HIDDEN}>
              <Link
                href="/events"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                See upcoming events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
