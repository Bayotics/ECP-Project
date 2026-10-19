type Verification = { ok: true } | { ok: false; status: number; error: string };

export async function verifyRecaptcha(token: unknown): Promise<Verification> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret || !process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY) {
    return { ok: false, status: 503, error: "Verification is not configured. Please contact the club." };
  }
  if (typeof token !== "string" || !token.trim() || token.length > 4096) {
    return { ok: false, status: 400, error: "Please complete the reCAPTCHA verification." };
  }
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Verification service unavailable");
    const result = await response.json() as { success?: boolean };
    if (result.success !== true) {
      return { ok: false, status: 400, error: "Verification expired or failed. Please complete reCAPTCHA again." };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 503, error: "Could not verify reCAPTCHA. Please try again." };
  }
}
