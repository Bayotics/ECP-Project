"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/client/api";
import { formatSummaryEventDate, type EventSummary } from "@/lib/event-summary";

export default function EventCalendarSummary() {
  const [summary, setSummary] = useState<EventSummary | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      apiRequest<EventSummary>("/api/events/summary", { signal: controller.signal }).then(data => {
        if (!controller.signal.aborted) { setSummary(data); setError(""); }
      }).catch(error => {
        if (!controller.signal.aborted) { setSummary(null); setError(error instanceof Error ? error.message : "Live club activity could not be loaded."); }
      }).finally(() => { pending = false; });
    }
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [attempt]);
  const stats = [
    { label: "Upcoming events", note: "Next 90 days", value: summary?.upcomingEventCount },
    { label: "Open volunteer opportunities", note: "Accepting volunteer sign-ups", value: summary?.openVolunteerOpportunities },
    { label: "Active committees", note: "Currently active", value: summary?.activeCommittees },
    { label: "Volunteers signed up this year", note: summary ? `Unique volunteers · ${summary.calendarYear}` : "General and event sign-ups", value: summary?.volunteersSignedUpThisYear },
  ];
  return <section aria-label="Live calendar activity" className="mt-5">
    <dl className="grid grid-cols-2 gap-3">
      {stats.map(stat => <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
        <dt className="text-sm font-medium text-white">{stat.label}</dt>
        <dd className="mt-2 text-3xl font-semibold tabular-nums text-white sm:text-4xl">{stat.value === undefined ? <span aria-label={error ? "Unavailable" : "Loading"}>—</span> : stat.value.toLocaleString("en-US")}</dd>
        <p className="mt-1 text-xs text-white/70">{stat.note}</p>
      </div>)}
    </dl>
    {error && <p role="alert" className="mt-5 text-sm text-white">{error} <button className="font-semibold underline" onClick={() => setAttempt(value => value + 1)}>Retry</button></p>}
    <div className="mt-8 border-t border-white/15 pt-6">
      <h3 className="text-lg font-semibold text-white">Upcoming events · next 90 days</h3>
      {!summary ? <p className="mt-3 text-sm text-white/75">{error ? "Event dates are temporarily unavailable." : "Loading upcoming events…"}</p>
        : summary.upcomingEvents.length === 0 ? <p className="mt-3 text-sm text-white/75">No published public events are scheduled in the next 90 days.</p>
        : <ol className="mt-4 divide-y divide-white/15">{summary.upcomingEvents.map(event => <li key={event.id} className="py-3">
          <time dateTime={event.date} className="block text-xs font-medium text-white/70">{formatSummaryEventDate(event)}</time>
          <Link href={`/events/${encodeURIComponent(event.slug)}`} className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-white underline-offset-4 hover:underline">{event.title}<span aria-hidden="true">→</span></Link>
        </li>)}</ol>}
      <Link href="#browse-events" className="mt-4 inline-block text-sm font-semibold text-white underline underline-offset-4">Browse all events</Link>
    </div>
  </section>;
}
