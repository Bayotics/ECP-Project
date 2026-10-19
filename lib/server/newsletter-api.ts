import type { NextRequest } from "next/server";
import { NewsletterError } from "@/lib/server/newsletter";
export function newsletterOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") throw new NewsletterError("Please submit this form from the club website.", 403);
}
export function newsletterBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new NewsletterError("Send valid form details.", 400);
  return body as Record<string, unknown>;
}
