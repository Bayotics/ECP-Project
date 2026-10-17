import Link from "next/link";
import type { DuesSummary } from "@/lib/models";
import { DUES_PLAN_LABELS } from "@/lib/dues";

export const duesMoney = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
export function duesDate(date: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date));
}
export function duesMonth(month: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00Z`));
}
export default function DuesStatus({ summary, compact = false }: { summary: DuesSummary; compact?: boolean }) {
  return <section aria-label="Membership dues status" className={`rounded-2xl border p-5 text-neutral-900 ${summary.suspensionWarning ? "border-red-300 bg-red-50" : summary.outstandingCents ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
    {summary.suspensionWarning && <div role="alert" className="mb-4 text-red-900">
      <h2 className="font-semibold">Your membership might be suspended</h2>
      <p className="mt-1 text-sm">You owe dues for at least three completed months. Pay your outstanding balance of {duesMoney(summary.outstandingCents)} to bring your account up to date. Unconfirmed transfers do not clear arrears.</p>
    </div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-semibold text-neutral-950">Dues: {summary.status === "current" ? "Up to date" : summary.status === "at-risk" ? "At risk of suspension" : "Payment due"}</h2>
      {compact && <Link href="/member/dues" className="rounded-full bg-green-700 px-4 py-2 text-sm text-white">Manage dues</Link>}
    </div>
    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div><dt className="text-neutral-700">Outstanding balance</dt><dd className="mt-1 font-semibold">{duesMoney(summary.outstandingCents)}</dd></div>
      <div><dt className="text-neutral-700">Next unpaid payment due</dt><dd className="mt-1 font-semibold">{duesDate(summary.nextPaymentDue)}</dd></div>
      <div><dt className="text-neutral-700">Paid through</dt><dd className="mt-1 font-semibold">{summary.paidThrough ? duesDate(summary.paidThrough) : "No confirmed coverage yet"}</dd></div>
      <div><dt className="text-neutral-700">Payment schedule</dt><dd className="mt-1 font-semibold">{DUES_PLAN_LABELS[summary.frequency]}</dd></div>
    </dl>
    {summary.overdueMonths.length > 0 && <p className="mt-4 text-sm text-neutral-900">Months with unpaid dues: {summary.overdueMonths.map(duesMonth).join(", ")}. The current month counts toward suspension warnings only at month-end.</p>}
    {summary.pendingPayment?.submittedAt && <p className="mt-3 text-sm text-neutral-900">A transfer of {duesMoney(Math.round(summary.pendingPayment.amount * 100))} is awaiting treasurer confirmation.</p>}
    {summary.pendingPayment?.rejectionReason && !summary.pendingPayment.submittedAt && <p role="alert" className="mt-3 text-sm text-red-800">Your previous transfer submission could not be confirmed: {summary.pendingPayment.rejectionReason}. Check the transfer details and submit again.</p>}
  </section>;
}
