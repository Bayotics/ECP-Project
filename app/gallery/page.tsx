"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import MediaViewer from "@/components/media/MediaViewer";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";
import type { MediaItem } from "@/lib/content/projects";
import { ALBUMS, GALLERY_CATEGORIES, MEDIA_COUNTS, type Album, type GalleryCategory } from "@/lib/content/gallery";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];
const ytThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const CATEGORY_COLOR: Record<GalleryCategory, string> = {
  "Community service": EKO.green,
  Education: EKO.blue,
  Culture: EKO.green,
  Health: EKO.red,
  Leadership: EKO.blue,
  Lagos: EKO.yellow,
};

type MediaFilter = "all" | "photo" | "video";

const MEDIA_FILTERS: { value: MediaFilter; label: string }[] = [
  { value: "all", label: "Everything" },
  { value: "photo", label: "Photographs" },
  { value: "video", label: "Video" },
];

function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-28 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

function PlayBadge({ label }: { label?: string }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-3 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
          <polygon points="7 4 20 12 7 20 7 4" />
        </svg>
        {label && <span className="pr-1 text-xs font-normal uppercase tracking-[0.16em]">{label}</span>}
      </span>
    </span>
  );
}

/* One frame in an album grid. The first frame of each album takes a 2×2 cell
   on anything wider than a phone, which gives the grid a lead image without
   needing a second layout. */
function Tile({
  item,
  onOpen,
  feature,
  accent,
}: {
  item: MediaItem;
  onOpen: () => void;
  feature?: boolean;
  accent: string;
}) {
  const src = item.kind === "image" ? item.src : item.kind === "video" ? item.poster : ytThumb(item.id);
  const label = item.kind === "image" ? item.alt : item.kind === "video" ? item.alt : item.title;
  const caption = item.kind === "youtube" ? item.caption ?? item.title : item.caption;

  return (
    <button
      type="button"
      data-tile
      onClick={onOpen}
      aria-label={`Open ${label}`}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        feature && "sm:col-span-2 sm:row-span-2",
      )}
      style={{ "--tw-ring-color": accent } as React.CSSProperties}
    >
      <Image
        src={src}
        alt={label}
        fill
        sizes={feature ? "(max-width: 640px) 50vw, (max-width: 1024px) 66vw, 50vw" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
      />
      <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/25" aria-hidden="true" />
      {item.kind !== "image" && <PlayBadge label={item.kind === "video" ? "Clip" : "Film"} />}
      {caption && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 text-left opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="block text-xs font-normal leading-5 text-white">{caption}</span>
        </span>
      )}
    </button>
  );
}

function AlbumBlock({
  album,
  media,
  onOpen,
}: {
  album: Album;
  media: MediaItem[];
  onOpen: (items: MediaItem[], index: number) => void;
}) {
  const color = CATEGORY_COLOR[album.category];
  return (
    <section data-album aria-labelledby={`album-${album.id}`} className="scroll-mt-28" id={album.id}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
            {album.category}
          </p>
          <h3 id={`album-${album.id}`} className="mt-3 text-2xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-3xl">
            {album.title}
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-black">{album.blurb}</p>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm text-neutral-600">
            {media.length} item{media.length !== 1 ? "s" : ""}
          </span>
          {album.href && (
            <Link href={album.href} className="group inline-flex items-center gap-1.5 text-sm font-normal text-neutral-900 hover:text-green-700">
              Read the story
              <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                →
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid auto-rows-auto grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((item, i) => (
          <Tile
            key={item.kind === "youtube" ? item.id : item.src}
            item={item}
            accent={color}
            feature={i === 0 && media.length > 3}
            onOpen={() => onOpen(media, i)}
          />
        ))}
      </div>
    </section>
  );
}

export default function GalleryPage() {
  const [category, setCategory] = useState<GalleryCategory | "All">("All");
  const [media, setMedia] = useState<MediaFilter>("all");

  const [viewerItems, setViewerItems] = useState<MediaItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const openViewer = useCallback((items: MediaItem[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
  }, []);
  const closeViewer = useCallback(() => setViewerIndex(null), []);

  const visible = useMemo(() => {
    return ALBUMS.map((album) => ({
      album,
      media: album.media.filter((m) => (media === "all" ? true : media === "photo" ? m.kind === "image" : m.kind !== "image")),
    })).filter(({ album, media: list }) => list.length > 0 && (category === "All" || album.category === category));
  }, [category, media]);

  const shown = visible.reduce((n, v) => n + v.media.length, 0);

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const albumsRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaLeftRef = useRef<HTMLDivElement>(null);
  const ctaRightRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after, queue }) => {
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    gsap.set(headRef.current, { x: -SHIFT });
    gsap.set(controlsRef.current, { y: 24 });
    const head = timeline();
    head.tl
      .to(headRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(controlsRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3");
    after([entered(headRef.current)], () => head.tl.play());

    gsap.set(albumsRef.current, { opacity: 1 });
    queue(gsap.utils.toArray<HTMLElement>("[data-album]", albumsRef.current), { opacity: 0, y: SHIFT }, head.done, 1.8);

    gsap.set(ctaLeftRef.current, { x: -SHIFT });
    gsap.set(ctaRightRef.current, { x: SHIFT });
    const cta = timeline();
    cta.tl
      .to(ctaTextRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(ctaLeftRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE })
      .to(ctaRightRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE }, "<");
    after([entered(ctaTextRef.current)], () => cta.tl.play());
  });

  /* The reveal above only covers the first render, where every album is on
     the page. Changing a filter rewrites that list and moves everything
     below it, so the remaining blocks are animated in here and the scroll
     triggers are remeasured against the new layout. Guarded on an actual
     change of selection, which also keeps React's development double run of
     effects from firing it on mount. */
  const lastSelection = useRef<string | null>(null);
  useEffect(() => {
    const selection = `${category}|${media}`;
    const previous = lastSelection.current;
    lastSelection.current = selection;
    if (previous === null || previous === selection) return;
    const root = albumsRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(root.querySelectorAll("[data-album]"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45, ease: EASE, stagger: 0.06 });
    }, root);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [category, media]);

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/projects/parade/eyo-street.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
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
          <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div ref={heroTextRef} data-reveal style={HIDDEN}>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                  {QUAD.map((color) => (
                    <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                  ))}
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">Photo and film library</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  The club, <span style={{ color: EKO.green }}>frame</span> by{" "}
                  <span style={{ color: EKO.yellow }}>frame</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  The club&apos;s photographs and film, gathered into albums: the roadside in Bucks County, the hall in
                  November, the parade route in New York, the webinar series, the people who lead the club, and the
                  city that gave us our name. Open any frame to see it full size.
                </p>
              </div>
              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#albums"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Browse the albums
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Read the stories
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-white">In the library</p>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { value: MEDIA_COUNTS.albums, label: "Albums", color: EKO.green },
                  { value: MEDIA_COUNTS.photos, label: "Photographs", color: EKO.blue },
                  { value: MEDIA_COUNTS.clips, label: "Club clips", color: EKO.yellow },
                  { value: MEDIA_COUNTS.films, label: "Films on YouTube", color: EKO.red },
                ].map((s) => (
                  <div key={s.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <span className="block text-4xl font-normal tracking-[-0.04em]" style={{ color: s.color }}>
                        {s.value}
                      </span>
                      <span className="mt-2 block text-xs font-normal uppercase tracking-[0.16em] text-white">{s.label}</span>
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

      {/* ─── Albums ─── */}
      <section id="albums" className="scroll-mt-28 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div ref={headRef} data-reveal style={HIDDEN}>
              <QuadBar />
              <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
                Gallery
              </span>
              <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
                {MEDIA_COUNTS.albums} albums, one club
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-700">
                Filter by the kind of work, or narrow to the moving pictures. Every album links back to the page where
                the story behind it is told.
              </p>
            </div>

            <div ref={controlsRef} data-reveal className="flex flex-col gap-3 lg:items-end" style={HIDDEN}>
              <div role="tablist" aria-label="Media type" className="flex rounded-full border border-neutral-200 bg-white p-1">
                {MEDIA_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    role="tab"
                    aria-selected={f.value === media}
                    onClick={() => setMedia(f.value)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-normal transition-colors",
                      f.value === media ? "bg-green-700 text-white" : "text-neutral-600 hover:text-neutral-950",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-neutral-600">
                {shown} item{shown !== 1 ? "s" : ""} in view
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["All", ...GALLERY_CATEGORIES] as const).map((c) => {
              const on = c === category;
              const color = c === "All" ? "#0a0a0a" : CATEGORY_COLOR[c];
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={on}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-normal transition-colors"
                  style={{
                    borderColor: on ? color : "#e5e5e5",
                    background: on ? `${color}14` : "#ffffff",
                    color: on ? "#0a0a0a" : "#525252",
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
                  {c === "All" ? "Everything" : c}
                </button>
              );
            })}
          </div>

          <div ref={albumsRef} data-reveal className="mt-12 space-y-16" style={HIDDEN}>
            {visible.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-normal text-neutral-900">Nothing matches that combination.</p>
                <button
                  onClick={() => {
                    setCategory("All");
                    setMedia("all");
                  }}
                  className="mt-3 text-sm font-normal text-green-700 hover:underline"
                >
                  Show everything
                </button>
              </div>
            ) : (
              visible.map(({ album, media: list }) => (
                <AlbumBlock key={album.id} album={album} media={list} onOpen={openViewer} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── Call to action ─── */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO.blue }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div ref={ctaTextRef} data-reveal style={HIDDEN}>
            <div className="flex justify-center">
              <QuadBar />
            </div>
            <h2 className="mt-6 text-4xl font-normal tracking-[-0.04em] text-white sm:text-5xl">
              Be in the <span style={{ color: EKO.yellow }}>next album</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Every picture here started with someone giving up a Saturday. Come to an event, join a committee, and put
              yourself in the frame.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftRef} data-reveal style={HIDDEN}>
              <Link
                href="/events"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green }}
              >
                See what&apos;s coming up
              </Link>
            </div>
            <div ref={ctaRightRef} data-reveal style={HIDDEN}>
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                Apply for membership
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MediaViewer items={viewerItems} index={viewerIndex} onClose={closeViewer} onIndex={setViewerIndex} />
    </div>
  );
}
