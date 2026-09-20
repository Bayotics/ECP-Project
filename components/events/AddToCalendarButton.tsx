"use client";

/* One click, straight into the viewer's Google Calendar.
 *
 * It is a plain link, so it works for anyone reading the site whether they
 * are signed in, a member, or a stranger. Google asks them to sign in to
 * their own calendar if they are not already. */

import { googleCalendarUrl, type CalendarEvent } from "@/lib/calendar";
import { cn } from "@/utils/cn";

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export default function AddToCalendarButton({
  event,
  variant = "full",
  className,
}: {
  event: CalendarEvent;
  /** "full" for a detail page rail, "compact" for a card footer. */
  variant?: "full" | "compact";
  className?: string;
}) {
  const href = googleCalendarUrl(event);
  const label = `Add ${event.title} to Google Calendar`;

  if (variant === "compact") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        /* Cards are often inside a link to the event, so the click must not
           bubble up and navigate the page underneath. */
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5",
          "text-xs font-normal text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50",
          className,
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5" />
        Add to calendar
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 py-3",
        "text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50",
        className,
      )}
    >
      <span className="text-neutral-950"><CalendarIcon className="h-5 w-5" /></span>
      <span className="flex-1 text-left">Add to Google Calendar</span>
      <span className="text-xs text-neutral-700" aria-hidden="true">↗</span>
    </a>
  );
}
