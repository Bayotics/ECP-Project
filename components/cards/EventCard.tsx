"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";
import Badge from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import { formatDate } from "@/utils/formatters";

/* ─── Types ──────────────────────────────────────────── */
export type EventType = "town-hall" | "workshop" | "volunteer" | "meetup" | "seminar" | "other";

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  isOnline?: boolean;
  type: EventType;
  description?: string;
  imageUrl?: string;
  organizer?: string;
  attendees?: number;
  maxAttendees?: number;
  registrationUrl?: string;
  isFeatured?: boolean;
  isFull?: boolean;
  membersOnly?: boolean;
  tags?: string[];
  /** "card" (default) or "list" row layout */
  layout?: "card" | "list";
}

/* ─── Helpers ────────────────────────────────────────── */
const TYPE_META: Record<
  EventType,
  { label: string; color: BadgeColor; icon: string }
> = {
  "town-hall": { label: "Town Hall", color: "green", icon: "🏛️" },
  workshop: { label: "Workshop", color: "info", icon: "🔧" },
  volunteer: { label: "Volunteer", color: "gold", icon: "🤝" },
  meetup: { label: "Meetup", color: "neutral", icon: "👥" },
  seminar: { label: "Seminar", color: "info", icon: "📚" },
  other: { label: "Event", color: "neutral", icon: "📅" },
};

/* ─── EventCard ──────────────────────────────────────── */
export default function EventCard({
  id,
  title,
  date,
  endDate,
  time,
  location,
  isOnline = false,
  type,
  description,
  imageUrl,
  organizer,
  attendees,
  maxAttendees,
  registrationUrl,
  isFeatured = false,
  isFull = false,
  membersOnly = false,
  tags = [],
  layout = "card",
}: EventCardProps) {
  const meta = TYPE_META[type] ?? TYPE_META.other;
  const href = registrationUrl ?? `/events/${id}`;
  const spotsLeft = maxAttendees != null && attendees != null
    ? maxAttendees - attendees
    : null;
  const isAlmostFull = spotsLeft != null && spotsLeft > 0 && spotsLeft <= 10;

  if (layout === "list") {
    return (
      <motion.article
        whileHover={{ x: 3 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex gap-4 rounded-xl border border-(--color-neutral-200) bg-white p-4 transition-shadow hover:shadow-md",
          isFeatured && "border-(--color-green-300) bg-(--color-green-50)"
        )}
        aria-label={`Event: ${title}`}
      >
        {/* Date block */}
        <div
          className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl bg-(--color-green-500) text-white w-14 h-14"
          aria-hidden="true"
        >
          <span className="text-lg font-extrabold leading-none">
            {new Date(date).getDate()}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
            {new Date(date).toLocaleString("en-NG", { month: "short" })}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <Link
              href={href}
              className="font-semibold text-gray-500 hover:text-(--color-green-600) transition-colors focus-visible:outline-none focus-visible:underline line-clamp-1"
            >
              {title}
            </Link>
            <Badge color={meta.color} dot>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-xs text-(--color-neutral-500) flex items-center gap-2 flex-wrap">
            <span>🕐 {time ?? formatDate(date, { hour: "2-digit", minute: "2-digit" })}</span>
            <span>·</span>
            <span>{isOnline ? "🌐 Online" : `📍 ${location}`}</span>
            {attendees != null && <span>· 👥 {attendees.toLocaleString()} attending</span>}
          </p>
        </div>
      </motion.article>
    );
  }

  // ── Card layout ──
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group flex flex-col rounded-2xl border border-(--color-neutral-200) bg-white overflow-hidden shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg",
        isFeatured && "ring-2 ring-(--color-green-400)"
      )}
      aria-label={`Event: ${title}`}
    >
      {/* Image or date banner */}
      <div className="relative h-48 overflow-hidden bg-(--color-green-800) flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${title} cover image`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-white/80">
            <span className="text-5xl" aria-hidden="true">{meta.icon}</span>
            <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
              {meta.label}
            </span>
          </div>
        )}

        {/* Date chip */}
        <div className="absolute top-3 left-3 flex flex-col items-center justify-center rounded-lg bg-white/95 text-(--color-green-700) px-2.5 py-1.5 shadow-sm min-w-[46px]">
          <span className="text-lg font-extrabold leading-none">{new Date(date).getDate()}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {new Date(date).toLocaleString("en-NG", { month: "short" })}
          </span>
        </div>

        {/* Status chips */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {isFeatured && <Badge color="gold" dot>Featured</Badge>}
          {membersOnly && <Badge color="info">🔒 Members Only</Badge>}
          {isFull && <Badge color="danger">Full</Badge>}
          {isAlmostFull && !isFull && <Badge color="gold">Only {spotsLeft} left</Badge>}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge color={meta.color} dot>{meta.label}</Badge>
          {isOnline && <Badge color="info">Online</Badge>}
        </div>

        <Link
          href={href}
          className="font-bold text-gray-700 hover:text-(--color-green-600) transition-colors focus-visible:outline-none focus-visible:underline line-clamp-2 leading-snug"
        >
          {title}
        </Link>

        {description && (
          <p className="text-sm text-(--color-neutral-500) line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-col gap-1.5 text-sm text-(--color-neutral-500)">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-(--color-green-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(date, { weekday: "short", month: "short", day: "numeric" })}
            {endDate && endDate !== date && ` – ${formatDate(endDate, { month: "short", day: "numeric" })}`}
            {time && `, ${time}`}
          </span>
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-(--color-green-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {isOnline ? "Online event" : location}
          </span>
          {attendees != null && (
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-(--color-green-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {attendees.toLocaleString()} attending
              {maxAttendees != null && ` / ${maxAttendees.toLocaleString()} max`}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="text-xs rounded-full bg-(--color-neutral-100) px-2.5 py-0.5 text-(--color-neutral-600)">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-(--color-neutral-100)">
          {organizer && (
            <p className="text-xs text-(--color-neutral-400) mb-2">By {organizer}</p>
          )}
          <Link
            href={href}
            aria-label={`Register for ${title}`}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)",
              isFull
                ? "bg-(--color-neutral-100) text-(--color-neutral-400) cursor-not-allowed"
                : "bg-(--color-green-500) text-white hover:bg-(--color-green-600)"
            )}
            aria-disabled={isFull}
            tabIndex={isFull ? -1 : undefined}
          >
            {isFull ? "Event Full" : "Register Now"}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
