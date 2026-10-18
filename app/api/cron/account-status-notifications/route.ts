import { NextRequest, NextResponse } from "next/server";
import { validCronSecret } from "@/lib/server/dues-reminders";
import { emailConfigured } from "@/lib/server/email";
import { retryAccountStatusNotifications } from "@/lib/server/account-status";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!validCronSecret(request.headers.get("authorization"))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!emailConfigured) return NextResponse.json({ ok: false, error: "Email is not configured" }, { status: 503 });
  try {
    const data = await retryAccountStatusNotifications();
    return NextResponse.json({ ok: !data.failed, data }, { status: data.failed ? 503 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[account-status] Notification retry failed", error);
    return NextResponse.json({ ok: false, error: "Notification retry failed" }, { status: 500 });
  }
}
