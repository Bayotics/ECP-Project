import { NextRequest, NextResponse } from "next/server";
import { confirmNewsletter } from "@/lib/server/newsletter";
import { newsletterBody, newsletterOrigin } from "@/lib/server/newsletter-api";
import { clubError, privateHeaders } from "@/lib/server/club-api";
import { ensureCoreIndexes } from "@/lib/server/collections";

export async function POST(request: NextRequest) {
  try {
    newsletterOrigin(request);
    const body = newsletterBody(await request.json());
    await ensureCoreIndexes();
    const result = await confirmNewsletter(body.token);
    return NextResponse.json({ ok: true, data: result }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
