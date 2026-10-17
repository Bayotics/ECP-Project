import { NextRequest, NextResponse } from "next/server";
import { emailConfigured } from "@/lib/server/email";
import { runDuesReminders, validCronSecret } from "@/lib/server/dues-reminders";
import { retryDuesPaymentNotifications } from "@/lib/server/dues";

export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
  if (!validCronSecret(request.headers.get("authorization"))) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!emailConfigured) return NextResponse.json({ ok: false, error: "Dues reminder email is not configured" }, { status: 503 });
  try {
    const result = await runDuesReminders();
    const notifications = await retryDuesPaymentNotifications();
    const ok = result.failed === 0 && notifications.failed === 0;
    return NextResponse.json({ ok, data: { ...result, notifications } }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[dues] Reminder job failed", error);
    return NextResponse.json({ ok: false, error: "Dues reminder job failed; retry required" }, { status: 500 });
  }
}
