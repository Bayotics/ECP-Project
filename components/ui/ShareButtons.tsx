"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface ShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  /** Platforms to show. Defaults to all. */
  platforms?: Array<"twitter" | "facebook" | "whatsapp" | "linkedin" | "copy">;
  className?: string;
}

/* ─── Share configs ──────────────────────────────────── */
function getShareUrl(platform: string, url: string, title?: string, description?: string) {
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title ?? "");
  const encodedDesc = encodeURIComponent(description ?? "");
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedTitle}%20${encoded}`;
    case "linkedin":
      return `https://www.linkedin.com/shareArticle?mini=true&url=${encoded}&title=${encodedTitle}&summary=${encodedDesc}`;
    default:
      return "#";
  }
}

const PLATFORM_META = {
  twitter: {
    label: "Share on X / Twitter",
    bg: "hover:bg-black/5 hover:text-black",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L2.018 2.25H8.08l4.265 5.638L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  facebook: {
    label: "Share on Facebook",
    bg: "hover:bg-blue-50 hover:text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  whatsapp: {
    label: "Share on WhatsApp",
    bg: "hover:bg-green-50 hover:text-green-600",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
  linkedin: {
    label: "Share on LinkedIn",
    bg: "hover:bg-blue-50 hover:text-blue-700",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  copy: {
    label: "Copy link",
    bg: "hover:bg-(--color-neutral-100) hover:text-(--color-neutral-800)",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
};

/* ─── ShareButtons ───────────────────────────────────── */
export default function ShareButtons({
  url,
  title,
  description,
  platforms = ["twitter", "facebook", "whatsapp", "linkedin", "copy"],
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)} aria-label="Share this page">
      <span className="text-xs font-semibold text-(--color-neutral-500) mr-1">Share:</span>
      {platforms.map((platform) => {
        const meta = PLATFORM_META[platform];
        if (platform === "copy") {
          return (
            <button
              key="copy"
              onClick={handleCopy}
              aria-label={copied ? "Link copied!" : meta.label}
              title={copied ? "Link copied!" : meta.label}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border border-(--color-neutral-200) text-(--color-neutral-500) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)",
                copied ? "bg-(--color-green-50) text-(--color-green-600) border-(--color-green-300)" : meta.bg,
              )}
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : meta.icon}
            </button>
          );
        }
        return (
          <a
            key={platform}
            href={getShareUrl(platform, url, title, description)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={meta.label}
            title={meta.label}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border border-(--color-neutral-200) text-(--color-neutral-500) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-500)",
              meta.bg,
            )}
          >
            {meta.icon}
          </a>
        );
      })}
    </div>
  );
}
