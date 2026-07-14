"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const SUBJECTS = [
  "General Inquiry",
  "Membership Questions",
  "Events & Programs",
  "Donations & Sponsorship",
  "Volunteer Opportunities",
  "Media / Press",
  "Other",
];

type FormState = "idle" | "submitting" | "success" | "error";

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
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = "Valid email is required.";
    if (!subject) e.subject = "Please select a subject.";
    if (!message.trim() || message.trim().length < 10) e.message = "Please enter at least 10 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setFormState("submitting");
    try {
      const res = await fetch("https://formspree.io/f/xpwroval", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      if (res.ok) {
        setFormState("success");
        setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("");
      } else {
        setFormState("error");
      }
    } catch {
      setFormState("error");
    }
  }

  const inputCls = (hasError: boolean) =>
    `w-full px-4 py-3 text-sm text-gray-700 rounded-xl border focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-400 bg-red-50 focus:ring-red-200"
        : "border-neutral-300 bg-white focus:ring-green-300 focus:border-green-500"
    }`;

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-800 to-green-600 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm font-bold uppercase tracking-widest opacity-75 mb-3">Get in Touch</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">Contact Eko Club Philadelphia</h1>
          <p className="text-white/80 text-lg max-w-xl mx-auto">
            We&apos;d love to hear from you. Reach out about membership, events, volunteering, or anything else — we respond to every message.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact details sidebar */}
        <aside className="space-y-6">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5">
            <h2 className="font-bold text-neutral-900 text-lg">Direct Contact</h2>

            <div className="flex items-start gap-3">
              <span className="text-2xl">👤</span>
              <div>
                <p className="text-sm font-semibold text-neutral-700">President</p>
                <p className="text-sm text-neutral-600">Olabisi Okoya</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📞</span>
              <div>
                <p className="text-sm font-semibold text-neutral-700">Phone</p>
                <a href="tel:+16096383297" className="text-sm text-green-700 hover:underline">+1 (609) 638-3297</a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">✉️</span>
              <div>
                <p className="text-sm font-semibold text-neutral-700">Email</p>
                <a href="mailto:info@ekoclubphiladelphia.org" className="text-sm text-green-700 hover:underline break-all">
                  info@ekoclubphiladelphia.org
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="text-sm font-semibold text-neutral-700">Chapter Location</p>
                <p className="text-sm text-neutral-600">Philadelphia, Pennsylvania, USA</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-200 p-6">
            <h2 className="font-bold text-neutral-900 text-lg mb-4">Follow Us</h2>
            <div className="space-y-2">
              {[
                { label: "Facebook", icon: "📘", href: "#" },
                { label: "Instagram", icon: "📸", href: "#" },
                { label: "YouTube", icon: "▶️", href: "#" },
                { label: "Twitter / X", icon: "🐦", href: "#" },
              ].map(s => (
                <a key={s.label} href={s.href}
                  className="flex items-center gap-2.5 text-sm text-neutral-600 hover:text-green-700 transition-colors">
                  <span>{s.icon}</span>{s.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Contact form */}
        <div className="lg:col-span-2">
          {formState === "success" ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200 rounded-2xl p-10 text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
              <h2 className="text-2xl font-extrabold text-neutral-900 mb-2">Message Sent!</h2>
              <p className="text-neutral-600 mb-6">
                Thank you for reaching out. We&apos;ll get back to you within 1–2 business days.
              </p>
              <button
                onClick={() => setFormState("idle")}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Send Another Message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-2xl p-8 space-y-5">
              <h2 className="font-bold text-neutral-900 text-xl mb-1">Send Us a Message</h2>
              <p className="text-sm text-neutral-500 mb-4">Fields marked * are required. We&apos;ll reply to your email within 1–2 business days.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your name" className={inputCls(!!errors.name)} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Email Address *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" className={inputCls(!!errors.email)} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Phone <span className="font-normal text-neutral-400 text-xs">(optional)</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (215) 000-0000" className={inputCls(false)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Subject *</label>
                  <select value={subject} onChange={e => setSubject(e.target.value)} className={inputCls(!!errors.subject)}>
                    <option value="">Select a subject…</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1">Message *</label>
                <textarea rows={6} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  className={`${inputCls(!!errors.message)} resize-none`} />
                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
              </div>

              {formState === "error" && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  Something went wrong. Please try again or email us directly.
                </div>
              )}

              {/* Honeypot */}
              <input type="text" name="_gotcha" className="hidden" tabIndex={-1} aria-hidden="true" />

              <button type="submit" disabled={formState === "submitting"}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-xl font-bold text-sm transition-colors">
                {formState === "submitting" ? "Sending…" : "Send Message →"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
