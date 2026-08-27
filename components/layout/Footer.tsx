"use client";

import { useEffect, useRef, useState, useId } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
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

  if (status === "success") {
    return (
      <div role="status" className="flex items-center gap-2 text-sm font-medium text-white">
        <span className="text-(--color-green-400)" aria-hidden="true">✓</span>
        You&apos;re subscribed — thank you!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Newsletter signup form" className="w-full max-w-md">
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
            placeholder="Your email address"
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
              "w-full rounded-full bg-white/10 border px-5 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors",
              "focus:ring-2 focus:ring-white/30 focus:border-white/30",
              status === "error" || status === "duplicate" ? "border-red-500" : "border-white/15"
            )}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "flex-shrink-0 rounded-full px-6 py-3 text-sm font-semibold text-[#0a0a0a] transition-colors",
            "bg-white hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
        <p id={`${inputId}-error`} role="alert" className="mt-2 text-xs text-red-400">
          Please enter a valid email address.
        </p>
      )}
      {status === "duplicate" && (
        <p id={`${inputId}-dup`} role="alert" className="mt-2 text-xs text-(--color-gold-400)">
          This email is already subscribed.
        </p>
      )}
    </form>
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
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded",
          isActive
            ? "text-(--color-green-400) font-medium"
            : "text-white/50 hover:text-white"
        )}
      >
        {label}
      </Link>
    </li>
  );
}

/* ─── Footer ────────────────────────────────────────── */
export default function Footer() {
  const year = new Date().getFullYear();
  const textRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current,
        { opacity: 0, x: -48 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: textRef.current, start: "top 90%", once: true } });
      gsap.fromTo(formRef.current,
        { opacity: 0, x: 48 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: formRef.current, start: "top 90%", once: true } });
    });
    return () => ctx.revert();
  }, []);

  return (
    <footer className="bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">

        {/* ── Newsletter invite ─────────────────────── */}
        <div className="flex flex-col gap-8 border-b border-white/10 py-16 lg:flex-row lg:items-end lg:justify-between">
          <div ref={textRef} className="max-w-lg">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Stay connected</p>
            <h2 className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl">
              Event updates and chapter news, straight to your inbox.
            </h2>
          </div>
          <div ref={formRef}>
            <NewsletterForm />
          </div>
        </div>

        {/* ── Brand + link columns ──────────────────── */}
        <div className="grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand column */}
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Eko Club Philadelphia homepage"
            >
              <Image
                src="/new-logo.png"
                alt="Eko Club Philadelphia"
                width={80}
                height={80}
                className="h-10 w-10 shrink-0"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-white text-base">Eko Club Philadelphia</span>
                <span className="text-xs text-white/40">Eko Club International</span>
              </span>
            </Link>

            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Bringing together Lagosians in the Philadelphia diaspora through
              cultural celebrations, social welfare projects, and community
              activities that keep the Eko spirit alive.
            </p>

            <div className="flex items-center gap-5" role="list" aria-label="Social media links">
              {SOCIAL_LINKS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                  aria-label={label}
                  className="text-white/40 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
              Community
            </h3>
            <ul className="space-y-3">
              {COMMUNITY_LINKS.map((link) => (
                <FooterLink key={link.href} {...link} />
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-white/40">
              Contact
            </h3>
            <address className="not-italic space-y-3 text-sm text-white/50">
              <a
                href="tel:+2348001234567"
                className="block hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
                aria-label="Call us at +1 (215) 000 1234"
              >
                +1 (215) 000 1234
              </a>
              <a
                href="mailto:info@ekoclubphiladelphia.org"
                className="block hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
                aria-label="Email us at info@ekoclubphiladelphia.org"
              >
                info@ekoclubphiladelphia.org
              </a>
              <p>Philadelphia, PA,<br />United States</p>
            </address>
          </div>
        </div>

        {/* ── Bottom bar ─────────────────────────────── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-8 sm:flex-row">
          <p className="text-xs text-white/30 text-center sm:text-left">
            &copy; {year} Eko Club Philadelphia. All rights reserved. A chapter of Eko Club International.
          </p>
          <nav aria-label="Legal links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "text-xs text-white/40 hover:text-white transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 rounded"
                )}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/donate"
              className="text-xs font-semibold text-(--color-green-400) hover:underline"
            >
              Donate →
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
