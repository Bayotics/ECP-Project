"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";
import SectionHeader from "@/components/ui/SectionHeader";

/* ─── Types ──────────────────────────────────────────── */
export interface RelatedItem {
  id: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  category?: string;
  href: string;
  date?: string;
}

export interface RelatedContentProps {
  items: RelatedItem[];
  title?: string;
  /** "grid" renders a 3-col grid; "scroll" renders a horizontal scroll row */
  layout?: "grid" | "scroll";
  className?: string;
}

/* ─── RelatedContent ─────────────────────────────────── */
export default function RelatedContent({
  items,
  title = "Related Content",
  layout = "scroll",
  className,
}: RelatedContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  return (
    <section aria-label={title} className={cn("space-y-5", className)}>
      <SectionHeader heading={title} align="left" withBar />

      {layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => (
            <RelatedCard key={item.id} item={item} index={i} />
          ))}
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory -mx-1 px-1 scrollbar-thin"
            role="list"
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                role="listitem"
                className="flex-shrink-0 w-64 snap-start"
              >
                <RelatedCard item={item} index={i} />
              </div>
            ))}
          </div>
          {/* Scroll hint for mobile */}
          <p className="text-xs text-(--color-neutral-400) sm:hidden text-center" aria-hidden="true">
            ← Scroll to see more →
          </p>
        </>
      )}
    </section>
  );
}

/* ─── RelatedCard ────────────────────────────────────── */
function RelatedCard({ item, index }: { item: RelatedItem; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      whileHover={{ y: -3 }}
      className="group flex flex-col rounded-xl border border-(--color-neutral-200) bg-white overflow-hidden hover:shadow-md transition-shadow h-full"
    >
      {/* Thumbnail */}
      <div className="relative h-36 bg-(--color-neutral-100) overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-(--color-neutral-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        {item.category && (
          <span className="text-xs font-bold uppercase tracking-wider text-(--color-green-600)">{item.category}</span>
        )}
        <Link
          href={item.href}
          className="font-semibold text-(--foreground) hover:text-(--color-green-600) transition-colors line-clamp-2 text-sm leading-snug focus-visible:outline-none focus-visible:underline"
        >
          {item.title}
        </Link>
        {item.excerpt && (
          <p className="text-xs text-(--color-neutral-500) line-clamp-2 leading-relaxed">{item.excerpt}</p>
        )}
        {item.date && (
          <p className="mt-auto pt-2 text-xs text-(--color-neutral-400)">{item.date}</p>
        )}
      </div>
    </motion.article>
  );
}
