import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_CONVENTIONS, validateConventions, type ConventionsDocument } from "@/lib/content/conventions";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { getRequestSession } from "@/lib/server/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await getCollection("siteContent");
    const content = await collection.findOne({ id: "conventions" });
    return NextResponse.json({ ok: true, data: { conventions: content?.id === "conventions" ? content.conventions : DEFAULT_CONVENTIONS, updatedAt: content?.updatedAt } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[homepage] Could not load conventions", error);
    return NextResponse.json({ ok: false, error: "Could not load convention videos. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Send a valid JSON request." }, { status: 400 }); }
  const validation = validateConventions(payload && typeof payload === "object" && "conventions" in payload ? payload.conventions : undefined);
  if ("error" in validation) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("siteContent");
    const content: ConventionsDocument = { id: "conventions", conventions: validation.conventions, updatedAt: new Date().toISOString(), updatedBy: session.sub };
    await collection.updateOne({ id: "conventions" }, { $set: content }, { upsert: true });
    return NextResponse.json({ ok: true, data: { conventions: content.conventions, updatedAt: content.updatedAt } });
  } catch (error) {
    console.error("[homepage] Could not save conventions", error);
    return NextResponse.json({ ok: false, error: "Could not save conventions. Your changes have been kept; please try again." }, { status: 500 });
  }
}
