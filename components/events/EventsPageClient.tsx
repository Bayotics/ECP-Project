"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEvents, useRSVP } from "@/context";
import EventCard from "@/components/cards/EventCard";
import type { EventCardProps } from "@/components/cards/EventCard";
import EmptyState from "@/components/ui/EmptyState";
import type { Event, EventType as ModelEventType } from "@/lib/models";
import { cn } from "@/utils/cn";

type CardEventType = "town-hall" | "workshop" | "volunteer" | "meetup" | "seminar" | "other";
type DateFilter = "all" | "upcoming" | "past";
type ViewMode = "card" | "list";

const EKO_GREEN = "#059669";
const EKO_RED = "#dc2626";
const EKO_BLUE = "#2563eb";
const EKO_YELLOW = "#d97706";
const QUAD = [EKO_GREEN, EKO_RED, EKO_BLUE, EKO_YELLOW];

const EVENT_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "town-hall", label: "Town Hall" },
  { value: "workshop", label: "Workshop" },
  { value: "volunteer", label: "Volunteer" },
  { value: "meetup", label: "Meetup" },
  { value: "seminar", label: "Seminar" },
  { value: "press-conference", label: "Press Conference" },
  { value: "other", label: "Other" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
];

const riseIn = {
  hidden: { opacity: 0, y: 28 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.09,
    },
  },
};

function toCardType(type: ModelEventType): CardEventType {
  if (type === "press-conference") return "other";
  return type as CardEventType;
}

function eventToCardProps(event: Event, confirmedCount: number): EventCardProps {
  return {
    id: event.slug,
    title: event.title,
    date: event.date,
    endDate: event.endDate,
    time: event.time,
    location: event.location,
    isOnline: event.isOnline,
    type: toCardType(event.type),
    description: event.shortDescription ?? event.description.slice(0, 140),
    imageUrl: event.imageUrl,
    organizer: event.organizerName,
    attendees: confirmedCount,
    maxAttendees: event.maxAttendees,
    registrationUrl: `/events/${event.slug}`,
    isFeatured: event.isFeatured,
    isFull: !!(event.maxAttendees && confirmedCount >= event.maxAttendees),
    membersOnly: event.membersOnly ?? false,
    tags: event.tags,
  };
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={cn("h-5 w-5", className)} aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={cn("h-5 w-5", className)} aria-hidden="true">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="3.5" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-neutral-400" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
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

export default function EventsPageClient() {
  const { events, isLoading } = useEvents();
  const { countConfirmed } = useRSVP();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const now = new Date();

  const publishedEvents = useMemo(
    () => events.filter((event) => event.status === "published" || event.status === "completed"),
    [events],
  );

  const organizers = useMemo(() => {
    const map = new Map<string, string>();
    for (const event of publishedEvents) map.set(event.organizerId, event.organizerName);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [publishedEvents]);

  const featuredEvents = useMemo(
    () => publishedEvents.filter((event) => event.isFeatured).slice(0, 3),
    [publishedEvents],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return publishedEvents.filter((event) => {
      if (q) {
        const haystack = [event.title, event.description, event.location, event.organizerName, ...(event.tags ?? [])]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      if (typeFilter !== "all" && event.type !== typeFilter) return false;

      const eventDate = new Date(event.date);
      if (dateFilter === "upcoming" && eventDate < now) return false;
      if (dateFilter === "past" && eventDate >= now) return false;

      if (organizerFilter !== "all" && event.organizerId !== organizerFilter) return false;

      return true;
    });
  }, [publishedEvents, search, typeFilter, dateFilter, organizerFilter, now]);

  const sortedEvents = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (dateFilter === "past") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filtered, dateFilter]);

  const totalAttendees = useMemo(
    () => publishedEvents.reduce((sum, event) => sum + countConfirmed(event.id), 0),
    [publishedEvents, countConfirmed],
  );

  const upcomingCount = useMemo(
    () => publishedEvents.filter((event) => new Date(event.date) >= now).length,
    [publishedEvents, now],
  );

  const hasFilters = search !== "" || typeFilter !== "all" || dateFilter !== "upcoming" || organizerFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setDateFilter("upcoming");
    setOrganizerFilter("all");
  }

  const statCards = [
    { value: publishedEvents.length, label: "Published events", color: EKO_GREEN },
    { value: upcomingCount, label: "Upcoming now", color: EKO_RED },
    { value: featuredEvents.length, label: "Featured picks", color: EKO_BLUE },
    { value: totalAttendees, label: "Confirmed RSVPs", color: EKO_YELLOW },
  ];

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
          <div className="grid items-end gap-14 lg:grid-cols-[1.1fr_0.9fr]">
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
                  Events at Eko Club Philadelphia
                </span>
              </motion.div>

              <motion.h1
                variants={riseIn}
                custom={0.08}
                className="mt-7 text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl lg:text-7xl"
              >
                Gather, <span style={{ color: EKO_GREEN }}>celebrate</span>,
                <span style={{ color: EKO_YELLOW }}> and show up</span> together.
              </motion.h1>

              <motion.p
                variants={riseIn}
                custom={0.16}
                className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg"
              >
                Our events page now carries the same energy as our home and about pages. Explore town
                halls, workshops, volunteer opportunities, and community gatherings that keep the Eko
                spirit visible all year round.
              </motion.p>

              <motion.div variants={riseIn} custom={0.24} className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#browse-events"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-black text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}66` }}
                >
                  Browse events
                </a>
                <Link
                  href="/membership/apply"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Become a member
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
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">What this page offers</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
                  Clear discovery, featured gatherings, and better browsing.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  We made the events experience more modern and easier to scan, without losing the RSVP,
                  filtering, and browsing tools already in place.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {statCards.map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                    <div className="text-3xl font-black tracking-[-0.04em]" style={{ color: item.color }}>
                      {item.value.toLocaleString()}
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

      {featuredEvents.length > 0 && (
        <section className="bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow="Featured gatherings"
              title="A quick look at the events we are spotlighting right now"
              text="These featured events help visitors quickly find the programmes, forums, and community moments we want to draw attention to first."
              align="center"
            />

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {featuredEvents.map((event, index) => (
                <motion.div key={event.id} variants={riseIn} custom={index * 0.08}>
                  <EventCard {...eventToCardProps(event, countConfirmed(event.id))} layout="card" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      <section id="browse-events" className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionIntro
            eyebrow="Browse events"
            title="Find the events that fit your schedule, interest, and committee"
            text="Search, filter, and switch views to move easily between upcoming gatherings, past events, and committee-led programmes."
          />

          <section className="sticky top-0 z-20 mt-10 rounded-4xl border border-neutral-200 bg-white/95 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                    <SearchIcon />
                  </span>
                  <input
                    type="search"
                    placeholder="Search events"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-green-200"
                  />
                </div>

                <div className="ml-auto flex items-center gap-1 rounded-full border border-neutral-200 p-1">
                  <button
                    onClick={() => setViewMode("card")}
                    aria-label="Card view"
                    className={cn(
                      "rounded-full p-2 transition-colors",
                      viewMode === "card" ? "text-white" : "text-neutral-500 hover:bg-neutral-100",
                    )}
                    style={viewMode === "card" ? { background: EKO_GREEN } : undefined}
                  >
                    <GridIcon />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List view"
                    className={cn(
                      "rounded-full p-2 transition-colors",
                      viewMode === "list" ? "text-white" : "text-neutral-500 hover:bg-neutral-100",
                    )}
                    style={viewMode === "list" ? { background: EKO_GREEN } : undefined}
                  >
                    <ListIcon />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {EVENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {DATE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  value={organizerFilter}
                  onChange={(e) => setOrganizerFilter(e.target.value)}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  <option value="all">All Committees</option>
                  {organizers.map((organizer) => (
                    <option key={organizer.id} value={organizer.id}>
                      {organizer.name}
                    </option>
                  ))}
                </select>

                <span className="ml-1 text-sm text-neutral-500">
                  {isLoading ? "Loading events..." : `${sortedEvents.length} event${sortedEvents.length !== 1 ? "s" : ""}`}
                </span>

                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-sm font-bold underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-900"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="mt-10">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-72 animate-pulse rounded-3xl bg-neutral-100" />
                ))}
              </div>
            ) : sortedEvents.length === 0 ? (
              <EmptyState
                title="No events found"
                description={hasFilters ? "Try adjusting your search or filters." : "There are no events to display right now."}
                actions={hasFilters ? [{ label: "Clear filters", onClick: clearFilters }] : []}
              />
            ) : viewMode === "card" ? (
              <motion.div key="card-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {sortedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3), ease: "easeOut" }}
                    >
                      <EventCard {...eventToCardProps(event, countConfirmed(event.id))} layout="card" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div key="list-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                  {sortedEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.2), ease: "easeOut" }}
                    >
                      <EventCard {...eventToCardProps(event, countConfirmed(event.id))} layout="list" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
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
              Stay close to the <span style={{ color: EKO_YELLOW }}>Eko calendar</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Join us at the next gathering, register early, and stay connected to the events that keep
              our club active, visible, and community-driven.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/membership/apply"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-black text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO_GREEN }}
              >
                Join the community
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                Learn about ECP
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
