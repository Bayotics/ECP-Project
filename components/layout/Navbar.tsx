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
    router.push("/login");
  }

  const displayName = currentUser?.displayName ?? "User";
  const initials = getInitials(displayName);
  const adminMode = isAdmin || userIsAdmin;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-(--color-neutral-200) bg-white px-4 sm:px-6">
      {/* Left */}
      <div className="flex items-center gap-2 text-sm text-(--color-neutral-500)">
        <Link href="/" className="hover:text-(--color-green-600) transition-colors">
          ECP
        </Link>
        <span>/</span>
        <span className="font-medium text-gray-500">
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
        {/* Notification bell */}
        <button
          className="relative rounded-full p-2 text-(--color-neutral-500) hover:bg-(--color-neutral-100) transition-colors"
          aria-label="Notifications"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-(--color-danger)" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-green-500) text-white font-semibold text-sm hover:ring-2 hover:ring-(--color-green-300) transition overflow-hidden"
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
            <div className="absolute right-0 mt-2 w-52 rounded-xl border border-(--color-neutral-200) bg-white shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-(--color-neutral-100)">
                <p className="text-sm font-semibold text-gray-500 truncate">{displayName}</p>
                <p className="text-xs text-(--color-neutral-400) truncate">{currentUser?.email}</p>
              </div>
              <Link
                href="/member/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-(--color-neutral-700) hover:bg-(--color-neutral-50) transition"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
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



