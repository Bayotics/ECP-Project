// PayPal REST API server-side utilities

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET ?? "";
const BASE = process.env.PAYPAL_BASE_URL ?? "https://api-m.sandbox.paypal.com"; // use https://api-m.paypal.com in prod

async function getAccessToken(): Promise<string> {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function paypalFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `PayPal error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Create order ─────────────────────────────────────────────────────────────

export interface PayPalOrderResult {
  id: string;
  status: string;
  links: { href: string; rel: string; method: string }[];
}

export async function paypalCreateOrder(params: {
  amountUSD: string; // e.g. "10.00"
  description: string;
  invoiceId?: string;
}): Promise<PayPalOrderResult> {
  return paypalFetch<PayPalOrderResult>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: params.amountUSD },
          description: params.description,
          invoice_id: params.invoiceId,
        },
      ],
    }),
  });
}

// ─── Capture order ────────────────────────────────────────────────────────────

export interface PayPalCaptureResult {
  id: string;
  status: string; // "COMPLETED" | "DECLINED" | ...
  payer: { email_address: string; name: { given_name: string; surname: string } };
  purchase_units: {
    payments: {
      captures: {
        id: string;
        status: string;
        amount: { value: string; currency_code: string };
      }[];
    };
  }[];
}

export async function paypalCaptureOrder(orderId: string): Promise<PayPalCaptureResult> {
  return paypalFetch<PayPalCaptureResult>(`/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    body: "{}",
  });
}

// ─── Check if configured ──────────────────────────────────────────────────────

export function isPayPalConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}
