"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export type SocialPlatform = "twitter" | "linkedin" | "email" | "facebook" | "instagram";

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
}

export interface CommitteeCardProps {
  name: string;
  role: string;
  bio?: string;
  imageUrl?: string;
  committee?: string;
  isChairperson?: boolean;
  isViceChair?: boolean;
  socialLinks?: SocialLink[];
  /** "card" | "compact" */
  layout?: "card" | "compact";
  className?: string;
}

/* ─── Icons ──────────────────────────────────────────── */
const SOCIAL_ICONS: Record<SocialPlatform, { icon: React.ReactNode; label: string; bg: string }> = {
  twitter: {
    label: "Twitter / X",
    bg: "hover:bg-black/10 hover:text-black",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.018 2.25H8.08l4.265 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  linkedin: {
    label: "LinkedIn",
    bg: "hover:bg-blue-50 hover:text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  email: {
    label: "Email",
    bg: "hover:bg-green-50 hover:text-(--color-green-700)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    bg: "hover:bg-blue-50 hover:text-blue-600",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  instagram: {
    label: "Instagram",
    bg: "hover:bg-pink-50 hover:text-pink-600",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
};

/* ─── CommitteeCard ──────────────────────────────────── */
export default function CommitteeCard({
  name,
  role,
  bio,
  imageUrl,
  committee,
  isChairperson = false,
  isViceChair = false,
  socialLinks = [],
  layout = "card",
  className,
}: CommitteeCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (layout === "compact") {
    return (
      <motion.div
        whileHover={{ x: 3 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex items-center gap-3 p-3 rounded-xl border border-(--color-neutral-200) bg-white hover:shadow-sm transition-shadow",
          className,
        )}
      >
        <div className="relative h-11 w-11 flex-shrink-0 rounded-full overflow-hidden bg-(--color-green-100)">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-(--color-green-700)">
              {initials}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-(--foreground) truncate">{name}</p>
          <p className="text-xs text-(--color-neutral-500) truncate">{role}</p>
        </div>
        {(isChairperson || isViceChair) && (
          <span className="text-xs font-bold text-(--color-gold-600) bg-(--color-gold-50) px-2 py-0.5 rounded-full flex-shrink-0">
            {isChairperson ? "Chair" : "V. Chair"}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "group flex flex-col items-center text-center rounded-2xl border border-(--color-neutral-200) bg-white p-6 shadow-[var(--shadow-card)] hover:shadow-lg transition-shadow",
        className,
      )}
    >
      {/* Avatar */}
      <div className="relative mb-4">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-(--color-green-100) ring-4 ring-(--color-green-50)">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} width={96} height={96} className="object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-extrabold text-(--color-green-700)">
              {initials}
            </span>
          )}
        </div>
        {(isChairperson || isViceChair) && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-(--color-gold-700) bg-(--color-gold-100) border border-(--color-gold-200) px-2 py-0.5 rounded-full">
            {isChairperson ? "Chairperson" : "Vice Chair"}
          </span>
        )}
      </div>

      {/* Name & role */}
      <h3 className="mt-2 font-extrabold text-(--foreground) leading-tight">{name}</h3>
      <p className="mt-0.5 text-sm font-semibold text-(--color-green-600)">{role}</p>
      {committee && (
        <p className="text-xs text-(--color-neutral-400) mt-0.5">{committee}</p>
      )}

      {/* Bio */}
      {bio && (
        <p className="mt-3 text-sm text-(--color-neutral-500) leading-relaxed line-clamp-3">
          {bio}
        </p>
      )}

      {/* Social links */}
      {socialLinks.length > 0 && (
        <div className="mt-4 flex items-center gap-2 justify-center" role="list" aria-label={`${name}'s social links`}>
          {socialLinks.map((link) => {
            const meta = SOCIAL_ICONS[link.platform];
            const href = link.platform === "email" ? `mailto:${link.url}` : link.url;
            return (
              <Link
                key={link.platform}
                href={href}
                target={link.platform !== "email" ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label={`${name} on ${meta.label}`}
                role="listitem"
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-full text-(--color-neutral-400) transition-colors",
                  meta.bg,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)",
                )}
              >
                {meta.icon}
              </Link>
            );
          })}
        </div>
      )}
    </motion.article>
  );
}
