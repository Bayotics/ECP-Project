"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { HEADER_OFFSET } from "@/components/layout/Header";
import { EASE, HIDDEN, SHIFT, useReveal } from "@/components/gsap/useReveal";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import type { Product, ProductCategory } from "@/lib/models/product";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

const QUAD = [EKO.green, EKO.red, EKO.blue, EKO.yellow];

const CATEGORY_LABEL: Record<ProductCategory, string> = {
  apparel: "Apparel",
  accessories: "Accessories",
  stationery: "Stationery",
  publications: "Publications",
  digital: "Digital",
  other: "Other",
};

const CATEGORY_COLOR: Record<ProductCategory, string> = {
  apparel: EKO.green,
  accessories: EKO.yellow,
  stationery: EKO.blue,
  publications: EKO.red,
  digital: "#0891b2",
  other: "#525252",
};

const CATEGORIES = Object.keys(CATEGORY_LABEL) as ProductCategory[];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price, low to high" },
  { value: "price-desc", label: "Price, high to low" },
  { value: "name", label: "Name, A to Z" },
] as const;

type Sort = (typeof SORT_OPTIONS)[number]["value"];

/* Prices are stored in naira by the ordering and payment side of the site,
   so that is what the storefront shows. */
const priceFormat = new Intl.NumberFormat("en-NG");
const formatPrice = (n: number) => `₦${priceFormat.format(n)}`;

function QuadBar({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-1.5 w-28 overflow-hidden rounded-full", className)} aria-hidden="true">
      {QUAD.map((color) => (
        <div key={color} className="flex-1" style={{ background: color }} />
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4 text-neutral-400" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function BagIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", className)} aria-hidden="true">
      <path d="M6 7h12l-1 13H7L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

/* ─── Product card ──────────────────────────────────────────────────────── */

function ProductCard({ product }: { product: Product }) {
  const { addItem, hasItem, getQty } = useCart();
  const color = CATEGORY_COLOR[product.category];
  const inCart = hasItem(product.id);
  const qty = getQty(product.id);
  const soldOut = product.status === "out-of-stock" || product.stock === 0;

  return (
    <article
      data-product-card
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)]"
    >
      <Link href={`/store/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-neutral-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          /* No photograph filed for this item, so the category carries the
             tile rather than a stand-in picture. */
          <span className="absolute inset-0 flex items-end p-5" style={{ background: `linear-gradient(135deg, ${color} 0%, #0a0a0a 120%)` }}>
            <span className="text-2xl font-normal tracking-[-0.03em] text-white/90">{CATEGORY_LABEL[product.category]}</span>
          </span>
        )}
        <span className="absolute left-4 top-4 flex flex-wrap gap-2">
          {product.isFeatured && <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-normal text-white">Featured</span>}
          {product.compareAtPrice && <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-normal text-neutral-800 backdrop-blur">On sale</span>}
          {product.isMemberOnly && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-normal text-neutral-800 backdrop-blur">Members only</span>
          )}
        </span>
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-xs font-normal text-neutral-700">Out of stock</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-2 text-[11px] font-normal uppercase tracking-[0.18em] text-neutral-500">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
          {CATEGORY_LABEL[product.category]}
        </p>
        <h3 className="mt-3 text-lg font-normal leading-snug tracking-[-0.02em] text-neutral-950">
          <Link href={`/store/${product.slug}`} className="transition-colors hover:text-green-700">
            {product.name}
          </Link>
        </h3>
        {product.shortDescription && <p className="mt-2 flex-1 text-sm leading-7 text-neutral-700">{product.shortDescription}</p>}

        <div className="mt-5 flex items-baseline gap-3">
          <span className="text-xl font-normal tracking-[-0.03em] text-neutral-950">{formatPrice(product.price)}</span>
          {product.compareAtPrice && <span className="text-sm text-neutral-400 line-through">{formatPrice(product.compareAtPrice)}</span>}
        </div>

        <button
          onClick={() => {
            void addItem({
              productId: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
              slug: product.slug,
            });
          }}
          disabled={soldOut}
          className={cn(
            "mt-4 w-full rounded-full py-3 text-sm font-normal transition-colors",
            soldOut && "cursor-not-allowed bg-neutral-100 text-neutral-400",
            !soldOut && inCart && "bg-green-50 text-green-800 hover:bg-green-100",
            !soldOut && !inCart && "text-white",
          )}
          style={!soldOut && !inCart ? { background: EKO.green } : undefined}
        >
          {soldOut ? "Out of stock" : inCart ? `In your bag (${qty})` : "Add to bag"}
        </button>
      </div>
    </article>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function StorePage() {
  const { getActive, isLoading } = useProducts();
  const { itemCount, subtotal } = useCart();
  const products = getActive();

  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const map = new Map<ProductCategory, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    let list = category === "all" ? products : products.filter((p) => p.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.shortDescription ?? "").toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    switch (sort) {
      case "price-asc":
        return [...list].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...list].sort((a, b) => b.price - a.price);
      case "name":
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return [...list].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
  }, [products, category, sort, search]);

  const inStock = products.filter((p) => p.stock > 0 && p.status === "active").length;

  const pageRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroPanelRef = useRef<HTMLDivElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const ctaTextRef = useRef<HTMLDivElement>(null);
  const ctaLeftRef = useRef<HTMLDivElement>(null);
  const ctaRightRef = useRef<HTMLDivElement>(null);

  useReveal(pageRef, ({ timeline, entered, after }) => {
    gsap.set(heroTextRef.current, { x: -SHIFT });
    gsap.set(heroPanelRef.current, { x: SHIFT });
    const hero = timeline();
    hero.tl
      .to(heroTextRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(heroPanelRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE }, "<")
      .to(heroButtonsRef.current, { opacity: 1, duration: 0.6, ease: "power2.out" });
    hero.tl.play();

    /* The catalogue is fetched after mount, so the shelf reveals as a block
       rather than card by card. */
    gsap.set(headRef.current, { x: -SHIFT });
    gsap.set([controlsRef.current, gridRef.current], { y: 24 });
    const shelf = timeline();
    shelf.tl
      .to(headRef.current, { opacity: 1, x: 0, duration: 0.8, ease: EASE })
      .to(controlsRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3")
      .to(gridRef.current, { opacity: 1, y: 0, duration: 0.6, ease: EASE }, "-=0.3");
    after([entered(headRef.current)], () => shelf.tl.play());

    gsap.set(ctaLeftRef.current, { x: -SHIFT });
    gsap.set(ctaRightRef.current, { x: SHIFT });
    const cta = timeline();
    cta.tl
      .to(ctaTextRef.current, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(ctaLeftRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE })
      .to(ctaRightRef.current, { opacity: 1, x: 0, duration: 0.7, ease: EASE }, "<");
    after([entered(ctaTextRef.current)], () => cta.tl.play());
  });

  return (
    <div ref={pageRef} className="bg-white text-neutral-950">
      {/* ─── Hero ─── */}
      <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
        <div className="absolute inset-0">
          <Image src="/gallery/about/right-about-hero-2.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.66) 0%, rgba(10,10,10,0.72) 45%, rgba(10,10,10,0.88) 100%)" }}
          />
        </div>

        {QUAD.map((color, i) => (
          <motion.div
            key={color}
            className="pointer-events-none absolute rounded-full blur-3xl"
            style={{ background: color, opacity: 0.16, width: 260, height: 260, left: `${8 + i * 20}%`, top: i % 2 === 0 ? "10%" : "52%" }}
            animate={{ y: [0, -24, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 7 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.45 }}
          />
        ))}

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 md:py-28 lg:px-8 lg:py-32">
          <div className="grid items-end gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-3xl">
              <div ref={heroTextRef} data-reveal style={HIDDEN}>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-md">
                  {QUAD.map((color) => (
                    <span key={color} className="h-2 w-2 rounded-full" style={{ background: color }} />
                  ))}
                  <span className="text-[11px] font-normal uppercase tracking-[0.24em] text-white">The club store</span>
                </div>
                <h1 className="mt-7 text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl">
                  Wear it. <span style={{ color: EKO.green }}>Fund</span> the{" "}
                  <span style={{ color: EKO.yellow }}>work</span>.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg">
                  Club apparel, accessories and publications. Whatever you buy here goes straight back into the
                  programs: the scholarships, the turkeys, the cleanups and the clinics.
                </p>
              </div>

              <div ref={heroButtonsRef} data-reveal className="mt-8 flex flex-wrap gap-3" style={HIDDEN}>
                <Link
                  href="#catalogue"
                  className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white shadow-2xl transition-transform duration-300 hover:-translate-y-0.5"
                  style={{ background: EKO.green, boxShadow: `0 0 32px ${EKO.green}66` }}
                >
                  Browse the store
                </Link>
                <Link
                  href="/donate"
                  className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
                >
                  Donate instead
                </Link>
              </div>
            </div>

            <div ref={heroPanelRef} data-reveal className="rounded-4xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl" style={HIDDEN}>
              <p className="text-xs font-normal uppercase tracking-[0.22em] text-white">Your bag</p>
              <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-4xl font-normal tracking-[-0.04em]" style={{ color: EKO.yellow }}>
                  {itemCount}
                </p>
                <p className="mt-2 text-xs font-normal uppercase tracking-[0.16em] text-white">
                  Item{itemCount !== 1 ? "s" : ""} in your bag
                </p>
                {itemCount > 0 && <p className="mt-3 text-sm text-white">Subtotal {formatPrice(subtotal)}</p>}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-3xl font-normal tracking-[-0.04em]" style={{ color: EKO.green }}>
                    {isLoading ? "–" : products.length}
                  </p>
                  <p className="mt-2 text-xs font-normal uppercase tracking-[0.16em] text-white">In the catalogue</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                  <p className="text-3xl font-normal tracking-[-0.04em]" style={{ color: EKO.blue }}>
                    {isLoading ? "–" : inStock}
                  </p>
                  <p className="mt-2 text-xs font-normal uppercase tracking-[0.16em] text-white">Ready to ship</p>
                </div>
              </div>

              <Link
                href="/store/cart"
                className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/8 px-6 py-3 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                <BagIcon />
                Go to your bag
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          {QUAD.map((color) => (
            <div key={color} className="flex-1" style={{ background: color }} />
          ))}
        </div>
      </section>

      {/* ─── Catalogue ─── */}
      <section id="catalogue" className="scroll-mt-28 bg-neutral-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div ref={headRef} data-reveal style={HIDDEN}>
              <QuadBar />
              <span className="mt-5 inline-flex rounded-full border border-neutral-200 bg-white px-4 py-1 text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
                Catalogue
              </span>
              <h2 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-neutral-950 sm:text-4xl lg:text-5xl">
                Everything in the store
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-neutral-700">
                Search for what you want, narrow by category, and order by price. A few items are reserved for
                members and are marked as such.
              </p>
            </div>

            <div ref={controlsRef} data-reveal className="flex flex-col gap-3 lg:items-end" style={HIDDEN}>
              <div className="relative w-full max-w-sm">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                  <SearchIcon />
                </span>
                <label htmlFor="store-search" className="sr-only">
                  Search the store
                </label>
                <input
                  id="store-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search the store"
                  className="w-full rounded-full border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm font-normal text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-green-200"
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="store-sort" className="sr-only">
                  Sort
                </label>
                <select
                  id="store-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-normal text-neutral-800 focus:outline-none focus:ring-2 focus:ring-green-200"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-neutral-600">
                  {isLoading ? "Loading…" : `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {(["all", ...CATEGORIES] as const).map((c) => {
              const on = c === category;
              const color = c === "all" ? "#0a0a0a" : CATEGORY_COLOR[c];
              const n = c === "all" ? products.length : counts.get(c) ?? 0;
              return (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  aria-pressed={on}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-normal transition-colors"
                  style={{
                    borderColor: on ? color : "#e5e5e5",
                    background: on ? `${color}14` : "#ffffff",
                    color: on ? "#0a0a0a" : "#525252",
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
                  {c === "all" ? "Everything" : CATEGORY_LABEL[c]}
                  {n > 0 && <span className="text-neutral-400">{n}</span>}
                </button>
              );
            })}
          </div>

          <div ref={gridRef} data-reveal className="mt-10" style={HIDDEN}>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[24rem] animate-pulse rounded-[1.75rem] bg-neutral-200/70" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-normal text-neutral-900">
                  {products.length === 0 ? "The store is not stocked yet." : "Nothing matches that search."}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-neutral-600">
                  {products.length === 0
                    ? "Club apparel and publications are on the way. Until then, a donation is the most direct way to back the programs."
                    : "Try a different word, or show everything."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {products.length === 0 ? (
                    <Link href="/donate" className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white" style={{ background: EKO.green }}>
                      Make a donation
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        setCategory("all");
                        setSearch("");
                      }}
                      className="inline-flex items-center rounded-full px-6 py-3 text-sm font-normal text-white"
                      style={{ background: EKO.green }}
                    >
                      Show everything
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Call to action ─── */}
      <section className="relative overflow-hidden bg-neutral-950 px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 opacity-10" style={{ background: EKO.yellow }} />
        <div className="relative mx-auto max-w-4xl text-center">
          <div ref={ctaTextRef} data-reveal style={HIDDEN}>
            <div className="flex justify-center">
              <QuadBar />
            </div>
            <h2 className="mt-6 text-4xl font-normal tracking-[-0.04em] text-white sm:text-5xl">
              Every order funds a <span style={{ color: EKO.yellow }}>program</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              The store is one of the ways the club pays for what it does. See where the money goes, or give directly.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <div ref={ctaLeftRef} data-reveal style={HIDDEN}>
              <Link
                href="/projects"
                className="inline-flex items-center rounded-full px-7 py-3.5 text-sm font-normal text-white transition-transform duration-300 hover:-translate-y-0.5"
                style={{ background: EKO.green }}
              >
                See where it goes
              </Link>
            </div>
            <div ref={ctaRightRef} data-reveal style={HIDDEN}>
              <Link
                href="/donate"
                className="inline-flex items-center rounded-full border border-white/25 bg-white/8 px-7 py-3.5 text-sm font-normal text-white backdrop-blur-md transition-colors hover:bg-white/12"
              >
                Make a donation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
