"use client";

import { useState, useEffect } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMethodKey = "paystack" | "paypal" | "zelle" | "bank-transfer";

export interface PaymentResult {
  method: PaymentMethodKey;
  reference: string;
  captureId?: string;
  zelleRef?: string;
}

interface PaymentWidgetProps {
  amountNGN: number;
  email: string;
  name: string;
  phone?: string;
  description: string;
  context: "donation" | "dues" | "order";
  recordId: string;
  enableAutoRenew?: boolean;
  defaultAutoRenew?: boolean;
  onSuccess: (result: PaymentResult, autoRenew?: boolean) => void;
  onError?: (error: string) => void;
}

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

const USD_RATE = 1600;

const METHODS: { key: PaymentMethodKey; label: string; icon: string; desc: string }[] = [
  { key: "paystack", label: "Paystack", icon: "💳", desc: "Card, Bank Transfer, USSD — Nigerian payments" },
  { key: "paypal",   label: "PayPal",   icon: "🅿️", desc: "International payments in USD" },
  { key: "zelle",    label: "Zelle",    icon: "🏦", desc: "US bank transfer (manual confirmation)" },
  { key: "bank-transfer", label: "Bank Transfer", icon: "🏛️", desc: "Direct transfer to ECP account" },
];

// ─── Paystack Inline ──────────────────────────────────────────────────────────

function usePaystackScript() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as Record<string, unknown>).PaystackPop) { setReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);
  return ready;
}

// ─── Main Widget ──────────────────────────────────────────────────────────────

export default function PaymentWidget({
  amountNGN, email, name, phone, description, context, recordId,
  enableAutoRenew, defaultAutoRenew, onSuccess, onError,
}: PaymentWidgetProps) {
  const [method, setMethod] = useState<PaymentMethodKey>("paystack");
  const [autoRenew, setAutoRenew] = useState(defaultAutoRenew ?? false);
  const [busy, setBusy] = useState(false);
  const [zelleRef, setZelleRef] = useState("");
  const [zelleSubmitted, setZelleSubmitted] = useState(false);
  const paystackReady = usePaystackScript();
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  // ── Paystack ────────────────────────────────────────────────────────────────

  async function handlePaystack() {
    setBusy(true);
    try {
      const initRes = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, amountNGN, context, metadata: { recordId } }),
      });
      const init = await initRes.json() as { ok: boolean; data?: { access_code: string; reference: string }; error?: string };
      if (!init.ok || !init.data) throw new Error(init.error ?? "Failed to initialize Paystack");

      const { access_code, reference } = init.data;

      // Open Paystack popup
      const PaystackPop = (window as unknown as Record<string, unknown>).PaystackPop as {
        setup: (opts: Record<string, unknown>) => { openIframe: () => void };
      };

      const handler = PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amountNGN * 100),
        ref: reference,
        access_code,
        metadata: { name, phone, recordId, context },
        onSuccess: async (trx: { reference: string }) => {
          setBusy(true);
          const verRes = await fetch("/api/payments/paystack/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: trx.reference, context, recordId }),
          });
          const ver = await verRes.json() as { ok: boolean; error?: string };
          setBusy(false);
          if (ver.ok) {
            onSuccess({ method: "paystack", reference: trx.reference }, autoRenew);
          } else {
            onError?.(ver.error ?? "Verification failed");
          }
        },
        onClose: () => { setBusy(false); },
      });

      handler.openIframe();
    } catch (err) {
      setBusy(false);
      onError?.(err instanceof Error ? err.message : "Paystack error");
    }
  }

  // ── Zelle ────────────────────────────────────────────────────────────────────

  async function handleZelleSubmit() {
    setBusy(true);
    try {
      const res = await fetch(context === "dues" ? "/api/dues" : "/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "zelle" }),
      });
      const json = await res.json() as { ok: boolean; data?: { zelleRef?: string; id?: string }; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Failed");
      const ref = json.data?.zelleRef ?? `ECP-ZELLE-${Date.now()}`;
      setZelleRef(ref);
      setZelleSubmitted(true);
      onSuccess({ method: "zelle", reference: ref, zelleRef: ref }, autoRenew);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Zelle submission failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Method selector */}
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Select Payment Method</p>
        <div className="grid grid-cols-2 gap-2">
          {METHODS.map(m => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={`flex items-start gap-2 p-3 rounded-xl border text-left transition-all ${
                method === m.key
                  ? "border-green-500 bg-green-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <span className="text-xl shrink-0">{m.icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                <p className="text-xs text-gray-400 leading-tight">{m.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Auto-renew option */}
      {enableAutoRenew && (
        <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-green-300 transition-colors">
          <input type="checkbox" checked={autoRenew} onChange={e => setAutoRenew(e.target.checked)} className="mt-0.5 accent-green-600" />
          <div>
            <p className="text-sm font-semibold text-gray-700">Enable Auto-Renewal</p>
            <p className="text-xs text-gray-400">Your payment will be automatically renewed. You can cancel at any time from your portal.</p>
          </div>
        </label>
      )}

      {/* ── Paystack ── */}
      {method === "paystack" && (
        <button
          type="button"
          onClick={handlePaystack}
          disabled={busy || !paystackReady}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors"
        >
          {busy ? "Processing…" : `Pay ${formatNaira(amountNGN)} with Paystack`}
        </button>
      )}

      {/* ── PayPal ── */}
      {method === "paypal" && paypalClientId && (
        <div>
          <p className="text-xs text-gray-500 mb-2">
            Paying <strong>${(amountNGN / USD_RATE).toFixed(2)} USD</strong> (≈ {formatNaira(amountNGN)})
          </p>
          <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
              createOrder={async () => {
                const res = await fetch("/api/payments/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amountNGN, description, invoiceId: recordId }),
                });
                const json = await res.json() as { ok: boolean; data?: { orderId: string }; error?: string };
                if (!json.ok) throw new Error(json.error ?? "Failed to create PayPal order");
                return json.data!.orderId;
              }}
              onApprove={async (data) => {
                setBusy(true);
                const res = await fetch("/api/payments/paypal/capture", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paypalOrderId: data.orderID, context, recordId }),
                });
                const json = await res.json() as { ok: boolean; data?: { captureId: string }; error?: string };
                setBusy(false);
                if (json.ok) {
                  onSuccess({ method: "paypal", reference: data.orderID, captureId: json.data?.captureId }, autoRenew);
                } else {
                  onError?.(json.error ?? "PayPal capture failed");
                }
              }}
              onError={() => { onError?.("PayPal payment failed. Please try again."); }}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {method === "paypal" && !paypalClientId && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-800">
          PayPal is not configured on this site. Please use Paystack or contact admin.
        </div>
      )}

      {/* ── Zelle ── */}
      {method === "zelle" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 space-y-2">
            <p className="text-sm font-bold text-blue-800">Send via Zelle</p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Zelle recipient:</span>{" "}
              {process.env.NEXT_PUBLIC_ZELLE_EMAIL ?? "payments@ecp.org"}
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Name:</span> Eko Club Philadelphia
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Amount:</span>{" "}
              ${(amountNGN / USD_RATE).toFixed(2)} USD (≈ {formatNaira(amountNGN)})
            </p>
            <p className="text-xs text-blue-600 bg-blue-100 rounded-lg px-3 py-2 mt-2">
              📝 Include your name and email in the Zelle memo so we can identify your payment.
              Your payment will be confirmed within 1–2 business days.
            </p>
          </div>
          {!zelleSubmitted ? (
            <button
              type="button"
              onClick={handleZelleSubmit}
              disabled={busy}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors"
            >
              {busy ? "Submitting…" : "I've sent the Zelle payment →"}
            </button>
          ) : (
            <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-700">
              ✅ Zelle submission recorded. Reference: <strong>{zelleRef}</strong>. We'll confirm within 1–2 business days.
            </div>
          )}
        </div>
      )}

      {/* ── Bank Transfer ── */}
      {method === "bank-transfer" && (
        <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-sm">
          <p className="font-bold text-gray-800">Bank Transfer Details</p>
          <p className="text-gray-700"><span className="font-semibold">Bank:</span> {process.env.NEXT_PUBLIC_BANK_NAME ?? "First Bank"}</p>
          <p className="text-gray-700"><span className="font-semibold">Account:</span> {process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "0123456789"}</p>
          <p className="text-gray-700"><span className="font-semibold">Name:</span> Eko Club Philadelphia</p>
          <p className="text-gray-700"><span className="font-semibold">Amount:</span> {formatNaira(amountNGN)}</p>
          <p className="text-xs text-gray-500 mt-2 bg-gray-100 rounded-lg px-3 py-2">
            Use your name as narration. Forward your transfer receipt to{" "}
            {process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "admin@ecp.org"} for confirmation.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">🔒 Secure payment. Eko Club Philadelphia is a registered non-profit organisation.</p>
    </div>
  );
}
