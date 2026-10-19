"use client";

import Link from "next/link";
import { useVolunteerOpportunities } from "@/components/volunteers/useVolunteerOpportunities";

export default function VolunteerEventButton({ eventId }: { eventId: string }) {
  const { data, error, retry } = useVolunteerOpportunities(eventId);
  const event = data?.find(event => event.id === eventId);
  return <section aria-labelledby="event-volunteer-heading" className="rounded-4xl border border-green-200 bg-green-50 p-6">
    <h2 id="event-volunteer-heading" className="text-xl font-semibold text-green-950">Lend a hand</h2>
    <p className="mt-2 text-sm leading-relaxed text-green-900">Help the club make this event happen. Volunteer sign-ups are separate from attendee registrations.</p>
    {event?.isFull && event.accepting && <p className="mt-3 text-sm text-green-900">Volunteer places are full. Join the waitlist and we’ll email you if a place opens.</p>}
    {event?.reason && <p className="mt-3 text-sm text-green-900">{event.reason}</p>}
    {error && <p className="mt-3 text-sm text-green-900">Volunteer availability could not be checked. <button onClick={retry} className="underline">Retry</button></p>}
    <Link href={`/volunteer?event=${encodeURIComponent(eventId)}`} className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-green-800 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-900">{event?.isFull && event.accepting ? "Join waitlist" : "Volunteer for this event"}</Link>
  </section>;
}
