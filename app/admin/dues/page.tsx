"use client";
import { useCallback, useEffect, useState } from "react";
import type { DuesPayment, DuesSummary } from "@/lib/models";
import { duesDate, duesMoney } from "@/components/payments/DuesStatus";

interface MemberDues { id: string; name: string; email: string; membershipId?: string; records: DuesPayment[]; summary: DuesSummary }
async function fetchDuesPage(page: number, signal?: AbortSignal) {
  const response = await fetch(`/api/admin/dues?page=${page}`, { cache: "no-store", signal });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to load dues");
  return result as { data: MemberDues[]; total: number; failures: unknown[] };
}
export default function AdminDuesPage() {
  const [members, setMembers] = useState<MemberDues[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<{ member: MemberDues; payment: DuesPayment } | null>(null);
  const [reference, setReference] = useState("");
  const [reason, setReason] = useState("");
  const [failures, setFailures] = useState(0);
  const apply = useCallback((result: { data: MemberDues[]; total: number; failures: unknown[] }) => {
    setMembers(result.data); setTotal(result.total); setFailures(result.failures.length); setError("");
  }, []);
  const load = useCallback(async () => {
    try {
      apply(await fetchDuesPage(page));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load dues"); }
    finally { setLoading(false); }
  }, [page, apply]);
  useEffect(() => {
    const controller = new AbortController();
    void fetchDuesPage(page, controller.signal).then(result => {
      if (!controller.signal.aborted) apply(result);
    }).catch(caught => {
      if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Unable to load dues");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, apply]);
  async function resolve(action: "confirm" | "reject") {
    if (!review) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/dues/${review.payment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(action === "confirm" ? { action, reference } : { action, reason }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to update payment");
      setReview(null); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to update payment"); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-6xl space-y-6 text-neutral-900">
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-semibold">Member dues</h1><p className="mt-1 text-sm text-neutral-700">Review member standing and verify submitted Zelle and bank transfers.</p></div><button onClick={() => void load()} disabled={busy || loading} className="rounded-full border bg-white px-4 py-2 text-sm">Refresh</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {failures > 0 && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">At least {failures} dues reminder deliveries have failed. Check the email provider and job logs; the scheduled job retries failed deliveries.</p>}
    {review && <section aria-label="Review dues transfer" className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <h2 className="font-semibold">Verify transfer from {review.member.name}</h2>
      <p className="text-sm">{duesMoney(Math.round(review.payment.amount * 100))} via {review.payment.paymentMethod}, covering {duesDate(review.payment.coverageStart!)} – {duesDate(review.payment.coverageEnd!)}. Member reference: {review.payment.reference}.</p>
      <p className="text-sm font-medium">Confirm only after matching the funds in the club bank account. Confirmation immediately credits this member’s dues.</p>
      <p className="text-sm">Zelle confirmation number supplied by member: <strong>{review.payment.transferReference || "Not provided"}</strong></p>
      <label className="block text-sm">Bank transaction reference<input className="mt-1 block w-full rounded-xl border bg-white p-3" value={reference} maxLength={160} onChange={event => setReference(event.target.value)} /></label>
      <label className="block text-sm">Reason if the transfer cannot be verified<textarea className="mt-1 block w-full rounded-xl border bg-white p-3" value={reason} maxLength={500} onChange={event => setReason(event.target.value)} /></label>
      <div className="flex flex-wrap gap-3"><button disabled={busy || !reference.trim()} onClick={() => void resolve("confirm")} className="rounded-full bg-green-700 px-5 py-2.5 text-sm text-white disabled:opacity-50">Confirm funds received</button><button disabled={busy || !reason.trim()} onClick={() => void resolve("reject")} className="rounded-full border border-red-300 px-5 py-2.5 text-sm text-red-800 disabled:opacity-50">Return for correction</button><button disabled={busy} onClick={() => setReview(null)} className="rounded-full border px-5 py-2.5 text-sm">Close review</button></div>
    </section>}
    <div className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-sm"><thead className="border-b bg-neutral-50"><tr>{["Member", "Standing", "Outstanding", "Paid through / next due", "Transfer"].map(label => <th key={label} className="px-4 py-3 font-medium" scope="col">{label}</th>)}</tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan={5} className="p-6">Loading member dues…</td></tr> : members.length === 0 ? <tr><td colSpan={5} className="p-6">{error ? "Member dues could not be loaded. Use Refresh to try again." : "No members found."}</td></tr> : members.map(member => <tr key={member.id}><td className="px-4 py-4"><p className="font-medium">{member.name}</p><p>{member.membershipId ?? "No membership number"}</p><p className="text-xs text-neutral-600">{member.email}</p></td><td className="px-4 py-4">{member.summary.status === "needs-review" ? "Membership date needs review" : member.summary.status === "at-risk" ? "At risk of suspension" : member.summary.status === "current" ? "Up to date" : "Owing"}</td><td className="px-4 py-4">{member.summary.status === "needs-review" ? "Needs review" : duesMoney(member.summary.outstandingCents)}<p className="mt-1 text-xs">{member.summary.status === "needs-review" ? "Billing dates incomplete" : `${member.summary.overdueMonths.length} unpaid month(s)`}</p></td><td className="px-4 py-4"><p>{member.summary.paidThrough ? duesDate(member.summary.paidThrough) : "No confirmed coverage"}</p><p className="mt-1 text-xs">Next unpaid due {duesDate(member.summary.nextPaymentDue)}</p></td><td className="px-4 py-4">{member.summary.pendingPayment?.submittedAt ? <button disabled={busy} onClick={() => { setReview({ member, payment: member.summary.pendingPayment! }); setReference(member.summary.pendingPayment!.reference ?? ""); setReason(""); }} className="rounded-full border border-blue-300 px-4 py-2 text-blue-800">Review {duesMoney(Math.round(member.summary.pendingPayment.amount * 100))}</button> : "None awaiting confirmation"}</td></tr>)}</tbody></table></div>
    <div className="flex items-center justify-between text-sm"><button disabled={busy || loading || page === 0} onClick={() => { setLoading(true); setPage(page - 1); setReview(null); }} className="rounded-full border bg-white px-4 py-2 disabled:opacity-40">Previous</button><span>{total ? `${page * 25 + 1}–${Math.min((page + 1) * 25, total)} of ${total}` : "0 members"}</span><button disabled={busy || loading || (page + 1) * 25 >= total} onClick={() => { setLoading(true); setPage(page + 1); setReview(null); }} className="rounded-full border bg-white px-4 py-2 disabled:opacity-40">Next</button></div>
  </div>;
}
