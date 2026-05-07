"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/* ── Model ── */
interface DuesRecord {
  id: string;
  year: number;
  amount: number;
  status: "paid" | "pending" | "overdue" | "waived";
  dueDate: string;       // ISO
  paidDate?: string;     // ISO, set when paid
  reference?: string;    // payment reference
  method?: string;
}

interface DuesState {
  records: DuesRecord[];
}

const DUES_KEY_PREFIX = "ecp_dues_";
const CURRENT_YEAR = new Date().getFullYear();
const DUES_AMOUNT = 5000; // ₦5,000 annual dues

function makeRef() {
  return "ECP-PAY-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

function loadDues(userId: string): DuesState {
  if (typeof window === "undefined") return { records: [] };
  try {
    const raw = localStorage.getItem(DUES_KEY_PREFIX + userId);
    if (raw) return JSON.parse(raw) as DuesState;
  } catch { /* ignore */ }
  // Default: generate history for past 3 years + current year
  const records: DuesRecord[] = [];
  for (let y = CURRENT_YEAR - 3; y <= CURRENT_YEAR; y++) {
    const isCurrentYear = y === CURRENT_YEAR;
    const paid = !isCurrentYear; // past years paid, current pending
    records.push({
      id: `dues-${y}`,
      year: y,
      amount: DUES_AMOUNT,
      status: paid ? "paid" : "pending",
      dueDate: `${y}-03-31`,
      paidDate: paid ? `${y}-02-${String(10 + (y % 15)).padStart(2, "0")}` : undefined,
      reference: paid ? makeRef() : undefined,
      method: paid ? "Bank Transfer" : undefined,
    });
  }
  return { records };
}

function saveDues(userId: string, state: DuesState) {
  localStorage.setItem(DUES_KEY_PREFIX + userId, JSON.stringify(state));
}

/* ── Pay Modal ── */
const PAYMENT_METHODS = ["Debit Card", "Bank Transfer", "USSD", "Paystack", "Flutterwave"];

function PayModal({
  amount,
  year,
  onSuccess,
  onClose,
}: {
  amount: number;
  year: number;
  onSuccess: (method: string, ref: string) => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [phase, setPhase] = useState<"form" | "processing" | "success">("form");
  const [ref, setRef] = useState("");

  function handlePay() {
    const newRef = makeRef();
    setRef(newRef);
    setPhase("processing");
    setTimeout(() => setPhase("success"), 2200);
  }

  if (phase === "success") {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-4 space-y-3">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-gray-500">Payment Successful!</h2>
          <p className="text-sm text-(--color-neutral-500)">
            Your {year} dues of <strong>₦{amount.toLocaleString()}</strong> have been received.
          </p>
          <div className="rounded-lg bg-(--color-green-50) border border-(--color-green-200) px-4 py-3 text-sm">
            <p className="text-(--color-neutral-500)">Reference</p>
            <p className="font-mono font-semibold text-(--color-green-700) mt-0.5">{ref}</p>
          </div>
          <button
            onClick={() => { onSuccess(method, ref); onClose(); }}
            className="w-full rounded-lg bg-(--color-green-600) py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) transition"
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  if (phase === "processing") {
    return (
      <ModalShell onClose={() => {}}>
        <div className="text-center py-8 space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-(--color-green-200) border-t-(--color-green-600) animate-spin mx-auto" />
          <p className="font-semibold text-gray-500">Processing payment…</p>
          <p className="text-sm text-(--color-neutral-500)">Please wait, do not close this window</p>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-500">Pay Annual Dues</h2>
          <p className="text-sm text-(--color-neutral-500) mt-1">
            {year} membership dues · Lagos State Chapter
          </p>
        </div>

        {/* Amount */}
        <div className="rounded-xl bg-(--color-green-50) border border-(--color-green-200) px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-(--color-green-700) font-medium">Amount due</span>
          <span className="text-2xl font-bold text-(--color-green-700)">₦{amount.toLocaleString()}</span>
        </div>

        {/* Payment method */}
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-2">Payment method</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                  method === m
                    ? "border-(--color-green-500) bg-(--color-green-50) text-(--color-green-700)"
                    : "border-(--color-neutral-200) text-(--color-neutral-600) hover:border-(--color-green-300)"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-(--color-neutral-400)">
          This is a demo — no real payment will be processed. Click &ldquo;Pay Now&rdquo; to simulate.
        </p>

        <div className="flex gap-2">
          <button
            onClick={handlePay}
            className="flex-1 rounded-lg bg-(--color-green-600) py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) transition"
          >
            Pay ₦{amount.toLocaleString()} Now
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-(--color-neutral-300) px-4 py-2.5 text-sm font-medium text-(--color-neutral-600) hover:bg-(--color-neutral-50) transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Main Page ── */
const STATUS_STYLES: Record<DuesRecord["status"], string> = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  waived:  "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<DuesRecord["status"], string> = {
  paid: "Paid", pending: "Pending", overdue: "Overdue", waived: "Waived",
};

export default function DuesPage() {
  const { currentUser } = useAuth();
  const [dues, setDues] = useState<DuesState>({ records: [] });
  const [paying, setPaying] = useState(false);

  const load = useCallback(() => {
    if (currentUser) setDues(loadDues(currentUser.id));
  }, [currentUser]);

  useEffect(() => { load(); }, [load]);

  const currentRecord = dues.records.find((r) => r.year === CURRENT_YEAR);
  const history = dues.records.filter((r) => r.year < CURRENT_YEAR).reverse();

  const totalPaid = dues.records
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  function handlePaySuccess(method: string, ref: string) {
    if (!currentUser) return;
    const updated: DuesState = {
      records: dues.records.map((r) =>
        r.year === CURRENT_YEAR
          ? { ...r, status: "paid", paidDate: new Date().toISOString(), reference: ref, method }
          : r
      ),
    };
    saveDues(currentUser.id, updated);
    setDues(updated);
  }

  const isCurrent = currentRecord?.status === "pending" || currentRecord?.status === "overdue";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-500">Dues &amp; Payments</h1>
        <p className="text-sm text-(--color-neutral-500) mt-1">Track your annual membership dues and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-(--color-neutral-200) p-5">
          <p className="text-xs font-medium text-(--color-neutral-400) uppercase tracking-wide">Current Year</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{CURRENT_YEAR}</p>
          {currentRecord && (
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[currentRecord.status]}`}>
              {STATUS_LABEL[currentRecord.status]}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-(--color-neutral-200) p-5">
          <p className="text-xs font-medium text-(--color-neutral-400) uppercase tracking-wide">Annual Dues</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">₦{DUES_AMOUNT.toLocaleString()}</p>
          <p className="text-xs text-(--color-neutral-400) mt-1">Per calendar year</p>
        </div>
        <div className="bg-white rounded-xl border border-(--color-neutral-200) p-5">
          <p className="text-xs font-medium text-(--color-neutral-400) uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-(--color-green-600) mt-1">₦{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-(--color-neutral-400) mt-1">All time</p>
        </div>
      </div>

      {/* Current year card */}
      {currentRecord && (
        <div className={`rounded-2xl border p-6 flex items-center justify-between gap-4 ${
          currentRecord.status === "paid"
            ? "bg-(--color-green-50) border-(--color-green-200)"
            : currentRecord.status === "overdue"
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
        }`}>
          <div className="space-y-1">
            <p className="font-semibold text-gray-500">{CURRENT_YEAR} Annual Dues</p>
            {currentRecord.status === "paid" ? (
              <>
                <p className="text-sm text-(--color-green-700)">✓ Paid on {new Date(currentRecord.paidDate!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}</p>
                <p className="text-xs text-(--color-neutral-500) font-mono">Ref: {currentRecord.reference}</p>
              </>
            ) : (
              <p className="text-sm text-yellow-700">
                Due by {new Date(currentRecord.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          {isCurrent && (
            <button
              onClick={() => setPaying(true)}
              className="flex-shrink-0 rounded-lg bg-(--color-green-600) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) transition shadow-sm"
            >
              Pay Now
            </button>
          )}
          {currentRecord.status === "paid" && (
            <span className="text-3xl">🏅</span>
          )}
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-gray-500 mb-3">Payment History</h2>
        <div className="bg-white rounded-xl border border-(--color-neutral-200) overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--color-neutral-100) bg-(--color-neutral-50)">
                <th className="text-left px-5 py-3 text-xs font-medium text-(--color-neutral-500) uppercase tracking-wide">Year</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-(--color-neutral-500) uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-(--color-neutral-500) uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-(--color-neutral-500) uppercase tracking-wide hidden sm:table-cell">Date Paid</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-(--color-neutral-500) uppercase tracking-wide hidden md:table-cell">Reference</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-(--color-neutral-500) uppercase tracking-wide hidden sm:table-cell">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--color-neutral-100)">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-(--color-neutral-400) text-sm">
                    No payment history yet
                  </td>
                </tr>
              ) : (
                history.map((r) => (
                  <tr key={r.id} className="hover:bg-(--color-neutral-50) transition">
                    <td className="px-5 py-3.5 font-semibold text-gray-500">{r.year}</td>
                    <td className="px-5 py-3.5 text-gray-500">₦{r.amount.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-(--color-neutral-500) hidden sm:table-cell">
                      {r.paidDate
                        ? new Date(r.paidDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-(--color-neutral-500) hidden md:table-cell">
                      {r.reference ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-(--color-neutral-500) hidden sm:table-cell">{r.method ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay modal */}
      {paying && currentRecord && (
        <PayModal
          amount={currentRecord.amount}
          year={CURRENT_YEAR}
          onSuccess={handlePaySuccess}
          onClose={() => setPaying(false)}
        />
      )}
    </div>
  );
}
