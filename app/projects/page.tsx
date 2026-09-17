"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import MediaViewer from "@/components/media/MediaViewer";
import { cn } from "@/utils/cn";
import { EKO, PROGRAMS } from "@/lib/content/programs";
import {
  FEATURED_VIDEO,
  HEALTH_INTRO,
  MEDICAL_MISSION_TEXT,
  MEDICAL_MISSION_VIDEOS,
  PROJECTS,
  WEBINARS,
  YOUTUBE_CHANNEL,
  type MediaItem,
  type Project,
} from "@/lib/content/projects";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/* Pixel sizes of the webinar flyers as stored in /public, so the viewer
   lays each one out at its true proportions (several are square). */
const FLYER_SIZE: Record<string, { w: number; h: number }> = {
  "/gallery/projects/health/flyer-back-pain-2025-09.jpg": { w: 1300, h: 1600 },
  "/gallery/projects/health/flyer-dementia-2026-02.jpg": { w: 1230, h: 1600 },
  "/gallery/projects/health/flyer-healthy-lifestyle-2025-06.jpg": { w: 1300, h: 1600 },
  "/gallery/projects/health/flyer-stroke-2025-05.jpg": { w: 1300, h: 1600 },
  "/gallery/projects/health/flyer-heart-health-2025-01.jpg": { w: 1600, h: 1600 },
  "/gallery/projects/health/flyer-colon-cancer-2024-12.jpg": { w: 1600, h: 1600 },
  "/gallery/projects/health/flyer-gynecologic-2025-03.jpg": { w: 1600, h: 1600 },
  "/gallery/projects/health/flyer-preventive-medicine-2026-04.jpg": { w: 1576, h: 1600 },
};

type OpenViewer = (items: MediaItem[], index: number) => void;

/* ─── Small building blocks ─────────────────────────────────────────────── */

function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-28 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

function PlayBadge({ label, large }: { label?: string; large?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={cn(
          "flex items-center gap-2 rounded-full bg-white/20 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110",
          large ? "p-6" : "p-3.5",
        )}
      >
        <svg viewBox="0 0 24 24" className={cn("fill-current", large ? "h-10 w-10" : "h-5 w-5")} aria-hidden="true">
          <polygon points="7 4 20 12 7 20 7 4" />
        </svg>
        {label && <span className="pr-1 text-xs font-normal uppercase tracking-[0.16em]">{label}</span>}
      </span>
    </span>
  );
}

function tileSrc(item: MediaItem) {
  if (item.kind === "image") return { src: item.src, alt: item.alt };
  if (item.kind === "video") return { src: item.poster, alt: item.alt };
  return { src: ytThumb(item.id), alt: item.title };
}

function MediaTile({
  item,
  onOpen,
  sizes,
  className,
  more,
}: {
  item: MediaItem;
  onOpen: () => void;
  sizes: string;
  className?: string;
  more?: number;
}) {
  const { src, alt } = tileSrc(item);
  return (
    <button
      type="button"
      data-tile
      onClick={onOpen}
      aria-label={item.kind === "image" ? `View photo: ${alt}` : `Play: ${alt}`}
      className={cn("group relative block overflow-hidden rounded-2xl bg-neutral-200", className)}
    >
      <Image src={src} alt="" fill sizes={sizes} className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
      <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" aria-hidden="true" />
      {item.kind !== "image" && <PlayBadge label={item.kind === "video" ? "Clip" : undefined} />}
      {more ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-normal text-white">
          +{more} more
        </span>
      ) : null}
    </button>
  );
}

/* A large lead tile and up to three smaller ones; the last small tile
   carries a "+N more" count when the set is bigger, and every tile opens
   the full set in the viewer. */
function Mosaic({ media, onOpen, accent }: { media: MediaItem[]; onOpen: OpenViewer; accent: string }) {
  const [lead, ...rest] = media;
  const shown = rest.slice(0, 3);
  const hidden = media.length - 1 - shown.length;
  return (
    <div className="relative">
      <div className="absolute -inset-3 rounded-[2.2rem] opacity-15 blur-2xl" style={{ background: accent }} aria-hidden="true" />
      <div className="relative grid gap-3">
        <MediaTile item={lead} onOpen={() => onOpen(media, 0)} sizes="(max-width: 1024px) 100vw, 640px" className="aspect-[4/3] w-full" />
        {shown.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {shown.map((item, i) => (
              <MediaTile
                key={i}
                item={item}
                onOpen={() => onOpen(media, i + 1)}
                sizes="(max-width: 1024px) 33vw, 210px"
                className="aspect-square w-full"
                more={i === shown.length - 1 && hidden > 0 ? hidden : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── A documented project ──────────────────────────────────────────────── */

function ProjectSection({ project, index, onOpen }: { project: Project; index: number; onOpen: OpenViewer }) {
  const program = PROGRAMS.find((p) => p.id === project.programId);
  const flip = index % 2 === 1;
  const [lead, ...extra] = project.groups;

  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const extraRef = useRef<HTMLDivElement>(null);

  // Text slides in from its own side while the photo mosaic rises; any
  // further groups (e.g. individual award years) follow as they scroll in.
  useReveal(sectionRef, ({ timeline, entered, after, queue }) => {
    gsap.set(textRef.current, { x: flip ? SHIFT : -SHIFT });
    gsap.set(mediaRef.current, { y: SHIFT });
    const intro = timeline();
    intro.tl
      .to(textRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(mediaRef.current, { opacity: 1, y: 0, duration: 0.8, ease: EASE }, "<0.1");
    after([entered(textRef.current)], () => intro.tl.play());
    if (extraRef.current) {
      queue(gsap.utils.toArray<HTMLElement>(extraRef.current.children), { opacity: 0, y: SHIFT }, intro.done);
    }
  });

  return (
    <section
      ref={sectionRef}
      id={project.id}
      className={cn("scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8 lg:py-24", index % 2 === 0 ? "bg-white" : "bg-neutral-50")}
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div ref={textRef} data-reveal className={cn(flip && "lg:order-2")} style={HIDDEN}>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="rounded-full px-4 py-1 text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-950"
                style={{ background: `${project.accent}1f` }}
              >
                {project.kicker}
              </span>
              <span className="text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-500">{project.category}</span>
            </div>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {project.title}
            </h2>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
              <span className="inline-flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 11h18" />
                </svg>
                {project.when}
              </span>
              {project.where && (
                <span className="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {project.where}
                </span>
              )}
            </div>
            <div className="mt-6 space-y-4">
              {project.body.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-base leading-8 text-black">
                  {paragraph}
                </p>
              ))}
            </div>
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
              {project.facts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border border-neutral-600 bg-white p-4">
                  <dt className="sr-only">{fact.label}</dt>
                  <dd>
                    <span className="block text-2xl font-normal tracking-[-0.03em]" style={{ color: project.accent }}>
                      {fact.value}
                    </span>
                    <span className="mt-1 block text-xs font-normal uppercase tracking-[0.14em] text-black">{fact.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
            {program && (
              <Link
                href="/programs#calendar"
                className="group mt-8 inline-flex items-center gap-2 text-sm font-normal text-neutral-900 hover:text-green-700"
              >
                Part of the {program.name} program
                <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">→</span>
              </Link>
            )}
          </div>

          <div ref={mediaRef} data-reveal className={cn(flip && "lg:order-1")} style={HIDDEN}>
            {lead.heading && (
              <p className="mb-4 text-xs font-normal uppercase tracking-[0.2em] text-neutral-800">{lead.heading}</p>
            )}
            <Mosaic media={lead.media} onOpen={onOpen} accent={project.accent} />
          </div>
        </div>

        {extra.length > 0 && (
          <div ref={extraRef} className="mt-16 grid gap-10">
            {extra.map((group) => (
              <div key={group.heading} className="grid gap-6 border-t border-neutral-200 pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
                <div>
                  {group.heading && <h3 className="text-xl font-normal tracking-[-0.02em] text-neutral-950">{group.heading}</h3>}
                  {group.text && <p className="mt-3 text-sm leading-7 text-black">{group.text}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {group.media.map((item, i) => (
                    <div key={i} className="relative">
                      <MediaTile
                        item={item}
                        onOpen={() => onOpen(group.media, i)}
                        sizes="(max-width: 640px) 50vw, 260px"
                        className="aspect-[4/5] w-full"
                      />
                      {item.kind === "image" && item.caption && (
                        <p className="mt-2 text-xs font-normal text-black">{item.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Health Education webinar library ─────────────────────────────────── */

function HealthSection({ onOpen }: { onOpen: OpenViewer }) {
  const webinars = [...WEBINARS].sort((a, b) => (a.sort < b.sort ? 1 : -1));
  const videoItems: MediaItem[] = webinars.map((w) => ({
    kind: "youtube",
    id: w.id,
    title: w.title,
    caption: `${w.title} — ${w.speakers}`,
  }));
  const flyers: MediaItem[] = webinars
    .filter((w) => w.flyer)
    .map((w) => ({
      kind: "image",
      src: w.flyer!,
      alt: `Flyer: ${w.title}`,
      caption: `${w.title} · ${w.date}`,
      ...(FLYER_SIZE[w.flyer!] ?? { w: 1300, h: 1600 }),
    }));

  const sectionRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const flyersRef = useRef<HTMLDivElement>(null);

  useReveal(sectionRef, ({ timeline, entered, after, queue }) => {
    gsap.set(headRef.current, { x: -SHIFT });
    const head = timeline();
    head.tl.to(headRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(headRef.current)], () => head.tl.play());
    const cards = queue(gsap.utils.toArray<HTMLElement>(gridRef.current!.children), { opacity: 0, y: SHIFT }, head.done, 1.6);
    gsap.set(flyersRef.current, { y: 24 });
    const flyerTl = timeline();
    flyerTl.tl.to(flyersRef.current, { opacity: 1, y: 0, duration: 0.8, ease: EASE });
    after([cards, entered(flyersRef.current)], () => flyerTl.tl.play());
  });

  return (
    <section ref={sectionRef} id="health-education" className="relative scroll-mt-24 overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-600/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-green-600/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <div ref={headRef} data-reveal className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end" style={HIDDEN}>
          <div>
            <QuadBar />
            <span className="mt-5 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-white/75">
              Health · Webinar series
            </span>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-white sm:text-4xl lg:text-5xl">
              Health Education, <span style={{ color: EKO.red }}>on the record</span>
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/70">{HEALTH_INTRO}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 lg:justify-end">
            <div className="rounded-3xl border border-white/10 bg-white/6 px-6 py-5">
              <p className="text-4xl font-normal tracking-[-0.04em] text-white">{WEBINARS.length}</p>
              <p className="mt-1 text-xs font-normal uppercase tracking-[0.16em] text-white/55">Recorded sessions</p>
            </div>
            <a
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm font-normal text-white transition-colors hover:bg-white/10"
            >
              ECP on YouTube ↗
            </a>
          </div>
        </div>

        <div ref={gridRef} className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {webinars.map((w, i) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onOpen(videoItems, i)}
              className="group flex flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] text-left transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            >
              <span className="relative block aspect-video w-full overflow-hidden bg-neutral-900">
                <Image src={ytThumb(w.id)} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px" className="object-cover opacity-85 transition-transform duration-700 group-hover:scale-[1.05]" />
                <PlayBadge />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-normal text-white backdrop-blur">
                  {w.dateKind === "held" ? w.date : `Published ${w.date}`}
                </span>
              </span>
              <span className="flex flex-1 flex-col p-5">
                <span className="text-base font-normal leading-6 text-white">{w.title}</span>
                <span className="mt-3 text-sm text-white/75">{w.speakers}</span>
                {w.affiliation && <span className="mt-1 text-xs text-white/50">{w.affiliation}</span>}
              </span>
            </button>
          ))}
        </div>

        <div ref={flyersRef} data-reveal className="mt-14" style={HIDDEN}>
          <p className="text-xs font-normal uppercase tracking-[0.2em] text-white/50">Session flyers</p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2" data-lenis-prevent>
            {flyers.map((f, i) => (
              <MediaTile
                key={i}
                item={f}
                onOpen={() => onOpen(flyers, i)}
                sizes="180px"
                className="aspect-[13/16] w-36 shrink-0 sm:w-44"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── ECI medical missions ─────────────────────────────────────────────── */

function MedicalMissionSection({ onOpen }: { onOpen: OpenViewer }) {
  const items: MediaItem[] = MEDICAL_MISSION_VIDEOS.map((v) => ({ kind: "youtube", id: v.id, title: v.title }));
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<HTMLDivElement>(null);

  useReveal(sectionRef, ({ timeline, entered, after }) => {
    gsap.set(textRef.current, { x: -SHIFT });
    gsap.set(videosRef.current, { x: SHIFT });
    const tl = timeline();
    tl.tl
      .to(textRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(videosRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<");
    after([entered(textRef.current)], () => tl.tl.play());
  });

  return (
    <section ref={sectionRef} id="medical-missions" className="scroll-mt-24 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div ref={textRef} data-reveal style={HIDDEN}>
          <span className="rounded-full bg-red-600/10 px-4 py-1 text-[11px] font-normal uppercase tracking-[0.2em] text-neutral-950">
            Parent body · Eko Club International
          </span>
          <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            ECI Medical Missions
          </h2>
          <p className="mt-5 text-base leading-8 text-black">{MEDICAL_MISSION_TEXT}</p>
          <Link
            href="/programs#calendar"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-normal text-neutral-900 hover:text-green-700"
          >
            Part of the Medical Mission program
            <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">→</span>
          </Link>
        </div>
        <div ref={videosRef} data-reveal className="grid gap-5 sm:grid-cols-2" style={HIDDEN}>
          {MEDICAL_MISSION_VIDEOS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onOpen(items, i)}
              className="group overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white text-left shadow-[0_24px_70px_rgba(15,23,42,0.07)]"
            >
              <span className="relative block aspect-video overflow-hidden bg-neutral-900">
                <Image src={ytThumb(v.id)} alt="" fill sizes="(max-width: 640px) 100vw, 380px" className="object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
                <PlayBadge />
              </span>
              <span className="block p-5">
                <span className="block text-base font-normal leading-6 text-neutral-950">{v.title}</span>
                <span className="mt-2 block text-xs text-neutral-500">{v.note}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function ProjectsPage() {
  const [viewer, setViewer] = useState<{ items: MediaItem[]; index: number } | null>(null);
  const openViewer = useCallback<OpenViewer>((items, index) => setViewer({ items, index }), []);
  const closeViewer = useCallback(() => setViewer(null), []);
  const setViewerIndex = useCallback((index: number) => setViewer((v) => (v ? { ...v, index } : v)), []);

  const featured: MediaItem[] = [{ kind: "youtube", id: FEATURED_VIDEO.id, title: FEATURED_VIDEO.title }];

  const byId = (id: string) => PROJECTS.find((p) => p.id === id)!;
  const beforeHealth = ["adopt-a-highway", "scholarships", "ronald-mcdonald-house", "back-to-school"].map(byId);
  const afterHealth = ["thanksgiving", "independence-day-parade", "school-outreach-2026"].map(byId);

  const index = [
    ...beforeHealth.map((p) => ({ id: p.id, title: p.title, tag: p.kicker, cover: p.cover.src, accent: p.accent })),
    { id: "health-education", title: "Health Education webinars", tag: "Health", cover: "/gallery/projects/health/flyer-dementia-2026-02.jpg", accent: EKO.red },
    ...afterHealth.map((p) => ({ id: p.id, title: p.title, tag: p.kicker, cover: p.cover.src, accent: p.accent })),
    { id: "medical-missions", title: "ECI Medical Missions", tag: "Parent body", cover: ytThumb(MEDICAL_MISSION_VIDEOS[1].id), accent: EKO.red },
  ];

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const indexHeadRef = useRef<HTMLDivElement>(null);
  const indexGridRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaLeftRef = useRef<HTMLDivElement>(null);
  const ctaRightRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after, queue }) => {
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroVideoRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroVideoRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    gsap.set(indexHeadRef.current, { x: -SHIFT });
    const indexHead = timeline();
    indexHead.tl.to(indexHeadRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE });
    after([entered(indexHeadRef.current)], () => indexHead.tl.play());
    queue(gsap.utils.toArray<HTMLElement>(indexGridRef.current!.children), { opacity: 0, y: SHIFT }, indexHead.done, 1.8);

    gsap.set(ctaLeftRef.current, { x: -SHIFT });
    gsap.set(ctaRightRef.current, { x: SHIFT });
    const cta = timeline();
    cta.tl
      .to(ctaTextRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(ctaLeftRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE })
      .to(ctaRightRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE }, "<");
    after([entered(ctaTextRef.current)], () => cta.tl.play());
  });

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/projects/highway/banner.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0.88) 100%)" }}
          />
        </div>

        {QUAD.map((color, i) => (
          <motion.div
            key={color}
            className="pointer-events-none absolute rounded-full blur-3xl"
            style={{ background: color, opacity: 0.16, width: 260, height: 260, left: `${8 + i * 20}%`, top: i % 2 === 0 ? "10%" : "52%" }}
            animate={{ y: [0, -24, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.45 }}
          />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-3xl">
              <div ref={heroTextRef} data-reveal style={HIDDEN}>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                  {QUAD.map((color) => (
                    <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                  ))}
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">Projects & initiatives</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  The <span style={{ color: EKO.green }}>work</span>, on the <span style={{ color: EKO.yellow }}>ground</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  Scholarships for local students, roadside cleanups in Bucks County, breakfasts and service days at
                  Ronald McDonald House, school supplies, Thanksgiving turkeys and a library of health webinars
                  documented in the club&apos;s own photos and film.
                </p>
              </div>
              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <button
                  type="button"
                  onClick={() => openViewer(featured, 0)}
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                    <polygon points="7 4 20 12 7 20 7 4" />
                  </svg>
                  Watch our initiatives
                </button>
                <Link
                  href="#projects"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Browse projects
                </Link>
              </div>
            </div>

            <div ref={heroVideoRef} data-reveal style={HIDDEN}>
              <button
                type="button"
                onClick={() => openViewer(featured, 0)}
                className="group relative block w-full overflow-hidden rounded-4xl border border-white/10 bg-white/6 p-3 text-left backdrop-blur-xl"
              >
                <span className="relative block aspect-video overflow-hidden rounded-[1.6rem]">
                  <Image src={ytThumb(FEATURED_VIDEO.id)} alt="" fill sizes="(max-width: 1024px) 100vw, 600px" className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden="true" />
                  <PlayBadge large />
                </span>
                <span className="flex items-center justify-between gap-4 px-3 pb-2 pt-4">
                  <span>
                    <span className="block text-xs font-normal uppercase tracking-[0.2em] text-white/45">Film · {FEATURED_VIDEO.length}</span>
                    <span className="mt-1 block text-lg font-normal text-white">{FEATURED_VIDEO.title}</span>
                  </span>
                </span>
              </button>
              <dl className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {[
                  { value: "2004", label: "Founded", color: EKO.green },
                  { value: "2 mi", label: "Road adopted", color: EKO.red },
                  { value: "5", label: "Scholarships a year", color: EKO.blue },
                  { value: String(WEBINARS.length), label: "Health webinars", color: EKO.yellow },
                ].map((s) => (
                  <div key={s.label} className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4 backdrop-blur-md">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <span className="block text-2xl font-normal tracking-[-0.04em]" style={{ color: s.color }}>
                        {s.value}
                      </span>
                      <span className="mt-1 block text-[11px] font-normal uppercase tracking-[0.14em] text-white">{s.label}</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      {/* ─── Project index ─── */}
      <section id="projects" className="scroll-mt-24 bg-white px-4 pt-20 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-7xl">
          <div ref={indexHeadRef} data-reveal style={HIDDEN}>
            <QuadBar />
            <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-black">
              Projects
            </span>
            <h2 className="mt-5 max-w-3xl text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
              Where our programs meet real people
            </h2>
          </div>
          <div ref={indexGridRef} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {index.map((item) => (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200"
              >
                <Image src={item.cover} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px" className="object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" aria-hidden="true" />
                <span className="absolute inset-x-0 bottom-0 p-4">
                  <span className="block h-1 w-8 rounded-full" style={{ background: item.accent }} aria-hidden="true" />
                  <span className="mt-2 block text-[10px] font-normal uppercase tracking-[0.18em] text-white/65">{item.tag}</span>
                  <span className="mt-1 block text-sm font-normal leading-5 text-white">{item.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {beforeHealth.map((project, i) => (
        <ProjectSection key={project.id} project={project} index={i} onOpen={openViewer} />
      ))}

      <HealthSection onOpen={openViewer} />

      {afterHealth.map((project, i) => (
        <ProjectSection key={project.id} project={project} index={i} onOpen={openViewer} />
      ))}

      <MedicalMissionSection onOpen={openViewer} />

      {/* ─── Call to action ─── */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO.green }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div ref={ctaTextRef} data-reveal style={HIDDEN}>
            <div className="flex justify-center">
              <QuadBar />
            </div>
            <h2 className="mt-6 text-4xl font-normal tracking-[-0.04em] text-white sm:text-5xl">
              Help us keep <span style={{ color: EKO.yellow }}>these projects moving</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Every cleanup, scholarship and turkey table runs on members and supporters. Give to the work, or see
              when the next program opens for sign-ups.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftRef} data-reveal style={HIDDEN}>
              <Link
                href="/donate"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green }}
              >
                Donate now
              </Link>
            </div>
            <div ref={ctaRightRef} data-reveal style={HIDDEN}>
              <Link
                href="/programs"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                View the programs calendar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MediaViewer items={viewer?.items ?? []} index={viewer?.index ?? null} onClose={closeViewer} onIndex={setViewerIndex} />
    </div>
  );
}
