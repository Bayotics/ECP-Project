"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEvents, useRSVP } from "@/context";
import EventCard from "@/components/cards/EventCard";
import ShareButtons from "@/components/ui/ShareButtons";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import RSVPForm from "@/components/events/RSVPForm";
import { formatDate } from "@/utils/formatters";
import type { BadgeColor } from "@/components/ui/Badge";
import type { Event, EventType as ModelEventType } from "@/lib/models";

/* ─── Types ───────────────────────────────────────────── */
type CardEventType = "town-hall" | "workshop" | "volunteer" | "meetup" | "seminar" | "other";

/* ─── Helpers ─────────────────────────────────────────── */
function toCardType(t: ModelEventType): CardEventType {
  if (t === "press-conference") return "other";
  return t as CardEventType;
}

const TYPE_LABEL: Record<ModelEventType, string> = {
  "town-hall": "Town Hall",
  workshop: "Workshop",
  volunteer: "Volunteer",
  meetup: "Meetup",
  seminar: "Seminar",
  "press-conference": "Press Conference",
  other: "Event",
};

const TYPE_COLOR: Record<ModelEventType, BadgeColor> = {
  "town-hall": "green",
  workshop: "info",
  volunteer: "gold",
  meetup: "neutral",
  seminar: "info",
  "press-conference": "neutral",
  other: "neutral",
};

const STATUS_COLOR: Record<string, BadgeColor> = {
  published: "green",
  completed: "neutral",
  cancelled: "danger",
  draft: "neutral",
};

function isHTML(str: string) {
  return /<[a-z][\s\S]*>/i.test(str);
}

/* ─── Sub-components ──────────────────────────────────── */
function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-(--color-green-600) shrink-0">{icon}</span>
      <span className="text-(--color-neutral-700) text-sm leading-relaxed">{children}</span>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 15.5" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden="true">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

/* ─── Add-to-Calendar mock ────────────────────────────── */
function AddToCalendarButton({ event }: { event: Event }) {
  function handleClick() {
    // Mock: in a real app would generate .ics or link to Google Calendar
    const startDate = new Date(event.date);
    const pad = (n: number) => n.toString().padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${fmt(startDate)}/${fmt(endDate)}&details=${encodeURIComponent(event.shortDescription ?? event.description.slice(0, 200))}&location=${encodeURIComponent(event.location)}`;

    window.open(googleUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2.5 w-full rounded-lg border border-(--color-neutral-200) bg-white hover:bg-(--color-neutral-50) px-4 py-3 text-sm font-medium text-(--color-neutral-700) transition-colors group"
    >
      <span className="text-(--color-green-600)"><CalendarIcon /></span>
      <span className="flex-1 text-left">Add to Calendar</span>
      <span className="text-xs text-(--color-neutral-400) group-hover:text-(--color-neutral-600)">Google Calendar ↗</span>
    </button>
  );
}

/* ─── EventDetailClient ───────────────────────────────── */
export default function EventDetailClient({ slug }: { slug: string }) {
  const { events, isLoading, getBySlug } = useEvents();
  const { countConfirmed } = useRSVP();

  const event = getBySlug(slug);

  const now = new Date();

  /* Related events: same type, published, not this one */
  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return events
      .filter(
        (ev) =>
          ev.id !== event.id &&
          ev.status === "published" &&
          ev.type === event.type
      )
      .slice(0, 3);
  }, [events, event]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-6 animate-pulse">
        <div className="h-80 rounded-2xl bg-(--color-neutral-100)" />
        <div className="h-8 w-2/3 rounded bg-(--color-neutral-100)" />
        <div className="h-4 w-1/3 rounded bg-(--color-neutral-100)" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <EmptyState
          title="Event not found"
          description="This event may have been removed or the URL is incorrect."
          actions={[{ label: "Browse all events", href: "/events" }]}
        />
      </div>
    );
  }

  const confirmedCount = countConfirmed(event.id);
  const spotsLeft = event.maxAttendees != null ? event.maxAttendees - confirmedCount : null;
  const isFull = spotsLeft != null && spotsLeft <= 0;
  const isUpcoming = new Date(event.date) >= now;
  const showRSVP = event.registrationRequired && event.status === "published";

  const pageUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://ekoclubphiladelphia.org/events/${event.slug}`;

  return (
    <div>
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 pt-6 pb-3">
        <ol className="flex items-center gap-1.5 text-sm text-(--color-neutral-500)">
          <li><Link href="/" className="hover:text-(--color-green-600) transition-colors">Home</Link></li>
          <li aria-hidden="true" className="text-(--color-neutral-300)">/</li>
          <li><Link href="/events" className="hover:text-(--color-green-600) transition-colors">Events</Link></li>
          <li aria-hidden="true" className="text-(--color-neutral-300)">/</li>
          <li className="text-(--color-neutral-700) font-medium truncate max-w-[220px]" aria-current="page">
            {event.title}
          </li>
        </ol>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        {/* Hero image */}
        {event.imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full h-56 md:h-80 rounded-2xl overflow-hidden mb-8 shadow-md"
          >
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {/* Overlay badges */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <Badge color={TYPE_COLOR[event.type]}>
                {TYPE_LABEL[event.type]}
              </Badge>
              {event.status !== "published" && (
                <Badge color={STATUS_COLOR[event.status] ?? "neutral"}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              )}
              {event.isFeatured && (
                <Badge color="gold">⭐ Featured</Badge>
              )}
              {event.isOnline && (
                <Badge color="info">🌐 Online</Badge>
              )}
              {isFull && (
                <Badge color="danger">Fully Booked</Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Main layout: content + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left / Main ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title & badges (no image fallback) */}
            {!event.imageUrl && (
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge color={TYPE_COLOR[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                {event.isOnline && <Badge color="info">🌐 Online</Badge>}
                {event.isFeatured && <Badge color="gold">⭐ Featured</Badge>}
                {isFull && <Badge color="danger">Fully Booked</Badge>}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <h1 className="text-2xl md:text-3xl font-bold text-(--color-neutral-900) font-display leading-snug mb-4">
                {event.title}
              </h1>

              {/* Meta block */}
              <div className="space-y-3 p-5 rounded-xl bg-(--color-neutral-50) border border-(--color-neutral-100)">
                <MetaItem icon={<CalendarIcon />}>
                  <span className="font-medium">{formatDate(event.date)}</span>
                  {event.endDate && event.endDate !== event.date && (
                    <span className="text-(--color-neutral-500)"> – {formatDate(event.endDate)}</span>
                  )}
                </MetaItem>

                {event.time && (
                  <MetaItem icon={<ClockIcon />}>
                    <span className="font-medium">{event.time}</span>
                    {event.endTime && <span className="text-(--color-neutral-500)"> – {event.endTime}</span>}
                  </MetaItem>
                )}

                <MetaItem icon={event.isOnline ? <VideoIcon /> : <LocationIcon />}>
                  <span className="font-medium">{event.location}</span>
                  {event.venue && <span className="text-(--color-neutral-500)"> · {event.venue}</span>}
                  {event.isOnline && event.meetingUrl && (
                    <span className="block mt-0.5">
                      <a
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-(--color-green-600) underline hover:no-underline text-xs"
                      >
                        Join online meeting ↗
                      </a>
                    </span>
                  )}
                </MetaItem>

                <MetaItem icon={<UserIcon />}>
                  Organised by <span className="font-medium">{event.organizerName}</span>
                </MetaItem>

                {event.maxAttendees != null && (
                  <MetaItem icon={<UsersIcon />}>
                    <span>
                      <span className="font-medium">{confirmedCount}</span>
                      <span className="text-(--color-neutral-500)"> / {event.maxAttendees} registered</span>
                      {spotsLeft != null && spotsLeft > 0 && (
                        <span className={`ml-2 text-xs font-semibold ${spotsLeft <= 20 ? "text-orange-600" : "text-(--color-green-600)"}`}>
                          {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                        </span>
                      )}
                    </span>
                    {/* Capacity bar */}
                    <div className="mt-2 w-full max-w-xs h-1.5 rounded-full bg-(--color-neutral-200) overflow-hidden">
                      <div
                        className="h-full rounded-full bg-(--color-green-500) transition-all"
                        style={{ width: `${Math.min((confirmedCount / event.maxAttendees!) * 100, 100).toFixed(0)}%` }}
                      />
                    </div>
                  </MetaItem>
                )}

                {event.registrationDeadline && (
                  <MetaItem icon={<CalendarIcon />}>
                    <span className="text-(--color-neutral-500)">Registration closes:</span>{" "}
                    <span className="font-medium">{formatDate(event.registrationDeadline)}</span>
                  </MetaItem>
                )}
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
              className="prose prose-sm prose-neutral max-w-none text-(--color-neutral-700)"
            >
              <h2 className="text-lg font-bold text-(--color-neutral-800) mb-3">About This Event</h2>
              {isHTML(event.description) ? (
                <div dangerouslySetInnerHTML={{ __html: event.description }} />
              ) : (
                <p className="leading-relaxed whitespace-pre-wrap">{event.description}</p>
              )}
            </motion.div>

            {/* Tags */}
            {event.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.12, ease: "easeOut" }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-(--color-green-600)"><TagIcon /></span>
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium bg-(--color-green-50) text-(--color-green-700) border border-(--color-green-200) rounded-full px-2.5 py-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mobile RSVP (shown only on small screens) */}
            {showRSVP && (
              <div className="lg:hidden rounded-xl border border-(--color-neutral-200) p-5 bg-white shadow-sm">
                <h2 className="text-lg font-bold text-(--color-neutral-800) mb-4">Reserve Your Spot</h2>
                <RSVPForm event={event} confirmedCount={confirmedCount} />
              </div>
            )}

            {/* Related events */}
            {relatedEvents.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-(--color-neutral-800) mb-5">Related Events</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedEvents.map((ev) => (
                    <EventCard
                      key={ev.id}
                      id={ev.slug}
                      title={ev.title}
                      date={ev.date}
                      endDate={ev.endDate}
                      time={ev.time}
                      location={ev.location}
                      isOnline={ev.isOnline}
                      type={toCardType(ev.type)}
                      description={ev.shortDescription ?? ev.description.slice(0, 120)}
                      imageUrl={ev.imageUrl}
                      organizer={ev.organizerName}
                      attendees={countConfirmed(ev.id)}
                      maxAttendees={ev.maxAttendees}
                      registrationUrl={`/events/${ev.slug}`}
                      isFeatured={ev.isFeatured}
                      isFull={!!(ev.maxAttendees && countConfirmed(ev.id) >= ev.maxAttendees)}
                      tags={ev.tags}
                      layout="card"
                    />
                  ))}
                </div>
                <div className="mt-5">
                  <Link
                    href="/events"
                    className="text-sm text-(--color-green-600) font-semibold hover:underline"
                  >
                    ← Browse all events
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* ── Right / Sidebar ──────────────────────────── */}
          <aside className="space-y-5">
            {/* RSVP card (desktop) */}
            {showRSVP && (
              <div className="hidden lg:block rounded-xl border border-(--color-neutral-200) p-5 bg-white shadow-sm sticky top-24">
                <h2 className="text-lg font-bold text-(--color-neutral-800) mb-4">Reserve Your Spot</h2>
                <RSVPForm event={event} confirmedCount={confirmedCount} />
              </div>
            )}

            {/* No RSVP needed banner */}
            {!event.registrationRequired && event.status === "published" && (
              <div className="rounded-xl border border-(--color-green-200) p-5 bg-(--color-green-50) text-center">
                <p className="text-sm font-semibold text-(--color-green-800)">✅ Free Entry</p>
                <p className="text-xs text-(--color-green-700) mt-1">No registration required. Just show up!</p>
              </div>
            )}

            {/* Add to Calendar */}
            {isUpcoming && event.status === "published" && (
              <div className="rounded-xl border border-(--color-neutral-200) p-4 bg-white">
                <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-3">Save to your calendar</p>
                <AddToCalendarButton event={event} />
              </div>
            )}

            {/* Share */}
            <div className="rounded-xl border border-(--color-neutral-200) p-4 bg-white">
              <p className="text-xs font-semibold text-(--color-neutral-500) uppercase tracking-wide mb-3">Share this event</p>
              <ShareButtons
                url={pageUrl}
                title={event.title}
                description={event.shortDescription ?? event.description.slice(0, 120)}
                platforms={["whatsapp", "twitter", "facebook", "linkedin", "copy"]}
              />
            </div>

            {/* Quick info card */}
            <div className="rounded-xl border border-(--color-neutral-100) p-4 bg-(--color-neutral-50) space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-(--color-neutral-500)">Status</span>
                <Badge color={STATUS_COLOR[event.status] ?? "neutral"}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-(--color-neutral-500)">Visibility</span>
                <span className="font-medium text-(--color-neutral-700)">{event.isPublic ? "Public" : "Members only"}</span>
              </div>
              {event.maxAttendees != null && (
                <div className="flex justify-between">
                  <span className="text-(--color-neutral-500)">Capacity</span>
                  <span className="font-medium text-(--color-neutral-700)">{event.maxAttendees} attendees</span>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

