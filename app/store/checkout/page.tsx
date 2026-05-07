"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useOrders } from "@/context/OrdersContext";
import { useAuth } from "@/context/AuthContext";
import type { PaymentMethod } from "@/lib/models/order";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string; desc: string }[] = [
  { value: "card", label: "Debit / Credit Card", icon: "💳", desc: "Visa, Mastercard, Verve" },
  { value: "bank-transfer", label: "Bank Transfer", icon: "🏦", desc: "Transfer to Eko Club Philadelphia account" },
  { value: "ussd", label: "USSD", icon: "📱", desc: "Dial *737# or *966#" },
];

type Step = "shipping" | "payment" | "processing";

interface ShippingForm {
  fullName: string; email: string; phone: string;
  address: string; city: string; state: string;
}

const EMPTY_SHIPPING: ShippingForm = {
  fullName: "", email: "", phone: "", address: "", city: "", state: "Lagos",
};

/* ─── Step indicator ──────────────────────────────── */
function StepBar({ step }: { step: Step }) {
  const steps = [
    { key: "shipping", label: "Shipping" },
    { key: "payment", label: "Payment" },
    { key: "processing", label: "Confirm" },
  ];
  const idx = steps.findIndex(s => s.key === step);
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            i < idx ? "bg-(--color-green-600) text-white"
            : i === idx ? "bg-(--color-green-600) text-white ring-4 ring-(--color-green-100)"
            : "bg-(--color-neutral-200) text-(--color-neutral-500)"
          }`}>
            {i < idx ? "✓" : i + 1}
          </div>
          <span className={`text-sm font-semibold ${i === idx ? "text-(--color-neutral-900)" : "text-(--color-neutral-400)"}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`w-8 h-0.5 mx-1 ${i < idx ? "bg-(--color-green-500)" : "bg-(--color-neutral-200)"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Field ───────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-(--color-neutral-700) mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  const { error, className, ...rest } = props;
  return (
    <input
      className={`w-full text-gray-400 px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) transition-shadow ${
        error ? "border-red-400 bg-red-50" : "border-(--color-neutral-300) bg-white"
      } ${className ?? ""}`}
      {...rest}
    />
  );
}

/* ─── Order summary sidebar ───────────────────────── */
function OrderSummary() {
  const { items, subtotal, shippingFee, total } = useCart();
  return (
    <div className="bg-(--color-neutral-50) border border-(--color-neutral-200) rounded-2xl p-5">
      <h3 className="text-sm font-bold text-(--color-neutral-900) mb-4">Order Summary</h3>
      <div className="space-y-3 mb-4">
        {items.map(item => (
          <div key={item.productId} className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-(--color-neutral-200) shrink-0">
              {item.imageUrl && <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="40px" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-(--color-neutral-800) line-clamp-1">{item.name}</p>
              <p className="text-xs text-(--color-neutral-500)">×{item.quantity}</p>
            </div>
            <p className="text-xs font-bold text-(--color-neutral-700) shrink-0">{formatNaira(item.price * item.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-(--color-neutral-200) pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-(--color-neutral-600)">
          <span>Subtotal</span><span className="font-semibold">{formatNaira(subtotal)}</span>
        </div>
        <div className="flex justify-between text-(--color-neutral-600)">
          <span>Shipping</span>
          <span className={`font-semibold ${shippingFee === 0 ? "text-(--color-green-700)" : ""}`}>
            {shippingFee === 0 ? "FREE" : formatNaira(shippingFee)}
          </span>
        </div>
        <div className="flex justify-between font-bold pt-1 border-t border-(--color-neutral-200)">
          <span>Total</span>
          <span className="text-(--color-green-700)">{formatNaira(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, shippingFee, total, clearCart } = useCart();
  const { add: addOrder } = useOrders();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<Step>("shipping");
  const [shipping, setShipping] = useState<ShippingForm>({
    ...EMPTY_SHIPPING,
    fullName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "",
    email: currentUser?.email ?? "",
    phone: currentUser?.phone ?? "",
  });
  const [errors, setErrors] = useState<Partial<ShippingForm>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-5xl">🛒</p>
        <p className="font-bold text-(--color-neutral-900)">Your cart is empty.</p>
        <Link href="/store" className="px-5 py-2.5 bg-(--color-green-600) text-white rounded-xl font-semibold text-sm hover:bg-(--color-green-700)">Go to Store</Link>
      </div>
    );
  }

  /* Validation */
  function validateShipping(): boolean {
    const e: Partial<ShippingForm> = {};
    if (!shipping.fullName.trim()) e.fullName = "Full name is required";
    if (!shipping.email.trim() || !/\S+@\S+\.\S+/.test(shipping.email)) e.email = "Valid email required";
    if (!shipping.phone.trim()) e.phone = "Phone is required";
    if (!shipping.address.trim()) e.address = "Address is required";
    if (!shipping.city.trim()) e.city = "City is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleShippingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validateShipping()) setStep("payment");
  }

  async function handlePlaceOrder() {
    setStep("processing");
    setProcessing(true);

    // Simulate payment processing
    await new Promise(r => setTimeout(r, 2000));

    const order = addOrder({
      userId: currentUser?.id,
      customerName: shipping.fullName,
      customerEmail: shipping.email,
      items: items.map(i => ({
        productId: i.productId,
        productName: i.name,
        imageUrl: i.imageUrl,
        price: i.price,
        quantity: i.quantity,
        subtotal: i.price * i.quantity,
      })),
      subtotal,
      shippingFee,
      discount: 0,
      shippingAddress: {
        fullName: shipping.fullName,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        country: "Nigeria",
      },
      paymentMethod,
      paymentReference: `PAY-${Date.now()}`,
    } as Parameters<typeof addOrder>[0]);

    clearCart();
    router.push(`/store/order-success?ref=${order.orderNumber}`);
  }

  return (
    <div className="min-h-screen bg-(--color-neutral-50)">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-(--color-neutral-200)">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2 text-xs text-(--color-neutral-500)">
          <Link href="/store" className="hover:text-(--color-green-700)">Store</Link>
          <span>/</span>
          <Link href="/store/cart" className="hover:text-(--color-green-700)">Cart</Link>
          <span>/</span>
          <span className="text-(--color-neutral-700)">Checkout</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-extrabold text-(--color-neutral-900) mb-2">Checkout</h1>
        <StepBar step={step} />

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left panel */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* ── Step 1: Shipping ── */}
              {step === "shipping" && (
                <motion.form
                  key="shipping"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25, ease: "easeOut" as const }}
                  onSubmit={handleShippingSubmit}
                  className="bg-white border border-(--color-neutral-200) rounded-2xl p-6 space-y-4"
                >
                  <h2 className="font-bold text-(--color-neutral-900) text-base mb-2">Shipping Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Full Name *" error={errors.fullName}>
                      <Input
                        value={shipping.fullName}
                        onChange={e => setShipping(s => ({ ...s, fullName: e.target.value }))}
                        placeholder="Tunde Adeyemi"
                        error={!!errors.fullName}
                      />
                    </Field>
                    <Field label="Email Address *" error={errors.email}>
                      <Input
                        type="email"
                        value={shipping.email}
                        onChange={e => setShipping(s => ({ ...s, email: e.target.value }))}
                        placeholder="tunde@email.com"
                        error={!!errors.email}
                      />
                    </Field>
                    <Field label="Phone Number *" error={errors.phone}>
                      <Input
                        type="tel"
                        value={shipping.phone}
                        onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))}
                        placeholder="080xxxxxxxx"
                        error={!!errors.phone}
                      />
                    </Field>
                    <Field label="State *">
                      <select
                        value={shipping.state}
                        onChange={e => setShipping(s => ({ ...s, state: e.target.value }))}
                        className="w-full px-3 text-gray-400 py-2.5 text-sm border border-(--color-neutral-300) rounded-xl focus:outline-none focus:ring-2 focus:ring-(--color-green-400) bg-white"
                      >
                        {NIGERIAN_STATES.map(st => <option key={st}>{st}</option>)}
                      </select>
                    </Field>
                    <Field label="City *" error={errors.city}>
                      <Input
                        value={shipping.city}
                        onChange={e => setShipping(s => ({ ...s, city: e.target.value }))}
                        placeholder="Surulere"
                        error={!!errors.city}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Street Address *" error={errors.address}>
                        <Input
                          value={shipping.address}
                          onChange={e => setShipping(s => ({ ...s, address: e.target.value }))}
                          placeholder="45 Bode Thomas Street"
                          error={!!errors.address}
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-bold rounded-xl text-sm transition-colors"
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </motion.form>
              )}

              {/* ── Step 2: Payment ── */}
              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25, ease: "easeOut" as const }}
                  className="bg-white border border-(--color-neutral-200) rounded-2xl p-6"
                >
                  <h2 className="font-bold text-(--color-neutral-900) text-base mb-4">Payment Method</h2>
                  <div className="space-y-3 mb-6">
                    {PAYMENT_METHODS.map(pm => (
                      <button
                        key={pm.value}
                        onClick={() => setPaymentMethod(pm.value)}
                        className={`w-full flex items-center gap-4 p-4 border rounded-xl text-left transition-all ${
                          paymentMethod === pm.value
                            ? "border-(--color-green-500) bg-(--color-green-50) shadow-sm"
                            : "border-(--color-neutral-200) hover:border-(--color-neutral-300)"
                        }`}
                      >
                        <span className="text-2xl">{pm.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-(--color-neutral-900)">{pm.label}</p>
                          <p className="text-xs text-(--color-neutral-500)">{pm.desc}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          paymentMethod === pm.value
                            ? "border-(--color-green-600) bg-(--color-green-600)"
                            : "border-(--color-neutral-300)"
                        }`} />
                      </button>
                    ))}
                  </div>

                  {/* Shipping review */}
                  <div className="bg-(--color-neutral-50) rounded-xl p-4 mb-6 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-(--color-neutral-800)">{shipping.fullName}</p>
                        <p className="text-(--color-neutral-500)">{shipping.address}, {shipping.city}, {shipping.state}</p>
                        <p className="text-(--color-neutral-500)">{shipping.phone} · {shipping.email}</p>
                      </div>
                      <button
                        onClick={() => setStep("shipping")}
                        className="text-xs text-(--color-green-700) font-semibold hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("shipping")}
                      className="px-4 text-gray-400 py-2.5 border border-(--color-neutral-300) rounded-xl text-sm font-semibold hover:bg-(--color-neutral-50) transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={handlePlaceOrder}
                      className="flex-1 py-2.5 bg-(--color-green-600) hover:bg-(--color-green-700) text-white font-bold rounded-xl text-sm transition-colors"
                    >
                      Place Order · {formatNaira(total)}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── Step 3: Processing ── */}
              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" as const }}
                  className="bg-white border border-(--color-neutral-200) rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
                >
                  <div className="w-14 h-14 border-4 border-(--color-green-200) border-t-(--color-green-600) rounded-full animate-spin" />
                  <p className="text-lg font-bold text-(--color-neutral-900)">Processing your order…</p>
                  <p className="text-sm text-(--color-neutral-500)">Please don't close this page.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: order summary */}
          <div className="lg:w-72 shrink-0">
            <OrderSummary />
          </div>
        </div>
      </div>
    </div>
  );
}
