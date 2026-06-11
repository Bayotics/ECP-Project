"use client";

import { useState, useMemo } from "react";
import { useEvents } from "@/context/EventsContext";
import { useRSVP } from "@/context";
import { useAuth } from "@/context/AuthContext";
import type { Event } from "@/lib/models/event";
import type { RSVP } from "@/lib/models/rsvp";

type Tab = "upcoming" | "past" | "my-rsvps";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function EventBadge({ membersOnly }: { membersOnly?: boolean }) {
  if (!membersOnly) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
      🔒 Members Only
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    confirmed: "bg-green-100 text-green-700",
    waitlisted: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${colors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

interface RSVPFormInline {
  name: string;
  email: string;
  phone: string;
  guestCount: number;
  notes: string;
}

function RSVPPanel({ event, currentUser, onDone }: { event: Event; currentUser: { id: string; firstName: string; lastName: string; email: string; phone?: string }; onDone: () => void }) {
  const { add } = useRSVP();
  const [form, setForm] = useState<RSVPFormInline>({
    name: `${currentUser.firstName} ${currentUser.lastName}`,
    email: currentUser.email,
    phone: currentUser.phone ?? "",
    guestCount: 0,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [rsvpId, setRsvpId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const rsvp = await add({
        eventId: event.id,
        userId: currentUser.id,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        guestCount: form.guestCount,
        notes: form.notes.trim() || undefined,
      });
      setRsvpId(rsvp.id);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center space-y-2">
        <p className="text-2xl">🎉</p>
        <p className="font-bold text-green-800">You&apos;re registered!</p>
        <p className="text-sm text-green-700">Confirmation ID: <code className="font-mono">{rsvpId}</code></p>
        <p className="text-xs text-green-600">A confirmation email has been sent to {form.email}</p>
        <button onClick={onDone} className="mt-2 text-sm text-green-700 underline hover:no-underline">Back to events</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
        <input className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
        <input type="email" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Phone <span className="font-normal text-gray-400">(optional — for SMS reminders)</span></label>
        <input type="tel" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-200" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="08012345678" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Additional Attendees (besides you)</label>
        <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-200" value={form.guestCount} onChange={e => setForm(p => ({ ...p, guestCount: Number(e.target.value) }))}>
          {Array.from({ length: 10 }).map((_, i) => <option key={i} value={i}>{i === 0 ? "Just me" : `+${i} guest${i > 1 ? "s" : ""}`}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Notes <span className="font-normal text-gray-400">(optional)</span></label>
        <textarea className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button type="submit" disabled={submitting} className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-lg text-sm transition-colors">
        {submitting ? "Registering…" : "Confirm Registration"}
      </button>
    </form>
  );
}

export default function MemberEventsPage() {
  const { events, isLoading } = useEvents();
  const { rsvps } = useRSVP();
  const { currentUser } = useAuth();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [selected, setSelected] = useState<Event | null>(null);
  const [showRSVP, setShowRSVP] = useState(false);

  const now = new Date().toISOString();

  const published = useMemo(() => events.filter(e => e.status === "published"), [events]);
  const upcoming = useMemo(() => published.filter(e => e.date >= now).sort((a, b) => a.date.localeCompare(b.date)), [published, now]);
  const past = useMemo(() => published.filter(e => e.date < now).sort((a, b) => b.date.localeCompare(a.date)), [published, now]);

  const myRsvpIds = useMemo(() => {
    const confirmed = (rsvps as RSVP[]).filter(r => r.status === "confirmed" && r.userId === currentUser?.id);
    return new Set(confirmed.map(r => r.eventId));
  }, [rsvps, currentUser]);

  const myRsvpEvents = useMemo(() => {
    return events.filter(e => myRsvpIds.has(e.id)).sort((a, b) => a.date.localeCompare(b.date));
  }, [events, myRsvpIds]);

  const displayList = tab === "upcoming" ? upcoming : tab === "past" ? past : myRsvpEvents;

  function isRegistered(eventId: string) { return myRsvpIds.has(eventId); }

  function openEvent(ev: Event) {
    setSelected(ev);
    setShowRSVP(false);
  }

  function closeDetail() {
    setSelected(null);
    setShowRSVP(false);
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t ? "bg-green-600 text-white" : "text-gray-500 hover:bg-gray-100"
    }`;

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500 mt-1">Browse all events including exclusive member-only events.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabClass("upcoming")} onClick={() => { setTab("upcoming"); setSelected(null); }}>
          Upcoming <span className="ml-1 text-xs">({upcoming.length})</span>
        </button>
        <button className={tabClass("past")} onClick={() => { setTab("past"); setSelected(null); }}>
          Past <span className="ml-1 text-xs">({past.length})</span>
        </button>
        <button className={tabClass("my-rsvps")} onClick={() => { setTab("my-rsvps"); setSelected(null); }}>
          My Registrations <span className="ml-1 text-xs">({myRsvpEvents.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-400 text-sm">Loading events…</div>
      ) : displayList.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-sm">
          {tab === "my-rsvps" ? "You haven't registered for any events yet." : "No events in this category."}
        </div>
      ) : selected ? (
        /* ── Event Detail ── */
        <div className="space-y-4">
          <button onClick={closeDetail} className="text-sm text-green-600 hover:underline">← Back to events</button>
          <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <EventBadge membersOnly={selected.membersOnly} />
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{selected.type.replace("-", " ")}</span>
                  {selected.status === "cancelled" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Cancelled</span>}
                </div>
              </div>
              {isRegistered(selected.id) && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  ✅ Registered
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Date & Time</p>
                <p className="font-medium">{formatDate(selected.date)}</p>
                {selected.time && <p className="text-gray-600">{selected.time}{selected.endTime ? ` — ${selected.endTime}` : ""}</p>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">Location</p>
                <p className="font-medium">{selected.location}</p>
                {selected.venue && <p className="text-gray-600">{selected.venue}</p>}
                {selected.isOnline && selected.meetingUrl && (
                  <a href={selected.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-green-600 text-xs hover:underline">Join Online →</a>
                )}
              </div>
              {selected.organizerName && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Organiser</p>
                  <p className="font-medium">{selected.organizerName}</p>
                </div>
              )}
              {selected.maxAttendees && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Capacity</p>
                  <p className="font-medium">{selected.maxAttendees} attendees max</p>
                </div>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">About this event</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.description}</p>
            </div>

            {/* Registration */}
            {selected.status !== "cancelled" && new Date(selected.date) > new Date() && (
              <div className="border-t border-gray-100 pt-4">
                {isRegistered(selected.id) ? (
                  <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
                    ✅ You are already registered for this event. Check your email for confirmation details.
                  </p>
                ) : showRSVP ? (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Register for this event</h3>
                    <RSVPPanel
                      event={selected}
                      currentUser={{ id: currentUser.id, firstName: currentUser.firstName, lastName: currentUser.lastName, email: currentUser.email, phone: currentUser.phone }}
                      onDone={() => { closeDetail(); setTab("my-rsvps"); }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRSVP(true)}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    Register for this Event
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── Event List ── */
        <div className="grid gap-4">
          {displayList.map(ev => (
            <button
              key={ev.id}
              onClick={() => openEvent(ev)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-5 hover:border-green-300 hover:shadow-sm transition-all"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 items-center mb-1">
                    <EventBadge membersOnly={ev.membersOnly} />
                    <span className="text-xs text-gray-400 capitalize">{ev.type.replace("-", " ")}</span>
                    {ev.status === "cancelled" && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Cancelled</span>}
                  </div>
                  <h3 className="font-semibold text-gray-900 leading-snug">{ev.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{formatDate(ev.date)}{ev.time ? ` · ${ev.time}` : ""} · {ev.location}</p>
                  {ev.shortDescription && <p className="text-sm text-gray-400 mt-1 truncate">{ev.shortDescription}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isRegistered(ev.id) && (
                    <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">✅ Registered</span>
                  )}
                  {tab === "my-rsvps" && (
                    <StatusBadge status={[...(rsvps as RSVP[])].find(r => r.eventId === ev.id && r.userId === currentUser.id)?.status ?? "confirmed"} />
                  )}
                  <span className="text-xs text-green-600">View details →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
