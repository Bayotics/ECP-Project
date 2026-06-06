"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDonations } from "@/context/DonationsContext";
import { useAuth } from "@/context/AuthContext";
import type { DonationType, DonationCause, DonationPaymentMethod } from "@/lib/models/donation";

/* ─── Constants ───────────────────────────────────── */
const PRESET_AMOUNTS = [1000, 2500, 5000, 10000, 25000, 50000];

const CAUSES: { value: DonationCause; label: string; icon: string; desc: string }[] = [
  { value: "general",           label: "General Fund",       icon: "🌟", desc: "Support Eko Club Philadelphia’s core operations" },
  { value: "youth-empowerment", label: "Youth Empowerment",  icon: "🎓", desc: "Skills, mentorship & civic education for youth" },
  { value: "civic-education",   label: "Civic Education",    icon: "📚", desc: "Rights awareness & governance literacy" },
  { value: "environmental",     label: "Environment",        icon: "🌿", desc: "Clean waterways & environmental advocacy" },
  { value: "infrastructure",    label: "Infrastructure",     icon: "🏗️", desc: "Roads, drainage & public facility advocacy" },
  { value: "healthcare",        label: "Healthcare",         icon: "🏥", desc: "Community health outreach programmes" },
  { value: "education",         label: "Education",          icon: "✏️", desc: "School outreach & scholarship support" },
];

const PAYMENT_METHODS: { value: DonationPaymentMethod; label: string; icon: string }[] = [
  { value: "card",          label: "Card Payment",   icon: "💳" },
  { value: "bank-transfer", label: "Bank Transfer",  icon: "🏦" },
  { value: "ussd",          label: "USSD",           icon: "📱" },
];

type DonationStep = "form" | "processing" | "success";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

/* ─── Page ────────────────────────────────────────── */
export default function DonatePage() {
  const { add: addDonation, markSuccessful } = useDonations();
  const { currentUser } = useAuth();

  // Form state
  const [type, setType] = useState<DonationType>("one-time");
  const [cause, setCause] = useState<DonationCause>("general");
  const [presetAmount, setPresetAmount] = useState<number | null>(5000);
  const [customAmount, setCustomAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<DonationPaymentMethod>("card");
  const [name, setName] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [step, setStep] = useState<DonationStep>("form");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = presetAmount ?? parseInt(customAmount.replace(/\D/g, "") || "0", 10);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setStep("processing");
    await new Promise(r => setTimeout(r, 2000));

    const donation = await addDonation({
      userId: currentUser?.id,
      donorName: isAnonymous ? "Anonymous" : name,
      donorEmail: isAnonymous ? "" : email,
      donorPhone: phone || undefined,
      isAnonymous,
      amount,
      type,
      cause,
      message: message || undefined,
      paymentMethod,
      isRecurring: type !== "one-time",
      nextChargeDate: type !== "one-time"
        ? new Date(Date.now() + (type === "monthly" ? 30 : 365) * 86400000).toISOString()
        : undefined,
    });

    const ref = `PAY-DON-${Date.now()}`;
    await markSuccessful(donation.id, ref);
    setReference(donation.referenceNumber);
    setStep("success");
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Hero */}
      <section
        className="relative bg-linear-to-br from-(--color-green-800) to-(--color-green-600) text-white py-20 px-4 overflow-hidden"
      >
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
          {/* ── Processing ── */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              className="bg-white border border-(--color-neutral-200) rounded-2xl p-16 text-center flex flex-col items-center gap-5"
            >
              <div className="w-14 h-14 border-4 border-(--color-green-200) border-t-(--color-green-600) rounded-full animate-spin" />
              <p className="text-lg font-bold text-(--color-neutral-900)">Processing your donation…</p>
              <p className="text-sm text-(--color-neutral-500)">Please wait, do not close this page.</p>
            </motion.div>
          )}

          {/* ── Success ── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" as const }}
              className="bg-white border border-(--color-neutral-200) rounded-2xl p-10 text-center"
            >
              <div className="w-20 h-20 bg-(--color-green-100) rounded-full flex items-center justify-center text-4xl mx-auto mb-5">
                🎉
              </div>
              <h2 className="text-2xl font-extrabold text-(--color-neutral-900) mb-2">Thank You!</h2>
              <p className="text-(--color-neutral-600) mb-5">
                {isAnonymous ? "Your anonymous donation" : `${name}\u2019s donation`} of{" "}
                <span className="font-bold text-(--color-green-700)">{formatNaira(amount)}</span>{" "}
                {type !== "one-time" ? `(${type})` : ""} has been received.
              </p>
              <div className="bg-(--color-green-50) border border-(--color-green-200) rounded-xl px-5 py-4 inline-block mb-7">
                <p className="text-xs text-(--color-green-700) font-semibold uppercase tracking-wide">Reference Number</p>
                <p className="text-xl font-extrabold text-(--color-green-800)">{reference}</p>
              </div>
              <p className="text-sm text-(--color-neutral-500) mb-7 max-w-xs mx-auto">
                A receipt will be sent to {isAnonymous ? "the provided contact" : email}. Thank you for supporting Eko Club Philadelphia’s mission.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep("form");
                    setPresetAmount(5000);
                    setCustomAmount("");
                    setMessage("");
                    setReference("");
                  }}
                  className="px-5 py-2.5 bg-(--color-green-600) hover:bg-(--color-green-700) text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Donate Again
                </button>
                <Link
                  href="/"
                  className="px-5 py-2.5 border border-(--color-neutral-300) rounded-xl font-semibold text-sm text-(--color-neutral-700) hover:bg-(--color-neutral-50) transition-colors"
                >
                  Back to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Form ── */}
          {step === "form" && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" as const }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* ── Donation type ── */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Donation Type</h2>
                <div className="grid grid-cols-3 gap-2 p-1 bg-(--color-neutral-100) rounded-xl">
                  {(["one-time", "monthly", "annual"] as DonationType[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                        type === t
                          ? "bg-white shadow text-(--color-neutral-900)"
                          : "text-(--color-neutral-500) hover:text-(--color-neutral-700)"
                      }`}
                    >
                      {t === "one-time" ? "One-Time" : t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
                {type !== "one-time" && (
                  <p className="text-xs text-(--color-green-700) mt-2 font-medium">
                    ✓ You&apos;ll be charged {formatNaira(amount)} every {type === "monthly" ? "month" : "year"}. Cancel anytime.
                  </p>
                )}
              </div>

              {/* ── Amount ── */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Choose Amount</h2>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {PRESET_AMOUNTS.map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => { setPresetAmount(a); setCustomAmount(""); }}
                      className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        presetAmount === a
                          ? "border-(--color-green-500) bg-(--color-green-50) text-(--color-green-800)"
                          : "border-(--color-neutral-200) hover:border-(--color-neutral-300) text-(--color-neutral-700)"
                      }`}
                    >
                      {formatNaira(a)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-500) font-semibold text-sm">₦</span>
                  <input
                    type="number"
                    min={100}
                    value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setPresetAmount(null); }}
                    placeholder="Custom amount"
                    className={`w-full pl-7 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${
                      errors.amount ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"
                    }`}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                {amount >= 100 && (
                  <p className="text-xs text-(--color-neutral-500) mt-2">
                    You&apos;re donating <span className="font-bold text-(--color-green-700)">{formatNaira(amount)}</span>
                    {type !== "one-time" ? ` / ${type}` : ""}
                  </p>
                )}
              </div>

              {/* ── Cause ── */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Choose a Cause</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CAUSES.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCause(c.value)}
                      className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                        cause === c.value
                          ? "border-(--color-green-500) bg-(--color-green-50)"
                          : "border-(--color-neutral-200) hover:border-(--color-neutral-300)"
                      }`}
                    >
                      <span className="text-xl mt-0.5 shrink-0">{c.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-(--color-neutral-800)">{c.label}</p>
                        <p className="text-xs text-(--color-neutral-500) line-clamp-2">{c.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Donor info ── */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-(--color-neutral-900)">Your Details</h2>
                  <label className="flex items-center gap-2 text-sm font-medium text-(--color-neutral-600) cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={e => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    Donate anonymously
                  </label>
                </div>
                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Full Name *</label>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Tunde Adeyemi"
                        className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${
                          errors.name ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"
                        }`}
                      />
                      {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="tunde@email.com"
                        className={`w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${
                          errors.email ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"
                        }`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Phone (optional)</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="080xxxxxxxx"
                        className="w-full px-3 py-2.5 text-sm border border-(--color-neutral-300) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400)"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Leave a note or dedication…"
                    className="w-full px-3 py-2.5 text-sm border border-(--color-neutral-300) rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-(--color-green-400)"
                  />
                </div>
              </div>

              {/* ── Payment method ── */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Payment Method</h2>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === pm.value
                          ? "border-(--color-green-500) bg-(--color-green-50)"
                          : "border-(--color-neutral-200) hover:border-(--color-neutral-300)"
                      }`}
                    >
                      <span className="text-xl">{pm.icon}</span>
                      <span className="text-sm font-semibold text-(--color-neutral-800)">{pm.label}</span>
                      <div className={`ml-auto w-4 h-4 rounded-full border-2 ${
                        paymentMethod === pm.value
                          ? "border-(--color-green-600) bg-(--color-green-600)"
                          : "border-(--color-neutral-300)"
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Submit ── */}
              <button
                type="submit"
                className="w-full py-4 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-extrabold rounded-2xl text-base transition-colors shadow-md"
              >
                {amount >= 100
                  ? `Donate ${formatNaira(amount)}${type !== "one-time" ? ` / ${type}` : ""}`
                  : "Donate Now"}
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
