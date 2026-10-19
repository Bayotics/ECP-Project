import { NextRequest, NextResponse } from "next/server";
import { validCronSecret } from "@/lib/server/dues-reminders";
import { deliverNewsletterMessages } from "@/lib/server/newsletter";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  if (!validCronSecret(request.headers.get("authorization"))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  try { const result = await deliverNewsletterMessages(); return NextResponse.json({ ok: result.failed === 0, data: result }, { status: result.failed ? 503 : 200, headers: { "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ ok: false, error: "Newsletter confirmation delivery could not be completed." }, { status: 503 }); }
}
