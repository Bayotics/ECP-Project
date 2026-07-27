"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useDonations } from "@/context/DonationsContext";
import { useAuth } from "@/context/AuthContext";
import type { DonationType, DonationCause } from "@/lib/models/donation";

/* ─── Constants ───────────────────────────────────────────────────────────── */
const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

const CAUSES: { value: DonationCause; label: string; icon: string; desc: string }[] = [
  { value: "general",           label: "General Fund",       icon: "🌟", desc: "Support Eko Club Philadelphia's core operations" },
  { value: "youth-empowerment", label: "Youth Empowerment",  icon: "🎓", desc: "Skills, mentorship & civic education for youth" },
  { value: "civic-education",   label: "Civic Education",    icon: "📚", desc: "Rights awareness & governance literacy" },
  { value: "environmental",     label: "Environment",        icon: "🌿", desc: "Clean waterways & environmental advocacy" },
  { value: "infrastructure",    label: "Infrastructure",     icon: "🏗️", desc: "Roads, drainage & public facility advocacy" },
  { value: "healthcare",        label: "Healthcare",         icon: "🏥", desc: "Community health outreach programmes" },
  { value: "education",         label: "Education",          icon: "✏️", desc: "School outreach & scholarship support" },
];

type DonationStep = "form" | "success";

function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default function DonatePage() {
  const { add: addDonation } = useDonations();
  const { currentUser } = useAuth();

  const [donationType, setDonationType] = useState<DonationType>("one-time");
  const [cause, setCause] = useState<DonationCause>("general");
  const [presetAmount, setPresetAmount] = useState<number | null>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [step, setStep] = useState<DonationStep>("form");
  const [donationRef, setDonationRef] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = presetAmount ?? parseInt(customAmount.replace(/\D/g, "") || "0", 10);
  const isRecurring = donationType !== "one-time";

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (amount < 5) e.amount = "Minimum donation is $5";
    if (!isAnonymous) {
      if (!name.trim()) e.name = "Name is required";
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    // Open PayPal FIRST and synchronously, inside the click gesture, so the
    // browser's popup blocker doesn't swallow the new tab (any await before
    // window.open would break it). All amounts are in USD.
    // TODO: Replace REPLACE_WITH_CLUB_BUTTON_ID with the club's actual PayPal
    // Donate button ID from their PayPal Business account.
    const paypalUrl = `https://www.paypal.com/donate/?hosted_button_id=REPLACE_WITH_CLUB_BUTTON_ID&currency_code=USD&amount=${amount}`;
    window.open(paypalUrl, "_blank", "noopener,noreferrer");

    // Advance the UI first so the confirmation always shows, then record the
    // pledge as a pending lead for the club's records (fully non-blocking —
    // the PayPal tab has already opened; completion is reconciled in PayPal).
    setStep("success");

    try {
      void Promise.resolve(
        addDonation({
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
        })
      )
        .then((donation) => setDonationRef(donation.referenceNumber))
        .catch(() => {});
    } catch {
      /* record write is best-effort; never block the confirmation */
    }
  }

  function handleReset() {
    setStep("form");
    setPresetAmount(50);
    setCustomAmount("");
    setMessage("");
    setDonationRef("");
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Hero */}
      <section className="relative bg-[#0a0a0a] text-white py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=1200')] bg-cover bg-center" />
        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-3">Support Eko Club Philadelphia</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">Make a Difference Today</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            Your donation funds civic education, youth empowerment, community advocacy, and service programmes across the United States and Lagos, Nigeria.
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
              <div className="w-20 h-20 bg-(--color-green-100) rounded-full flex items-center justify-center text-4xl mx-auto mb-5">🙏</div>
              <h2 className="text-2xl font-bold text-(--color-neutral-900) mb-2">Thank You!</h2>
              <p className="text-(--color-neutral-600) mb-5">
                We&apos;ve opened PayPal in a new tab to complete your{" "}
                <span className="font-bold text-(--color-green-700)">{formatUSD(amount)}</span>{" "}
                {isRecurring ? `${donationType} ` : ""}gift to {CAUSES.find(c => c.value === cause)?.label}.
                If it didn&apos;t open, use the direct link below.
              </p>
              {donationRef && (
                <div className="bg-(--color-green-50) border border-(--color-green-200) rounded-xl px-5 py-4 inline-block mb-7">
                  <p className="text-xs text-(--color-green-700) font-semibold uppercase tracking-wide">Reference Number</p>
                  <p className="text-xl font-bold text-(--color-green-800)">{donationRef}</p>
                </div>
              )}
              <p className="text-sm text-(--color-neutral-500) mb-7 max-w-sm mx-auto">
                Once your PayPal payment completes, your support goes straight to work.
                Thank you for supporting Eko Club Philadelphia!{" "}
                <a
                  href="https://paypal.me/ekoclubphiladelphia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#059669] hover:underline font-medium"
                >
                  Open PayPal.me
                </a>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleReset} className="px-5 py-2.5 bg-(--color-green-600) hover:bg-(--color-green-700) text-white rounded-xl font-semibold text-sm transition-colors">
                  Make Another Gift
                </button>
                <Link href="/" className="px-5 py-2.5 border border-(--color-neutral-300) rounded-xl font-semibold text-sm text-(--color-neutral-700) hover:bg-(--color-neutral-50) transition-colors">
                  Back to Home
                </Link>
              </div>
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
              onSubmit={handleDonate}
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
                      {formatUSD(a)}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-500) font-semibold text-sm">$</span>
                  <input type="number" min={5} value={customAmount}
                    onChange={e => { setCustomAmount(e.target.value); setPresetAmount(null); }}
                    placeholder="Custom amount (USD)"
                    className={`w-full pl-7 pr-4 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) ${errors.amount ? "border-red-400 bg-red-50" : "border-(--color-neutral-300)"}`} />
                </div>
                {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
              </div>

              {/* Cause */}
              <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6">
                <h2 className="font-bold text-(--color-neutral-900) mb-4">Choose a Cause</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAUSES.map(c => {
                    const selected = cause === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCause(c.value)}
                        aria-pressed={selected}
                        className={`relative cursor-pointer rounded-2xl border p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#059669] hover:shadow-md ${
                          selected
                            ? "border-[#059669] bg-[#f0fdf9] ring-2 ring-[#059669]/20"
                            : "border-neutral-200 bg-white"
                        }`}
                      >
                        {/* Checkmark indicator */}
                        <div
                          className={`absolute top-4 right-4 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            selected ? "bg-[#059669] opacity-100" : "opacity-0"
                          }`}
                        >
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                          </svg>
                        </div>

                        <span className="text-2xl">{c.icon}</span>
                        <p className="mt-3 text-sm font-semibold text-neutral-900 pr-6">{c.label}</p>
                        <p className="mt-1 text-xs text-neutral-500 leading-relaxed">{c.desc}</p>
                      </button>
                    );
                  })}
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
                className="w-full py-4 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-2xl text-base transition-colors shadow-md">
                {amount >= 5 ? `Continue to PayPal · ${formatUSD(amount)}${isRecurring ? ` / ${donationType}` : ""}` : "Continue to PayPal →"}
              </button>

              {/* Secondary fallback — direct PayPal.me link */}
              <p className="text-xs text-neutral-400 text-center mt-3">
                Or donate directly via{" "}
                <a href="https://paypal.me/ekoclubphiladelphia" target="_blank"
                   rel="noopener noreferrer"
                   className="text-[#059669] hover:underline font-medium">
                  PayPal.me
                </a>
                {" "}(replace with club&apos;s actual PayPal.me link)
              </p>

              <p className="text-center text-xs text-(--color-neutral-400)">
                🔒 Secure donation via PayPal. Eko Club Philadelphia is a registered non-profit organisation.
              </p>
            </motion.form>
          )}

        </AnimatePresence>
      </section>
    </div>
  );
}
