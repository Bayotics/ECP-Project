"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/utils/cn";

/* ─── Navigation definition ────────────────────────── */
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/projects", label: "Projects" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/store", label: "Store" },
  { href: "/contact", label: "Contact" },
] as const;

/* ─── Logo ──────────────────────────────────────────── */
function Logo({
  onClick,
  solid,
}: {
  onClick?: () => void;
  solid: boolean;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]/50"
      aria-label="ECP — Go to homepage"
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#059669] text-white font-bold text-xs tracking-tight ring-2 ring-transparent transition-all group-hover:ring-[#059669]/40"
        aria-hidden="true"
      >
        ECP
      </span>
      <span
        className={cn(
          "font-bold text-sm leading-tight transition-colors duration-300",
          solid
            ? "text-[#059669] group-hover:text-[#047857]"
            : "text-white group-hover:text-white/80"
        )}
      >
        Eko Club Philadelphia
      </span>
    </Link>
  );
}

/* ─── NavLink — center-growing 1px underline ─────────── */
function NavLink({
  href,
  label,
  isActive,
  solid,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  solid: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative px-0.5 py-1 text-sm font-medium transition-colors duration-300",
        "after:absolute after:bottom-[-2px] after:left-1/2 after:h-px after:w-0 after:bg-[#059669]",
        "after:transition-all after:duration-300 hover:after:left-0 hover:after:w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] rounded",
        isActive
          ? "text-[#059669] after:left-0 after:w-full"
          : solid
          ? "text-neutral-800 hover:text-[#059669]"
          : "text-white/85 hover:text-white after:bg-white"
      )}
    >
      {label}
    </Link>
  );
}

/* ─── Donate pill ───────────────────────────────────── */
function DonatePill({
  onClick,
  fullWidth = false,
}: {
  onClick?: () => void;
  fullWidth?: boolean;
}) {
  return (
    <Link href="/donate" onClick={onClick} className={fullWidth ? "w-full" : undefined}>
      <motion.span
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-full bg-[#059669] px-5 py-2 text-sm font-semibold text-white",
          fullWidth && "w-full py-3"
        )}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        Donate
      </motion.span>
    </Link>
  );
}

/* ─── Header ────────────────────────────────────────── */
export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  /* Solid state: any page that isn't the transparent-hero homepage, OR scrolled */
  const isHome = pathname === "/";
  const solid = !isHome || scrolled;

  /* GSAP scroll-driven height + background + shadow.
     A ScrollTrigger toggles at 80px; onToggle animates to explicit target
     states in both directions (no reliance on GSAP's recorded from-values,
     which would otherwise send interior-page backgrounds back to transparent). */
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = headerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      /* Rest state depends on page: transparent over the homepage hero,
         solid white everywhere else. */
      gsap.set(el, {
        height: 72,
        backgroundColor: isHome ? "rgba(255,255,255,0)" : "#ffffff",
        boxShadow: isHome ? "none" : "0 1px 0 rgba(0,0,0,0.08)",
      });

      const trigger = ScrollTrigger.create({
        trigger: document.body,
        start: "80px top",
        end: "80px top",
        onToggle: (self) => {
          const compact = self.isActive;
          setScrolled(compact);
          gsap.to(el, {
            height: compact ? 52 : 72,
            backgroundColor: compact || !isHome ? "#ffffff" : "rgba(255,255,255,0)",
            boxShadow: compact || !isHome ? "0 1px 0 rgba(0,0,0,0.08)" : "none",
            duration: 0.4,
            ease: "power2.out",
          });
        },
      });

      return () => trigger.kill();
    });

    return () => ctx.revert();
  }, [isHome]);

  /* Close menu on route change */
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  /* Close drawer on outside click */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !hamburgerRef.current?.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  /* Focus trap + Escape */
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      setMenuOpen(false);
      hamburgerRef.current?.focus();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  /* Lock body scroll while drawer open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* ── Fixed masthead ─────────────────────────── */}
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 h-[72px] bg-transparent transition-none"
      >
        <div className="container-app flex h-full items-center justify-between gap-4">
          {/* Logo */}
          <Logo solid={solid} />

          {/* Desktop nav */}
          <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                solid={solid}
                isActive={href === "/" ? pathname === "/" : pathname.startsWith(href)}
              />
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/auth/login"
              className={cn(
                "text-sm font-medium transition-colors duration-300",
                solid ? "text-neutral-700 hover:text-[#059669]" : "text-white/85 hover:text-white"
              )}
            >
              Login
            </Link>
            <DonatePill />
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <DonatePill />
            <button
              ref={hamburgerRef}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-drawer"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                solid ? "text-neutral-800 hover:bg-neutral-100" : "text-white hover:bg-white/10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
              )}
            >
              <span className="relative block h-5 w-5" aria-hidden="true">
                <motion.span
                  className="absolute left-0 block h-0.5 w-5 rounded-full bg-current"
                  animate={menuOpen ? { top: 9, rotate: 45 } : { top: 4, rotate: 0 }}
                  transition={{ duration: 0.25 }}
                />
                <motion.span
                  className="absolute left-0 top-[9px] block h-0.5 w-5 rounded-full bg-current"
                  animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
                <motion.span
                  className="absolute left-0 block h-0.5 w-5 rounded-full bg-current"
                  animate={menuOpen ? { top: 9, rotate: -45 } : { top: 14, rotate: 0 }}
                  transition={{ duration: 0.25 }}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer: reserve header height on pages without a full-bleed hero.
          The homepage hero sits behind the transparent header, so no spacer there. */}
      {!isHome && <div aria-hidden="true" className="h-[72px]" />}

      {/* ── Mobile off-canvas drawer ────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              id="mobile-drawer"
              ref={menuRef}
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
              onKeyDown={handleMenuKeyDown}
              initial={{ x: 288, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 288, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-white p-6 lg:hidden"
            >
              {/* Drawer header */}
              <div className="mb-4 flex items-center justify-between">
                <Logo solid onClick={() => setMenuOpen(false)} />
                <button
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Links */}
              <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto">
                {NAV_LINKS.map(({ href, label }) => {
                  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "block border-b border-neutral-100 py-5 text-lg font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-inset",
                        isActive ? "text-[#059669]" : "text-neutral-800 hover:text-[#059669]"
                      )}
                    >
                      {label}
                    </Link>
                  );
                })}
                <Link
                  href="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="block border-b border-neutral-100 py-5 text-lg font-medium text-neutral-800 transition-colors hover:text-[#059669] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-inset"
                >
                  Login
                </Link>
              </nav>

              {/* Donate at bottom */}
              <div className="pt-5">
                <DonatePill fullWidth onClick={() => setMenuOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
