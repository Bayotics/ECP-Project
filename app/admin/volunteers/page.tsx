"use client";

import { VOLUNTEER_SOURCES, VOLUNTEER_SOURCE_LABELS } from "@/lib/volunteer-sources";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminFilters, AdminTable, AdminModal, FilterSelect, TR, TD, Badge, Btn } from "@/components/admin/AdminUI";
import { useEvents } from "@/context/EventsContext";
import { apiRequest } from "@/lib/client/api";
import type { VolunteerAdminList, VolunteerAdminRow } from "@/lib/models/volunteer";

export default function AdminVolunteersPage() {
  const { events } = useEvents();
  const [result, setResult] = useState<VolunteerAdminList | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [scope, setScope] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<VolunteerAdminRow | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ q: search, source, eventId, status, scope, page: String(page) });
      apiRequest<VolunteerAdminList>(`/api/admin/volunteers?${params}`, { signal: controller.signal }).then(data => {
        if (!controller.signal.aborted) { setResult(data); setSelected(previous => previous ? data.volunteers.find(person => person.id === previous.id) ?? null : null); setError(""); }
      }).catch(error => { if (!controller.signal.aborted) { setResult(null); setError(error instanceof Error ? error.message : "Could not load volunteers."); } });
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [source, search, eventId, status, scope, page, attempt]);
  function filter(change: () => void) { change(); setPage(0); setResult(null); }
  async function cancelSignup(id: string) {
    if (!window.confirm("Cancel this volunteer sign-up? Any available place will automatically go to the earliest waitlisted volunteer.")) return;
    setActionBusy(true); setError(""); setNotice("");
    try { await apiRequest(`/api/admin/volunteers/signups/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) }); setNotice("Sign-up cancelled. Available places are offered automatically in waitlist order."); setAttempt(value => value + 1); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not cancel sign-up."); }
    finally { setActionBusy(false); }
  }
  async function retryEmails(id: string) {
    setActionBusy(true); setError(""); setNotice("");
    try { const result = await apiRequest<{ sent: number; failed: number }>(`/api/admin/volunteers/${encodeURIComponent(id)}/notify`, { method: "POST" }); setNotice(`${result.sent} emails delivered; ${result.failed} failed. Sent emails are not resent.`); setAttempt(value => value + 1); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not retry emails."); }
    finally { setActionBusy(false); }
  }
  return <div className="space-y-6">
    <AdminPageHeader title="Volunteers" count={result?.total} subtitle="Volunteer contact details and event sign-ups.">
      <Link href="/admin/volunteers/import" className="text-sm text-green-800 underline">Import CSV</Link>
      <Link href="/admin/volunteers/integrations" className="text-sm text-green-800 underline">Integrations & form links</Link>
      <Btn variant="secondary" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Refresh</Btn>
    </AdminPageHeader>
    <AdminFilters search={search} onSearchChange={value => filter(() => setSearch(value))} filters={<>
      <FilterSelect aria-label="Filter volunteer source" value={source} onChange={value => filter(() => setSource(value))} options={[{value: "", label: "All sources"}, ...VOLUNTEER_SOURCES.map(value => ({value, label: VOLUNTEER_SOURCE_LABELS[value]}))]} />
      <FilterSelect aria-label="Filter volunteer list" value={scope} onChange={value => filter(() => setScope(value))} options={[{ value: "", label: "All volunteers" }, { value: "general", label: "General interest list" }, { value: "event", label: "Event volunteers" }]} />
      <FilterSelect aria-label="Filter volunteer event" value={eventId} onChange={value => filter(() => setEventId(value))} options={[{ value: "", label: "All events" }, ...events.map(event => ({ value: event.id, label: event.title }))]} />
      <FilterSelect aria-label="Filter volunteer status" value={status} onChange={value => filter(() => setStatus(value))} options={[{ value: "", label: "All sign-up statuses" }, { value: "confirmed", label: "Confirmed" }, { value: "waitlisted", label: "Waitlisted" }, { value: "cancelled", label: "Cancelled" }]} />
    </>} />
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button className="ml-2 underline" onClick={() => setAttempt(value => value + 1)}>Retry</button></p>}
    {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">{notice}</p>}
    <AdminTable headers={["Volunteer", "Contact", "Source", "Interests", "Event sign-ups", "Updated"]} empty={error ? "Volunteer records are temporarily unavailable." : !result ? "Loading volunteers…" : "No volunteers match these filters."}>
      {result?.volunteers.map(person => <TR key={person.id} onClick={() => setSelected(person)}>
        <TD className="font-medium">{person.name}{person.generalRegisteredAt && <span className="mt-1 block text-xs font-normal text-green-800">General interest list</span>}{Boolean(person.emailIssues) && <span className="mt-1 block text-xs font-normal text-amber-800">{person.emailIssues} emails pending or failed</span>}</TD>
        <TD><span className="block break-all">{person.email}</span>{person.phone && <span className="block">{person.phone}</span>}</TD>
        <TD>{(person.sources ?? [person.source ?? "website"]).map(source => VOLUNTEER_SOURCE_LABELS[source]).join(", ")}</TD>
        <TD className="max-w-64 whitespace-normal">{person.interests || "—"}</TD>
        <TD><div className="space-y-2">{person.signups.length ? person.signups.map(signup => <div key={signup.id} className="flex flex-wrap items-center gap-2"><span>{signup.eventTitle}</span><Badge value={signup.status} /></div>) : "—"}</div></TD>
        <TD>{new Date(person.updatedAt).toLocaleDateString("en-US", { timeZone: "America/New_York" })}</TD>
      </TR>)}
    </AdminTable>
    {result && <div className="flex items-center justify-between gap-3 text-sm text-neutral-800">
      <Btn variant="secondary" disabled={page === 0} onClick={() => { setResult(null); setPage(value => value - 1); }}>Previous</Btn>
      <span>{result.total} volunteers · Page {page + 1}</span>
      <Btn variant="secondary" disabled={(page + 1) * result.pageSize >= result.total} onClick={() => { setResult(null); setPage(value => value + 1); }}>Next</Btn>
    </div>}
    {selected && <AdminModal title={selected.name} open onClose={() => setSelected(null)}>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-900">{notice}</p>}
      <dl className="space-y-4 text-sm text-neutral-800">
        {[['Sources', (selected.sources ?? [selected.source ?? 'website']).map(source => VOLUNTEER_SOURCE_LABELS[source]).join(', ')], ['Opportunity emails', selected.opportunityEmails ? 'Opted in' : 'Off'], ['Email', selected.email], ['Phone', selected.phone || 'Not provided'], ['Interests', selected.interests || 'Not provided'], ['Notes', selected.notes || 'Not provided']].map(([label, value]) => <div key={label}><dt className="mb-1 font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
      </dl>
      {selected.generalRegisteredAt && <p className="mt-4 text-sm text-green-900">Joined the general interest list {new Date(selected.generalRegisteredAt).toLocaleDateString("en-US", { timeZone: "America/New_York" })}.</p>}
      {Boolean(selected.emailIssues) && <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="mb-3">{selected.emailIssues} emails are pending or have failed delivery.</p><Btn variant="secondary" disabled={actionBusy} onClick={() => void retryEmails(selected.id)}>Retry pending emails</Btn></div>}
      <h2 className="mb-3 mt-6 font-semibold text-neutral-950">Event sign-ups</h2>
      {selected.signups.length ? <ul className="space-y-4">{selected.signups.map(signup => <li key={signup.id} className="rounded-xl border border-neutral-200 p-4 text-sm text-neutral-800">
        <div className="flex flex-wrap items-center justify-between gap-2">{signup.eventSlug ? <Link href={`/events/${encodeURIComponent(signup.eventSlug)}`} className="font-semibold text-green-800 underline">{signup.eventTitle}</Link> : <span>{signup.eventTitle}</span>}<Badge value={signup.status} /></div>
        <p className="mt-2 text-xs">Source: {(signup.sources ?? [signup.source ?? "website"]).map(source => VOLUNTEER_SOURCE_LABELS[source]).join(", ")}</p>
        <p className="mt-2 text-xs">Signed up {new Date(signup.registeredAt).toLocaleString("en-US", { timeZone: "America/New_York" })} (Philadelphia time)</p>
        {signup.status !== "cancelled" && <div className="mt-3"><Btn variant="secondary" disabled={actionBusy} onClick={() => void cancelSignup(signup.id)}>Cancel sign-up</Btn></div>}
      </li>)}</ul> : <p className="text-sm text-neutral-700">No event sign-ups.</p>}
    </AdminModal>}
  </div>;
}
