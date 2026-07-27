"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useProducts } from "@/context/ProductsContext";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/models/product";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

/* ─── Related card ────────────────────────────────── */
function RelatedCard({ product }: { product: Product }) {
  return (
    <Link href={`/store/${product.slug}`} className="group block bg-white rounded-xl overflow-hidden border border-(--color-neutral-200) hover:shadow-sm transition-shadow">
      <div className="relative h-36 bg-(--color-neutral-100)">
        {product.imageUrl ? (
          <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-400" sizes="200px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-(--color-neutral-300)">🛍️</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-(--color-neutral-800) line-clamp-2 group-hover:text-(--color-green-700) transition-colors">{product.name}</p>
        <p className="text-sm font-bold text-(--color-green-700) mt-1">{formatNaira(product.price)}</p>
      </div>
    </Link>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const { getBySlug, getByCategory, isLoading } = useProducts();
  const { addItem, hasItem, getQty, itemCount } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const product = getBySlug(params.slug);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-(--color-neutral-400) text-sm animate-pulse">Loading…</span>
    </div>
  );
  if (!product || product.status === "discontinued" || product.status === "draft") {
    notFound(); return null;
  }

  const outOfStock = product.status === "out-of-stock" || product.stock === 0;
  const inCart = hasItem(product.id);
  const related = getByCategory(product.category)
    .filter(p => p.id !== product.id && p.status === "active")
    .slice(0, 4);

  function handleAddToCart() {
    addItem({
      productId: product!.id,
      name: product!.name,
      price: product!.price,
      imageUrl: product!.imageUrl,
      slug: product!.slug,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-(--color-neutral-200)">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-(--color-neutral-500)">
          <Link href="/" className="hover:text-(--color-green-700) transition-colors">Home</Link>
          <span>/</span>
          <Link href="/store" className="hover:text-(--color-green-700) transition-colors">Store</Link>
          <span>/</span>
          <span className="text-(--color-neutral-700) line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Main product section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-(--color-neutral-100)">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-(--color-neutral-300)">🛍️</div>
            )}
            {product.compareAtPrice && (
              <span className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase">Sale</span>
            )}
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="flex flex-col"
          >
            <span className="text-xs font-bold text-(--color-green-600) uppercase tracking-widest mb-2">{product.category}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-(--color-neutral-900) mb-3 leading-tight">{product.name}</h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold text-(--color-green-700)">{formatNaira(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-(--color-neutral-400) line-through">{formatNaira(product.compareAtPrice)}</span>
              )}
              {product.compareAtPrice && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  Save {formatNaira(product.compareAtPrice - product.price)}
                </span>
              )}
            </div>

            <p className="text-(--color-neutral-600) text-sm leading-relaxed mb-6">{product.description}</p>

            {/* Stock */}
            <p className={`text-sm font-semibold mb-4 ${outOfStock ? "text-red-600" : "text-(--color-green-700)"}`}>
              {outOfStock ? "Out of Stock" : `In Stock (${product.stock} available)`}
            </p>

            {/* Quantity + Add */}
            {!outOfStock && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center border border-(--color-neutral-300) rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="px-3 py-2 hover:bg-(--color-neutral-100) transition-colors text-sm font-bold"
                  >−</button>
                  <span className="px-4 py-2 text-sm font-semibold border-x border-(--color-neutral-300)">{qty}</span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    className="px-3 py-2 hover:bg-(--color-neutral-100) transition-colors text-sm font-bold"
                  >+</button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    added
                      ? "bg-(--color-green-100) text-(--color-green-800)"
                      : "bg-(--color-green-600) hover:bg-(--color-green-700) text-white"
                  }`}
                >
                  {added ? "✓ Added to Cart!" : inCart ? "Add More to Cart" : "Add to Cart"}
                </button>
              </div>
            )}

            {/* Go to cart */}
            {(inCart || added) && (
              <Link
                href="/store/cart"
                className="text-sm text-(--color-green-700) font-semibold hover:underline mb-4 inline-block"
              >
                View Cart ({getQty(product.id) || qty} item{getQty(product.id) !== 1 ? "s" : ""}) →
              </Link>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {product.tags.map(tag => (
                  <span key={tag} className="text-xs px-2.5 py-0.5 bg-(--color-neutral-100) text-(--color-neutral-500) rounded-full">#{tag}</span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-(--color-neutral-900) mb-5">More in {product.category}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {related.map(p => <RelatedCard key={p.id} product={p} />)}
            </div>
          </div>
        )}

        {/* Floating cart pill */}
        {itemCount > 0 && (
          <Link
            href="/store/cart"
            className="fixed bottom-6 right-6 bg-(--color-green-600) hover:bg-(--color-green-700) text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 text-sm font-bold transition-colors z-30"
          >
            🛒 Cart · {itemCount}
          </Link>
        )}
      </div>
    </div>
  );
}
