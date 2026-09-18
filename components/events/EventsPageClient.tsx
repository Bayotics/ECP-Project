"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useIsClient, useReveal } from "@/components/gsap/useReveal";
import { useEvents, useRSVP } from "@/context";
import type { Event, EventType } from "@/lib/models";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

type DateFilter = "all" | "upcoming" | "past";
type ViewMode = "card" | "list";

const TYPE_LABEL: Record<EventType, string> = {
  "town-hall": "Town hall",
  workshop: "Workshop",
  volunteer: "Volunteer",
  meetup: "Meetup",
  seminar: "Seminar",
  "press-conference": "Press conference",
  other: "Other",
};

const TYPE_COLOR: Record<EventType, string> = {
  "town-hall": EKO.blue,
  workshop: EKO.yellow,
  volunteer: EKO.green,
  meetup: EKO.green,
  seminar: EKO.red,
  "press-conference": EKO.blue,
  other: "#525252",
};

const TYPE_OPTIONS: { value: EventType | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  ...(Object.keys(TYPE_LABEL) as EventType[]).map((t) => ({ value: t, label: TYPE_LABEL[t] })),
];

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
];

/* Dates arrive as ISO strings and are formatted in UTC, so a visitor in one
   timezone and the server in another never disagree about which day an
   event falls on. */
const dayFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" });
const monthFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" });
const dateFormat = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", day: "numeric" });

function formatDay(iso: string) {
  return dayFormat.format(new Date(iso));
}

function formatRange(event: Event) {
  const start = formatDay(event.date);
  if (!event.endDate || event.endDate.slice(0, 10) === event.date.slice(0, 10)) return start;
  return `${start} to ${formatDay(event.endDate)}`;
}

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-neutral-400" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", className)} aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", className)} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function Badges({ event, full }: { event: Event; full: boolean }) {
  return (
    <>
      {event.isFeatured && <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-normal text-white">Featured</span>}
      {event.membersOnly && (
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-normal text-neutral-800 backdrop-blur">Members only</span>
      )}
      {full && <span className="rounded-full bg-neutral-900/80 px-3 py-1 text-[11px] font-normal text-white backdrop-blur">Fully booked</span>}
      {event.isOnline && <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-normal text-neutral-800 backdrop-blur">Online</span>}
    </>
  );
}

/* ─── Event card ────────────────────────────────────────────────────────── */

function EventTile({ event, attending }: { event: Event; attending: number }) {
  const color = TYPE_COLOR[event.type];
  const full = !!(event.maxAttendees && attending >= event.maxAttendees);
  const summary = event.shortDescription ?? event.description;

  return (
    <article data-event-card className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
      <div className="relative aspect-[16/10] overflow-hidden">
        {event.imageUrl ? (
          <>
            <Image
              src={event.imageUrl}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" aria-hidden="true" />
          </>
        ) : (
          /* No photograph on this event yet: a typographic date panel in the
             type's colour rather than an unrelated stand-in picture. */
          <div className="absolute inset-0 flex flex-col justify-end p-6" style={{ background: `linear-gradient(135deg, ${color} 0%, #0a0a0a 120%)` }}>
            <p className="text-5xl font-normal tracking-[-0.04em] text-white/90">{monthFormat.format(new Date(event.date))}</p>
            <p className="text-5xl font-normal tracking-[-0.04em] text-white">{dateFormat.format(new Date(event.date))}</p>
          </div>
        )}
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <Badges event={event} full={full} />
        </div>
        {event.imageUrl && (
          <p className="absolute bottom-4 left-5 text-sm font-normal uppercase tracking-[0.18em] text-white">{formatDay(event.date)}</p>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
          {TYPE_LABEL[event.type]}
        </p>
        <h3 className="mt-3 text-2xl font-normal leading-tight tracking-[-0.03em] text-neutral-950">{event.title}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-neutral-700">{summary.length > 168 ? `${summary.slice(0, 168).trimEnd()}…` : summary}</p>

        <dl className="mt-6 space-y-2 rounded-2xl bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
          <div className="flex items-center gap-3">
            <dt className="sr-only">When</dt>
            <ClockIcon className="shrink-0 text-neutral-500" />
            <dd>
              {formatRange(event)}
              {event.time ? ` · ${event.time}` : ""}
            </dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="sr-only">Where</dt>
            <PinIcon className="shrink-0 text-neutral-500" />
            <dd>{event.isOnline ? event.location || "Online" : event.venue ? `${event.venue}, ${event.location}` : event.location}</dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-neutral-100 pt-4 text-sm font-normal">
          <Link href={`/events/${event.slug}`} className="group/link inline-flex items-center gap-1.5 text-green-700 hover:text-green-800">
            Event details
            <span className="transition-transform duration-300 group-hover/link:translate-x-0.5" aria-hidden="true">
              →
            </span>
          </Link>
          <span className="text-neutral-500">
            {attending} going{event.maxAttendees ? ` of ${event.maxAttendees}` : ""}
          </span>
        </div>
      </div>
    </article>
  );
}

function EventRow({ event, attending }: { event: Event; attending: number }) {
  const color = TYPE_COLOR[event.type];
  const full = !!(event.maxAttendees && attending >= event.maxAttendees);

  return (
    <article data-event-card className="group flex flex-col gap-5 rounded-[1.5rem] border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 sm:flex-row sm:items-center">
      <div
        className="flex w-full shrink-0 flex-row items-center gap-3 rounded-2xl px-5 py-3 text-white sm:w-24 sm:flex-col sm:gap-0 sm:px-0 sm:py-4"
        style={{ background: color }}
      >
        <span className="text-xs font-normal uppercase tracking-[0.18em]">{monthFormat.format(new Date(event.date))}</span>
        <span className="text-3xl font-normal tracking-[-0.04em]">{dateFormat.format(new Date(event.date))}</span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">{TYPE_LABEL[event.type]}</span>
          {event.isFeatured && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-normal text-white">Featured</span>}
          {event.membersOnly && (
            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-[11px] font-normal text-neutral-700">Members only</span>
          )}
          {full && <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[11px] font-normal text-white">Fully booked</span>}
        </div>
        <h3 className="mt-2 text-xl font-normal tracking-[-0.02em] text-neutral-950">{event.title}</h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600">
          <span className="inline-flex items-center gap-2">
            <ClockIcon className="text-neutral-400" />
            {formatRange(event)}
            {event.time ? ` · ${event.time}` : ""}
          </span>
          <span className="inline-flex items-center gap-2">
            <PinIcon className="text-neutral-400" />
            {event.isOnline ? event.location || "Online" : event.location}
          </span>
        </p>
      </div>

      <Link
        href={`/events/${event.slug}`}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
      >
        Details
        <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
          →
        </span>
      </Link>
    </article>
  );
}

/* ─── Propose a project ─────────────────────────────────────────────────── */

type FormState = "idle" | "submitting" | "success" | "error";

/* Portalled to <body>: the page transition wrapper and the reveal
   animations both put transforms on ancestors, which would otherwise make
   `position: fixed` resolve against them instead of the viewport. */
function AdoptProjectModal({ onClose }: { onClose: () => void }) {
  const isClient = useIsClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idea, setIdea] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "A valid email is required.";
    if (!idea.trim() || idea.trim().length < 20) e.idea = "Please describe your idea in at least 20 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormState("submitting");
    try {
      const res = await fetch("https://formspree.io/f/xpwroval", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ _subject: "Adopt a Project Proposal", name, email, phone, idea }),
      });
      setFormState(res.ok ? "success" : "error");
    } catch {
      setFormState("error");
    }
  }

  const field = (bad: boolean) =>
    cn(
      "w-full rounded-xl border px-4 py-2.5 text-sm text-neutral-800 transition-colors focus:outline-none focus:ring-2",
      bad ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-neutral-300 bg-white focus:ring-green-200",
    );

  if (!isClient) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Propose a project"
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 [animation:viewer-in_220ms_ease-out]"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-1.5 w-full" aria-hidden="true">
          {QUAD.map((c) => (
            <div key={c} className="flex-1" style={{ background: c }} />
          ))}
        </div>
        <div className="p-6 sm:p-8">
          {formState === "success" ? (
            <div className="py-6 text-center">
              <h2 className="text-2xl font-normal tracking-[-0.02em] text-neutral-950">Proposal sent</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-neutral-700">
                The President will read your idea and come back to you within a few business days.
              </p>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center rounded-full px-7 py-3 text-sm font-normal text-white"
                style={{ background: EKO.green }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-500">Adopt a project</p>
                  <h2 className="mt-2 text-2xl font-normal tracking-[-0.02em] text-neutral-950">Propose a community project</h2>
                  <p className="mt-2 text-sm leading-7 text-neutral-700">It goes straight to the President.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-colors hover:bg-neutral-200"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="adopt-name" className="mb-1.5 block text-xs font-normal uppercase tracking-[0.14em] text-neutral-600">
                    Name
                  </label>
                  <input id="adopt-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={field(!!errors.name)} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="adopt-email" className="mb-1.5 block text-xs font-normal uppercase tracking-[0.14em] text-neutral-600">
                    Email
                  </label>
                  <input id="adopt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className={field(!!errors.email)} />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="adopt-phone" className="mb-1.5 block text-xs font-normal uppercase tracking-[0.14em] text-neutral-600">
                  Phone <span className="text-neutral-400">(optional)</span>
                </label>
                <input id="adopt-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (215) 000 0000" className={field(false)} />
              </div>

              <div>
                <label htmlFor="adopt-idea" className="mb-1.5 block text-xs font-normal uppercase tracking-[0.14em] text-neutral-600">
                  Your idea
                </label>
                <textarea
                  id="adopt-idea"
                  rows={4}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="What the project is, who it helps, and when you imagine running it."
                  className={cn(field(!!errors.idea), "resize-none leading-7")}
                />
                {errors.idea && <p className="mt-1 text-xs text-red-600">{errors.idea}</p>}
              </div>

              {formState === "error" && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Something went wrong. Please try again, or email us directly.
                </p>
              )}

              <input type="text" name="_gotcha" className="hidden" tabIndex={-1} aria-hidden="true" />

              <button
                type="submit"
                disabled={formState === "submitting"}
                className="w-full rounded-full py-3.5 text-sm font-normal text-white transition-opacity disabled:opacity-60"
                style={{ background: EKO.green }}
              >
                {formState === "submitting" ? "Sending…" : "Send the proposal"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function EventsPageClient() {
  const { events, isLoading } = useEvents();
  const { countConfirmed } = useRSVP();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [showModal, setShowModal] = useState(false);

  /* Read once per mount rather than on every render, so the filters below
     memoise properly. Nothing derived from it is rendered before the event
     list arrives from the API. */
  const now = useMemo(() => new Date(), []);

  const published = useMemo(
    () => events.filter((event) => event.status === "published" || event.status === "completed"),
    [events],
  );

  const organizers = useMemo(() => {
    const map = new Map<string, string>();
    for (const event of published) map.set(event.organizerId, event.organizerName);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [published]);

  const featured = useMemo(() => published.filter((event) => event.isFeatured).slice(0, 3), [published]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return published.filter((event) => {
      if (q) {
        const haystack = [event.title, event.description, event.location, event.organizerName, ...(event.tags ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (typeFilter !== "all" && event.type !== typeFilter) return false;
      const when = new Date(event.date);
      if (dateFilter === "upcoming" && when < now) return false;
      if (dateFilter === "past" && when >= now) return false;
      if (organizerFilter !== "all" && event.organizerId !== organizerFilter) return false;
      return true;
    });
  }, [published, search, typeFilter, dateFilter, organizerFilter, now]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        dateFilter === "past" ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
    [filtered, dateFilter],
  );

  const upcomingCount = useMemo(() => published.filter((event) => new Date(event.date) >= now).length, [published, now]);
  const totalAttending = useMemo(() => published.reduce((sum, event) => sum + countConfirmed(event.id), 0), [published, countConfirmed]);

  const hasFilters = search !== "" || typeFilter !== "all" || dateFilter !== "upcoming" || organizerFilter !== "all";
  /* The list opens on "Upcoming", so an empty result with nothing else
     narrowed means the calendar is simply between events rather than
     bare. Worth saying differently. */
  const nothingUpcoming = !hasFilters && published.length > 0;
  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setDateFilter("upcoming");
    setOrganizerFilter("all");
  }

  const stats = [
    { value: published.length, label: "Published events", color: EKO.green },
    { value: upcomingCount, label: "Coming up", color: EKO.red },
    { value: featured.length, label: "Featured", color: EKO.blue },
    { value: totalAttending, label: "Confirmed RSVPs", color: EKO.yellow },
  ];

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const featuredHeadRef = useRef<HTMLDivElement>(null);
  const featuredGridRef = useRef<HTMLDivElement>(null);
  const browseHeadRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
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

    /* The event sections are filled from the API after mount, so their
       cards cannot be queued up front the way a static grid is: each
       section reveals as a block once it comes into view. */
    const featuredIn = timeline();
    gsap.set(featuredHeadRef.current, { x: -SHIFT });
    gsap.set(featuredGridRef.current, { y: 24 });
    featuredIn.tl
      .to(featuredHeadRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(featuredGridRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3");
    after([entered(featuredHeadRef.current)], () => featuredIn.tl.play());

    const browse = timeline();
    gsap.set(browseHeadRef.current, { x: -SHIFT });
    gsap.set([controlsRef.current, listRef.current], { y: 24 });
    browse.tl
      .to(browseHeadRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(controlsRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3")
      .to(listRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3");
    after([entered(browseHeadRef.current)], () => browse.tl.play());

    gsap.set(ctaLeftRef.current, { x: -SHIFT });
    gsap.set(ctaRightRef.current, { x: SHIFT });
    const cta = timeline();
    cta.tl
      .to(ctaTextRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(ctaLeftRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE })
      .to(ctaRightRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE }, "<");
    after([entered(ctaTextRef.current)], () => cta.tl.play());
  });

  const selectClass =
    "rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-normal text-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-200";

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {showModal && <AdoptProjectModal onClose={() => setShowModal(false)} />}

      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/projects/scholarship/2026-ceremony-stage.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
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
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">The Eko calendar</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  Gather, <span style={{ color: EKO.green }}>celebrate</span>, and
                  <span style={{ color: EKO.yellow }}> show up</span> together.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  Award nights and cleanups, town halls and workshops, volunteer days and the gatherings that keep the
                  club close. Search the calendar, filter by committee, and RSVP to the ones you can make.
                </p>
              </div>
              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#browse-events"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Browse events
                </Link>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Adopt a project
                </button>
                <Link
                  href="/programs"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  The programs calendar
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-white">On the calendar</p>
              <dl className="mt-5 grid grid-cols-2 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <dt className="sr-only">{s.label}</dt>
                    <dd>
                      <span className="block text-4xl font-normal tracking-[-0.04em]" style={{ color: s.color }}>
                        {isLoading ? "–" : s.value.toLocaleString()}
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

      {/* ─── Featured ─── */}
      <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div ref={featuredHeadRef} data-reveal className="max-w-3xl" style={HIDDEN}>
            <QuadBar />
            <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
              Featured
            </span>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
              The ones we would hate you to miss
            </h2>
            <p className="mt-4 text-base leading-8 text-neutral-700">
              A few gatherings the club is putting front and centre this season.
            </p>
          </div>

          <div ref={featuredGridRef} data-reveal className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3" style={HIDDEN}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-[30rem] animate-pulse rounded-[1.75rem] bg-neutral-200/70" />)
            ) : featured.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center md:col-span-2 xl:col-span-3">
                <p className="text-lg font-normal text-neutral-900">Nothing is featured right now.</p>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  When the club spotlights an event it will appear here. Everything else is in the list below.
                </p>
              </div>
            ) : (
              featured.map((event) => <EventTile key={event.id} event={event} attending={countConfirmed(event.id)} />)
            )}
          </div>
        </div>
      </section>

      {/* ─── Browse ─── */}
      <section id="browse-events" className="scroll-mt-28 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div ref={browseHeadRef} data-reveal className="max-w-3xl" style={HIDDEN}>
            <QuadBar />
            <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
              Browse events
            </span>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
              Find the one that fits your week
            </h2>
            <p className="mt-4 text-base leading-8 text-neutral-700">
              Search by name or place, narrow by type or committee, and switch between cards and a plain list.
            </p>
          </div>

          <div
            ref={controlsRef}
            data-reveal
            className="mt-10 rounded-[1.75rem] border border-neutral-200 bg-white/95 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur"
            style={HIDDEN}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative w-full max-w-md flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                    <SearchIcon />
                  </span>
                  <label htmlFor="event-search" className="sr-only">
                    Search events
                  </label>
                  <input
                    id="event-search"
                    type="search"
                    placeholder="Search events"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-neutral-200 p-1">
                  <button
                    onClick={() => setViewMode("card")}
                    aria-label="Card view"
                    aria-pressed={viewMode === "card"}
                    className={cn("rounded-full p-2 transition-colors", viewMode === "card" ? "text-white" : "text-neutral-500 hover:bg-neutral-100")}
                    style={viewMode === "card" ? { background: EKO.green } : undefined}
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    aria-pressed={viewMode === "list"}
                    className={cn("rounded-full p-2 transition-colors", viewMode === "list" ? "text-white" : "text-neutral-500 hover:bg-neutral-100")}
                    style={viewMode === "list" ? { background: EKO.green } : undefined}
                  >
                    <ListIcon />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="event-type" className="sr-only">
                  Type
                </label>
                <select id="event-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as EventType | "all")} className={selectClass}>
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <label htmlFor="event-when" className="sr-only">
                  When
                </label>
                <select id="event-when" value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className={selectClass}>
                  {DATE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <label htmlFor="event-organizer" className="sr-only">
                  Committee
                </label>
                <select id="event-organizer" value={organizerFilter} onChange={(e) => setOrganizerFilter(e.target.value)} className={selectClass}>
                  <option value="all">All committees</option>
                  {organizers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>

                <span className="ml-1 text-sm text-neutral-600">
                  {isLoading ? "Loading events…" : `${sorted.length} event${sorted.length !== 1 ? "s" : ""}`}
                </span>

                {hasFilters && (
                  <button onClick={clearFilters} className="ml-auto text-sm font-normal text-green-700 hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          <div ref={listRef} data-reveal className="mt-10" style={HIDDEN}>
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[30rem] animate-pulse rounded-[1.75rem] bg-neutral-100" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-normal text-neutral-900">
                  {published.length === 0
                    ? "No events are on the calendar yet."
                    : nothingUpcoming
                      ? "Nothing is coming up just yet."
                      : "No events match those filters."}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-neutral-600">
                  {published.length === 0
                    ? "Our year runs on the programs calendar in the meantime, and new events are posted here as they are confirmed."
                    : nothingUpcoming
                      ? `The next date has not been announced. There ${published.length === 1 ? "is one event" : `are ${published.length} events`} in the archive in the meantime.`
                      : "Try a wider date range, or clear the filters to see everything."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {published.length === 0 ? (
                    <Link
                      href="/programs"
                      className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white"
                      style={{ background: EKO.green }}
                    >
                      See the programs calendar
                    </Link>
                  ) : nothingUpcoming ? (
                    <button
                      onClick={() => setDateFilter("past")}
                      className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white"
                      style={{ background: EKO.green }}
                    >
                      Browse past events
                    </button>
                  ) : (
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white"
                      style={{ background: EKO.green }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === "card" ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((event) => (
                  <EventTile key={event.id} event={event} attending={countConfirmed(event.id)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sorted.map((event) => (
                  <EventRow key={event.id} event={event} attending={countConfirmed(event.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Call to action ─── */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO.green }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div ref={ctaTextRef} data-reveal style={HIDDEN}>
            <div className="flex justify-center">
              <QuadBar />
            </div>
            <h2 className="mt-6 text-4xl font-normal tracking-[-0.04em] text-white sm:text-5xl">
              Stay close to the <span style={{ color: EKO.yellow }}>Eko calendar</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Members hear about every gathering first, and committees decide what goes on the calendar. Join us and
              you will be in the room.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftRef} data-reveal style={HIDDEN}>
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green }}
              >
                Join the community
              </Link>
            </div>
            <div ref={ctaRightRef} data-reveal style={HIDDEN}>
              <Link
                href="/about"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                Learn about ECP
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
