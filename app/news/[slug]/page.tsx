"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useNews } from "@/context/NewsContext";
import type { NewsCategory, NewsPost } from "@/lib/models/news";

/* ─── Helpers ─────────────────────────────────────── */
const CATEGORY_LABELS: Record<NewsCategory, string> = {
  news: "News",
  announcement: "Announcements",
  report: "Reports",
  opinion: "Opinion",
  "press-release": "Press Releases",
  blog: "Blog",
};

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  news: "bg-blue-100 text-blue-700",
  announcement: "bg-green-100 text-green-700",
  report: "bg-yellow-100 text-yellow-700",
  opinion: "bg-purple-100 text-purple-700",
  "press-release": "bg-orange-100 text-orange-700",
  blog: "bg-pink-100 text-pink-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/* ─── Related card ─────────────────────────────────── */
function RelatedCard({ post }: { post: NewsPost }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex gap-3 p-3 rounded-xl hover:bg-(--color-neutral-100) transition-colors"
    >
      {post.imageUrl && (
        <div className="relative w-20 h-16 flex-shrink-0 rounded-lg overflow-hidden">
          <Image src={post.imageUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="80px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-(--color-neutral-800) line-clamp-2 group-hover:text-(--color-green-700) transition-colors">{post.title}</p>
        <p className="text-xs text-(--color-neutral-500) mt-1">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
      </div>
    </Link>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function NewsArticlePage() {
  const params = useParams<{ slug: string }>();
  const { getBySlug, getPublished, incrementViews, isLoading } = useNews();
  const [copied, setCopied] = useState(false);

  const post = getBySlug(params.slug);

  useEffect(() => {
    if (post) incrementViews(post.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-(--color-neutral-400) text-sm animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!post || post.status !== "published") {
    notFound();
    return null;
  }

  const related = getPublished()
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-(--color-neutral-200)">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-(--color-neutral-500)">
          <Link href="/" className="hover:text-(--color-green-700) transition-colors">Home</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-(--color-green-700) transition-colors">News</Link>
          <span>/</span>
          <span className="text-(--color-neutral-700) line-clamp-1">{post.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col lg:flex-row gap-10">
        {/* Main Article */}
        <article className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {post.isBreaking && (
              <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">Breaking</span>
            )}
            {post.isFeatured && (
              <span className="bg-(--color-green-600) text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide">Featured</span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category]}`}>
              {CATEGORY_LABELS[post.category]}
            </span>
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="text-2xl md:text-4xl font-extrabold text-(--color-neutral-900) mb-4 leading-tight"
          >
            {post.title}
          </motion.h1>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-(--color-neutral-500) mb-6 flex-wrap">
            <span className="flex items-center gap-2">
              {post.authorAvatarUrl ? (
                <Image src={post.authorAvatarUrl} alt={post.authorName} width={28} height={28} className="rounded-full" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-(--color-green-100) text-(--color-green-700) flex items-center justify-center font-bold text-xs">
                  {post.authorName.charAt(0)}
                </span>
              )}
              <span className="font-medium text-(--color-neutral-700)">{post.authorName}</span>
            </span>
            {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
            <span>{post.readingTimeMinutes} min read</span>
            <span>{post.viewCount.toLocaleString()} views</span>
          </div>

          {/* Hero image */}
          {post.imageUrl && (
            <div className="relative w-full h-72 md:h-[420px] rounded-2xl overflow-hidden mb-8">
              <Image
                src={post.imageUrl}
                alt={post.imageAlt ?? post.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 800px"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-neutral max-w-none prose-headings:font-bold prose-headings:text-(--color-neutral-900) prose-p:text-(--color-neutral-700) prose-li:text-(--color-neutral-700) prose-a:text-(--color-green-700)"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Link
                  key={tag}
                  href={`/news?q=${tag}`}
                  className="text-xs px-3 py-1 bg-(--color-neutral-100) text-(--color-neutral-600) rounded-full hover:bg-(--color-green-100) hover:text-(--color-green-700) transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="mt-8 p-5 bg-white border border-(--color-neutral-200) rounded-2xl flex items-center gap-4">
            <span className="text-sm font-semibold text-(--color-neutral-700)">Share this article</span>
            <button
              onClick={copyLink}
              className="ml-auto px-4 py-2 bg-(--color-green-600) hover:bg-(--color-green-700) text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>

          {/* Back */}
          <Link
            href="/news"
            className="inline-flex items-center gap-2 mt-6 text-sm text-(--color-green-700) hover:text-(--color-green-900) font-medium transition-colors"
          >
            ← Back to News
          </Link>
        </article>

        {/* Sidebar */}
        <aside className="lg:w-72 xl:w-80 shrink-0">
          {related.length > 0 && (
            <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-5 sticky top-24">
              <h3 className="text-sm font-bold text-(--color-neutral-900) uppercase tracking-wide mb-4">
                Related Articles
              </h3>
              <div className="space-y-1">
                {related.map(p => (
                  <RelatedCard key={p.id} post={p} />
                ))}
              </div>
              <Link
                href="/news"
                className="block text-center mt-4 text-xs font-semibold text-(--color-green-700) hover:text-(--color-green-900) transition-colors"
              >
                View all news →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
