"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useIsClient } from "@/components/gsap/useReveal";
import type { MediaItem } from "@/lib/content/projects";

/* Full-screen viewer for a set of photos, local clips and YouTube videos.

   Portalled to <body>: the pages that use it animate their sections with
   transforms, and a transformed ancestor would make `position: fixed`
   resolve against that section instead of the viewport. Opens with a short
   CSS entrance and simply unmounts on close — framer-motion exit
   animations have been unreliable in this app. */
export default function MediaViewer({
  items,
  index,
  onClose,
  onIndex,
}: {
  items: MediaItem[];
  index: number | null;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const isClient = useIsClient();
  const open = index !== null && items.length > 0;
  const many = items.length > 1;

  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null) return;
      onIndex((index + dir + items.length) % items.length);
    },
    [index, items.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && many) step(1);
      if (e.key === "ArrowLeft" && many) step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, many, onClose, step]);

  if (!isClient || !open || index === null) return null;
  const item = items[index];
  const caption = item.kind === "youtube" ? item.caption ?? item.title : item.caption;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950/95 [animation:viewer-in_220ms_ease-out]"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-4 text-white/70 sm:px-6">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">
          {many ? `${index + 1} / ${items.length}` : ""}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
        <div key={index} className="flex max-h-full w-full max-w-6xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {item.kind === "image" && (
            <Image
              src={item.src}
              alt={item.alt}
              width={item.w}
              height={item.h}
              sizes="(max-width: 1280px) 100vw, 1280px"
              quality={100}
              className="h-auto max-h-[78vh] w-auto max-w-full rounded-lg object-contain"
            />
          )}
          {item.kind === "video" && (
            <video
              src={item.src}
              poster={item.poster}
              controls
              autoPlay
              playsInline
              aria-label={item.alt}
              className="max-h-[78vh] max-w-full rounded-lg bg-black"
              style={{ aspectRatio: `${item.w} / ${item.h}` }}
            />
          )}
          {item.kind === "youtube" && (
            <div className="aspect-video w-full max-w-5xl overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0`}
                title={item.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {many && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous"
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="min-h-[4.5rem] px-6 py-5 text-center text-sm leading-6 text-white/75">
        {caption ?? (item.kind !== "youtube" ? item.alt : "")}
      </div>
    </div>,
    document.body,
  );
}
