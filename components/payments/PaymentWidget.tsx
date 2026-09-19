"use client";

/* Payment methods for dues, donations and store orders.
 *
 * Everything is in US dollars. Paystack used to sit at the top of this list
 * but it settles in naira and is charged in kobo, so it cannot take a dollar
 * payment; it was removed. "paystack" survives in PaymentMethodKey only so
 * records written before the change still read back. */

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { cn } from "@/utils/cn";
import { EKO } from "@/lib/content/programs";

export type PaymentMethodKey = "paystack" | "paypal" | "zelle" | "bank-transfer";

export interface PaymentResult {
  method: PaymentMethodKey;
  reference: string;
  captureId?: string;
  zelleRef?: string;
}

interface PaymentWidgetProps {
  amountUSD: number;
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

export function formatUSD(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: n % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
}

type Selectable = Exclude<PaymentMethodKey, "paystack">;

const METHODS: { key: Selectable; label: string; desc: string }[] = [
  { key: "paypal", label: "PayPal", desc: "Card or PayPal balance, in US dollars" },
  { key: "zelle", label: "Zelle", desc: "US bank transfer, confirmed by the treasurer" },
  { key: "bank-transfer", label: "Bank transfer", desc: "Direct transfer to the club account" },
];

/* `email`, `name` and `phone` stay on the props because callers already
   pass them and a future method will want them; only Paystack read them,
   so nothing destructures them today. */
export default function PaymentWidget({
  amountUSD,
  description,
  context,
  recordId,
  enableAutoRenew,
  defaultAutoRenew,
  onSuccess,
  onError,
}: PaymentWidgetProps) {
  const [method, setMethod] = useState<Selectable>("paypal");
  const [autoRenew, setAutoRenew] = useState(defaultAutoRenew ?? false);
  const [busy, setBusy] = useState(false);
  const [zelleRef, setZelleRef] = useState("");
  const [zelleSubmitted, setZelleSubmitted] = useState(false);
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  async function handleZelleSubmit() {
    setBusy(true);
    try {
      const res = await fetch(context === "dues" ? "/api/dues" : "/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "zelle" }),
      });
      const json = (await res.json()) as { ok: boolean; data?: { zelleRef?: string; id?: string }; error?: string };
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
      <div>
        <p className="mb-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900">Choose how to pay</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {METHODS.map((m) => {
            const on = method === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMethod(m.key)}
                aria-pressed={on}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-colors",
                  on ? "border-green-600 bg-green-50" : "border-neutral-200 hover:border-neutral-400",
                )}
              >
                <span className="block text-sm font-normal text-neutral-950">{m.label}</span>
                <span className="mt-0.5 block text-xs leading-5 text-neutral-900">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {enableAutoRenew && (
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-3 transition-colors hover:border-neutral-400">
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => setAutoRenew(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-[#059669]"
          />
          <span>
            <span className="block text-sm font-normal text-neutral-950">Renew automatically</span>
            <span className="mt-0.5 block text-xs leading-5 text-neutral-900">
              You can cancel at any time from your portal.
            </span>
          </span>
        </label>
      )}

      {/* ── PayPal ── */}
      {method === "paypal" && paypalClientId && (
        <div>
          <p className="mb-2 text-xs text-neutral-900">
            Paying <strong className="font-normal text-neutral-950">{formatUSD(amountUSD)}</strong>
          </p>
          <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
            <PayPalButtons
              style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
              createOrder={async () => {
                const res = await fetch("/api/payments/paypal/create-order", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amountUSD, description, invoiceId: recordId }),
                });
                const json = (await res.json()) as { ok: boolean; data?: { orderId: string }; error?: string };
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
                const json = (await res.json()) as { ok: boolean; data?: { captureId: string }; error?: string };
                setBusy(false);
                if (json.ok) {
                  onSuccess({ method: "paypal", reference: data.orderID, captureId: json.data?.captureId }, autoRenew);
                } else {
                  onError?.(json.error ?? "PayPal capture failed");
                }
              }}
              onError={() => {
                onError?.("PayPal payment failed. Please try again.");
              }}
            />
          </PayPalScriptProvider>
        </div>
      )}

      {method === "paypal" && !paypalClientId && (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          PayPal is not configured on this site yet. Use Zelle or a bank transfer, or contact the treasurer.
        </p>
      )}

      {/* ── Zelle ── */}
      {method === "zelle" && (
        <div className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-normal text-blue-900">Send with Zelle</p>
            <p className="text-sm text-blue-900">
              <span className="text-blue-950">Recipient:</span> {process.env.NEXT_PUBLIC_ZELLE_EMAIL ?? "the club treasurer"}
            </p>
            <p className="text-sm text-blue-900">
              <span className="text-blue-950">Name:</span> Eko Club Philadelphia
            </p>
            <p className="text-sm text-blue-900">
              <span className="text-blue-950">Amount:</span> {formatUSD(amountUSD)}
            </p>
            <p className="mt-2 rounded-xl bg-blue-100 px-3 py-2 text-xs leading-6 text-blue-900">
              Put your name and email in the Zelle memo so we can match the payment. The treasurer confirms within one
              or two business days.
            </p>
          </div>
          {!zelleSubmitted ? (
            <button
              type="button"
              onClick={handleZelleSubmit}
              disabled={busy}
              className="w-full rounded-full py-3 text-sm font-normal text-white transition-opacity disabled:opacity-60"
              style={{ background: EKO.blue }}
            >
              {busy ? "Submitting…" : "I have sent the Zelle payment"}
            </button>
          ) : (
            <p className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900">
              Recorded. Your reference is <strong className="font-normal">{zelleRef}</strong>. We will confirm within one
              or two business days.
            </p>
          )}
        </div>
      )}

      {/* ── Bank transfer ── */}
      {method === "bank-transfer" && (
        <div className="space-y-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <p className="font-normal text-neutral-950">Bank transfer details</p>
          <p className="text-neutral-900">
            <span className="text-neutral-950">Bank:</span> {process.env.NEXT_PUBLIC_BANK_NAME ?? "Contact the treasurer"}
          </p>
          <p className="text-neutral-900">
            <span className="text-neutral-950">Account:</span> {process.env.NEXT_PUBLIC_BANK_ACCOUNT ?? "Contact the treasurer"}
          </p>
          <p className="text-neutral-900">
            <span className="text-neutral-950">Name:</span> Eko Club Philadelphia
          </p>
          <p className="text-neutral-900">
            <span className="text-neutral-950">Amount:</span> {formatUSD(amountUSD)}
          </p>
          <p className="mt-2 rounded-xl bg-neutral-100 px-3 py-2 text-xs leading-6 text-neutral-900">
            Use your name as the narration, and forward the receipt to{" "}
            {process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "the club"} so it can be matched.
          </p>
        </div>
      )}

      <p className="text-center text-xs text-neutral-900">
        Payments are handled by PayPal or your own bank. The club never sees your card details.
      </p>
    </div>
  );
}
