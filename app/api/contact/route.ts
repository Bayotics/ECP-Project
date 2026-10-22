import { NextRequest, NextResponse } from "next/server";
import { verifyRecaptcha } from "@/lib/server/recaptcha";

export async function POST(request: NextRequest) {
  const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status, headers: { "Cache-Control": "no-store" } });
  if ((request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") return fail("Please submit this form from the club website.", 403);
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return fail("Send valid contact details.");
    const { name, email, phone = "", subject, message, website } = body;
    if (website) return fail("Please submit the contact form directly.");
    if (typeof name !== "string" || !name.trim() || name.length > 150 || typeof email !== "string" || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof phone !== "string" || phone.length > 40 || typeof subject !== "string" || !["Membership", "Events and programs", "Volunteering", "Donations and sponsorship", "Media and press", "Something else"].includes(subject) || typeof message !== "string" || message.trim().length < 10 || message.length > 10000) return fail("Enter a name, valid email, subject and message of 10–10,000 characters.");
    const verification = await verifyRecaptcha(body.recaptchaToken);
    if (!verification.ok) return fail(verification.error, verification.status);
    const response = await fetch("https://formspree.io/f/xpwroval", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim(), subject, message: message.trim(), _subject: `ECP website: ${subject}`, _replyto: email.trim() }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return fail("Your message could not be delivered. Please try again or email info@ekoclubphiladelphia.org.", 503);
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return fail(error instanceof SyntaxError ? "Send valid form details." : "Your message could not be delivered. Please try again or email info@ekoclubphiladelphia.org.", error instanceof SyntaxError ? 400 : 503);
  }
}
