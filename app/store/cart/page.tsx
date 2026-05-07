"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function CartPage() {
  const { items, subtotal, shippingFee, total, updateQty, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-(--color-neutral-50) flex flex-col items-center justify-center gap-5 px-4">
        <p className="text-6xl">🛒</p>
        <h1 className="text-2xl font-bold text-(--color-neutral-900)">Your cart is empty</h1>
        <p className="text-(--color-neutral-500) text-sm">Browse our store and add some items.</p>
        <Link
          href="/store"
          className="px-6 py-3 bg-(--color-green-600) hover:bg-(--color-green-700) text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Go to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-(--color-neutral-200)">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-(--color-neutral-500)">
          <Link href="/" className="hover:text-(--color-green-700)">Home</Link>
          <span>/</span>
          <Link href="/store" className="hover:text-(--color-green-700)">Store</Link>
          <span>/</span>
          <span className="text-(--color-neutral-700)">Cart</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-(--color-neutral-900)">Your Cart</h1>
          <button
            onClick={clearCart}
            className="text-xs text-(--color-neutral-400) hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Items */}
          <div className="flex-1 space-y-3">
            <AnimatePresence initial={false}>
              {items.map(item => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" as const }}
                  className="bg-white border border-(--color-neutral-200) rounded-2xl p-4 flex gap-4"
                >
                  {/* Image */}
                  <Link href={`/store/${item.slug}`} className="shrink-0">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-(--color-neutral-100)">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link href={`/store/${item.slug}`}>
                      <p className="font-semibold text-(--color-neutral-900) hover:text-(--color-green-700) text-sm leading-snug line-clamp-2 transition-colors">
                        {item.name}
                      </p>
                    </Link>
                    <p className="text-sm font-bold text-(--color-green-700) mt-1">{formatNaira(item.price)}</p>
                  </div>

                  {/* Qty + remove */}
                  <div className="flex flex-col items-end justify-between shrink-0">
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-(--color-neutral-400) hover:text-red-500 text-xs transition-colors"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                    <div className="flex items-center border border-(--color-neutral-300) rounded-lg overflow-hidden mt-2">
                      <button
                        onClick={() => item.quantity === 1 ? removeItem(item.productId) : updateQty(item.productId, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-(--color-neutral-100) transition-colors text-sm font-bold"
                      >−</button>
                      <span className="px-3 py-1 text-sm font-semibold border-x border-(--color-neutral-300)">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.productId, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-(--color-neutral-100) transition-colors text-sm font-bold"
                      >+</button>
                    </div>
                    <p className="text-xs font-bold text-(--color-neutral-600) mt-1">{formatNaira(item.price * item.quantity)}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order summary */}
          <div className="lg:w-80 shrink-0">
            <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6 sticky top-24">
              <h2 className="text-base font-bold text-(--color-neutral-900) mb-5">Order Summary</h2>
              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between text-(--color-neutral-600)">
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatNaira(subtotal)}</span>
                </div>
                <div className="flex justify-between text-(--color-neutral-600)">
                  <span>Shipping</span>
                  <span className={`font-semibold ${shippingFee === 0 ? "text-(--color-green-700)" : ""}`}>
                    {shippingFee === 0 ? "FREE" : formatNaira(shippingFee)}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-xs text-(--color-neutral-400)">Free shipping on orders over ₦15,000</p>
                )}
                <div className="border-t border-(--color-neutral-200) pt-3 flex justify-between">
                  <span className="font-bold text-(--color-neutral-900)">Total</span>
                  <span className="font-extrabold text-(--color-green-700) text-base">{formatNaira(total)}</span>
                </div>
              </div>
              <Link
                href="/store/checkout"
                className="block w-full text-center py-3 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-bold rounded-xl text-sm transition-colors"
              >
                Proceed to Checkout →
              </Link>
              <Link
                href="/store"
                className="block w-full text-center mt-3 text-xs text-(--color-neutral-500) hover:text-(--color-green-700) transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
