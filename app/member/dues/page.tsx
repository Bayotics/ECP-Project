"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useDues } from "@/hooks/useDues";
import { DUES_PLAN_LABELS, MONTHLY_DUES_CENTS, ANNUAL_DUES_CENTS, SEMIANNUAL_DUES_CENTS } from "@/lib/dues";
import type { DuesFrequency, DuesPayment } from "@/lib/models";
import PaymentWidget from "@/components/payments/PaymentWidget";
import DuesStatus, { duesDate, duesMoney } from "@/components/payments/DuesStatus";

function Checkout({ payment, onClose, onSuccess }: { payment: DuesPayment; onClose: () => void; onSuccess: () => void }) {
  const { currentUser } = useAuth();
  const [error, setError] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const controls = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, [tabindex="0"], iframe');
      if (!controls?.length) { event.preventDefault(); return; }
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    window.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", keydown); previousFocus?.focus(); };
  }, [onClose]);
  if (!currentUser) return null;
  return createPortal(<div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-neutral-950/60 p-4" data-lenis-prevent onClick={onClose}>
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="dues-checkout-heading" className="my-auto max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6" onClick={event => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><h2 id="dues-checkout-heading" className="text-xl font-semibold">Pay membership dues</h2><button onClick={onClose} aria-label="Close payment dialog" className="rounded-lg border px-3 py-1">Close</button></div>
      <p className="mt-3 text-sm">{duesDate(payment.coverageStart ?? payment.dueDate)} – {duesDate(payment.coverageEnd ?? payment.dueDate)}</p>
      <p className="my-4 text-3xl font-semibold text-green-800">{duesMoney(Math.round(payment.amount * 100))}</p>
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <PaymentWidget amountUSD={payment.amount} email={currentUser.email} name={currentUser.displayName} phone={currentUser.phone} description="Eko Club Philadelphia membership dues" context="dues" recordId={payment.id} lockedMethod={payment.paypalOrderId ? "paypal" : undefined} onError={setError} onSuccess={onSuccess} />
      <p className="mt-4 text-xs text-neutral-700">Transfers remain pending until verified by the treasurer. Payments are initiated by you; there is no automatic debit.</p>
    </div>
  </div>, document.body);
}

export default function DuesPage() {
  const { currentUser } = useAuth();
  const { records, summary, loading, error, reload } = useDues(currentUser?.id);
  const [frequency, setFrequency] = useState<DuesFrequency | null>(null);
  const [checkout, setCheckout] = useState<DuesPayment | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const selected = frequency ?? summary?.frequency ?? "monthly";

  async function prepare(catchUp = false) {
    setBusy(true); setActionError(""); setNotice("");
    try {
      const response = await fetch("/api/dues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ frequency: selected, catchUp }) });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? "Unable to prepare payment");
      await reload();
      if (result.data.submittedAt) setNotice("Your transfer is awaiting confirmation. Coverage updates when the treasurer verifies the funds.");
      else setCheckout(result.data);
    } catch (caught) { setActionError(caught instanceof Error ? caught.message : "Unable to prepare payment"); }
    finally { setBusy(false); }
  }
  async function discardDraft() {
    if (!summary?.pendingPayment) return;
    setBusy(true); setActionError("");
    try {
      const response = await fetch(`/api/dues/${summary.pendingPayment.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await reload();
    } catch (caught) { setActionError(caught instanceof Error ? caught.message : "Unable to discard draft"); }
    finally { setBusy(false); }
  }
  async function downloadHistory() {
    setBusy(true); setActionError("");
    try {
      const response = await fetch("/api/dues/history", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to download payment history. Please try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = "ecp-dues-payment-history.pdf"; link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (caught) { setActionError(caught instanceof Error ? caught.message : "Download failed"); }
    finally { setBusy(false); }
  }
  if (!currentUser) return null;
  return <div className="mx-auto max-w-5xl space-y-6 pb-10 text-neutral-900">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-semibold text-neutral-950">Dues &amp; payments</h1><p className="mt-1 text-sm text-neutral-700">Your coverage, outstanding dues and confirmed payment history.</p></div><button disabled={busy || loading || !!error} onClick={downloadHistory} className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm disabled:opacity-50">Download history (.pdf)</button></div>
    {(error || actionError) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error || actionError}{error && <button onClick={() => void reload()} className="ml-3 underline">Retry</button>}</div>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-900">{notice}</p>}
    {loading ? <p role="status">Loading dues…</p> : summary && <>
      <DuesStatus summary={summary} />
      <section className="rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Choose your payment schedule</h2>
        <p className="mt-2 text-sm text-neutral-700">Dues are {duesMoney(MONTHLY_DUES_CENTS)} monthly, {duesMoney(ANNUAL_DUES_CENTS)} yearly, or {duesMoney(SEMIANNUAL_DUES_CENTS)} twice yearly. Each twice-yearly payment covers six months. Pay with PayPal or Zelle. Payments cover your oldest unpaid period first.</p>
        <div className="my-5 grid gap-3 sm:grid-cols-3" role="group" aria-label="Dues payment schedule">
          {summary.plans.map(plan => <button key={plan.frequency} type="button" disabled={busy || !!summary.pendingPayment} aria-pressed={selected === plan.frequency} onClick={() => setFrequency(plan.frequency)} className={`rounded-xl border p-4 text-left disabled:opacity-60 ${selected === plan.frequency ? "border-green-700 bg-green-50" : "border-neutral-200"}`}>
            <span className="block font-semibold">{DUES_PLAN_LABELS[plan.frequency]}</span><span className="mt-2 block text-xl">{duesMoney(plan.amountCents)}</span><span className="mt-2 block text-xs text-neutral-700">{duesDate(plan.coverageStart)} – {duesDate(plan.coverageEnd)}</span>
          </button>)}
        </div>
        {summary.pendingPayment ? <div className="space-y-3 text-sm"><p>{summary.pendingPayment.submittedAt ? "Awaiting treasurer confirmation" : "Payment in progress"}: {duesMoney(Math.round(summary.pendingPayment.amount * 100))} for {duesDate(summary.pendingPayment.coverageStart!)} – {duesDate(summary.pendingPayment.coverageEnd!)}.</p>
          {!summary.pendingPayment.submittedAt && <div className="flex flex-wrap gap-3"><button disabled={busy} onClick={() => setCheckout(summary.pendingPayment)} className="rounded-full bg-green-700 px-5 py-2.5 text-white">Continue payment</button>{!summary.pendingPayment.paypalOrderId && <button disabled={busy} onClick={discardDraft} className="rounded-full border px-5 py-2.5">Discard draft to change schedule</button>}</div>}
          {summary.pendingPayment.reference && <p>Reference: <span className="font-mono">{summary.pendingPayment.reference}</span></p>}
        </div> : <div className="flex flex-wrap gap-3"><button disabled={busy || !!error} onClick={() => void prepare()} className="rounded-full bg-green-700 px-5 py-2.5 text-sm text-white disabled:opacity-50">{busy ? "Preparing…" : `Pay ${DUES_PLAN_LABELS[selected].toLowerCase()} dues`}</button>{summary.catchUp && <button disabled={busy || !!error} onClick={() => void prepare(true)} className="rounded-full border border-green-700 px-5 py-2.5 text-sm text-green-800">Pay outstanding period · {duesMoney(summary.catchUp.amountCents)}</button>}</div>}
        <p className="mt-4 text-xs text-neutral-700">Billing begins {duesDate(summary.billingStartsOn)}. New memberships begin billing the month after approval. Three completed unpaid months trigger a month-end suspension warning; prepaid periods are exempt.</p>
      </section>
      <section className="rounded-2xl border border-neutral-200 bg-white p-5"><div className="mb-4 flex flex-wrap justify-between gap-2"><h2 className="text-lg font-semibold">Payment history</h2><p className="text-sm">Total confirmed payments: <strong>{duesMoney(summary.totalPaidCents)}</strong></p></div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-neutral-50"><tr>{["Coverage", "Amount", "Status", "Paid on", "Method / reference"].map(label => <th key={label} scope="col" className="px-3 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-neutral-100">{records.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-neutral-700">No payments have been recorded.</td></tr> : records.map(payment => <tr key={payment.id}>
          <td className="min-w-48 px-3 py-4">{payment.coverageStart && payment.coverageEnd ? `${duesDate(payment.coverageStart)} – ${duesDate(payment.coverageEnd)}` : `${payment.year} annual dues`}</td><td className="px-3 py-4">{duesMoney(Math.round(payment.amount * 100))}</td><td className="px-3 py-4">{payment.status === "pending" ? payment.submittedAt ? "Awaiting confirmation" : "Not paid" : payment.status === "paid" ? "Paid" : payment.status === "waived" ? "Waived" : "Overdue"}</td><td className="whitespace-nowrap px-3 py-4">{payment.paidDate ? duesDate(payment.paidDate) : "Unpaid"}</td><td className="px-3 py-4"><span className="block">{payment.paymentMethod ?? "Not selected"}</span><span className="break-all font-mono text-xs">{payment.reference ?? payment.id}</span></td>
        </tr>)}</tbody></table></div>
      </section>
    </>}
    {checkout && <Checkout payment={checkout} onClose={() => { setCheckout(null); void reload(); }} onSuccess={() => { setCheckout(null); setNotice("Payment submitted. Your status below reflects confirmed payments; bank transfers await treasurer verification."); void reload(); }} />}
  </div>;
}
