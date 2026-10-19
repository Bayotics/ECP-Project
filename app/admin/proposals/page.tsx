"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useEvents } from "@/context/EventsContext";
import { apiRequest } from "@/lib/client/api";
import { PROPOSAL_STATUSES, PROPOSAL_STATUS_LABELS, type EventProposal, type ProposalStatus } from "@/lib/models/proposal";
import { AdminPageHeader, AdminTable, AdminModal, FilterSelect, TR, TD, Badge, Btn } from "@/components/admin/AdminUI";
type Row = EventProposal & { emailIssues: number };
const field = "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-950 placeholder:text-neutral-700";
export default function ProposalsPage() {
  const { refresh } = useEvents();
  const [data, setData] = useState<{proposals: Row[]; total: number} | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ProposalStatus>("new");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [recipients, setRecipients] = useState<Array<{name: string; email: string}>>([]);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{proposals: Row[]; total: number}>(`/api/admin/proposals?${new URLSearchParams({status, page: String(page)})}`, { signal: controller.signal }).then(result => { setData(result); setSelected(previous => previous ? {...previous, emailIssues: result.proposals.find(row => row.id === previous.id)?.emailIssues ?? previous.emailIssues} : null); setError(""); }).catch(error => { if (!controller.signal.aborted) { setData(null); setError(error.message); } });
    return () => controller.abort();
  }, [status, page, attempt]);
  function select(row: Row) { setSelected(row); setReviewStatus(row.status); setNotes(row.reviewNotes || ""); setError(""); setNotice(""); }
  async function save() {
    if (!selected) return;
    setBusy(true); setError("");
    try { await apiRequest(`/api/admin/proposals/${encodeURIComponent(selected.id)}`, { method: "PATCH", body: JSON.stringify({status: reviewStatus, reviewNotes: notes}) }); setSelected({...selected, status: reviewStatus, reviewNotes: notes}); setNotice("Review saved."); setAttempt(value => value + 1); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save review."); }
    finally { setBusy(false); }
  }
  async function action(kind: "convert" | "retry-email") {
    if (!selected) return;
    setBusy(true); setError("");
    try {
      if (kind === "convert") {
        const event = await apiRequest<{id: string; slug: string}>(`/api/admin/proposals/${encodeURIComponent(selected.id)}`, { method: "POST", body: JSON.stringify({action: kind}) });
        setSelected({...selected, draftEventId: event.id, draftEventSlug: event.slug});
        setNotice("Draft event created. Open it below to finish the details and publish when ready.");
        await refresh();
      } else {
        const delivery = await apiRequest<{sent: number; failed: number}>(`/api/admin/proposals/${encodeURIComponent(selected.id)}`, { method: "POST", body: JSON.stringify({action: kind}) });
        setNotice(`${delivery.sent} emails sent; ${delivery.failed} failed.`);
      }
      setAttempt(value => value + 1);
    } catch (error) { setError(error instanceof Error ? error.message : "Could not complete the action."); }
    finally { setBusy(false); }
  }
  async function openRecipients() {
    setBusy(true); setError("");
    try { const result = await apiRequest<{recipients: Array<{name: string; email: string}>}>("/api/admin/proposals/recipients"); setRecipients(result.recipients); setRecipientsOpen(true); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not load recipients."); }
    finally { setBusy(false); }
  }
  async function saveRecipients(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { await apiRequest("/api/admin/proposals/recipients", { method: "PUT", body: JSON.stringify({ recipients }) }); setRecipientsOpen(false); setNotice("Proposal notification recipients saved. Future proposals will use this list."); }
    catch (error) { setError(error instanceof Error ? error.message : "Could not save recipients."); }
    finally { setBusy(false); }
  }
  const alerts = <>{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}{notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-900">{notice}</p>}</>;
  return <div className="space-y-6"><AdminPageHeader title="Event proposals" count={data?.total} subtitle="Review ideas and turn approved proposals into draft events."><Btn variant="secondary" disabled={busy} onClick={() => void openRecipients()}>Notification recipients</Btn><Link href="/events/propose" className="text-sm text-green-800 underline">Public proposal form</Link></AdminPageHeader>
    <div className="flex flex-wrap items-center gap-3"><FilterSelect aria-label="Filter proposal status" value={status} onChange={value => {setStatus(value); setPage(0); setData(null);}} options={[{value: "", label: "All statuses"}, ...PROPOSAL_STATUSES.map(value => ({ value, label: PROPOSAL_STATUS_LABELS[value] }))]} /><Btn variant="secondary" onClick={() => setAttempt(value => value + 1)}>Refresh</Btn></div>
    {alerts}
    <AdminTable headers={["Proposal", "Submitter", "Proposed date", "Status", "Submitted"]} empty={!data ? "Loading proposals…" : "No proposals found."}>{data?.proposals.map(row => <TR key={row.id} onClick={() => select(row)}><TD className="font-medium">{row.title}{row.draftEventId && <span className="block text-xs text-green-800">Draft event created</span>}{row.emailIssues > 0 && <span className="block text-xs text-amber-800">{row.emailIssues} emails pending or failed</span>}</TD><TD>{row.name}<span className="block break-all text-xs">{row.email}</span></TD><TD>{row.proposedDate}</TD><TD><Badge value={row.status} /></TD><TD>{new Date(row.createdAt).toLocaleDateString("en-US")}</TD></TR>)}</AdminTable>
    {data && <div className="flex items-center justify-between"><Btn variant="secondary" disabled={!page} onClick={() => {setPage(page - 1); setData(null);}}>Previous</Btn><span className="text-sm">{data.total} proposals · Page {page + 1}</span><Btn variant="secondary" disabled={(page + 1) * 25 >= data.total} onClick={() => {setPage(page + 1); setData(null);}}>Next</Btn></div>}
    {selected && <AdminModal title={selected.title} open onClose={() => setSelected(null)} size="lg"><div className="space-y-5">{alerts}<dl className="space-y-4 text-sm">{[["Submitter", `${selected.name} (${selected.email})`], ["Description", selected.description], ["Proposed date", selected.proposedDate], ["Location", selected.location], ["Budget", selected.estimatedBudgetCents === undefined ? "Not provided" : `$${(selected.estimatedBudgetCents / 100).toFixed(2)}`], ["Notes", selected.notes || "Not provided"]].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>
      <label className="block text-sm">Review status<select aria-label="Review status" className={field} value={reviewStatus} disabled={busy || Boolean(selected.draftEventId)} onChange={e => setReviewStatus(e.target.value as ProposalStatus)}>{PROPOSAL_STATUSES.map(value => <option key={value} value={value}>{PROPOSAL_STATUS_LABELS[value]}</option>)}</select></label>
      <label className="block text-sm">Internal review notes<textarea aria-label="Internal review notes" className={field} rows={4} maxLength={5000} disabled={busy} value={notes} onChange={e => setNotes(e.target.value)} /></label>
      <div className="flex flex-wrap gap-3"><Btn disabled={busy} onClick={() => void save()}>Save review</Btn>{selected.status === "approved" && !selected.draftEventId && <Btn disabled={busy || reviewStatus !== selected.status || notes !== (selected.reviewNotes || "")} onClick={() => void action("convert")}>Create draft event</Btn>}{selected.draftEventId && <Link href={`/admin/events?event=${encodeURIComponent(selected.draftEventId)}`} className="rounded-full bg-green-800 px-5 py-2.5 text-sm text-white">Open draft event</Link>}{selected.emailIssues > 0 && <Btn variant="secondary" disabled={busy} onClick={() => void action("retry-email")}>Retry pending emails</Btn>}</div>
    </div></AdminModal>}
    {recipientsOpen && <AdminModal title="Proposal notification recipients" open onClose={() => setRecipientsOpen(false)} size="lg"><form onSubmit={saveRecipients} className="space-y-5"><p className="text-sm text-neutral-700">Initially populated from the active President, Vice President and admin accounts. Saving replaces this with your chosen list for future proposals. Previously queued emails keep their original recipients.</p>{error && <p role="alert" className="text-red-800">{error}</p>}<fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Notification recipients</legend>{recipients.map((recipient, index) => <div className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1fr_1.5fr_auto]" key={index}><label className="text-xs">Name<input className={field} maxLength={150} value={recipient.name} onChange={e => setRecipients(recipients.map((row, i) => i === index ? {...row, name: e.target.value} : row))} /></label><label className="text-xs">Email<input className={field} type="email" required maxLength={254} value={recipient.email} onChange={e => setRecipients(recipients.map((row, i) => i === index ? {...row, email: e.target.value} : row))} /></label><button type="button" onClick={() => setRecipients(recipients.filter((_, i) => i !== index))} className="self-end py-2 text-sm text-red-800">Remove</button></div>)}<div className="flex flex-wrap gap-3"><Btn variant="secondary" disabled={recipients.length >= 50} onClick={() => setRecipients([...recipients, {name: "", email: ""}])}>Add recipient</Btn><button disabled={busy || !recipients.length} className="rounded-full bg-green-800 px-5 py-2 text-sm text-white disabled:opacity-50">Save recipients</button></div></fieldset></form></AdminModal>}
  </div>;
}
