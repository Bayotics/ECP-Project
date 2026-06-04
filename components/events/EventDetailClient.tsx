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
import RSVPForm from "@/components/events/RSVPForm";
import { formatDate } from "@/utils/formatters";
import type { BadgeColor } from "@/components/ui/Badge";
import type { Event, EventType as ModelEventType } from "@/lib/models";

type CardEventType = "town-hall" | "workshop" | "volunteer" | "meetup" | "seminar" | "other";

const EKO_GREEN = "#059669";
const EKO_RED = "#dc2626";
const EKO_BLUE = "#2563eb";
const EKO_YELLOW = "#d97706";
const QUAD = [EKO_GREEN, EKO_RED, EKO_BLUE, EKO_YELLOW];

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

function QuadBar() {
  return (
    <div className="flex h-1.5 w-28 overflow-hidden rounded-full" aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

function MetaItem({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0 text-neutral-950">{icon}</span>
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-neutral-400">{label}</p>
          <div className="mt-1 text-sm leading-7 text-neutral-700">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8">
      <div className="flex items-center gap-4">
        <QuadBar />
        <h2 className="text-2xl font-black tracking-[-0.03em] text-neutral-950 sm:text-3xl">{title}</h2>
      </div>
      <div className="mt-6">{children}</div>
    </section>
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

function AddToCalendarButton({ event }: { event: Event }) {
  function handleClick() {
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
      className="flex w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
    >
      <span className="text-neutral-950"><CalendarIcon /></span>
      <span className="flex-1 text-left">Add to Calendar</span>
      <span className="text-xs text-neutral-400">Google ↗</span>
    </button>
  );
}

export default function EventDetailClient({ slug }: { slug: string }) {
  const { events, isLoading, getBySlug } = useEvents();
  const { countConfirmed } = useRSVP();

  const event = getBySlug(slug);
  const now = new Date();

  const relatedEvents = useMemo(() => {
    if (!event) return [];
    return events
      .filter((item) => item.id !== event.id && item.status === "published" && item.type === event.type)
      .slice(0, 3);
  }, [events, event]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 animate-pulse">
        <div className="h-96 rounded-4xl bg-neutral-100" />
        <div className="h-8 w-2/3 rounded bg-neutral-100" />
        <div className="h-4 w-1/3 rounded bg-neutral-100" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
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
  const pageUrl = typeof window !== "undefined" ? window.location.href : `https://ekoclubphiladelphia.org/events/${event.slug}`;

  const statCards = [
    {
      label: "Confirmed RSVPs",
      value: confirmedCount.toLocaleString(),
      color: EKO_GREEN,
    },
    {
      label: "Capacity",
      value: event.maxAttendees != null ? event.maxAttendees.toLocaleString() : "Open",
      color: EKO_RED,
    },
    {
      label: "Spots left",
      value: spotsLeft == null ? "Open" : Math.max(spotsLeft, 0).toLocaleString(),
      color: EKO_BLUE,
    },
    {
      label: "Access",
      value: event.isPublic ? "Public" : "Members",
      color: EKO_YELLOW,
    },
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

        {event.imageUrl && (
          <div className="absolute inset-0 opacity-20">
            <Image src={event.imageUrl} alt={event.title} fill className="object-cover" priority sizes="100vw" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/45" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12 lg:px-8 lg:py-16">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-white/65">
              <li><Link href="/" className="transition-colors hover:text-white">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/events" className="transition-colors hover:text-white">Events</Link></li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-white">{event.title}</li>
            </ol>
          </nav>

          <div className="grid items-end gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
              <motion.div variants={riseIn} custom={0} className="inline-flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white/80">Event details</span>
                <span className="mx-1 h-1 w-1 rounded-full bg-white/40" />
                <span className="text-[11px] font-black uppercase tracking-[0.24em] text-white/80">{TYPE_LABEL[event.type]}</span>
              </motion.div>

              <motion.h1
                variants={riseIn}
                custom={0.08}
                className="mt-7 text-5xl font-black leading-none tracking-tighter text-white sm:text-6xl lg:text-7xl"
              >
                {event.title}
              </motion.h1>

              <motion.p
                variants={riseIn}
                custom={0.16}
                className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg"
              >
                {event.shortDescription ?? event.description.slice(0, 220)}
              </motion.p>

              <motion.div variants={riseIn} custom={0.24} className="mt-8 flex flex-wrap gap-2">
                <Badge color={TYPE_COLOR[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                {event.status !== "published" && (
                  <Badge color={STATUS_COLOR[event.status] ?? "neutral"}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                )}
                {event.isFeatured && <Badge color="gold">Featured</Badge>}
                {event.isOnline && <Badge color="info">Online</Badge>}
                {isFull && <Badge color="danger">Fully Booked</Badge>}
              </motion.div>

              <motion.div variants={riseIn} custom={0.32} className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#event-content"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-black text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO_GREEN, boxShadow: `0 0 32px ${EKO_GREEN}66` }}
                >
                  See full details
                </a>
                {showRSVP && (
                  <a
                    href="#rsvp-panel"
                    className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/12"
                  >
                    RSVP now
                  </a>
                )}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid gap-4 rounded-4xl border border-white/10 bg-white/6 p-5 backdrop-blur-xl"
            >
              <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">At a glance</p>
                <p className="mt-3 text-2xl font-black tracking-[-0.03em] text-white">
                  Everything a visitor needs before showing up.
                </p>
                <p className="mt-3 text-sm leading-7 text-white/65">
                  Date, access, capacity, RSVP, location, and related events are now presented in the
                  same polished system as the rest of the site.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {statCards.map((item) => (
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

      <section id="event-content" className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <SectionCard title="Event information">
              <div className="grid gap-4 md:grid-cols-2">
                <MetaItem icon={<CalendarIcon />} label="Date">
                  <span className="font-semibold text-neutral-950">{formatDate(event.date)}</span>
                  {event.endDate && event.endDate !== event.date && (
                    <span className="text-neutral-500"> – {formatDate(event.endDate)}</span>
                  )}
                </MetaItem>

                {event.time && (
                  <MetaItem icon={<ClockIcon />} label="Time">
                    <span className="font-semibold text-neutral-950">{event.time}</span>
                    {event.endTime && <span className="text-neutral-500"> – {event.endTime}</span>}
                  </MetaItem>
                )}

                <MetaItem icon={event.isOnline ? <VideoIcon /> : <LocationIcon />} label={event.isOnline ? "Online access" : "Location"}>
                  <span className="font-semibold text-neutral-950">{event.location}</span>
                  {event.venue && <span className="text-neutral-500"> · {event.venue}</span>}
                  {event.isOnline && event.meetingUrl && (
                    <span className="mt-1 block">
                      <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-green-700 underline hover:no-underline">
                        Join online meeting ↗
                      </a>
                    </span>
                  )}
                </MetaItem>

                <MetaItem icon={<UserIcon />} label="Organiser">
                  <span className="font-semibold text-neutral-950">{event.organizerName}</span>
                </MetaItem>

                {event.maxAttendees != null && (
                  <MetaItem icon={<UsersIcon />} label="Capacity">
                    <span className="font-semibold text-neutral-950">{confirmedCount}</span>
                    <span className="text-neutral-500"> / {event.maxAttendees} registered</span>
                    {spotsLeft != null && spotsLeft > 0 && (
                      <span className="ml-2 text-xs font-bold text-green-700">{spotsLeft} spots left</span>
                    )}
                    <div className="mt-3 h-2 w-full rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((confirmedCount / event.maxAttendees) * 100, 100)}%`,
                          background: EKO_GREEN,
                        }}
                      />
                    </div>
                  </MetaItem>
                )}

                {event.registrationDeadline && (
                  <MetaItem icon={<CalendarIcon />} label="Registration deadline">
                    <span className="font-semibold text-neutral-950">{formatDate(event.registrationDeadline)}</span>
                  </MetaItem>
                )}
              </div>
            </SectionCard>

            <SectionCard title="About this event">
              <div className="prose prose-neutral max-w-none text-neutral-700">
                {isHTML(event.description) ? (
                  <div dangerouslySetInnerHTML={{ __html: event.description }} />
                ) : (
                  <p className="whitespace-pre-wrap text-base leading-8 text-neutral-700">{event.description}</p>
                )}
              </div>
            </SectionCard>

            {event.tags.length > 0 && (
              <SectionCard title="Tags and topics">
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-green-700"
                    >
                      <span className="text-green-700"><TagIcon /></span>
                      {tag}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            {relatedEvents.length > 0 && (
              <SectionCard title="Related events">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {relatedEvents.map((item) => (
                    <EventCard
                      key={item.id}
                      id={item.slug}
                      title={item.title}
                      date={item.date}
                      endDate={item.endDate}
                      time={item.time}
                      location={item.location}
                      isOnline={item.isOnline}
                      type={toCardType(item.type)}
                      description={item.shortDescription ?? item.description.slice(0, 120)}
                      imageUrl={item.imageUrl}
                      organizer={item.organizerName}
                      attendees={countConfirmed(item.id)}
                      maxAttendees={item.maxAttendees}
                      registrationUrl={`/events/${item.slug}`}
                      isFeatured={item.isFeatured}
                      isFull={!!(item.maxAttendees && countConfirmed(item.id) >= item.maxAttendees)}
                      tags={item.tags}
                      layout="card"
                    />
                  ))}
                </div>
                <div className="mt-6">
                  <Link href="/events" className="text-sm font-bold text-green-700 underline underline-offset-4 hover:no-underline">
                    Browse all events
                  </Link>
                </div>
              </SectionCard>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            {showRSVP && (
              <div id="rsvp-panel" className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Reserve your spot</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-neutral-950">RSVP for this event</h2>
                <p className="mt-2 text-sm leading-7 text-neutral-600">
                  Complete your reservation to stay connected to this gathering and help us plan attendance well.
                </p>
                <div className="mt-5">
                  <RSVPForm event={event} confirmedCount={confirmedCount} />
                </div>
              </div>
            )}

            {!event.registrationRequired && event.status === "published" && (
              <div className="rounded-4xl border border-green-200 bg-green-50 p-6 text-center">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-green-700">Open entry</p>
                <p className="mt-3 text-lg font-black text-green-900">No registration required</p>
                <p className="mt-2 text-sm leading-7 text-green-800">This is a free-entry event. Visitors can simply show up and participate.</p>
              </div>
            )}

            {isUpcoming && event.status === "published" && (
              <div className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Save the date</p>
                <div className="mt-4">
                  <AddToCalendarButton event={event} />
                </div>
              </div>
            )}

            <div className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Share this event</p>
              <div className="mt-4">
                <ShareButtons
                  url={pageUrl}
                  title={event.title}
                  description={event.shortDescription ?? event.description.slice(0, 120)}
                  platforms={["whatsapp", "twitter", "facebook", "linkedin", "copy"]}
                />
              </div>
            </div>

            <div className="rounded-4xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-500">Quick facts</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Status</span>
                  <Badge color={STATUS_COLOR[event.status] ?? "neutral"}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Visibility</span>
                  <span className="font-semibold text-neutral-800">{event.isPublic ? "Public" : "Members only"}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-neutral-500">Type</span>
                  <span className="font-semibold text-neutral-800">{TYPE_LABEL[event.type]}</span>
                </div>
                {event.maxAttendees != null && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-neutral-500">Capacity</span>
                    <span className="font-semibold text-neutral-800">{event.maxAttendees} attendees</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
