import type { Metadata } from "next";
import { Suspense } from "react";
import ApplicationFeeClient from "@/components/membership/ApplicationFeeClient";

export const metadata: Metadata = {
  title: "Membership application fee",
  description:
    "Pay the one hundred dollar non-refundable Eko Club Philadelphia membership application fee by PayPal or Zelle.",
};

export default function MembershipPaymentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm text-neutral-700">Loading…</p>
          </div>
        }
      >
        <ApplicationFeeClient />
      </Suspense>
    </div>
  );
}
