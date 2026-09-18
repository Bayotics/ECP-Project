"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";
import { YOUTUBE_CHANNEL } from "@/lib/content/projects";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

/* Where the form is delivered. Formspree emails the club and, with a reply
   address attached, lets the club answer straight from the notification.
   The auto-acknowledgement to the sender is configured on the Formspree
   form itself, not here. */
const FORM_ENDPOINT = "https://formspree.io/f/xpwroval";

const SUBJECTS = [
  "Membership",
  "Events and programs",
  "Volunteering",
  "Donations and sponsorship",
  "Media and press",
  "Something else",
];

const CONTACTS = [
  {
    label: "President",
    value: "Hon. Olabisi Dabiri-Okoya",
    color: EKO.green,
  },
  {
    label: "Phone",
    value: "+1 (609) 638 3297",
    href: "tel:+16096383297",
    color: EKO.red,
  },
  {
    label: "Email",
    value: "info@ekoclubphiladelphia.org",
    href: "mailto:info@ekoclubphiladelphia.org",
    color: EKO.blue,
  },
  {
    label: "Chapter",
    value: "Philadelphia, Pennsylvania",
    color: EKO.yellow,
  },
];

const SOCIAL = [
  { label: "YouTube", href: YOUTUBE_CHANNEL },
  { label: "Facebook", href: "https://facebook.com/ekoclubphiladelphia" },
  { label: "Instagram", href: "https://instagram.com/ekoclubphilly" },
  { label: "X", href: "https://twitter.com/ekoclubphilly" },
];

type FormState = "idle" | "submitting" | "success" | "error";

function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-28 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please tell us your name.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "We need a valid email to reply to.";
    if (!subject) e.subject = "Pick the closest subject.";
    if (!message.trim() || message.trim().length < 10) e.message = "A sentence or two at least, please.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setFormState("submitting");
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          subject,
          message,
          _subject: `ECP website: ${subject}`,
          _replyto: email,
        }),
      });
      if (res.ok) {
        setFormState("success");
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
        setErrors({});
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
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
  const asideRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after }) => {
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    gsap.set(formRef.current, { x: -SHIFT });
    gsap.set(asideRef.current, { x: SHIFT });
    const body = timeline();
    body.tl
      .to(formRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(asideRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<");
    after([entered(formRef.current)], () => body.tl.play());
  });

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/projects/rmh/team-with-ronald.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
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
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">Get in touch</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  Say <span style={{ color: EKO.green }}>hello</span>. We
                  <span style={{ color: EKO.yellow }}> read everything</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  Questions about joining, an event you want to help with, a project you would like the club to take
                  on, or a sponsorship. Write to us and a member of the executive will come back to you.
                </p>
              </div>
              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#message"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Write to us
                </Link>
                <Link
                  href="/membership/apply"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Apply for membership
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-white">Reach us directly</p>
              <dl className="mt-5 space-y-3">
                {CONTACTS.map((c) => (
                  <div key={c.label} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                    <dt className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.16em] text-white/70">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.color }} aria-hidden="true" />
                      {c.label}
                    </dt>
                    <dd className="mt-2 text-sm text-white">
                      {c.href ? (
                        <a href={c.href} className="transition-colors hover:text-white/75">
                          {c.value}
                        </a>
                      ) : (
                        c.value
                      )}
                    </dd>
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

      {/* ─── Message ─── */}
      <section id="message" className="scroll-mt-28 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.35fr_0.65fr]">
          <div ref={formRef} data-reveal style={HIDDEN}>
            <QuadBar />
            <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
              Send a message
            </span>
            <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl">
              Tell us what you need
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-700">
              Everything here reaches the club inbox. We answer within one or two business days.
            </p>

            {formState === "success" ? (
              <div className="mt-8 rounded-[1.75rem] border border-neutral-200 bg-white p-8 text-center sm:p-12">
                <h3 className="text-2xl font-normal tracking-[-0.02em] text-neutral-950">Message sent</h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-neutral-700">
                  Thank you for writing. A member of the executive will reply to the email address you gave us within
                  one or two business days.
                </p>
                <button
                  onClick={() => setFormState("idle")}
                  className="mt-6 inline-flex items-center rounded-full px-7 py-3 text-sm font-normal text-white"
                  style={{ background: EKO.green }}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-[1.75rem] border border-neutral-200 bg-white p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                      Your name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className={field(!!errors.name)}
                    />
                    {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className={field(!!errors.email)}
                    />
                    {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                      Phone <span className="text-neutral-400">(optional)</span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (215) 000 0000"
                      className={field(false)}
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={field(!!errors.subject)}
                    >
                      <option value="">Choose a subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {errors.subject && <p className="mt-1.5 text-xs text-red-600">{errors.subject}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="contact-message" className="mb-1.5 block text-[11px] font-normal uppercase tracking-[0.14em] text-neutral-600">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={7}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="How can we help?"
                    className={cn(field(!!errors.message), "resize-none leading-7")}
                  />
                  {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message}</p>}
                </div>

                {formState === "error" && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                    The message did not go through. Please try again, or email us at info@ekoclubphiladelphia.org.
                  </p>
                )}

                {/* Honeypot: bots fill hidden fields, people never see this. */}
                <input type="text" name="_gotcha" className="hidden" tabIndex={-1} aria-hidden="true" />

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <button
                    type="submit"
                    disabled={formState === "submitting"}
                    className="inline-flex items-center rounded-full px-8 py-3.5 text-sm font-normal text-white transition-opacity disabled:opacity-60"
                    style={{ background: EKO.green }}
                  >
                    {formState === "submitting" ? "Sending…" : "Send the message"}
                  </button>
                  <p className="text-xs leading-6 text-neutral-500">We use your details only to reply to you.</p>
                </div>
              </form>
            )}
          </div>

          <div ref={asideRef} data-reveal className="space-y-5" style={HIDDEN}>
            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">Looking for something specific?</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {[
                  { label: "Join the club", href: "/membership/apply", note: "The full application and what it asks for" },
                  { label: "Check an application", href: "/membership/status", note: "Where your application has got to" },
                  { label: "Give to a program", href: "/donate", note: "One off or monthly, in US dollars" },
                  { label: "What we run each year", href: "/programs", note: "Nine programs and their sign up windows" },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="group block rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-neutral-400">
                      <span className="flex items-center justify-between gap-3 font-normal text-neutral-950">
                        {l.label}
                        <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                          →
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-neutral-600">{l.note}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6">
              <h3 className="text-lg font-normal tracking-[-0.02em] text-neutral-950">Follow the club</h3>
              <ul className="mt-4 space-y-2">
                {SOCIAL.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2 text-sm font-normal text-neutral-700 transition-colors hover:text-green-700"
                    >
                      {s.label}
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
