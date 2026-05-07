"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useNews } from "@/context/NewsContext";
import type { NewsCategory, NewsPost } from "@/lib/models/news";

/* ─── Helpers ─────────────────────────────────────── */
const CATEGORY_LABELS: Record<NewsCategory | "all", string> = {
  all: "All",
  news: "News",
  announcement: "Announcements",
  report: "Reports",
  opinion: "Opinion",
  "press-release": "Press Releases",
  blog: "Blog",
};

const ALL_CATEGORIES: Array<NewsCategory | "all"> = [
  "all", "news", "announcement", "report", "opinion", "press-release", "blog",
];

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  news: "bg-blue-100 text-(--color-blue-700)",
  announcement: "bg-green-100 text-(--color-green-700)",
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

/* ─── Post card ───────────────────────────────────── */
function NewsCard({ post, featured = false }: { post: NewsPost; featured?: boolean }) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className={`group bg-white rounded-2xl overflow-hidden shadow-sm border border-(--color-neutral-200) hover:shadow-md transition-shadow flex flex-col ${featured ? "md:col-span-2 md:flex-row" : ""}`}
    >
      {post.imageUrl && (
        <div className={`relative overflow-hidden flex-shrink-0 ${featured ? "md:w-1/2 h-64 md:h-auto" : "h-48"}`}>
          <Image
            src={post.imageUrl}
            alt={post.imageAlt ?? post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          {(post.isBreaking || post.isFeatured) && (
            <div className="absolute top-3 left-3 flex gap-2">
              {post.isBreaking && (
                <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Breaking
                </span>
              )}
              {post.isFeatured && (
                <span className="bg-(--color-green-600) text-white text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Featured
                </span>
              )}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category]}`}>
            {CATEGORY_LABELS[post.category]}
          </span>
          <span className="text-xs text-(--color-neutral-500)">{post.readingTimeMinutes} min read</span>
        </div>
        <h2 className={`font-bold text-(--color-neutral-900) mb-2 group-hover:text-(--color-green-700) transition-colors leading-snug ${featured ? "text-xl md:text-2xl" : "text-base"}`}>
          <Link href={`/news/${post.slug}`} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400) rounded">
            {post.title}
          </Link>
        </h2>
        <p className="text-sm text-(--color-neutral-600) mb-4 flex-1 line-clamp-3">{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-(--color-neutral-500) mt-auto">
          <span className="flex items-center gap-1.5">
            {post.authorAvatarUrl ? (
              <Image src={post.authorAvatarUrl} alt={post.authorName} width={20} height={20} className="rounded-full" />
            ) : (
              <span className="w-5 h-5 rounded-full bg-(--color-green-100) text-(--color-green-700) flex items-center justify-center font-bold text-[10px]">
                {post.authorName.charAt(0)}
              </span>
            )}
            {post.authorName}
          </span>
          <span>{post.publishedAt ? formatDate(post.publishedAt) : ""}</span>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function NewsPage() {
  const { getPublished, getBreaking } = useNews();
  const published = getPublished();
  const breaking = getBreaking();

  const [activeCategory, setActiveCategory] = useState<NewsCategory | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let posts = activeCategory === "all" ? published : published.filter(p => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return posts;
  }, [published, activeCategory, search]);

  const featuredPosts = published.filter(p => p.isFeatured).slice(0, 2);
  const showFeatured = activeCategory === "all" && !search.trim();

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Breaking news banner */}
      {breaking.length > 0 && (
        <div className="bg-red-600 text-white text-sm py-2 px-4 flex items-center gap-3">
          <span className="font-bold uppercase tracking-wide shrink-0">Breaking</span>
          <div className="overflow-hidden flex-1">
            <span className="inline-block animate-[marquee_20s_linear_infinite]">
              {breaking.map(p => p.title).join("  •  ")}
            </span>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-white border-b border-(--color-neutral-200) py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-(--color-neutral-900) mb-3">News &amp; Updates</h1>
          <p className="text-lg text-(--color-neutral-600) max-w-xl">
            Stay informed about Eko Club Philadelphia’s events, community initiatives, reports, and member stories.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-(--color-neutral-200) sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-400) text-sm">🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search news…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-(--color-neutral-300) rounded-xl bg-(--color-neutral-50) focus:outline-none focus:ring-2 focus:ring-(--color-green-400)"
            />
          </div>
          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-wrap">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-(--color-green-600) text-white"
                    : "bg-(--color-neutral-100) text-(--color-neutral-600) hover:bg-(--color-neutral-200)"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {/* Featured strip */}
        {showFeatured && featuredPosts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xs font-bold text-(--color-neutral-500) uppercase tracking-widest mb-4">Featured</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {featuredPosts.map((post, i) => (
                <NewsCard key={post.id} post={post} featured={i === 0 && featuredPosts.length === 1} />
              ))}
            </div>
          </div>
        )}

        {/* All posts grid */}
        <div>
          {showFeatured && published.length > featuredPosts.length && (
            <h2 className="text-xs font-bold text-(--color-neutral-500) uppercase tracking-widest mb-4">Latest</h2>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-(--color-neutral-500)">
              <p className="text-4xl mb-3">📰</p>
              <p className="font-semibold">No articles found.</p>
              <p className="text-sm mt-1">Try a different search or category.</p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {(showFeatured
                  ? filtered.filter(p => !p.isFeatured)
                  : filtered
                ).map(post => (
                  <NewsCard key={post.id} post={post} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
