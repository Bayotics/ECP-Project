"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

/* ─── Social icons ──────────────────────────────────── */
const SOCIAL_LINKS = [
  {
    label: "X (Twitter)",
    href: "https://twitter.com/ekoclubphilly",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com/ekoclubphiladelphia",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com/ekoclubphilly",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/company/ekoclubphiladelphia",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com/@ekoclubphilly",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
] as const;

/* ─── Footer link groups ────────────────────────────── */
const QUICK_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/programs", label: "Programs" },
  { href: "/projects", label: "Our Projects" },
  { href: "/events", label: "Events & Programmes" },
  { href: "/donate", label: "Donate" },
  { href: "/apply", label: "Apply Now" },
];

const COMMUNITY_LINKS = [
  { href: "/members", label: "Our Members" },
  { href: "/forums", label: "Community Forums" },
  { href: "/blog", label: "Blog & News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/impact", label: "Impact Reports" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/accessibility", label: "Accessibility" },
];

/* ─── Newsletter form ───────────────────────────────── */
const STORAGE_KEY = "ecp_newsletter_email";

function NewsletterForm() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "duplicate">("idle");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), source: "footer" }),
      });
      if (res.status === 409) {
        setStatus("duplicate");
      } else if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-widest text-(--color-neutral-300) mb-3">
        Newsletter
      </h3>
      <p className="text-sm text-(--color-neutral-400) leading-relaxed mb-3">
        Cultural events, news, and Lagos development updates — straight to
        your inbox.
      </p>

      {status === "success" ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl bg-(--color-green-900) border border-(--color-green-700) px-4 py-3"
        >
          <span className="text-(--color-green-400)" aria-hidden="true">✓</span>
          <span className="text-sm text-(--color-green-300) font-medium">
            You&apos;re subscribed — thank you!
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate aria-label="Newsletter signup form">
          <div className="flex gap-2">
            <div className="flex-1">
              <label htmlFor={inputId} className="sr-only">
                Email address
              </label>
              <input
                id={inputId}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error" || status === "duplicate") setStatus("idle");
                }}
                placeholder="your@email.com"
                autoComplete="email"
                required
                aria-describedby={
                  status === "error"
                    ? `${inputId}-error`
                    : status === "duplicate"
                    ? `${inputId}-dup`
                    : undefined
                }
                aria-invalid={status === "error" || status === "duplicate"}
                className={cn(
                  "w-full rounded-lg bg-(--color-neutral-800) border px-3 py-2.5 text-sm text-white placeholder-(--color-neutral-500) outline-none transition",
                  "focus:ring-2 focus:ring-(--color-green-500) focus:border-(--color-green-500)",
                  status === "error" || status === "duplicate"
                    ? "border-red-500"
                    : "border-(--color-neutral-700)"
                )}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all",
                "bg-(--color-green-500) hover:bg-(--color-green-600) disabled:opacity-60 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
              )}
            >
              {loading ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-label="Loading">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                "Subscribe"
              )}
            </button>
          </div>

          {status === "error" && (
            <p id={`${inputId}-error`} role="alert" className="mt-1.5 text-xs text-red-400">
              Please enter a valid email address.
            </p>
          )}
          {status === "duplicate" && (
            <p id={`${inputId}-dup`} role="alert" className="mt-1.5 text-xs text-(--color-gold-400)">
              This email is already subscribed.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

/* ─── FooterLink ────────────────────────────────────── */
function FooterLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname === href;
  return (
    <li>
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "text-sm leading-relaxed transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--color-green-500) rounded",
          isActive
            ? "text-(--color-green-400) font-medium"
            : "text-(--color-neutral-400) hover:text-white"
        )}
      >
        {label}
      </Link>
    </li>
  );
}

/* ─── Footer ────────────────────────────────────────── */
export default function Footer() {
  return (
    <footer
      style={{ background: "var(--color-green-950, #021503)" }}
      className="text-white"
    >
      {/* ── Donate banner ─────────────────────────── */}
      <div
        className="border-b border-white/10"
        style={{ background: "var(--color-green-900)" }}
      >
        <div className="container-app py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-(--color-green-100) text-center sm:text-left">
            <span className="font-bold text-white">Support our community.</span>{" "}
            Your donation helps us serve our members and advance Lagos State.
          </p>
          <Link
            href="/donate"
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold",
              "bg-(--color-gold-500) hover:bg-(--color-gold-400) text-white transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-gold-300) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-green-900)"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Donate Now
          </Link>
        </div>
      </div>

      {/* ── Main footer grid ──────────────────────── */}
      <div className="container-app py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Logo */}
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400) rounded-lg"
              aria-label="Eko Club Philadelphia homepage"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-(--color-green-700) font-bold text-xs ring-2 ring-white/20 group-hover:ring-white/40 transition">
                ECP
              </span>
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-white text-base">Eko Club Philadelphia</span>
                <span className="text-xs text-(--color-green-400)">Eko Club International</span>
              </span>
            </Link>

            {/* Mission */}
            <p className="text-sm text-(--color-neutral-400) leading-relaxed max-w-xs">
              We bring together Lagosians in the Philadelphia diaspora through
              cultural celebrations, social welfare projects, and community
              activities that keep the Eko spirit alive.
            </p>

            {/* Contact info */}
            <address className="not-italic space-y-2">
              <a
                href="tel:+2348001234567"
                className="flex items-center gap-2 text-sm text-(--color-neutral-400) hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--color-green-500) rounded"
                aria-label="Call us at +1 (215) 000 1234"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-(--color-green-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                +1 (215) 000 1234
              </a>
              <a
                href="mailto:info@ekoclubphiladelphia.org"
                className="flex items-center gap-2 text-sm text-(--color-neutral-400) hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--color-green-500) rounded"
                aria-label="Email us at info@ekoclubphiladelphia.org"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 text-(--color-green-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                info@ekoclubphiladelphia.org
              </a>
              <p className="flex items-start gap-2 text-sm text-(--color-neutral-400)">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0 mt-0.5 text-(--color-green-500)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Philadelphia, PA,<br />United States</span>
              </p>
            </address>

            {/* Social links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-(--color-neutral-500) mb-3">
                Follow us
              </p>
              <div className="flex items-center gap-2" role="list" aria-label="Social media links">
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="listitem"
                    aria-label={label}
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      "text-(--color-neutral-400) bg-(--color-neutral-800) hover:text-white hover:bg-(--color-green-700)",
                      "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
                    )}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--color-neutral-300) mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-(--color-neutral-300) mb-4">
              Community
            </h3>
            <ul className="space-y-2.5">
              {COMMUNITY_LINKS.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="sm:col-span-2 lg:col-span-1">
            <NewsletterForm />
          </div>
        </div>

        {/* ── Secondary donate CTA ──────────────────── */}
        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Eko Club Philadelphia ·
            A chapter of Eko Club International
          </p>
          <Link
            href="/donate"
            className="text-xs font-semibold text-[#059669] hover:underline"
          >
            Support our programs →
          </Link>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="container-app py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <p className="text-xs text-(--color-neutral-500) text-center sm:text-left">
            &copy; {new Date().getFullYear()} Eko Club Philadelphia. All rights reserved.{" "}
            <span aria-hidden="true">·</span> Made with{" "}
            <span className="text-(--color-green-500)" aria-label="love">♥</span>{" "}
            in Philadelphia, PA.
          </p>

          {/* Legal links */}
          <nav aria-label="Legal links" className="flex items-center gap-4 flex-wrap justify-center">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-xs text-(--color-neutral-500) hover:text-white transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--color-green-500) rounded"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
