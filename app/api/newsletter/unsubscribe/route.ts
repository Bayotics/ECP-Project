import { NextRequest, NextResponse } from "next/server";
import { unsubscribeNewsletter } from "@/lib/server/newsletter";
import { newsletterBody, newsletterOrigin } from "@/lib/server/newsletter-api";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { clubError, privateHeaders } from "@/lib/server/club-api";
export async function POST(request: NextRequest) {
  try {
    newsletterOrigin(request);
    const body = newsletterBody(await request.json());
    await ensureCoreIndexes();
    const result = await unsubscribeNewsletter(body.token);
    return NextResponse.json({ ok: true, data: { ...result, message: "You’re unsubscribed from the newsletter. You won’t receive further newsletter emails." } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
