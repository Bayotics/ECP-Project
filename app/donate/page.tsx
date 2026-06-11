"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDonations } from "@/context/DonationsContext";
import { useAuth } from "@/context/AuthContext";
import PaymentWidget from "@/components/payments/PaymentWidget";
import type { PaymentResult } from "@/components/payments/PaymentWidget";
import type { DonationType, DonationCause } from "@/lib/models/donation";
import { sendZellePendingNotification } from "@/lib/server/notifications";

/* ─── Constants ───────────────────────────────────────────────────────────── */
const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

const CAUSES: { value: DonationCause; label: string; icon: string; desc: string }[] = [
  { value: "general",           label: "General Fund",       icon: "🌟", desc: "Support Eko Club Philadelphia's core operations" },
  { value: "youth-empowerment", label: "Youth Empowerment",  icon: "🎓", desc: "Skills, mentorship & civic education for youth" },
  { value: "civic-education",   label: "Civic Education",    icon: "📚", desc: "Rights awareness & governance literacy" },
  { value: "environmental",     label: "Environment",        icon: "🌿", desc: "Clean waterways & environmental advocacy" },
  { value: "infrastructure",    label: "Infrastructure",     icon: "🏗️", desc: "Roads, drainage & public facility advocacy" },
  { value: "healthcare",        label: "Healthcare",         icon: "🏥", desc: "Community health outreach programmes" },
  { value: "education",         label: "Education",          icon: "✏️", desc: "School outreach & scholarship support" },
];

type DonationStep = "form" | "payment" | "success";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DonatePage() {
  const { add: addDonation, markSuccessful } = useDonations();
  const { currentUser } = useAuth();

  const [donationType, setDonationType] = useState<DonationType>("one-time");
  const [cause, setCause] = useState<DonationCause>("general");
  const [presetAmount, setPresetAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [step, setStep] = useState<DonationStep>("form");
  const [donationId, setDonationId] = useState("");
  const [donationRef, setDonationRef] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentError, setPaymentError] = useState("");

  const amount = presetAmount ?? parseInt(customAmount.replace(/\D/g, "") || "0", 10);
  const isRecurring = donationType !== "one-time";

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (amount < 100) e.amount = "Minimum donation is ₦100";
    if (!isAnonymous) {
      if (!name.trim()) e.name = "Name is required";
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleProceedToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Create the donation record in pending state
    const donation = await addDonation({
      userId: currentUser?.id,
      donorName: isAnonymous ? "Anonymous" : name.trim(),
      donorEmail: isAnonymous ? "" : email.trim().toLowerCase(),
      donorPhone: phone.trim() || undefined,
      isAnonymous,
      amount,
      type: donationType,
      cause,
      message: message.trim() || undefined,
      isRecurring,
      autoRenew: isRecurring,
      nextChargeDate: isRecurring
        ? new Date(Date.now() + (donationType === "monthly" ? 30 : 365) * 86400000).toISOString()
        : undefined,
    });

    setDonationId(donation.id);
    setDonationRef(donation.referenceNumber);
    setStep("payment");
    setPaymentError("");
  }

  async function handlePaymentSuccess(result: PaymentResult, autoRenew?: boolean) {
    if (result.method !== "zelle") {
      // For non-Zelle, mark successful immediately (server already did this via verify/capture)
      await markSuccessful(donationId, result.reference).catch(() => {});
    }
    setStep("success");
  }

  function handleReset() {
    setStep("form");
    setPresetAmount(5000);
    setCustomAmount("");
    setMessage("");
    setDonationId("");
    setDonationRef("");
    setPaymentError("");
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Hero */}
      <section className="relative bg-linear-to-br from-(--color-green-800) to-(--color-green-600) text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=1200')] bg-cover bg-center" />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-3">Support Eko Club Philadelphia</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Make a Difference Today</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Your donation funds civic education, youth empowerment, community advocacy, and accountability programmes across Lagos.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">

          {/* ── Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-white border border-(--color-neutral-200) rounded-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-(--color-green-100) rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🎉</div>
              <h2 className="text-2xl font-extrabold text-(--color-neutral-900) mb-2">Thank You!</h2>
              <p className="text-(--color-neutral-600) mb-5">
                {isAnonymous ? "Your anonymous donation" : `${name}'s donation`} of{" "}
                <span className="font-bold text-(--color-green-700)">{formatNaira(amount)}</span>{" "}
                {isRecurring ? `(${donationType})` : ""} has been received.
              </p>
              <div className="bg-(--color-green-50) border border-(--color-green-200) rounded-xl px-5 py-4 inline-block mb-7">
                <p className="text-xs text-(--color-green-700) font-semibold uppercase tracking-wide">Reference Number</p>
                <p className="text-xl font-extrabold text-(--color-green-800)">{donationRef}</p>
              </div>
              {!isAnonymous && (
                <p className="text-sm text-(--color-neutral-500) mb-7 max-w-xs mx-auto">
                  A receipt has been sent to <strong>{email}</strong>. Thank you for supporting Eko Club Philadelphia!
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleReset} className="px-5 py-2.5 bg-(--color-green-600) hover:bg-(--color-green-700) text-white rounded-xl font-semibold text-sm transition-colors">
                  Donate Again
                </button>
                <Link href="/" className="px-5 py-2.5 border border-(--color-neutral-300) rounded-xl font-semibold text-sm text-(--color-neutral-700) hover:bg-(--color-neutral-50) transition-colors">
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Payment Step ── */}
          {step === "payment" && (
            <motion.div
              key="payment"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-(--color-neutral-200) rounded-2xl p-6 space-y-5"
            >
              <div>
                <button onClick={() => setStep("form")} className="text-sm text-(--color-green-600) hover:underline mb-3">← Back</button>
                <h2 className="text-xl font-bold text-(--color-neutral-900)">Complete Your Donation</h2>
                <div className="mt-2 rounded-xl bg-(--color-green-50) border border-(--color-green-200) px-4 py-3 text-sm flex justify-between items-center">
                  <span className="text-(--color-green-700)">
                    {isAnonymous ? "Anonymous" : name} · {CAUSES.find(c => c.value === cause)?.label}
                    {isRecurring ? ` · ${donationType}` : ""}
                  </span>
                  <span className="font-bold text-(--color-green-800) text-lg">{formatNaira(amount)}</span>
                </div>
              </div>

              {paymentError && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{paymentError}</div>
              )}

              <PaymentWidget
                amountNGN={amount}
                email={isAnonymous ? "anonymous@ecp.org" : email}
                name={isAnonymous ? "Anonymous" : name}
                phone={phone || undefined}
                description={`Donation to Eko Club Philadelphia — ${cause}`}
                context="donation"
                recordId={donationId}
                enableAutoRenew={isRecurring}
                defaultAutoRenew={isRecurring}
                onSuccess={handlePaymentSuccess}
                onError={setPaymentError}
              />
            </motion.div>
          )}

          {/* ── Form Step ── */}
          {step === "form" && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleProceedToPayment}
              className="space-y-6"
            >
              {/* Donation type */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Donation Type</h2>
                <div className="grid grid-cols-3 gap-2 p-1 bg-(--color-neutral-100) rounded-xl">
                  {(["one-time", "monthly", "annual"] as DonationType[]).map(t => (
                    <button key={t} type="button" onClick={() => setDonationType(t)}
                      className={`py-2 rounded-lg text-sm font-semibold capitalize transition-all ${donationType === t ? "bg-white shadow text-(--color-neutral-900)" : "text-(--color-neutral-500) hover:text-(--color-neutral-700)"}`}>
                      {t === "one-time" ? "One-Time" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {isRecurring && (
                  <p className="text-xs text-(--color-green-700) mt-2 font-medium">
                    ✓ Recurring {donationType} donation — you can cancel anytime from your portal.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Choose Amount</h2>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_AMOUNTS.map(a => (
                    <button key={a} type="button" onClick={() => { setPresetAmount(a); setCustomAmount(""); }}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${presetAmount === a ? "border-(--color-green-500) bg-(--color-green-50) text-(--color-green-800)" : "border-(--color-neutral-200) hover:border-(--color-neutral-300) text-(--color-neutral-700)"}`}>
                      {formatNaira(a)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-500) font-semibold text-sm">₦</span>
                  <input type="number" min={100} value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setPresetAmount(null); }}
                    placeholder="Custom amount"
                    className={`w-full pl-7 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${errors.amount ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"}`} />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>

              {/* Cause */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Choose a Cause</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAUSES.map(c => (
                    <button key={c.value} type="button" onClick={() => setCause(c.value)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${cause === c.value ? "border-(--color-green-500) bg-(--color-green-50)" : "border-(--color-neutral-200) hover:border-(--color-neutral-300)"}`}>
                      <span className="text-xl mt-0.5 shrink-0">{c.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-(--color-neutral-800)">{c.label}</p>
                        <p className="text-xs text-(--color-neutral-500) line-clamp-2">{c.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Donor info */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-(--color-neutral-900)">Your Details</h2>
                  <label className="flex items-center gap-2 text-sm font-medium text-(--color-neutral-600) cursor-pointer">
                    <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="rounded" />
                    Donate anonymously
                  </label>
                </div>
                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Full Name *</label>
                      <input value={name} onChange={e => setName(e.target.value)} placeholder="Tunde Adeyemi"
                        className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${errors.name ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"}`} />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Email Address *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tunde@email.com"
                        className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${errors.email ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"}`} />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Phone <span className="font-normal text-(--color-neutral-400)">(for SMS receipt)</span></label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080xxxxxxxx"
                        className="w-full px-3 py-2.5 text-sm border border-(--color-neutral-300) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400)" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Message (optional)</label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Leave a note or dedication…"
                    className="w-full px-3 py-2.5 text-sm border border-(--color-neutral-300) rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-(--color-green-400)" />
                </div>
              </div>

              <button type="submit"
                className="w-full py-4 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-extrabold rounded-2xl text-base transition-colors shadow-md">
                {amount >= 100 ? `Continue · ${formatNaira(amount)}${isRecurring ? ` / ${donationType}` : ""}` : "Continue to Payment →"}
              </button>
              <p className="text-center text-xs text-(--color-neutral-400)">
                🔒 Secure donation. Eko Club Philadelphia is a registered non-profit organisation.
              </p>
            </motion.form>
          )}

        </AnimatePresence>
      </section>
    </div>
  );
}
