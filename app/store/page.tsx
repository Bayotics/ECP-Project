"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import type { ProductCategory, Product } from "@/lib/models/product";

/* ─── Constants ───────────────────────────────────── */
const CATEGORY_LABELS: Record<ProductCategory | "all", string> = {
  all: "All",
  apparel: "Apparel",
  accessories: "Accessories",
  stationery: "Stationery",
  publications: "Publications",
  digital: "Digital",
  other: "Other",
};
const ALL_CATS: Array<ProductCategory | "all"> = [
  "all", "apparel", "accessories", "stationery", "publications", "digital", "other",
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

/* ─── Product card ────────────────────────────────── */
function ProductCard({ product }: { product: Product }) {
  const { addItem, hasItem, getQty } = useCart();
  const inCart = hasItem(product.id);
  const qty = getQty(product.id);
  const outOfStock = product.status === "out-of-stock" || product.stock === 0;

  function addToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      slug: product.slug,
    });
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: "easeOut" as const }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-(--color-neutral-200) hover:shadow-md transition-shadow flex flex-col"
    >
      <Link href={`/store/${product.slug}`} className="block relative">
        <div className="relative h-52 overflow-hidden bg-(--color-neutral-100)">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-(--color-neutral-300)">🛍️</div>
          )}
          {product.isFeatured && (
            <span className="absolute top-2 left-2 bg-(--color-green-600) text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Featured
            </span>
          )}
          {product.compareAtPrice && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Sale
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-white border border-(--color-neutral-300) text-xs font-semibold px-3 py-1 rounded-full text-(--color-neutral-500)">Out of stock</span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        <span className="text-xs font-semibold text-(--color-neutral-400) uppercase tracking-wide mb-1">
          {CATEGORY_LABELS[product.category]}
        </span>
        <Link href={`/store/${product.slug}`}>
          <h3 className="text-sm font-bold text-(--color-neutral-900) hover:text-(--color-green-700) transition-colors leading-snug mb-2 line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-3 mt-auto">
          <span className="text-base font-extrabold text-(--color-green-700)">{formatNaira(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-(--color-neutral-400) line-through">{formatNaira(product.compareAtPrice)}</span>
          )}
        </div>
        <button
          onClick={addToCart}
          disabled={outOfStock}
          className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${
            outOfStock
              ? "bg-(--color-neutral-100) text-(--color-neutral-400) cursor-not-allowed"
              : inCart
              ? "bg-(--color-green-100) text-(--color-green-800) hover:bg-(--color-green-200)"
              : "bg-(--color-green-600) text-white hover:bg-(--color-green-700)"
          }`}
        >
          {outOfStock ? "Out of Stock" : inCart ? `✓ In Cart (${qty})` : "Add to Cart"}
        </button>
      </div>
    </motion.article>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function StorePage() {
  const { getActive } = useProducts();
  const { itemCount } = useCart();
  const products = getActive();

  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [sort, setSort] = useState("featured");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = category === "all" ? products : products.filter(p => p.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.shortDescription ?? "").toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case "price-asc": return [...list].sort((a, b) => a.price - b.price);
      case "price-desc": return [...list].sort((a, b) => b.price - a.price);
      case "name": return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default: return [...list].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
  }, [products, category, sort, search]);

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Hero */}
      <section className="bg-white border-b border-(--color-neutral-200) py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-(--color-neutral-900) mb-2">ECP Store</h1>
            <p className="text-(--color-neutral-600) max-w-md">
              Official merchandise, publications, and digital resources. Purchases support Eko Club Philadelphia's community programmes.
            </p>
          </div>
          <Link
            href="/store/cart"
            className="flex items-center gap-2 px-5 py-2.5 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-semibold rounded-xl text-sm transition-colors shrink-0"
          >
            🛒 Cart
            {itemCount > 0 && (
              <span className="bg-white text-(--color-green-700) text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </section>

      {/* Filters bar */}
      <section className="bg-white border-b border-(--color-neutral-200) sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-neutral-400) text-sm">🔍</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-8 pr-4 py-2 text-sm border border-(--color-neutral-300) rounded-xl bg-(--color-neutral-50) focus:outline-none focus:ring-2 focus:ring-(--color-green-400)"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 flex-wrap">
            {ALL_CATS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                  category === cat
                    ? "bg-(--color-green-600) text-white"
                    : "bg-(--color-neutral-100) text-(--color-neutral-600) hover:bg-(--color-neutral-200)"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="ml-auto text-sm border border-(--color-neutral-300) rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-(--color-green-400) shrink-0"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Product grid */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <p className="text-sm text-(--color-neutral-500) mb-5">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-(--color-neutral-500)">
            <p className="text-4xl mb-3">🛍️</p>
            <p className="font-semibold">No products found.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </AnimatePresence>
          </motion.div>
        )}
      </section>
    </div>
  );
}
