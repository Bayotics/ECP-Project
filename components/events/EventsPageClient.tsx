"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEvents, useRSVP } from "@/context";
import EventCard from "@/components/cards/EventCard";
import type { EventCardProps } from "@/components/cards/EventCard";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import type { Event, EventType as ModelEventType } from "@/lib/models";
import { cn } from "@/utils/cn";

/* ─── Types ───────────────────────────────────────────── */
type CardEventType = "town-hall" | "workshop" | "volunteer" | "meetup" | "seminar" | "other";
type DateFilter = "all" | "upcoming" | "past";
type ViewMode = "card" | "list";

/* ─── Constants ───────────────────────────────────────── */
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

/* ─── Helpers ─────────────────────────────────────────── */
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
    tags: event.tags,
  };
}

/* ─── Icons ───────────────────────────────────────────── */
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-(--color-neutral-400)" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

/* ─── EventsPageClient ────────────────────────────────── */
export default function EventsPageClient() {
  const { events, isLoading } = useEvents();
  const { countConfirmed } = useRSVP();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("upcoming");
  const [organizerFilter, setOrganizerFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const now = new Date();

  /* Unique organizers derived from published events */
  const organizers = useMemo(() => {
    const published = events.filter((e) => e.status === "published" || e.status === "completed");
    const map = new Map<string, string>();
    for (const ev of published) map.set(ev.organizerId, ev.organizerName);
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [events]);

  /* Filtered events */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter((ev) => {
      if (ev.status !== "published" && ev.status !== "completed") return false;

      // Search
      if (q) {
        const haystack = [ev.title, ev.description, ev.location, ev.organizerName, ...(ev.tags ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Type filter
      if (typeFilter !== "all" && ev.type !== typeFilter) return false;

      // Date filter
      const evDate = new Date(ev.date);
      if (dateFilter === "upcoming" && evDate < now) return false;
      if (dateFilter === "past" && evDate >= now) return false;

      // Organizer/committee filter
      if (organizerFilter !== "all" && ev.organizerId !== organizerFilter) return false;

      return true;
    });
  }, [events, search, typeFilter, dateFilter, organizerFilter]);

  const sortedEvents = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (dateFilter === "past") {
        // Most recent past first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      // Soonest upcoming first
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filtered, dateFilter]);

  const hasFilters = search !== "" || typeFilter !== "all" || dateFilter !== "upcoming" || organizerFilter !== "all";

  function clearFilters() {
    setSearch("");
    setTypeFilter("all");
    setDateFilter("upcoming");
    setOrganizerFilter("all");
  }

  /* ─── Render ──────────────────────────────────────── */
  return (
    <div>
      {/* Hero */}
      <section className="bg-(--color-green-700) py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-bold text-white mb-3 font-display"
          >
            Events
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
            className="text-(--color-green-100) text-lg max-w-2xl mx-auto"
          >
            Town halls, workshops, volunteer days and more — find events that matter to your Lagos community.
          </motion.p>
        </div>
      </section>

      {/* Filters & Toolbar */}
      <section className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-(--color-neutral-200) shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3">
          {/* Row 1: search + view toggle */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <SearchIcon />
              </span>
              <input
                type="search"
                placeholder="Search events…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-(--color-neutral-300) rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-300) focus:border-(--color-green-500) placeholder-neutral-400"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 border border-(--color-neutral-200) rounded-lg p-0.5 ml-auto shrink-0">
              <button
                onClick={() => setViewMode("card")}
                aria-label="Card view"
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "card"
                    ? "bg-(--color-green-600) text-white"
                    : "text-(--color-neutral-500) hover:bg-(--color-neutral-100)"
                )}
              >
                <GridIcon />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-label="List view"
                className={cn(
                  "p-2 rounded-md transition-colors",
                  viewMode === "list"
                    ? "bg-(--color-green-600) text-white"
                    : "text-(--color-neutral-500) hover:bg-(--color-neutral-100)"
                )}
              >
                <ListIcon />
              </button>
            </div>
          </div>

          {/* Row 2: filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-sm border border-(--color-neutral-300) rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-300) text-(--color-neutral-700)"
            >
              {EVENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Date */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="text-sm border border-(--color-neutral-300) rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-300) text-(--color-neutral-700)"
            >
              {DATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Committee / Organizer */}
            <select
              value={organizerFilter}
              onChange={(e) => setOrganizerFilter(e.target.value)}
              className="text-sm border border-(--color-neutral-300) rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-300) text-(--color-neutral-700)"
            >
              <option value="all">All Committees</option>
              {organizers.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>

            {/* Result count + clear */}
            <span className="text-sm text-(--color-neutral-500) ml-1">
              {isLoading ? "Loading…" : `${sortedEvents.length} event${sortedEvents.length !== 1 ? "s" : ""}`}
            </span>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-(--color-green-600) underline hover:no-underline ml-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Events grid / list */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-xl bg-(--color-neutral-100) animate-pulse" />
            ))}
          </div>
        ) : sortedEvents.length === 0 ? (
          <EmptyState
            title="No events found"
            description={hasFilters ? "Try adjusting your search or filters." : "There are no events to display right now."}
            actions={hasFilters ? [{ label: "Clear filters", onClick: clearFilters }] : []}
          />
        ) : viewMode === "card" ? (
          <motion.div
            key="card-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {sortedEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.3), ease: "easeOut" }}
                >
                  <EventCard {...eventToCardProps(ev, countConfirmed(ev.id))} layout="card" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            <AnimatePresence mode="popLayout">
              {sortedEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.2), ease: "easeOut" }}
                >
                  <EventCard {...eventToCardProps(ev, countConfirmed(ev.id))} layout="list" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}
