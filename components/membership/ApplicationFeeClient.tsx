"use client";

/* The $100 non-refundable membership application fee.
 *
 * The club's form says "A $100 MEMBERSHIP APPLICATION NON-REFUNDABLE FEE IS
 * REQUIRED. Zelle to ekoclubphiladelphia@gmail.com". Zelle is kept exactly
 * as the club specified, and PayPal is offered beside it for applicants
 * without a US bank account.
 *
 * The two settle differently and the page says so rather than pretending
 * otherwise. A PayPal capture is money received. A Zelle transfer is
 * something the applicant has told us they sent, which the treasurer still
 * has to find in the club's account, so it reads "awaiting confirmation"
 * until they do.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { APPLICATION_FEE_USD } from "@/lib/models/membership";

const ZELLE_EMAIL = "ekoclubphiladelphia@gmail.com";
const MEMBERSHIP_EMAIL = "ekophillymembership@gmail.com";

type Phase = "choose" | "zelle-sent" | "paid";

export default function ApplicationFeeClient() {
  const params = useSearchParams();
  const applicationId = params.get("application") ?? "";

  const [method, setMethod] = useState<"paypal" | "zelle">("paypal");
  const [phase, setPhase] = useState<Phase>("choose");
  const [zelleRef, setZelleRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "";

  /* An application id is required: without it the fee cannot be recorded
     against anything, and taking money we cannot attribute is worse than
     refusing it. */
  const [missingId, setMissingId] = useState(false);
  useEffect(() => setMissingId(!applicationId), [applicationId]);

  const record = useCallback(
    async (payMethod: "paypal" | "zelle", reference?: string) => {
      const res = await fetch(`/api/membership-applications/${encodeURIComponent(applicationId)}/fee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: payMethod, reference }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) throw new Error(json.error ?? "Could not record the payment.");
    },
    [applicationId],
  );

  async function handleZelleDone() {
    setBusy(true);
    setError("");
    try {
      const ref = zelleRef.trim() || undefined;
      await record("zelle", ref);
      setPhase("zelle-sent");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record the payment.");
    } finally {
      setBusy(false);
    }
  }

  if (missingId) {
    return (
      <Panel>
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-950">We lost track of your application</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          This page needs to know which application the fee belongs to. Open the link from the end
          of the form again, or start the application afresh.
        </p>
        <Link
          href="/membership/apply"
          className="mt-5 inline-block rounded-full bg-green-600 px-6 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90"
        >
          Back to the application
        </Link>
      </Panel>
    );
  }

  if (phase === "paid" || phase === "zelle-sent") {
    const byZelle = phase === "zelle-sent";
    return (
      <Panel>
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
            <path d="m5 13 4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-medium tracking-[-0.02em] text-neutral-950">
          {byZelle ? "Thank you, we will confirm it" : "Application fee received"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-neutral-700">
          {byZelle ? (
            <>
              Your application is in, and we have noted that you sent ${APPLICATION_FEE_USD} by
              Zelle. The treasurer checks the club account and confirms it, usually within a few
              days. You do not need to do anything else.
            </>
          ) : (
            <>
              Your ${APPLICATION_FEE_USD} application fee is paid and your application is with the
              membership committee.
            </>
          )}
        </p>
        <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-800">
          One thing still to do: send your two written references to{" "}. *Ignore if done
          <a href={`mailto:${MEMBERSHIP_EMAIL}`} className="text-green-700 underline">{MEMBERSHIP_EMAIL}</a>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/membership/status"
            className="rounded-full bg-green-600 px-6 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90"
          >
            Track my application
          </Link>
          <Link
            href="/"
            className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
          >
            Back to the homepage
          </Link>
        </div>
      </Panel>
    );
  }

  return (
    <Panel>
      <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">Step 2 of 2</p>
      <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-neutral-950">
        Membership application fee
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-700">
        Your application has been received. A ${APPLICATION_FEE_USD} application fee is required to
        complete it, and it is non-refundable.
      </p>

      <div className="mt-5 flex items-baseline gap-2 rounded-xl bg-neutral-50 px-4 py-4">
        <span className="text-3xl font-medium tracking-[-0.02em] text-neutral-950">
          ${APPLICATION_FEE_USD}
        </span>
        <span className="text-sm text-neutral-700">one off, non-refundable</span>
      </div>

      {/* Method */}
      <div className="mt-6">
        <p className="mb-2 text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900">
          Choose how to pay
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {([
            { key: "paypal", label: "PayPal", desc: "Card or PayPal balance" },
            { key: "zelle", label: "Zelle", desc: "US bank transfer" },
          ] as const).map((m) => {
            const on = method === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => { setMethod(m.key); setError(""); }}
                aria-pressed={on}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  on ? "border-green-600 bg-green-50" : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <span className="block text-sm font-normal text-neutral-950">{m.label}</span>
                <span className="block text-xs text-neutral-700">{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* PayPal */}
      {method === "paypal" && (
        <div className="mt-6">
          {paypalClientId ? (
            <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD", intent: "capture" }}>
              <PayPalButtons
                style={{ layout: "vertical", shape: "pill", label: "pay" }}
                createOrder={async () => {
                  const res = await fetch("/api/payments/paypal/create-order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      amountUSD: APPLICATION_FEE_USD,
                      description: "ECP membership application fee",
                      invoiceId: applicationId,
                    }),
                  });
                  const json = (await res.json()) as { ok: boolean; data?: { orderId: string }; error?: string };
                  if (!json.ok || !json.data) throw new Error(json.error ?? "Could not start the payment.");
                  return json.data.orderId;
                }}
                onApprove={async (data) => {
                  const res = await fetch("/api/payments/paypal/capture", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: data.orderID }),
                  });
                  const json = (await res.json()) as { ok: boolean; error?: string };
                  if (!json.ok) throw new Error(json.error ?? "The payment could not be captured.");
                  await record("paypal", data.orderID);
                  setPhase("paid");
                }}
                onError={(e) => setError(e instanceof Error ? e.message : "PayPal could not complete the payment.")}
              />
            </PayPalScriptProvider>
          ) : (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              PayPal is not configured on this server yet, so card payment is unavailable. Use
              Zelle below, or ask the club to add their PayPal keys.
            </p>
          )}
        </div>
      )}

      {/* Zelle */}
      {method === "zelle" && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-neutral-200 p-4">
            <p className="text-sm text-neutral-800">Send ${APPLICATION_FEE_USD} by Zelle to:</p>
            <p className="mt-1 text-lg font-normal tracking-[-0.01em] text-neutral-950">{ZELLE_EMAIL}</p>
            <p className="mt-2 text-xs leading-5 text-neutral-700">
              Put your full name in the Zelle memo so the treasurer can match the transfer to your
              application.
            </p>
          </div>

          <div>
            <label htmlFor="zelleRef" className="mb-1.5 block text-sm font-normal text-neutral-900">
              Zelle confirmation number <span className="text-neutral-700">(optional)</span>
            </label>
            <input
              id="zelleRef"
              value={zelleRef}
              onChange={(e) => setZelleRef(e.target.value)}
              placeholder="e.g. 1234567890"
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-200"
            />
            <p className="mt-1 text-xs leading-5 text-neutral-700">
              It helps the treasurer find your transfer, but you can leave it blank.
            </p>
          </div>

          <button
            type="button"
            onClick={handleZelleDone}
            disabled={busy}
            className="w-full rounded-full bg-green-600 px-6 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Recording…" : "I have sent the Zelle transfer"}
          </button>
          <p className="text-xs leading-5 text-neutral-700">
            This tells the club to look out for your transfer. It is marked as confirmed once the
            treasurer sees it in the club account.
          </p>
        </div>
      )}
    </Panel>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">{children}</div>
  );
}
