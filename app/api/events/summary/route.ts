import { NextResponse } from "next/server";
import { getEventSummary } from "@/lib/server/event-summary";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({ ok: true, data: await getEventSummary() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[events] Calendar summary could not be loaded", error);
    return NextResponse.json({ ok: false, error: "Live club activity could not be loaded. Please try again." }, { status: 503 });
  }
}
