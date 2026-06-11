"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import PaymentWidget from "@/components/payments/PaymentWidget";
import type { PaymentResult } from "@/components/payments/PaymentWidget";
import type { DuesPayment } from "@/lib/models";

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const CURRENT_YEAR = new Date().getFullYear();

const STATUS_STYLES: Record<DuesPayment["status"], string> = {
  paid:    "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  waived:  "bg-gray-100 text-gray-600",
};

const STATUS_LABEL: Record<DuesPayment["status"], string> = {
  paid: "Paid", pending: "Pending", overdue: "Overdue", waived: "Waived",
};

/* ─── Modal shell ───────────────────────────────────────────────────────────── */
function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/* ─── Pay modal ─────────────────────────────────────────────────────────────── */
function PayModal({
  dues, user, onSuccess, onClose,
}: {
  dues: DuesPayment;
  user: { id: string; email: string; displayName: string; phone?: string };
  onSuccess: (updated: DuesPayment) => void;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"pay" | "success">("pay");
  const [paidRef, setPaidRef] = useState("");
  const [paidMethod, setPaidMethod] = useState("");
  const [error, setError] = useState("");
  const [duesId, setDuesId] = useState(dues.id);

  async function ensureDuesRecord(paymentMethod: DuesPayment["paymentMethod"]): Promise<string> {
    if (duesId) return duesId;
    const res = await fetch("/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: dues.year, paymentMethod, autoRenew: false }),
    });
    const json = await res.json() as { ok: boolean; data?: DuesPayment; error?: string };
    if (!json.ok || !json.data) throw new Error(json.error ?? "Could not create dues record");
    setDuesId(json.data.id);
    return json.data.id;
  }

  async function handlePaymentSuccess(result: PaymentResult, autoRenew?: boolean) {
    const id = await ensureDuesRecord(result.method as DuesPayment["paymentMethod"]);

    if (result.method === "zelle") {
      // Zelle pending — already handled in PaymentWidget
      setPaidRef(result.reference);
      setPaidMethod("Zelle");
      setPhase("success");
      onSuccess({ ...dues, status: "pending", zelleRef: result.zelleRef });
      return;
    }

    // For Paystack/PayPal, server already marked as paid; just patch autoRenew if needed
    if (autoRenew) {
      await fetch(`/api/dues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoRenew: true }),
      }).catch(() => {});
    }

    setPaidRef(result.reference);
    setPaidMethod(result.method === "paystack" ? "Paystack" : "PayPal");
    setPhase("success");
    onSuccess({ ...dues, status: "paid", paidDate: new Date().toISOString(), reference: result.reference, paymentMethod: result.method as DuesPayment["paymentMethod"], autoRenew: autoRenew ?? false });
  }

  if (phase === "success") {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-4 space-y-3">
          <div className="text-5xl">{paidMethod === "Zelle" ? "⏳" : "🎉"}</div>
          <h2 className="text-xl font-bold text-(--color-neutral-800)">
            {paidMethod === "Zelle" ? "Payment Submitted!" : "Payment Successful!"}
          </h2>
          <p className="text-sm text-(--color-neutral-500)">
            {paidMethod === "Zelle"
              ? `Your Zelle payment for ${dues.year} dues has been recorded. We'll confirm within 1–2 business days.`
              : `Your ${dues.year} dues of ₦${dues.amount.toLocaleString()} have been received.`}
          </p>
          <div className="rounded-lg bg-(--color-green-50) border border-(--color-green-200) px-4 py-3 text-sm">
            <p className="text-(--color-neutral-500)">Reference</p>
            <p className="font-mono font-semibold text-(--color-green-700) mt-0.5">{paidRef}</p>
          </div>
          <p className="text-xs text-(--color-neutral-400)">A receipt has been sent to {user.email}</p>
          <button onClick={onClose} className="w-full rounded-lg bg-(--color-green-600) py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) transition">
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-(--color-neutral-900)">Pay Annual Dues</h2>
          <p className="text-sm text-(--color-neutral-500) mt-1">{dues.year} membership dues · Eko Club Philadelphia</p>
        </div>
        <div className="rounded-xl bg-(--color-green-50) border border-(--color-green-200) px-5 py-4 flex items-center justify-between">
          <span className="text-sm text-(--color-green-700) font-medium">Amount due</span>
          <span className="text-2xl font-bold text-(--color-green-700)">₦{dues.amount.toLocaleString()}</span>
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        <PaymentWidget
          amountNGN={dues.amount}
          email={user.email}
          name={user.displayName}
          phone={user.phone}
          description={`Eko Club Philadelphia ${dues.year} Annual Dues`}
          context="dues"
          recordId={duesId}
          enableAutoRenew
          defaultAutoRenew={dues.autoRenew}
          onSuccess={handlePaymentSuccess}
          onError={setError}
        />
      </div>
    </ModalShell>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function DuesPage() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState<DuesPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dues");
      const json = await res.json() as { ok: boolean; data?: DuesPayment[]; error?: string };
      if (json.ok && json.data) setRecords(json.data.sort((a, b) => b.year - a.year));
    } catch { /* silently ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { if (currentUser) load(); }, [currentUser, load]);

  const currentRecord = records.find(r => r.year === CURRENT_YEAR);
  const history = records.filter(r => r.year < CURRENT_YEAR);
  const totalPaid = records.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0);
  const isCurrent = currentRecord?.status === "pending" || currentRecord?.status === "overdue";

  function handlePaySuccess(updated: DuesPayment) {
    setRecords(prev => prev.map(r => r.id === updated.id ? updated : r));
    setPaying(false);
  }

  if (!currentUser) return null;

  const userInfo = {
    id: currentUser.id,
    email: currentUser.email,
    displayName: `${currentUser.firstName} ${currentUser.lastName}`,
    phone: currentUser.phone,
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-(--color-neutral-900)">Dues &amp; Payments</h1>
        <p className="text-sm text-(--color-neutral-500) mt-1">Track your annual membership dues and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-(--color-neutral-200) p-5">
          <p className="text-xs font-medium text-(--color-neutral-400) uppercase tracking-wide">Current Year</p>
          <p className="text-2xl font-bold text-(--color-neutral-900) mt-1">{CURRENT_YEAR}</p>
          {currentRecord && (
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[currentRecord.status]}`}>
              {STATUS_LABEL[currentRecord.status]}
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-(--color-neutral-200) p-5">
          <p className="text-xs font-medium text-(--color-neutral-400) uppercase tracking-wide">Annual Dues</p>
          <p className="text-2xl font-bold text-(--color-neutral-900) mt-1">₦5,000</p>
          <p className="text-xs text-(--color-neutral-400) mt-1">Per calendar year</p>
        </div>
        <div className="bg-white rounded-xl border border-(--color-neutral-200) p-5">
          <p className="text-xs font-medium text-(--color-neutral-400) uppercase tracking-wide">Total Paid</p>
          <p className="text-2xl font-bold text-(--color-green-600) mt-1">₦{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-(--color-neutral-400) mt-1">All time</p>
        </div>
      </div>

      {/* Current year card */}
      {loading ? (
        <div className="rounded-2xl border border-(--color-neutral-200) bg-white p-8 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-(--color-green-200) border-t-(--color-green-600) animate-spin" />
        </div>
      ) : currentRecord ? (
        <div className={`rounded-2xl border p-6 flex items-center justify-between gap-4 ${
          currentRecord.status === "paid" ? "bg-(--color-green-50) border-(--color-green-200)"
          : currentRecord.status === "overdue" ? "bg-red-50 border-red-200"
          : "bg-yellow-50 border-yellow-200"}`}>
          <div className="space-y-1">
            <p className="font-semibold text-(--color-neutral-800)">{CURRENT_YEAR} Annual Dues</p>
            {currentRecord.status === "paid" ? (
              <>
                <p className="text-sm text-(--color-green-700)">
                  ✓ Paid on{" "}
                  {new Date(currentRecord.paidDate!).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <p className="text-xs text-(--color-neutral-500) font-mono">Ref: {currentRecord.reference ?? currentRecord.paystackRef ?? currentRecord.paypalOrderId ?? "—"}</p>
                {currentRecord.autoRenew && <p className="text-xs text-(--color-green-600) font-medium">🔄 Auto-renewal enabled</p>}
              </>
            ) : (
              <p className="text-sm text-yellow-700">
                Due by{" "}
                {new Date(currentRecord.dueDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          {isCurrent && (
            <button onClick={() => setPaying(true)}
              className="flex-shrink-0 rounded-lg bg-(--color-green-600) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--color-green-700) transition shadow-sm">
              Pay Now
            </button>
          )}
          {currentRecord.status === "paid" && <span className="text-3xl">🏅</span>}
        </div>
      ) : null}

      {/* History */}
      <div>
        <h2 className="font-semibold text-(--color-neutral-800) mb-3">Payment History</h2>
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
                  <td colSpan={6} className="px-5 py-8 text-center text-(--color-neutral-400) text-sm">No payment history yet</td>
                </tr>
              ) : history.map(r => (
                <tr key={r.id} className="hover:bg-(--color-neutral-50) transition">
                  <td className="px-5 py-3.5 font-semibold text-(--color-neutral-800)">{r.year}</td>
                  <td className="px-5 py-3.5 text-(--color-neutral-700)">₦{r.amount.toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-(--color-neutral-500) hidden sm:table-cell">
                    {r.paidDate ? new Date(r.paidDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-(--color-neutral-500) hidden md:table-cell">
                    {r.reference ?? r.paystackRef ?? r.zelleRef ?? "—"}
                  </td>
                  <td className="px-5 py-3.5 text-(--color-neutral-500) hidden sm:table-cell">
                    {r.paymentMethod ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {paying && currentRecord && (
        <PayModal
          dues={currentRecord}
          user={userInfo}
          onSuccess={handlePaySuccess}
          onClose={() => setPaying(false)}
        />
      )}
    </div>
  );
}
