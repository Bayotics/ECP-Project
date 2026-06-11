// Paystack server-side utilities

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? "";
const BASE = "https://api.paystack.co";

async function paystackFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!json.status) throw new Error(json.message ?? "Paystack error");
  return json.data;
}

// ─── Initialize transaction ───────────────────────────────────────────────────

export interface PaystackInitData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function paystackInitialize(params: {
  email: string;
  amount: number; // in kobo (Naira × 100)
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
  planCode?: string;
}): Promise<PaystackInitData> {
  return paystackFetch<PaystackInitData>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
      channels: params.channels ?? ["card", "bank", "ussd", "bank_transfer"],
      plan: params.planCode,
    }),
  });
}

// ─── Verify transaction ───────────────────────────────────────────────────────

export interface PaystackVerifyData {
  status: string; // "success" | "failed" | "abandoned"
  reference: string;
  amount: number; // in kobo
  paid_at: string;
  customer: { email: string; first_name?: string; last_name?: string };
  authorization: { authorization_code: string; last4: string; bank: string; channel: string };
  metadata?: Record<string, unknown>;
  subscription?: { subscription_code: string; status: string };
}

export async function paystackVerify(reference: string): Promise<PaystackVerifyData> {
  return paystackFetch<PaystackVerifyData>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// ─── Plans (for recurring / subscriptions) ───────────────────────────────────

export interface PaystackPlan {
  plan_code: string;
  name: string;
  amount: number;
  interval: string;
}

export async function paystackCreatePlan(params: {
  name: string;
  amount: number; // kobo
  interval: "monthly" | "annually";
  description?: string;
}): Promise<PaystackPlan> {
  return paystackFetch<PaystackPlan>("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      amount: params.amount,
      interval: params.interval,
      description: params.description,
    }),
  });
}

// ─── Webhook signature verification ──────────────────────────────────────────

import { createHmac } from "crypto";

export function verifyPaystackWebhook(body: string, signature: string): boolean {
  if (!PAYSTACK_SECRET) return false;
  const hash = createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");
  return hash === signature;
}

// ─── Check if configured ─────────────────────────────────────────────────────

export function isPaystackConfigured(): boolean {
  return Boolean(PAYSTACK_SECRET);
}
