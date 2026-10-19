"use client";

import { VOLUNTEER_SOURCES, VOLUNTEER_SOURCE_LABELS } from "@/lib/volunteer-sources";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminFilters, AdminTable, AdminModal, FilterSelect, TR, TD, Badge, Btn } from "@/components/admin/AdminUI";
import { useCommittees } from "@/context/CommitteesContext";
import { useEvents } from "@/context/EventsContext";
import { apiRequest } from "@/lib/client/api";
import type { VolunteerAdminList, VolunteerAdminRow } from "@/lib/models/volunteer";

export default function AdminVolunteersPage() {
  const { events } = useEvents();
  const { committees } = useCommittees();
  const [committeeId,setCommitteeId]=useState("");
  const [state,setState]=useState("");
  const [deletion,setDeletion]=useState("");
  useEffect(()=>{const timer=setTimeout(()=>{if(new URLSearchParams(window.location.search).get("deletion")==="requested")setDeletion("requested");},0);return()=>clearTimeout(timer);},[]);
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
      const params = new URLSearchParams({ q: search, source, eventId, committeeId, state, deletion, status, scope, page: String(page) });
      apiRequest<VolunteerAdminList>(`/api/admin/volunteers?${params}`, { signal: controller.signal }).then(data => {
        if (!controller.signal.aborted) { setResult(data); setSelected(previous => previous ? data.volunteers.find(person => person.id === previous.id) ?? null : null); setError(""); }
      }).catch(error => { if (!controller.signal.aborted) { setResult(null); setError(error instanceof Error ? error.message : "Could not load volunteers."); } });
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [source, search, eventId, committeeId, state, deletion, status, scope, page, attempt]);
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
      <a href={`/api/admin/volunteers/export?${new URLSearchParams({q:search,source,eventId,committeeId,state,deletion,status,scope})}`} className="text-sm text-green-800 underline">Export filtered CSV</a>
      <Link href="/admin/volunteers/import" className="text-sm text-green-800 underline">Import CSV</Link>
      <Link href="/admin/volunteers/integrations" className="text-sm text-green-800 underline">Integrations & form links</Link>
      <Btn variant="secondary" onClick={() => { setResult(null); setAttempt(value => value + 1); }}>Refresh</Btn>
    </AdminPageHeader>
    <AdminFilters search={search} onSearchChange={value => filter(() => setSearch(value))} filters={<>
      <FilterSelect aria-label="Filter committee" value={committeeId} onChange={value=>filter(()=>setCommitteeId(value))} options={[{value:"",label:"All committees"},...committees.map(committee=>({value:committee.id,label:committee.name}))]} />
      <FilterSelect aria-label="Filter volunteer status" value={state} onChange={value=>filter(()=>setState(value))} options={[{value:"",label:"All volunteer statuses"},{value:"active",label:"Active"},{value:"paused",label:"Paused"},{value:"inactive",label:"Inactive"}]} />
      <FilterSelect aria-label="Filter deletion requests" value={deletion} onChange={value=>filter(()=>setDeletion(value))} options={[{value:"",label:"All records"},{value:"requested",label:"Data deletion requested"}]} />
      <FilterSelect aria-label="Filter volunteer source" value={source} onChange={value => filter(() => setSource(value))} options={[{value: "", label: "All sources"}, ...VOLUNTEER_SOURCES.map(value => ({value, label: VOLUNTEER_SOURCE_LABELS[value]}))]} />
      <FilterSelect aria-label="Filter volunteer list" value={scope} onChange={value => filter(() => setScope(value))} options={[{ value: "", label: "All volunteers" }, { value: "general", label: "General interest list" }, { value: "event", label: "Event volunteers" }]} />
      <FilterSelect aria-label="Filter volunteer event" value={eventId} onChange={value => filter(() => setEventId(value))} options={[{ value: "", label: "All events" }, ...events.map(event => ({ value: event.id, label: event.title }))]} />
      <FilterSelect aria-label="Filter event sign-up status" value={status} onChange={value => filter(() => setStatus(value))} options={[{ value: "", label: "All sign-up statuses" }, { value: "confirmed", label: "Confirmed" }, { value: "waitlisted", label: "Waitlisted" }, { value: "cancelled", label: "Cancelled" }]} />
    </>} />
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error} <button className="ml-2 underline" onClick={() => setAttempt(value => value + 1)}>Retry</button></p>}
    {notice && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">{notice}</p>}
    <AdminTable headers={["Volunteer", "Contact", "Status", "Source", "Committees / interests", "Event sign-ups", "Updated"]} empty={error ? "Volunteer records are temporarily unavailable." : !result ? "Loading volunteers…" : "No volunteers match these filters."}>
      {result?.volunteers.map(person => <TR key={person.id} onClick={() => setSelected(person)}>
        <TD className="font-medium">{person.name}{person.member&&<span className="mt-1 block text-xs text-green-800">Linked member: {person.member.name}</span>}{person.deletionRequestedAt&&<span className="mt-1 block text-xs font-semibold text-red-800">Data deletion requested</span>}{person.generalRegisteredAt && <span className="mt-1 block text-xs font-normal text-green-800">General interest list</span>}{Boolean(person.emailIssues) && <span className="mt-1 block text-xs font-normal text-amber-800">{person.emailIssues} emails pending or failed</span>}</TD>
        <TD><span className="block break-all">{person.email}</span>{person.phone && <span className="block">{person.phone}</span>}</TD>
        <TD><Badge value={person.status??"active"} />{person.resumeDate&&<span className="mt-1 block text-xs">Resumes {person.resumeDate}</span>}</TD>
        <TD>{(person.sources ?? [person.source ?? "website"]).map(source => VOLUNTEER_SOURCE_LABELS[source]).join(", ")}</TD>
        <TD className="max-w-64 whitespace-normal">{[...(person.committeeNames??[]),...(person.interestAreas??[]),person.interests].filter(Boolean).join(", ") || "—"}</TD>
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
        {[['Volunteer status', selected.status??'active'], ['Linked member', selected.member?.name??'No matching member account'], ['City / ZIP', [selected.city,selected.zip].filter(Boolean).join(' ')||'Not provided'], ['Committees', selected.committeeNames?.join(', ')||'Not provided'], ['Other areas', selected.interestAreas?.join(', ')||'Not provided'], ['Availability', selected.availability||'Not provided'], ['Heard about us', selected.heardAbout||'Not provided'], ['Resume date', selected.resumeDate||'Not scheduled'], ['Sources', (selected.sources ?? [selected.source ?? 'website']).map(source => VOLUNTEER_SOURCE_LABELS[source]).join(', ')], ['Opportunity emails', selected.opportunityEmails ? 'Opted in' : 'Off'], ['Consent updated', selected.consentUpdatedAt ? new Date(selected.consentUpdatedAt).toLocaleString('en-US', {timeZone:'America/New_York'})+' (Philadelphia time)' : 'Not recorded for this legacy profile'], ['Email', selected.email], ['Phone', selected.phone || 'Not provided'], ['Interests', selected.interests || 'Not provided'], ['Notes', selected.notes || 'Not provided']].map(([label, value]) => <div key={label}><dt className="mb-1 font-semibold">{label}</dt><dd className="whitespace-pre-wrap break-words">{value}</dd></div>)}
      </dl>
      {selected.deletionRequestedAt&&<div role="status" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><strong>Data deletion request awaiting review</strong><p className="mt-2">Requested {new Date(selected.deletionRequestedAt).toLocaleString("en-US",{timeZone:"America/New_York"})} (Philadelphia time). Review the club’s records before handling this request; the membership account is separate.</p></div>}
      {selected.changes?.length ? <section className="mt-6"><h2 className="font-semibold">Recent activity</h2><ol className="mt-3 space-y-3">{selected.changes.map(change=><li key={change.id} className="rounded-xl border border-neutral-200 p-3 text-sm"><strong className="capitalize">{change.action.replace(/-/g," ")}</strong><p className="mt-1">{new Date(change.at).toLocaleString("en-US",{timeZone:"America/New_York"})} (Philadelphia time)</p>{change.action==="paused"&&<p className="mt-1 text-xs text-neutral-700">Resume: {change.resumeDate??"When resumed manually"}</p>}{change.changedFields.length>0&&<p className="mt-1 text-xs text-neutral-700">Changed: {change.changedFields.join(", ")}</p>}</li>)}</ol></section>:null}
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
