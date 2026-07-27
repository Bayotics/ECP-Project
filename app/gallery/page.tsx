"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Data ────────────────────────────────────────── */
type GalleryCategory = "All" | "Events" | "Community" | "Campaigns" | "Leadership" | "Outreach";

interface GalleryItem {
  id: string;
  title: string;
  imageUrl: string;
  category: Exclude<GalleryCategory, "All">;
  tags: string[];
  date: string;
  photographer?: string;
  width: number;
  height: number;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "g-001",
    title: "2026 Civic Education Campaign Launch",
    imageUrl: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800",
    category: "Campaigns",
    tags: ["civic", "launch", "2026"],
    date: "2026-05-01",
    photographer: "ECP Media Team",
    width: 800, height: 534,
  },
  {
    id: "g-002",
    title: "Youth Empowerment Forum at UNILAG",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800",
    category: "Events",
    tags: ["youth", "forum", "university"],
    date: "2026-04-27",
    photographer: "Tunde Adewale",
    width: 800, height: 534,
  },
  {
    id: "g-003",
    title: "Executive Committee Meeting — Q1 2026",
    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800",
    category: "Leadership",
    tags: ["committee", "governance"],
    date: "2026-03-10",
    width: 800, height: 534,
  },
  {
    id: "g-004",
    title: "Voter Registration Drive — Alimosho",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800",
    category: "Campaigns",
    tags: ["voter-registration", "elections", "2027"],
    date: "2026-04-20",
    photographer: "ECP Media Team",
    width: 800, height: 534,
  },
  {
    id: "g-005",
    title: "Community Clean-Up — Surulere Waterway",
    imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
    category: "Community",
    tags: ["environment", "clean-up", "surulere"],
    date: "2026-04-05",
    width: 800, height: 534,
  },
  {
    id: "g-006",
    title: "Annual Gala Dinner 2025",
    imageUrl: "https://images.unsplash.com/photo-1519671282429-b44b4bd4adf5?w=800",
    category: "Events",
    tags: ["gala", "fundraiser", "2025"],
    date: "2025-12-10",
    photographer: "Lagos Photo Studios",
    width: 800, height: 534,
  },
  {
    id: "g-007",
    title: "School Outreach — Kosofe Secondary School",
    imageUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800",
    category: "Outreach",
    tags: ["schools", "outreach", "kosofe"],
    date: "2026-02-14",
    width: 800, height: 534,
  },
  {
    id: "g-008",
    title: "Town Hall — Badagry LGA",
    imageUrl: "https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800",
    category: "Community",
    tags: ["town-hall", "badagry", "governance"],
    date: "2026-03-22",
    width: 800, height: 534,
  },
  {
    id: "g-009",
    title: "Policy Advocacy Workshop",
    imageUrl: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    category: "Outreach",
    tags: ["policy", "advocacy", "workshop"],
    date: "2026-01-25",
    photographer: "Amara Osei",
    width: 800, height: 534,
  },
  {
    id: "g-010",
    title: "ECP Leadership Session 2025",
    imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800",
    category: "Leadership",
    tags: ["leadership", "training", "2025"],
    date: "2025-11-05",
    width: 800, height: 534,
  },
  {
    id: "g-011",
    title: "Press Conference — INEC Partnership",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800",
    category: "Campaigns",
    tags: ["inec", "partnership", "press"],
    date: "2026-05-03",
    photographer: "ECP Media Team",
    width: 800, height: 534,
  },
  {
    id: "g-012",
    title: "Women in Governance Forum",
    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
    category: "Events",
    tags: ["women", "governance", "forum"],
    date: "2026-03-08",
    width: 800, height: 534,
  },
  {
    id: "g-013",
    title: "Neighbourhood Watch Orientation — Mushin",
    imageUrl: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800",
    category: "Community",
    tags: ["community", "mushin", "security"],
    date: "2026-02-28",
    width: 800, height: 534,
  },
  {
    id: "g-014",
    title: "Digital Skills Training — Yaba Hub",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
    category: "Outreach",
    tags: ["digital", "skills", "youth", "yaba"],
    date: "2026-01-18",
    photographer: "Tunde Adewale",
    width: 800, height: 534,
  },
  {
    id: "g-015",
    title: "Board Strategy Retreat 2025",
    imageUrl: "https://images.unsplash.com/photo-1559223607-b4d0555ae227?w=800",
    category: "Leadership",
    tags: ["board", "strategy", "retreat"],
    date: "2025-10-20",
    width: 800, height: 534,
  },
  {
    id: "g-016",
    title: "Road Survey Documentation — Ikeja",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800",
    category: "Campaigns",
    tags: ["survey", "roads", "ikeja"],
    date: "2026-04-12",
    width: 800, height: 534,
  },
  {
    id: "g-017",
    title: "Annual Members Day 2025",
    imageUrl: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800",
    category: "Events",
    tags: ["members", "annual", "celebration"],
    date: "2025-11-29",
    photographer: "Lagos Photo Studios",
    width: 800, height: 534,
  },
  {
    id: "g-018",
    title: "Community Health Fair — Ajegunle",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800",
    category: "Community",
    tags: ["health", "community", "ajegunle"],
    date: "2026-02-08",
    width: 800, height: 534,
  },
  {
    id: "g-019",
    title: "Media Briefing — 2026 Campaigns",
    imageUrl: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800",
    category: "Campaigns",
    tags: ["media", "briefing", "2026"],
    date: "2026-04-30",
    photographer: "ECP Media Team",
    width: 800, height: 534,
  },
  {
    id: "g-020",
    title: "ECP Induction Ceremony 2025",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800",
    category: "Events",
    tags: ["induction", "ceremony", "members"],
    date: "2025-09-14",
    width: 800, height: 534,
  },
];

const ALL_CATEGORIES: GalleryCategory[] = ["All", "Events", "Community", "Campaigns", "Leadership", "Outreach"];

/* ─── Lightbox ────────────────────────────────────── */
function Lightbox({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const item = items[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onNext, onPrev]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" as const }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/70 hover:text-white text-3xl leading-none transition-colors"
          aria-label="Close lightbox"
        >
          ✕
        </button>

        {/* Counter */}
        <span className="absolute top-5 left-5 text-white/60 text-sm">
          {index + 1} / {items.length}
        </span>

        {/* Prev */}
        <button
          onClick={e => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 md:left-8 text-white/70 hover:text-white text-4xl transition-colors select-none"
          aria-label="Previous image"
        >
          ‹
        </button>

        {/* Image */}
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" as const }}
          className="relative max-w-4xl w-full max-h-[80vh] flex flex-col items-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="relative w-full max-h-[68vh] rounded-xl overflow-hidden">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={item.width}
              height={item.height}
              className="w-full h-full object-contain max-h-[68vh]"
              style={{ maxHeight: "68vh" }}
              priority
            />
          </div>
          <div className="mt-4 text-center text-white">
            <p className="font-semibold text-base">{item.title}</p>
            <p className="text-white/60 text-sm mt-0.5">
              {new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              {item.photographer ? ` · Photo: ${item.photographer}` : ""}
            </p>
          </div>
        </motion.div>

        {/* Next */}
        <button
          onClick={e => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 md:right-8 text-white/70 hover:text-white text-4xl transition-colors select-none"
          aria-label="Next image"
        >
          ›
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("All");
  const [search, setSearch] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let items = activeCategory === "All" ? GALLERY_ITEMS : GALLERY_ITEMS.filter(i => i.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [activeCategory, search]);

  const openLightbox = useCallback((idx: number) => setLightboxIndex(idx), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goPrev = useCallback(() => setLightboxIndex(i => i === null ? null : (i - 1 + filtered.length) % filtered.length), [filtered.length]);
  const goNext = useCallback(() => setLightboxIndex(i => i === null ? null : (i + 1) % filtered.length), [filtered.length]);

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Hero */}
      <section className="bg-white border-b border-(--color-neutral-200) py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-(--color-neutral-900) mb-3">Gallery</h1>
          <p className="text-lg text-(--color-neutral-600) max-w-xl">
            A visual record of Eko Club Philadelphia’s events, cultural celebrations, community activities, and leadership.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-(--color-neutral-200) sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-400) text-sm">🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search gallery…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-(--color-neutral-300) rounded-xl bg-(--color-neutral-50) focus:outline-none focus:ring-2 focus:ring-(--color-green-400)"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
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
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-(--color-neutral-500) mb-5">{filtered.length} photo{filtered.length !== 1 ? "s" : ""}</p>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-(--color-neutral-500)">
            <p className="text-4xl mb-3">🖼️</p>
            <p className="font-semibold">No photos found.</p>
            <p className="text-sm mt-1">Try a different search or category.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((item, idx) => (
                <motion.button
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: "easeOut" as const }}
                  onClick={() => openLightbox(idx)}
                  className="group relative aspect-square rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-green-400)"
                  aria-label={`Open ${item.title}`}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex flex-col items-start justify-end p-3 opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-bold px-2 py-0.5 bg-(--color-green-600) rounded-full mb-1">
                      {item.category}
                    </span>
                    <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{item.title}</p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </div>
  );
}
