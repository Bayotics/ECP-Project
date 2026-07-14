"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { useCart } from "@/context/CartContext";

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
function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="group flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400) rounded-lg"
      aria-label="ECP — Go to homepage"
    >
      {/* Logomark */}
      <span
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-green-500) text-white font-extrabold text-xs tracking-tight ring-2 ring-transparent group-hover:ring-(--color-green-300) transition-all"
        aria-hidden="true"
      >
        ECP
      </span>
      {/* Wordmark */}
      <span className="flex flex-col leading-tight">
        <span className="font-extrabold text-sm text-green-600 group-hover:text-(--color-green-400) transition-colors">
          Eko Club Philadelphia
        </span>
        {/* <span className="hidden text-xs text-(--color-neutral-400) font-normal sm:block">
          Eko Club International
        </span> */}
      </span>
    </Link>
  );
}

/* ─── NavLink ───────────────────────────────────────── */
function NavLink({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative px-1 py-0.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400) rounded",
        "after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-(--color-green-500) after:transition-all after:duration-200",
        isActive
          ? "text-(--color-green-600) after:w-full"
          : "text-(--color-neutral-600) hover:text-(--color-green-600) after:w-0 hover:after:w-full"
      )}
    >
      {label}
    </Link>
  );
}

/* ─── Header ────────────────────────────────────────── */
export default function Header() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  /* Shadow on scroll */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close menu on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  /* Close menu on outside click */
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

  /* Trap focus & Escape key within mobile menu */
  const handleMenuKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
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
    },
    []
  );

  /* Lock body scroll while menu is open */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* ── Main header bar ─────────────────────────── */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full border-b border-(--color-neutral-200) bg-white/95 backdrop-blur-md transition-shadow duration-200",
          scrolled && "shadow-md"
        )}
      >
        <div className="container-app flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Logo />

          {/* Desktop nav */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink
                key={href}
                href={href}
                label={label}
                isActive={
                  href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(href)
                }
              />
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Cart */}
            <Link
              href="/store/cart"
              aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                "text-(--color-neutral-600) hover:bg-(--color-neutral-100)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-(--color-green-600) text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            {/* Login */}
            <Link
              href="/auth/login"
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                "text-(--color-neutral-700) hover:text-(--color-green-600) hover:bg-(--color-green-50)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Login
            </Link>

            {/* Donate */}
            <Link
              href="/donate"
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                "border border-(--color-gold-500) text-(--color-gold-600) hover:bg-(--color-gold-50)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-gold-400)"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Donate
            </Link>

            {/* Apply */}
            <Link
              href="/membership/apply"
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all",
                "bg-(--color-green-500) hover:bg-(--color-green-600)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400) focus-visible:ring-offset-1"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Membership
            </Link>
          </div>

          {/* Mobile right-side actions */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Cart (icon only, mobile) */}
            <Link
              href="/store/cart"
              aria-label={`Cart${itemCount > 0 ? ` (${itemCount} items)` : ""}`}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                "text-(--color-neutral-600) hover:bg-(--color-neutral-100)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-(--color-green-600) text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
            {/* Donate (icon only, mobile) */}
            <Link
              href="/donate"
              aria-label="Donate"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg border border-(--color-gold-400) text-(--color-gold-600)",
                "hover:bg-(--color-gold-50) transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-gold-400)"
              )}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Hamburger */}
            <button
              ref={hamburgerRef}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                "text-(--color-neutral-700) hover:bg-(--color-neutral-100)",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
              )}
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              {/* Animated icon */}
              <svg
                className="h-5 w-5 overflow-visible"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line
                  x1="3" y1="6" x2="21" y2="6"
                  className={cn("transition-all origin-center duration-200", menuOpen ? "translate-y-[6px] rotate-45" : "")}
                  style={{ transformBox: "fill-box" }}
                />
                <line
                  x1="3" y1="12" x2="21" y2="12"
                  className={cn("transition-all duration-150", menuOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100")}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                />
                <line
                  x1="3" y1="18" x2="21" y2="18"
                  className={cn("transition-all origin-center duration-200", menuOpen ? "-translate-y-[6px] -rotate-45" : "")}
                  style={{ transformBox: "fill-box" }}
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu drawer ──────────────────────── */}
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setMenuOpen(false)}
        className={cn(
          "fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Drawer panel */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-label="Mobile navigation menu"
        aria-modal="true"
        onKeyDown={handleMenuKeyDown}
        className={cn(
          "fixed top-16 inset-x-0 z-40 lg:hidden",
          "border-b border-(--color-neutral-200) bg-white shadow-xl",
          "transition-all duration-300 ease-in-out",
          menuOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-4 pointer-events-none"
        )}
      >
        <nav
          aria-label="Mobile navigation"
          className="container-app py-4 flex flex-col gap-1"
        >
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400) focus-visible:ring-inset",
                  isActive
                    ? "bg-(--color-green-50) text-(--color-green-700) font-semibold"
                    : "text-(--color-neutral-700) hover:bg-(--color-neutral-100) hover:text-(--color-green-600)"
                )}
              >
                {isActive && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-(--color-green-500) flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile CTA buttons */}
        <div className="container-app pb-5 pt-1 flex flex-col gap-2 border-t border-(--color-neutral-100)">
          <Link
            href="/auth/login"
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
              "text-(--color-neutral-700) border border-(--color-neutral-200) hover:bg-(--color-neutral-50)",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Login to your account
          </Link>

          <Link
            href="/donate"
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold",
              "text-(--color-gold-700) border border-(--color-gold-400) hover:bg-(--color-gold-50)",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-gold-400)"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            ♥ Donate to ECP
          </Link>

          <Link
            href="/membership/apply"
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white",
              "bg-(--color-green-500) hover:bg-(--color-green-600)",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Apply Now — It&apos;s Free
          </Link>
        </div>
      </div>
    </>
  );
}
