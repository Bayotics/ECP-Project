"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";

type Role = "member" | "admin";

interface SidebarProps {
  role?: Role;
}

const memberLinks = [
  { href: "/member/dashboard",  label: "Dashboard",          icon: "⊞" },
  { href: "/member/profile",    label: "My Profile",          icon: "◎" },
  { href: "/member/directory",  label: "Member Directory",    icon: "◉" },
  { href: "/member/documents",  label: "Documents",           icon: "◧" },
  { href: "/member/dues",       label: "Dues & Payments",     icon: "₦" },
  { href: "/events",            label: "Events",              icon: "◈" },
  { href: "/store",             label: "Store",               icon: "🛍️" },
  { href: "/news",              label: "News",                icon: "📰" },
  { href: "/gallery",           label: "Gallery",             icon: "🖼️" },
  { href: "/membership/status", label: "Application Status",  icon: "✦" },
];

const adminLinks = [
  { href: "/admin/dashboard",     label: "Dashboard",     icon: "⊞" },
  { href: "/admin/applications",  label: "Applications",  icon: "✦" },
  { href: "/admin/members",       label: "Members",       icon: "◉" },
  { href: "/admin/events",        label: "Events",        icon: "◈" },
  { href: "/admin/news",          label: "News",          icon: "📰" },
  { href: "/admin/products",      label: "Products",      icon: "🛍️" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Sidebar({ role = "member" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuth();
  const links = role === "admin" ? adminLinks : memberLinks;
  const accentColor =
    role === "admin" ? "var(--color-gold-500)" : "var(--color-green-500)";

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="hidden md:flex w-56 flex-shrink-0 flex-col bg-white border-r border-(--color-neutral-200) h-full">
      {/* Brand */}
      <div className="flex h-16 items-center px-5 border-b border-(--color-neutral-200)">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-md text-white font-extrabold text-xs"
            style={{ background: accentColor }}
          >
            ECP
          </span>
          <span className="font-bold text-sm text-(--foreground)">
            {role === "admin" ? "Admin" : "Member"} Portal
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-(--color-green-50) text-(--color-green-700)"
                  : "text-(--color-neutral-600) hover:bg-(--color-neutral-100) hover:text-(--foreground)"
              )}
              style={
                active && role === "admin"
                  ? { background: "var(--color-gold-50)", color: "var(--color-gold-700)" }
                  : undefined
              }
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-(--color-neutral-200) space-y-2">
        {currentUser && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            {currentUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.displayName}
                className="h-7 w-7 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-white font-semibold text-xs flex-shrink-0"
                style={{ background: accentColor }}
              >
                {getInitials(currentUser.displayName)}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-(--foreground) truncate">{currentUser.displayName}</p>
              <p className="text-xs text-(--color-neutral-400) capitalize">{currentUser.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--color-neutral-600) hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span className="text-base">⎋</span>
          Sign out
        </button>
      </div>
    </aside>
  );
}



