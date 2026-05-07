"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useOrders } from "@/context/OrdersContext";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const { getByOrderNumber } = useOrders();
  const order = ref ? getByOrderNumber(ref) : null;

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 text-center">
        <p className="text-5xl">🔍</p>
        <h1 className="text-2xl font-bold text-(--color-neutral-900)">Order not found</h1>
        <p className="text-(--color-neutral-500) text-sm">Your order may still be processing. Check your email or visit your account.</p>
        <Link href="/store" className="px-6 py-3 bg-(--color-green-600) text-white rounded-xl font-semibold text-sm hover:bg-(--color-green-700) transition-colors">
          Back to Store
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50) flex items-start justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" as const }}
        className="w-full max-w-lg"
      >
        {/* Success header */}
        <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-8 text-center mb-5">
          <div className="w-16 h-16 bg-(--color-green-100) rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            ✅
          </div>
          <h1 className="text-2xl font-extrabold text-(--color-neutral-900) mb-2">Order Placed!</h1>
          <p className="text-(--color-neutral-600) text-sm mb-4">
            Thank you, <span className="font-semibold">{order.customerName}</span>! We've received your order and will process it shortly.
          </p>
          <div className="bg-(--color-green-50) border border-(--color-green-200) rounded-xl px-4 py-3 inline-block">
            <p className="text-xs text-(--color-green-700) font-semibold uppercase tracking-wide">Order Number</p>
            <p className="text-xl font-extrabold text-(--color-green-800)">{order.orderNumber}</p>
          </div>
        </div>

        {/* Order details */}
        <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6 mb-5">
          <h2 className="font-bold text-(--color-neutral-900) mb-4 text-sm uppercase tracking-wide">Order Details</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span className="text-(--color-neutral-700)">
                  {item.productName}
                  <span className="text-(--color-neutral-400) ml-1">×{item.quantity}</span>
                </span>
                <span className="font-semibold text-(--color-neutral-800)">{formatNaira(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-(--color-neutral-200) mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-(--color-neutral-600)">
              <span>Subtotal</span><span>{formatNaira(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-(--color-neutral-600)">
              <span>Shipping</span>
              <span className={order.shippingFee === 0 ? "text-(--color-green-700) font-semibold" : ""}>
                {order.shippingFee === 0 ? "FREE" : formatNaira(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-(--color-neutral-200) pt-2">
              <span>Total Paid</span>
              <span className="text-(--color-green-700)">{formatNaira(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        {order.shippingAddress && (
          <div className="bg-white border border-(--color-neutral-200) rounded-2xl p-6 mb-5 text-sm">
            <h2 className="font-bold text-(--color-neutral-900) mb-3 text-sm uppercase tracking-wide">Shipping To</h2>
            <p className="text-(--color-neutral-700)">{order.shippingAddress.fullName}</p>
            <p className="text-(--color-neutral-500)">{order.shippingAddress.address}</p>
            <p className="text-(--color-neutral-500)">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
            <p className="text-(--color-neutral-500)">{order.shippingAddress.phone}</p>
            <p className="text-(--color-neutral-400) text-xs mt-2">Order placed {formatDate(order.createdAt)}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/store"
            className="flex-1 text-center py-3 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-bold rounded-xl text-sm transition-colors"
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="flex-1 text-center py-3 border border-(--color-neutral-300) hover:bg-(--color-neutral-50) text-(--color-neutral-700) font-semibold rounded-xl text-sm transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-(--color-neutral-400) text-sm animate-pulse">Loading…</span>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
