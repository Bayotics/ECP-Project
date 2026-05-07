"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/utils/cn";
import Badge from "@/components/ui/Badge";
import type { BadgeColor } from "@/components/ui/Badge";
import { formatDate, truncate } from "@/utils/formatters";

/* ─── Types ──────────────────────────────────────────── */
export type NewsCategory =
  | "news"
  | "announcement"
  | "report"
  | "opinion"
  | "press-release"
  | "blog";

export interface NewsCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  category: NewsCategory;
  publishedAt: string;
  updatedAt?: string;
  author?: { name: string; avatarUrl?: string; role?: string };
  imageUrl?: string;
  imageAlt?: string;
  readingTime?: number;
  tags?: string[];
  isBreaking?: boolean;
  isPinned?: boolean;
  viewCount?: number;
  /** "card" | "horizontal" | "featured" */
  layout?: "card" | "horizontal" | "featured";
}

/* ─── Helpers ────────────────────────────────────────── */
const CATEGORY_META: Record<NewsCategory, { label: string; color: BadgeColor }> = {
  news: { label: "News", color: "green" },
  announcement: { label: "Announcement", color: "gold" },
  report: { label: "Report", color: "info" },
  opinion: { label: "Opinion", color: "neutral" },
  "press-release": { label: "Press Release", color: "neutral" },
  blog: { label: "Blog", color: "green" },
};

function AuthorRow({ author, date, readingTime }: { author?: NewsCardProps["author"]; date: string; readingTime?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-(--color-neutral-400)">
      {author && (
        <>
          {author.avatarUrl ? (
            <Image
              src={author.avatarUrl}
              alt={author.name}
              width={20}
              height={20}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-(--color-green-100) text-(--color-green-700) text-[10px] font-bold flex-shrink-0">
              {author.name[0]}
            </span>
          )}
          <span className="font-medium text-(--color-neutral-600)">{author.name}</span>
          <span aria-hidden="true">·</span>
        </>
      )}
      <time dateTime={date}>{formatDate(date, { month: "short", day: "numeric", year: "numeric" })}</time>
      {readingTime != null && (
        <>
          <span aria-hidden="true">·</span>
          <span>{readingTime} min read</span>
        </>
      )}
    </div>
  );
}

/* ─── NewsCard ────────────────────────────────────────── */
export default function NewsCard({
  id,
  title,
  slug,
  excerpt,
  category,
  publishedAt,
  author,
  imageUrl,
  imageAlt,
  readingTime,
  tags = [],
  isBreaking = false,
  isPinned = false,
  viewCount,
  layout = "card",
}: NewsCardProps) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.news;
  const href = `/news/${slug}`;

  /* ── Horizontal layout ── */
  if (layout === "horizontal") {
    return (
      <motion.article
        whileHover={{ x: 3 }}
        transition={{ duration: 0.2 }}
        className="group flex gap-4 rounded-xl border border-(--color-neutral-200) bg-white overflow-hidden hover:shadow-md transition-shadow"
        aria-label={`Article: ${title}`}
      >
        {imageUrl && (
          <div className="relative w-32 flex-shrink-0 overflow-hidden bg-(--color-neutral-100)">
            <Image
              src={imageUrl}
              alt={imageAlt ?? title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="flex flex-col gap-2 py-3 pr-4 justify-center">
          <div className="flex items-center gap-2 flex-wrap">
            {isBreaking && <Badge color="danger" dot>Breaking</Badge>}
            <Badge color={meta.color}>{meta.label}</Badge>
          </div>
          <Link
            href={href}
            className="font-semibold text-gray-700 hover:text-(--color-green-600) transition-colors line-clamp-2 leading-snug focus-visible:outline-none focus-visible:underline"
          >
            {title}
          </Link>
          <AuthorRow author={author} date={publishedAt} readingTime={readingTime} />
        </div>
      </motion.article>
    );
  }

  /* ── Featured layout ── */
  if (layout === "featured") {
    return (
      <motion.article
        whileHover={{ y: -3 }}
        transition={{ duration: 0.25 }}
        className="group relative rounded-2xl overflow-hidden min-h-[420px] flex flex-col justify-end bg-(--color-green-900) shadow-lg"
        aria-label={`Featured article: ${title}`}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10" aria-hidden="true" />
        <div className="relative z-20 p-6 flex flex-col gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {isBreaking && <Badge color="danger" dot>Breaking</Badge>}
            <Badge color={meta.color}>{meta.label}</Badge>
          </div>
          <Link
            href={href}
            className="text-xl font-extrabold text-white hover:text-(--color-gold-300) transition-colors line-clamp-3 leading-snug focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-gold-400)"
          >
            {title}
          </Link>
          {excerpt && (
            <p className="text-sm text-white/75 line-clamp-2 leading-relaxed">{excerpt}</p>
          )}
          <AuthorRow author={author} date={publishedAt} readingTime={readingTime} />
        </div>
      </motion.article>
    );
  }

  /* ── Default card layout ── */
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex flex-col rounded-2xl border border-(--color-neutral-200) bg-white overflow-hidden shadow-[var(--shadow-card)] hover:shadow-lg transition-shadow"
      aria-label={`Article: ${title}`}
    >
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden bg-(--color-neutral-100)">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={imageAlt ?? title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-(--color-neutral-300)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {isBreaking && <Badge color="danger" dot>Breaking</Badge>}
          {isPinned && <Badge color="gold">Pinned</Badge>}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <Badge color={meta.color}>{meta.label}</Badge>

        <Link
          href={href}
          className="font-bold text-gray-500 hover:text-(--color-green-600) transition-colors leading-snug line-clamp-2 focus-visible:outline-none focus-visible:underline"
        >
          {title}
        </Link>

        {excerpt && (
          <p className="text-sm text-(--color-neutral-500) line-clamp-3 leading-relaxed flex-1">
            {truncate(excerpt, 150)}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="text-xs rounded-full bg-(--color-neutral-100) px-2.5 py-0.5 text-(--color-neutral-500)">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-(--color-neutral-100) flex items-center justify-between">
          <AuthorRow author={author} date={publishedAt} readingTime={readingTime} />
          {viewCount != null && (
            <span className="text-xs text-(--color-neutral-400) flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {viewCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
