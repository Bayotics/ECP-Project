"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  isAdmin?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Navbar({ isAdmin = false }: NavbarProps) {
  const { currentUser, logout, isAdmin: userIsAdmin } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/auth/login");
  }

  const displayName = currentUser?.displayName ?? "User";
  const initials = getInitials(displayName);
  const adminMode = isAdmin || userIsAdmin;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-2 text-sm font-normal text-neutral-900">
        <Link href="/" className="transition-colors hover:text-green-700">
          ECP
        </Link>
        <span>/</span>
        <span className="font-normal text-neutral-950">
          {adminMode ? "Admin" : "Member"} Portal
        </span>
        {adminMode && (
          <Badge color="gold" dot className="ml-2">
            Admin
          </Badge>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Out of the portal and back to the public site. */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50 sm:px-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10.5 12 3l9 7.5M5.25 9.75V20a1 1 0 0 0 1 1h3.5v-5.5h4.5V21h3.5a1 1 0 0 0 1-1V9.75" />
          </svg>
          <span className="hidden sm:inline">Go back home</span>
        </Link>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#059669] text-sm font-normal text-white transition hover:ring-2 hover:ring-green-200"
            aria-label="User menu"
          >
            {currentUser?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.avatarUrl} alt={displayName} className="h-8 w-8 object-cover" />
            ) : (
              initials
            )}
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-neutral-200 bg-white py-1 shadow-lg">
              {/* User info */}
              <div className="border-b border-neutral-100 px-4 py-3">
                <p className="truncate text-sm font-normal text-neutral-950">{displayName}</p>
                <p className="truncate text-xs text-neutral-900">{currentUser?.email}</p>
              </div>
              <Link
                href="/member/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-normal text-neutral-900 transition hover:bg-neutral-50"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-normal text-red-700 transition hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}



