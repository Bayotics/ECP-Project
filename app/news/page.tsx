"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import { useNews } from "@/context/NewsContext";
import type { NewsCategory, NewsPost } from "@/lib/models/news";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  news: "News",
  announcement: "Announcement",
  report: "Report",
  opinion: "Opinion",
  "press-release": "Press release",
  blog: "Blog",
};

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  news: EKO.blue,
  announcement: EKO.green,
  report: EKO.yellow,
  opinion: "#7c3aed",
  "press-release": EKO.red,
  blog: "#0891b2",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as NewsCategory[];

/* Published dates are ISO strings formatted in UTC, so the server and a
   reader in another timezone never disagree about the day. */
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-28 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-neutral-400" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function Byline({ post, tone = "light" }: { post: NewsPost; tone?: "light" | "dark" }) {
  const muted = tone === "dark" ? "text-white/70" : "text-neutral-500";
  return (
    <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", muted)}>
      <span className="inline-flex items-center gap-2">
        {post.authorAvatarUrl ? (
          <Image src={post.authorAvatarUrl} alt="" width={22} height={22} className="h-[22px] w-[22px] rounded-full object-cover" />
        ) : (
          <span
            className={cn(
              "flex h-[22px] w-[22px] items-center justify-center rounded-full text-[10px] font-normal",
              tone === "dark" ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-700",
            )}
            aria-hidden="true"
          >
            {post.authorName.charAt(0)}
          </span>
        )}
        {post.authorName}
      </span>
      {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
      <span>{post.readingTimeMinutes} min read</span>
    </p>
  );
}

/* ─── Cards ─────────────────────────────────────────────────────────────── */

function StoryCard({ post }: { post: NewsPost }) {
  const color = CATEGORY_COLOR[post.category];
  return (
    <article
      data-story-card
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]"
    >
      <Link href={`/news/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden">
        {post.imageUrl ? (
          <>
            <Image
              src={post.imageUrl}
              alt={post.imageAlt ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" aria-hidden="true" />
          </>
        ) : (
          /* No picture filed with this story, so the category carries the
             card instead of a stand-in photograph. */
          <span className="absolute inset-0 flex items-end p-6" style={{ background: `linear-gradient(135deg, ${color} 0%, #0a0a0a 120%)` }}>
            <span className="text-3xl font-normal leading-tight tracking-[-0.03em] text-white/90">{CATEGORY_LABEL[post.category]}</span>
          </span>
        )}
        <span className="absolute left-4 top-4 flex flex-wrap gap-2">
          {post.isBreaking && <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-normal text-white">Breaking</span>}
          {post.isPinned && <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-normal text-neutral-800 backdrop-blur">Pinned</span>}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
          {CATEGORY_LABEL[post.category]}
        </p>
        <h3 className="mt-3 text-xl font-normal leading-snug tracking-[-0.02em] text-neutral-950">
          <Link href={`/news/${post.slug}`} className="transition-colors hover:text-green-700">
            {post.title}
          </Link>
        </h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-neutral-700">{post.excerpt}</p>
        <div className="mt-6 border-t border-neutral-100 pt-4">
          <Byline post={post} />
        </div>
      </div>
    </article>
  );
}

function LeadStory({ post }: { post: NewsPost }) {
  const color = CATEGORY_COLOR[post.category];
  return (
    <article className="group grid overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)] lg:grid-cols-2">
      <Link href={`/news/${post.slug}`} className="relative block aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[22rem]">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.imageAlt ?? ""}
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color} 0%, #0a0a0a 120%)` }} />
        )}
        <span className="absolute left-5 top-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-900 backdrop-blur">
            Lead story
          </span>
          {post.isBreaking && <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-normal text-white">Breaking</span>}
        </span>
      </Link>

      <div className="flex flex-col justify-center p-7 sm:p-10">
        <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
          {CATEGORY_LABEL[post.category]}
        </p>
        <h3 className="mt-4 text-3xl font-normal leading-tight tracking-[-0.03em] text-neutral-950 sm:text-4xl">
          <Link href={`/news/${post.slug}`} className="transition-colors hover:text-green-700">
            {post.title}
          </Link>
        </h3>
        <p className="mt-4 text-base leading-8 text-black">{post.excerpt}</p>
        <div className="mt-6">
          <Byline post={post} />
        </div>
        <Link href={`/news/${post.slug}`} className="group/link mt-7 inline-flex items-center gap-2 text-sm font-normal text-green-700 hover:text-green-800">
          Read the story
          <span className="transition-transform duration-300 group-hover/link:translate-x-0.5" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </article>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function NewsPage() {
  const { getPublished, getBreaking, isLoading } = useNews();
  const published = getPublished();
  const breaking = getBreaking();

  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let posts = category === "all" ? published : published.filter((p) => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      posts = posts.filter(
        (p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return posts;
  }, [published, category, search]);

  const untouched = category === "all" && !search.trim();
  const lead = untouched ? published.find((p) => p.isPinned) ?? published.find((p) => p.isFeatured) ?? published[0] : undefined;
  const rest = lead ? filtered.filter((p) => p.id !== lead.id) : filtered;

  const counts = useMemo(() => {
    const map = new Map<NewsCategory, number>();
    for (const p of published) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [published]);

  const lastUpdated = published[0]?.publishedAt;

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaLeftRef = useRef<HTMLDivElement>(null);
  const ctaRightRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after }) => {
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    /* Stories arrive from the API after mount, so the newsroom reveals as
       whole blocks rather than card by card. */
    gsap.set(headRef.current, { x: -SHIFT });
    gsap.set([controlsRef.current, leadRef.current, gridRef.current], { y: 24 });
    const room = timeline();
    room.tl
      .to(headRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(controlsRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3")
      .to(leadRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3")
      .to(gridRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3");
    after([entered(headRef.current)], () => room.tl.play());

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
          <Image src="/gallery/projects/scholarship/2026-awardees.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
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
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">The newsroom</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  What the club is <span style={{ color: EKO.green }}>saying</span> and{" "}
                  <span style={{ color: EKO.yellow }}>doing</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  Announcements, reports from the field, press releases and writing from our members. Everything the
                  club publishes lands here first.
                </p>
              </div>

              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#newsroom"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Read the latest
                </Link>
                <Link
                  href="/events"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  See upcoming events
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              {breaking.length > 0 ? (
                <>
                  <p className="flex items-center gap-2 text-xs font-normal uppercase tracking-[0.22em] text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
                    Breaking
                  </p>
                  <ul className="mt-5 space-y-3">
                    {breaking.slice(0, 3).map((post) => (
                      <li key={post.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                        <Link href={`/news/${post.slug}`} className="block text-base leading-7 text-white transition-colors hover:text-white/80">
                          {post.title}
                        </Link>
                        {post.publishedAt && <p className="mt-2 text-xs text-white/60">{formatDate(post.publishedAt)}</p>}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p className="text-xs font-normal uppercase tracking-[0.22em] text-white">In the newsroom</p>
                  <dl className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                      <dt className="sr-only">Stories published</dt>
                      <dd>
                        <span className="block text-4xl font-normal tracking-[-0.04em]" style={{ color: EKO.green }}>
                          {isLoading ? "–" : published.length}
                        </span>
                        <span className="mt-2 block text-xs font-normal uppercase tracking-[0.16em] text-white">Stories published</span>
                      </dd>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                      <dt className="sr-only">Categories in use</dt>
                      <dd>
                        <span className="block text-4xl font-normal tracking-[-0.04em]" style={{ color: EKO.yellow }}>
                          {isLoading ? "–" : counts.size}
                        </span>
                        <span className="mt-2 block text-xs font-normal uppercase tracking-[0.16em] text-white">Kinds of story</span>
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 rounded-3xl border border-white/10 bg-black/20 p-5">
                    <p className="text-xs font-normal uppercase tracking-[0.16em] text-white/45">Last published</p>
                    <p className="mt-2 text-sm text-white">
                      {isLoading ? "Checking the newsroom…" : lastUpdated ? formatDate(lastUpdated) : "Nothing published yet."}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      {/* ─── Newsroom ─── */}
      <section id="newsroom" className="scroll-mt-28 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div ref={headRef} data-reveal style={HIDDEN}>
              <QuadBar />
              <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
                News and updates
              </span>
              <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
                Straight from the club
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-700">
                Search the archive or narrow it to the kind of story you are after.
              </p>
            </div>

            <div ref={controlsRef} data-reveal className="flex flex-col gap-3 lg:items-end" style={HIDDEN}>
              <div className="relative w-full max-w-sm">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <label htmlFor="news-search" className="sr-only">
                  Search news
                </label>
                <input
                  id="news-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the archive"
                  className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <p className="text-sm text-neutral-600">
                {isLoading ? "Loading stories…" : `${filtered.length} stor${filtered.length === 1 ? "y" : "ies"}`}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["all", ...CATEGORIES] as const).map((c) => {
              const on = c === category;
              const color = c === "all" ? "#0a0a0a" : CATEGORY_COLOR[c];
              const n = c === "all" ? published.length : counts.get(c) ?? 0;
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
                  {c === "all" ? "Everything" : CATEGORY_LABEL[c]}
                  {n > 0 && <span className="text-neutral-400">{n}</span>}
                </button>
              );
            })}
          </div>

          <div ref={leadRef} data-reveal className="mt-10" style={HIDDEN}>
            {lead && !isLoading && <LeadStory post={lead} />}
          </div>

          <div ref={gridRef} data-reveal className="mt-8" style={HIDDEN}>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[26rem] animate-pulse rounded-[1.75rem] bg-neutral-200/70" />
                ))}
              </div>
            ) : rest.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-normal text-neutral-900">
                  {published.length === 0 ? "Nothing has been published yet." : "No stories match that search."}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-neutral-600">
                  {published.length === 0
                    ? "The newsroom is new. In the meantime, the projects page carries the fullest account of what the club has been doing."
                    : "Try a different word, or show everything."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {published.length === 0 ? (
                    <Link href="/projects" className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white" style={{ background: EKO.green }}>
                      See our projects
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setCategory("all");
                        setSearch("");
                      }}
                      className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white"
                      style={{ background: EKO.green }}
                    >
                      Show everything
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post) => (
                  <StoryCard key={post.id} post={post} />
                ))}
              </div>
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
              Hear it <span style={{ color: EKO.yellow }}>first</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Members get the announcements before they reach this page, and they are the ones who make most of the
              news in the first place.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftRef} data-reveal style={HIDDEN}>
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green }}
              >
                Apply for membership
              </Link>
            </div>
            <div ref={ctaRightRef} data-reveal style={HIDDEN}>
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                Get in touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
