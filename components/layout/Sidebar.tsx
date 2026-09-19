"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/cn";
import { useAuth } from "@/context/AuthContext";
import { EKO } from "@/lib/content/programs";

type Role = "member" | "admin";

interface SidebarProps {
  role?: Role;
}

/* Line icons rather than emoji: emoji render differently on every platform
   and sit badly against text at this size. */
function Icon({ name, className }: { name: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("h-[18px] w-[18px] shrink-0", className),
    "aria-hidden": true,
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="8" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="11" width="7" height="10" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M2.5 19.5a6.5 6.5 0 0 1 13 0" />
          <path d="M16 5.6a3.2 3.2 0 0 1 0 6.3M17.5 14.2a6 6 0 0 1 4 5.3" />
        </svg>
      );
    case "documents":
      return (
        <svg {...common}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
          <path d="M14 3v5h5M9 13h6M9 17h4" />
        </svg>
      );
    case "money":
      return (
        <svg {...common}>
          <rect x="2.5" y="6" width="19" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
      );
    case "committees":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18" />
        </svg>
      );
    case "store":
      return (
        <svg {...common}>
          <path d="M6 7h12l-1 13H7L6 7Z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      );
    case "news":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M7 9h6M7 13h6M17 9v6" />
        </svg>
      );
    case "gallery":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="m4 17 5-5 4 4 3-2.5 4 3.5" />
        </svg>
      );
    case "status":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8.5 12 2.5 2.5 4.5-5" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3.5 7 8.5 6 8.5-6" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M15 17l5-5-5-5M20 12H9M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

const memberLinks = [
  { href: "/member/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/member/profile", label: "My profile", icon: "profile" },
  { href: "/member/directory", label: "Member directory", icon: "people" },
  { href: "/member/committees", label: "Committees", icon: "committees" },
  { href: "/member/events", label: "Events", icon: "calendar" },
  { href: "/member/documents", label: "Documents", icon: "documents" },
  { href: "/member/dues", label: "Dues and payments", icon: "money" },
  { href: "/membership/status", label: "Application status", icon: "status" },
];

const memberLinksPublic = [
  { href: "/store", label: "Store", icon: "store" },
  { href: "/news", label: "News", icon: "news" },
  { href: "/gallery", label: "Gallery", icon: "gallery" },
];

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/applications", label: "Applications", icon: "status" },
  { href: "/admin/members", label: "Members", icon: "people" },
  { href: "/admin/committees", label: "Committees", icon: "committees" },
  { href: "/admin/events", label: "Events", icon: "calendar" },
  { href: "/admin/news", label: "News", icon: "news" },
  { href: "/admin/newsletter", label: "Newsletter", icon: "mail" },
  { href: "/admin/products", label: "Products", icon: "store" },
  { href: "/admin/documents", label: "Documents", icon: "documents" },
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
  const isAdmin = role === "admin";
  const links = isAdmin ? adminLinks : memberLinks;
  const accent = isAdmin ? EKO.yellow : EKO.green;

  function handleLogout() {
    logout();
    router.push("/auth/login");
  }

  function navClass(active: boolean) {
    return cn(
      "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-normal transition-colors",
      active ? "text-neutral-950" : "text-neutral-900 hover:bg-neutral-100 hover:text-neutral-950",
    );
  }

  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-neutral-200 bg-white md:flex">
      <div className="flex h-16 items-center border-b border-neutral-200 px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/new-logo.png" alt="" width={28} height={28} className="h-7 w-7 rounded-full object-contain" />
          <span className="text-sm font-normal text-neutral-950">{isAdmin ? "Admin" : "Member"} portal</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={navClass(active)}
              style={active ? { background: `${accent}14`, boxShadow: `inset 0 0 0 1px ${accent}40` } : undefined}
            >
              <Icon name={icon} className={active ? "" : "text-neutral-800"} />
              {label}
            </Link>
          );
        })}

        {!isAdmin && (
          <>
            <p className="px-3.5 pb-1 pt-5 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-800">On the site</p>
            {memberLinksPublic.map(({ href, label, icon }) => (
              <Link key={href} href={href} className={navClass(false)}>
                <Icon name={icon} className="text-neutral-800" />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="space-y-1 border-t border-neutral-200 px-3 py-4">
        {currentUser && (
          <div className="flex items-center gap-2.5 px-3.5 py-2">
            {currentUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-normal text-white"
                style={{ background: accent }}
              >
                {getInitials(currentUser.displayName)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-normal text-neutral-950">{currentUser.displayName}</p>
              <p className="truncate text-xs capitalize text-neutral-900">{currentUser.role.replace("-", " ")}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <Icon name="logout" className="text-neutral-800" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
