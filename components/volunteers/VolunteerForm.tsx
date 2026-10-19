"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/client/api";
import { validateVolunteerInput } from "@/lib/volunteer-input";
import { formatSummaryEventDate } from "@/lib/event-summary";
import Recaptcha from "@/components/membership/Recaptcha";
import { useVolunteerOpportunities } from "@/components/volunteers/useVolunteerOpportunities";

interface Receipt { reference: string; status: "general" | "confirmed" | "waitlisted"; alreadyRegistered: boolean; confirmationEmailSent: boolean }
const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-950 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-200";

export default function VolunteerForm({ initialEventId = "", source = "website" }: { initialEventId?: string; source?: string }) {
  const { currentUser } = useAuth();
  const { data, error: loadError, retry } = useVolunteerOpportunities(initialEventId, true);
  const [eventId, setEventId] = useState(initialEventId);
  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [interests, setInterests] = useState("");
  const [notes, setNotes] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const selected = data?.find(event => event.id === eventId);
  const blocked = Boolean(eventId && (!selected || !selected.accepting));
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    const validation = validateVolunteerInput({ name, email, phone, interests, notes, eventId });
    if ("error" in validation) { setError(validation.error); return; }
    if (blocked) { setError(selected?.reason || "The selected event is unavailable. Please choose another event or contact the club."); return; }
    if (!captcha) { setError("Please complete the reCAPTCHA verification."); return; }
    setBusy(true);
    try { setReceipt(await apiRequest<Receipt>("/api/volunteers", { method: "POST", body: JSON.stringify({ ...validation.value, source, recaptchaToken: captcha }) })); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save your volunteer sign-up. Please try again."); retry(); }
    finally { setBusy(false); setCaptcha(""); setCaptchaAttempt(value => value + 1); }
  }
  if (receipt) return <section role="status" className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8">
    <h2 className="text-2xl font-semibold text-green-950">{receipt.status === "waitlisted" ? "You’re on the volunteer waitlist" : receipt.status === "general" ? "Thank you for volunteering" : "Your volunteer place is confirmed"}</h2>
    <p className="mt-4 leading-relaxed text-green-950">{receipt.status === "waitlisted" ? "Your sign-up is saved. You do not have a confirmed place yet. If a place opens, we’ll confirm waitlisted volunteers in sign-up order and email you." : receipt.status === "general" ? "You’ve joined the club’s general volunteer interest list. This does not reserve a place at a particular event." : "Your place is reserved. Thank you for helping make this event possible."}</p>
    {receipt.alreadyRegistered && <p className="mt-3 text-sm text-green-900">{receipt.status === "general" ? "You were already on the general interest list. Use the private link in your email to update your details." : "You were already signed up. No duplicate place was reserved. Use the private link in your email to update your details."}</p>}
    {selected && <p className="mt-4 font-semibold text-green-950">{selected.title}<br /><span className="text-sm font-normal">{formatSummaryEventDate(selected)}{selected.time ? ` · ${selected.time} (Philadelphia time)` : ""}<br />{selected.location}</span></p>}
    <p className="mt-4 text-sm text-green-950">{receipt.confirmationEmailSent ? "Your confirmation email has been sent." : "Your sign-up is saved. We couldn’t deliver your confirmation email yet; we’ll retry. Please keep your reference and contact the club if you need help."}</p>
    <p className="mt-3 text-sm text-green-950">Reference: <strong className="break-all">{receipt.reference}</strong></p>
    <div className="mt-6 flex flex-wrap gap-4"><Link href="/events" className="font-semibold text-green-800 underline">Browse events</Link><Link href="/volunteer" onClick={() => { setReceipt(null); setEventId(""); }} className="font-semibold text-green-800 underline">Another volunteer sign-up</Link></div>
  </section>;
  return <form onSubmit={submit} className="space-y-5 rounded-3xl border border-neutral-200 bg-white text-neutral-900 [color-scheme:light] p-6 shadow-sm sm:p-8" aria-label="Volunteer sign-up">
    <h2 className="text-2xl font-semibold text-neutral-950">Sign up to volunteer</h2>
    <p className="text-sm leading-relaxed text-neutral-700">Name and email are required. Each event sign-up reserves one volunteer place. Choosing general interest joins the club-wide list.</p>
    {loadError && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{loadError} <button type="button" onClick={retry} className="underline">Retry</button>{initialEventId && <p className="mt-2"><Link href="/auth/login" className="underline">Log in for members-only events</Link></p>}</div>}
    <fieldset disabled={busy} className="min-w-0 space-y-5">
      <legend className="sr-only">Volunteer information</legend>
      <div><label htmlFor="volunteer-event" className="text-sm font-semibold text-neutral-900">Volunteer interest</label><select id="volunteer-event" value={eventId} onChange={event => setEventId(event.target.value)} className={field}>
        <option value="">General volunteer interest</option>
        {eventId && !selected && <option value={eventId}>Selected event unavailable</option>}
        {data?.map(event => <option key={event.id} value={event.id}>{event.title} — {formatSummaryEventDate(event)}{event.isFull ? " (waitlist)" : ""}{!event.accepting ? " (closed)" : ""}</option>)}
      </select>{!data && !loadError && <p className="mt-2 text-sm text-neutral-700">Loading event options…</p>}</div>
      {selected && <div className="rounded-xl bg-green-50 p-4 text-sm leading-relaxed text-green-950"><strong>{selected.title}</strong><br />{formatSummaryEventDate(selected)}{selected.time ? ` · ${selected.time} (Philadelphia time)` : ""}<br />{selected.location}{selected.isFull && selected.accepting && <p className="mt-2">Volunteer places are full. This submission will join the waitlist.</p>}{selected.reason && <p className="mt-2 font-semibold">{selected.reason}</p>}</div>}
      <div><label htmlFor="volunteer-name" className="text-sm font-semibold text-neutral-900">Name *</label><input id="volunteer-name" autoComplete="name" required maxLength={150} value={name} onChange={event => setName(event.target.value)} className={field} /></div>
      <div><label htmlFor="volunteer-email" className="text-sm font-semibold text-neutral-900">Email *</label><input id="volunteer-email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} className={field} /><p className="mt-2 text-xs text-neutral-700">Use the same email for future sign-ups so the club can keep your volunteer record together.</p></div>
      <div><label htmlFor="volunteer-phone" className="text-sm font-semibold text-neutral-900">Phone (optional)</label><input id="volunteer-phone" type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={event => setPhone(event.target.value)} className={field} /></div>
      <div><label htmlFor="volunteer-interests" className="text-sm font-semibold text-neutral-900">Interests or skills (optional)</label><textarea id="volunteer-interests" rows={3} maxLength={500} value={interests} onChange={event => setInterests(event.target.value)} className={field} /></div>
      <div><label htmlFor="volunteer-notes" className="text-sm font-semibold text-neutral-900">Notes (optional)</label><textarea id="volunteer-notes" rows={3} maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} className={field} /></div>
      <Recaptcha key={captchaAttempt} onChange={setCaptcha} />
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={busy || blocked} className="w-full rounded-full bg-green-800 px-6 py-3.5 font-semibold text-white hover:bg-green-900 disabled:opacity-50">{busy ? "Saving…" : selected?.isFull ? "Join waitlist" : "Sign up to volunteer"}</button>
    </fieldset>
  </form>;
}
