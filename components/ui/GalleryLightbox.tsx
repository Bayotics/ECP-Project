"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface GalleryLightboxProps {
  images: GalleryImage[];
  /** Number of columns for the grid: 2 | 3 | 4 */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COL_CLASS = { 2: "grid-cols-2", 3: "grid-cols-2 sm:grid-cols-3", 4: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4" };

/* ─── GalleryLightbox ────────────────────────────────── */
export default function GalleryLightbox({ images, columns = 3, className }: GalleryLightboxProps) {
  const [active, setActive] = useState<number | null>(null);

  const open = (idx: number) => { setActive(idx); document.body.style.overflow = "hidden"; };
  const close = () => { setActive(null); document.body.style.overflow = ""; };
  const prev = useCallback(() => setActive((i) => (i == null ? null : (i - 1 + images.length) % images.length)), [images.length]);
  const next = useCallback(() => setActive((i) => (i == null ? null : (i + 1) % images.length)), [images.length]);

  useEffect(() => {
    if (active == null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [active, prev, next]);

  return (
    <>
      {/* Grid */}
      <div
        role="list"
        className={cn("grid gap-2", COL_CLASS[columns], className)}
        aria-label="Photo gallery"
      >
        {images.map((img, idx) => (
          <motion.button
            key={idx}
            role="listitem"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            onClick={() => open(idx)}
            aria-label={`Open image: ${img.alt}`}
            className="relative aspect-square overflow-hidden rounded-xl bg-(--color-neutral-100) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--color-green-500)"
          >
            <Image src={img.src} alt={img.alt} fill className="object-cover" />
            <span className="absolute inset-0 bg-black/0 hover:bg-black/15 transition-colors" aria-hidden="true" />
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {active != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            onClick={close}
          >
            {/* Image container */}
            <motion.div
              key={active}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center"
            >
              <div className="relative w-full max-h-[75vh] overflow-hidden rounded-xl">
                <Image
                  src={images[active].src}
                  alt={images[active].alt}
                  width={images[active].width ?? 1200}
                  height={images[active].height ?? 800}
                  className="object-contain w-full h-full max-h-[75vh]"
                />
              </div>
              {images[active].caption && (
                <p className="mt-3 text-sm text-white/70 text-center max-w-lg">
                  {images[active].caption}
                </p>
              )}
              <p className="mt-1 text-xs text-white/40">
                {active + 1} / {images.length}
              </p>
            </motion.div>

            {/* Close */}
            <button
              onClick={close}
              aria-label="Close image viewer"
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
