"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

/* ─── Navigation definition ────────────────────────── */
const PRIMARY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
] as const;

const GET_INVOLVED_LINKS = [
  { href: "/programs", label: "Programs", desc: "Recurring initiatives that serve Philadelphia year-round" },
  { href: "/projects", label: "Projects", desc: "Completed and ongoing community projects" },
  { href: "/events", label: "Events", desc: "Galas, meetups, and volunteer days on the calendar" },
] as const;

const TRAILING_LINKS = [
  { href: "/news", label: "News" },
  { href: "/gallery", label: "Gallery" },
  { href: "/store", label: "Store" },
] as const;

/* Scroll distance past which the header compacts and the logo/login/donate
   fade out — restored once the user scrolls back above this point. */
const SCROLL_THRESHOLD = 60;

function isLinkActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/* ─── Logo ──────────────────────────────────────────── */
function Logo({ dark, onClick }: { dark: boolean; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="group inline-flex shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]/50"
      aria-label="Eko Club Philadelphia — Go to homepage"
    >
      <Image
        src="/new-logo.png"
        alt="Eko Club Philadelphia"
        width={300}
        height={300}
        quality={100}
        priority
        className={cn(
          "h-16 w-16 shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20 lg:h-[150px] lg:w-[150px]",
          dark && "drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)]"
        )}
      />
    </Link>
  );
}

/* ─── NavLink — text flips white/dark with the pill's own glass state ── */
function NavLink({
  href,
  label,
  isActive,
  showGlass,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  showGlass: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]",
        isActive
          ? "text-[#059669]"
          : showGlass
          ? "text-neutral-800 hover:text-[#059669]"
          : "text-white hover:text-white/80"
      )}
    >
      {label}
    </Link>
  );
}

/* ─── "Get Involved" dropdown — Programs / Projects / Events ────────── */
function GetInvolvedMenu({ pathname, showGlass }: { pathname: string; showGlass: boolean }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = GET_INVOLVED_LINKS.some((l) => pathname.startsWith(l.href));

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }
  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  return (
    <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669]",
          isActive
            ? "text-[#059669]"
            : showGlass
            ? "text-neutral-800 hover:text-[#059669]"
            : "text-white hover:text-white/80"
        )}
      >
        Get Involved
        <svg
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-1/2 top-full z-10 mt-3 w-[92vw] max-w-[560px] -translate-x-1/2 rounded-2xl border border-black/5 bg-white p-6 shadow-xl sm:w-[520px]"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
              {GET_INVOLVED_LINKS.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="group/item block">
                  <p className="text-sm font-semibold text-neutral-900 transition-colors group-hover/item:text-[#059669]">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-neutral-500">{item.desc}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  const [mobileInvolvedOpen, setMobileInvolvedOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const isHome = pathname === "/";
  /* Background: transparent only at the very top of the homepage hero;
     a frosted glass surface everywhere else (never plain transparent once
     scrolled, and always glass on interior pages since they don't all have
     a dark hero to sit on top of). */
  const showGlass = !isHome || scrolled;
  /* Logo + Login + Donate declutter while scrolled, and return once the
     user is back at the top of the page. */
  const showExtras = !scrolled;

  useEffect(() => {
    // Polled via rAF rather than solely the native `scroll` event: Lenis
    // (site-wide smooth scrolling) drives the scroll position itself, and
    // polling the resolved position every frame is the most robust way to
    // stay in sync with it regardless of how/when it dispatches events.
    let raf = 0;
    function tick() {
      setScrolled((prev) => {
        const next = window.scrollY > SCROLL_THRESHOLD;
        return next === prev ? prev : next;
      });
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

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
      {/* ── Fixed masthead — the bar itself is ALWAYS transparent; only the
             nav pill inside it (and the buttons) carry their own backgrounds */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 bg-transparent transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          showExtras ? "h-24 sm:h-28 lg:h-[168px]" : "h-16 sm:h-[68px] lg:h-[76px]"
        )}
      >
        <div className="container-app relative flex h-full items-center justify-between gap-4">
          {/* Logo — hides while scrolled */}
          <div
            className={cn(
              "transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]",
              showExtras ? "opacity-100 translate-x-0" : "pointer-events-none -translate-x-3 opacity-0"
            )}
          >
            <Logo dark={!showGlass} />
          </div>

          {/* Desktop nav pill — transparent at the top of the homepage hero,
              glassmorphism everywhere else (scrolled, or any interior page) */}
          <nav
            aria-label="Primary navigation"
            className={cn(
              "hidden items-center gap-1 rounded-full px-2 py-1.5 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex",
              showGlass
                ? "border border-black/5 bg-white/75 shadow-sm backdrop-blur-xl"
                : "border border-transparent bg-transparent"
            )}
          >
            {PRIMARY_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} isActive={isLinkActive(pathname, href)} showGlass={showGlass} />
            ))}
            <GetInvolvedMenu pathname={pathname} showGlass={showGlass} />
            {TRAILING_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} isActive={isLinkActive(pathname, href)} showGlass={showGlass} />
            ))}
          </nav>

          {/* Desktop actions — hide while scrolled */}
          <div
            className={cn(
              "hidden items-center gap-3 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex",
              showExtras ? "opacity-100 translate-x-0" : "pointer-events-none translate-x-3 opacity-0"
            )}
          >
            <Link
              href="/auth/login"
              className={cn(
                "text-sm font-medium transition-colors duration-300",
                showGlass ? "text-neutral-700 hover:text-[#059669]" : "text-white/85 hover:text-white"
              )}
            >
              Login
            </Link>
            <DonatePill />
          </div>

          {/* Mobile actions — always reachable (hamburger must never hide) */}
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
                showGlass ? "text-neutral-800 hover:bg-black/5" : "text-white hover:bg-white/10",
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

      {/* Spacer: reserve the header's resting (logo-visible) height on pages
          without a full-bleed hero to sit behind. The homepage hero sits
          behind the transparent header, so no spacer there. */}
      {!isHome && <div aria-hidden="true" className="h-24 sm:h-28 lg:h-[168px]" />}

      {/* ── Mobile off-canvas drawer ──────────────── */}
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
                <Logo dark={false} onClick={() => setMenuOpen(false)} />
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
                {PRIMARY_LINKS.map(({ href, label }) => {
                  const isActive = isLinkActive(pathname, href);
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

                {/* Get Involved accordion */}
                <div className="border-b border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setMobileInvolvedOpen((o) => !o)}
                    aria-expanded={mobileInvolvedOpen}
                    className={cn(
                      "flex w-full items-center justify-between py-5 text-lg font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-inset",
                      GET_INVOLVED_LINKS.some((l) => pathname.startsWith(l.href)) ? "text-[#059669]" : "text-neutral-800"
                    )}
                  >
                    Get Involved
                    <svg className={cn("h-4 w-4 transition-transform duration-200", mobileInvolvedOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {mobileInvolvedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col gap-4 pb-5 pl-4">
                          {GET_INVOLVED_LINKS.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMenuOpen(false)}
                              className="text-base font-medium text-neutral-700 hover:text-[#059669]"
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {TRAILING_LINKS.map(({ href, label }) => {
                  const isActive = isLinkActive(pathname, href);
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
