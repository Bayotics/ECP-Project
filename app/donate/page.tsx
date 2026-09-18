"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useDonations } from "@/context/DonationsContext";
import { useAuth } from "@/context/AuthContext";
import type { DonationType, DonationCause } from "@/lib/models/donation";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

/* PayPal, per §9 of the website review. Both come from the club's own
   PayPal Business account and are set in the environment rather than
   hard-coded, so going live is a config change and not a deploy.

   NEXT_PUBLIC_PAYPAL_DONATE_BUTTON_ID  the hosted Donate button id
   NEXT_PUBLIC_PAYPAL_ME                the club's paypal.me handle

   With neither set the page still takes the pledge and records it, but it
   deliberately does not open a PayPal tab: sending a donor to a broken
   checkout is worse than telling them a link is on its way. */
const PAYPAL_BUTTON_ID = process.env.NEXT_PUBLIC_PAYPAL_DONATE_BUTTON_ID ?? "";
const PAYPAL_ME = process.env.NEXT_PUBLIC_PAYPAL_ME ?? "";
const PAYPAL_READY = Boolean(PAYPAL_BUTTON_ID || PAYPAL_ME);

/* Only the causes that map to a programme the club actually runs. The
   remaining values in the DonationCause union (civic-education,
   infrastructure) belong to the template this site started from and are
   deliberately not offered. */
const CAUSES: { value: DonationCause; label: string; desc: string; color: string }[] = [
  {
    value: "general",
    label: "Where it is needed most",
    desc: "The club decides, which usually means turkeys in November, coats in January, and whatever the year throws at us.",
    color: EKO.green,
  },
  {
    value: "education",
    label: "Scholarships and school supplies",
    desc: "Two high school and three college scholarships a year, plus backpacks and uniforms each August.",
    color: EKO.blue,
  },
  {
    value: "healthcare",
    label: "Medical Mission and health education",
    desc: "The biennial medical mission, and the webinar series that runs with physicians through the year.",
    color: EKO.red,
  },
  {
    value: "environmental",
    label: "Adopt-a-Highway",
    desc: "Bags, vests, pickers and the upkeep of our two adopted miles of Big Oak Road.",
    color: EKO.green,
  },
  {
    value: "youth-empowerment",
    label: "Young people",
    desc: "Mentoring, school outreach and the award nights that put our students on a stage.",
    color: EKO.yellow,
  },
];

type Step = "form" | "success";

const formatUSD = (n: number) => `$${n.toLocaleString("en-US")}`;

function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-28 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

/* Module scope on purpose: reading the clock is a side effect, and doing it
   inside the component body is what the purity lint rule objects to. */
function nextChargeFrom(type: DonationType) {
  if (type === "one-time") return undefined;
  const days = type === "monthly" ? 30 : 365;
  return new Date(Date.now() + days * 86400000).toISOString();
}

function paypalUrlFor(amount: number, causeLabel: string) {
  if (PAYPAL_BUTTON_ID) {
    const params = new URLSearchParams({
      hosted_button_id: PAYPAL_BUTTON_ID,
      currency_code: "USD",
      amount: String(amount),
      item_name: `Eko Club Philadelphia: ${causeLabel}`,
    });
    return `https://www.paypal.com/donate/?${params.toString()}`;
  }
  if (PAYPAL_ME) return `https://paypal.me/${PAYPAL_ME}/${amount}USD`;
  return null;
}

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
  const [step, setStep] = useState<Step>("form");
  const [donationRef, setDonationRef] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const amount = presetAmount ?? parseInt(customAmount.replace(/\D/g, "") || "0", 10);
  const isRecurring = donationType !== "one-time";
  const causeLabel = CAUSES.find((c) => c.value === cause)?.label ?? "General fund";

  function validate() {
    const e: Record<string, string> = {};
    if (amount < 5) e.amount = "The smallest gift we can take is $5.";
    if (!isAnonymous) {
      if (!name.trim()) e.name = "Please give us a name for the receipt.";
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "We need a valid email to send the receipt to.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    /* Open PayPal synchronously inside the click, before any await, or the
       popup blocker swallows the tab. */
    const url = paypalUrlFor(amount, causeLabel);
    if (url) window.open(url, "_blank", "noopener,noreferrer");

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
          nextChargeDate: nextChargeFrom(donationType),
        }),
      )
        .then((donation) => setDonationRef(donation.referenceNumber))
        .catch(() => {});
    } catch {
      /* best effort: the pledge record must never block the confirmation */
    }
  }

  function handleReset() {
    setStep("form");
    setPresetAmount(50);
    setCustomAmount("");
    setMessage("");
    setDonationRef("");
    setErrors({});
  }

  const field = (bad: boolean) =>
    cn(
      "w-full rounded-2xl border px-4 py-3 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2",
      bad ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-neutral-300 bg-white focus:ring-green-200",
    );

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after }) => {
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    gsap.set(formRef.current, { y: 24 });
    const body = timeline();
    body.tl.to(formRef.current, { opacity: 1, y: 0, duration: 0.7, ease: EASE });
    after([entered(formRef.current)], () => body.tl.play());
  });

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/projects/thanksgiving/handing-out.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0.88) 100%)" }}
          />
        </div>

        {QUAD.map((color, i) => (
          <motion.div
            key={color}
            className="pointer-events-none absolute rounded-full blur-3xl"
            style={{ background: color, opacity: 0.16, width: 260, height: 260, left: `${8 + i * 20}%`, top: i % 2 === 0 ? "10%" : "52%" }}
            animate={{ y: [0, -24, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.45 }}
          />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div ref={heroTextRef} data-reveal style={HIDDEN}>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                  {QUAD.map((color) => (
                    <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                  ))}
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">Support the club</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  Twenty five dollars is a <span style={{ color: EKO.yellow }}>turkey</span> on someone&apos;s table.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  Every gift funds the programs our members run with their own hands, across the United States and in
                  Lagos, Nigeria. Scholarships, roadside cleanups, school supplies, Thanksgiving turkeys, winter coats
                  and the medical mission.
                </p>
              </div>
              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#give"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Make a gift
                </Link>
                <Link
                  href="/projects"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  See where it goes
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-white">What a gift buys</p>
              <dl className="mt-5 space-y-3">
                {[
                  { amount: "$25", what: "A Thanksgiving turkey for a family", color: EKO.yellow },
                  { amount: "$50", what: "A backpack of school supplies", color: EKO.blue },
                  { amount: "$250", what: "A stretch of the highway kept clear for a season", color: EKO.green },
                  { amount: "$1,000", what: "A meaningful share of one student's scholarship", color: EKO.red },
                ].map((row) => (
                  <div key={row.amount} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <dt className="text-2xl font-normal tracking-[-0.03em]" style={{ color: row.color }}>
                      {row.amount}
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-white">{row.what}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      {/* ─── Give ─── */}
      <section id="give" className="scroll-mt-28 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div ref={formRef} data-reveal className="mx-auto max-w-3xl" style={HIDDEN}>
          {step === "success" ? (
            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-8 text-center sm:p-12">
              <QuadBar className="mx-auto" />
              <h2 className="mt-6 text-3xl font-normal tracking-[-0.03em] text-neutral-950">Thank you</h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-8 text-neutral-700">
                {PAYPAL_READY ? (
                  <>
                    PayPal is open in another tab to finish your {formatUSD(amount)}
                    {isRecurring ? ` ${donationType}` : ""} gift to {causeLabel.toLowerCase()}.
                  </>
                ) : (
                  <>
                    We have your {formatUSD(amount)}
                    {isRecurring ? ` ${donationType}` : ""} pledge to {causeLabel.toLowerCase()}. The treasurer will
                    email you a payment link shortly.
                  </>
                )}
              </p>

              {donationRef && (
                <div className="mx-auto mt-6 inline-block rounded-2xl border border-green-200 bg-green-50 px-6 py-4">
                  <p className="text-[11px] font-normal uppercase tracking-[0.16em] text-green-700">Your reference</p>
                  <p className="mt-1 text-xl font-normal tracking-[-0.02em] text-green-900">{donationRef}</p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center rounded-full px-7 py-3 text-sm font-normal text-white"
                  style={{ background: EKO.green }}
                >
                  Give again
                </button>
                <Link
                  href="/projects"
                  className="inline-flex items-center rounded-full border border-neutral-300 px-7 py-3 text-sm font-normal text-neutral-800 transition-colors hover:border-neutral-400"
                >
                  See the work
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleDonate} className="space-y-5">
              <div>
                <QuadBar />
                <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
                  Make a gift
                </span>
                <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl">
                  Give once, or every month
                </h2>
                <p className="mt-4 text-base leading-8 text-neutral-700">
                  All amounts are in US dollars. Choose what your gift should pay for, and we will tell you what it
                  did.
                </p>
              </div>

              {/* Type */}
              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6">
                <h3 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">How often</h3>
                <div className="mt-4 flex rounded-full border border-neutral-200 p-1">
                  {(["one-time", "monthly", "annual"] as DonationType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDonationType(t)}
                      aria-pressed={donationType === t}
                      className={cn(
                        "flex-1 rounded-full px-4 py-2.5 text-sm font-normal transition-colors",
                        donationType === t ? "text-white" : "text-neutral-600 hover:text-neutral-950",
                      )}
                      style={donationType === t ? { background: EKO.green } : undefined}
                    >
                      {t === "one-time" ? "Once" : t === "monthly" ? "Monthly" : "Yearly"}
                    </button>
                  ))}
                </div>
                {isRecurring && (
                  <p className="mt-3 text-sm leading-6 text-neutral-600">
                    A {donationType} gift you can stop at any time from your member portal or from PayPal.
                  </p>
                )}
              </div>

              {/* Amount */}
              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6">
                <h3 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">How much</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {PRESET_AMOUNTS.map((a) => {
                    const on = presetAmount === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setPresetAmount(a);
                          setCustomAmount("");
                        }}
                        aria-pressed={on}
                        className="rounded-full border px-4 py-3 text-sm font-normal transition-colors"
                        style={{
                          borderColor: on ? EKO.green : "#e5e5e5",
                          background: on ? `${EKO.green}14` : "#ffffff",
                          color: on ? "#0a0a0a" : "#525252",
                        }}
                      >
                        {formatUSD(a)}
                      </button>
                    );
                  })}
                </div>
                <div className="relative mt-3">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
                  <label htmlFor="donate-amount" className="sr-only">
                    Another amount in US dollars
                  </label>
                  <input
                    id="donate-amount"
                    type="number"
                    min={5}
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setPresetAmount(null);
                    }}
                    placeholder="Another amount"
                    className={cn(field(!!errors.amount), "pl-8")}
                  />
                </div>
                {errors.amount && <p className="mt-1.5 text-xs text-red-600">{errors.amount}</p>}
              </div>

              {/* Cause */}
              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6">
                <h3 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">What it pays for</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {CAUSES.map((c) => {
                    const on = cause === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCause(c.value)}
                        aria-pressed={on}
                        className={cn(
                          "relative rounded-2xl border p-5 text-left transition-all duration-200",
                          "hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.10)]",
                          on ? "shadow-[0_12px_30px_rgba(15,23,42,0.08)]" : "border-neutral-200 bg-white",
                        )}
                        style={on ? { borderColor: c.color, background: `${c.color}0d` } : undefined}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="block h-1.5 w-10 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                          <span
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-opacity",
                              on ? "opacity-100" : "opacity-0",
                            )}
                            style={{ background: c.color }}
                            aria-hidden="true"
                          >
                            <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                            </svg>
                          </span>
                        </span>
                        <span className="mt-4 block text-base font-normal leading-snug text-neutral-950">{c.label}</span>
                        <span className="mt-2 block text-xs leading-6 text-neutral-600">{c.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Donor */}
              <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">Your details</h3>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-normal text-neutral-600">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 accent-[#059669]"
                    />
                    Give anonymously
                  </label>
                </div>

                {!isAnonymous && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="donate-name" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                        Full name
                      </label>
                      <input
                        id="donate-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className={field(!!errors.name)}
                      />
                      {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                    </div>
                    <div>
                      <label htmlFor="donate-email" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                        Email
                      </label>
                      <input
                        id="donate-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@email.com"
                        className={field(!!errors.email)}
                      />
                      {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="donate-phone" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                        Phone <span className="text-neutral-400">(optional)</span>
                      </label>
                      <input
                        id="donate-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (215) 000 0000"
                        className={field(false)}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <label htmlFor="donate-message" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                    Message <span className="text-neutral-400">(optional)</span>
                  </label>
                  <textarea
                    id="donate-message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="A note, or a dedication"
                    className={cn(field(false), "resize-none leading-7")}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-full py-4 text-base font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}44` }}
              >
                {PAYPAL_READY
                  ? amount >= 5
                    ? `Continue to PayPal · ${formatUSD(amount)}${isRecurring ? ` ${donationType}` : ""}`
                    : "Continue to PayPal"
                  : amount >= 5
                    ? `Pledge ${formatUSD(amount)}${isRecurring ? ` ${donationType}` : ""}`
                    : "Pledge a gift"}
              </button>

              <p className="text-center text-xs leading-6 text-neutral-500">
                {PAYPAL_READY
                  ? "Payment is taken by PayPal. We never see your card details."
                  : "Card payments are being connected. Pledge now and the treasurer will send you a secure payment link."}
              </p>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
