import { NextRequest, NextResponse } from "next/server";
import { resolveWhatWeDo, validateWhatWeDo, type WhatWeDoDocument } from "@/lib/content/what-we-do";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { getRequestSession } from "@/lib/server/guards";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collection = await getCollection("siteContent");
    const content = await collection.findOne({ id: "what-we-do" });
    return NextResponse.json({ ok: true, data: { slides: resolveWhatWeDo(content?.id === "what-we-do" ? content.slides : undefined), updatedAt: content?.updatedAt } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[homepage] Could not load What We Do content", error);
    return NextResponse.json({ ok: false, error: "Could not load the homepage slides. Please try again." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) return NextResponse.json({ ok: false, error: "Administrator access required" }, { status: 403 });
  let payload: unknown;
  try { payload = await request.json(); } catch { return NextResponse.json({ ok: false, error: "Send a valid JSON request." }, { status: 400 }); }
  const validation = validateWhatWeDo(payload && typeof payload === "object" && "slides" in payload ? payload.slides : undefined);
  if ("error" in validation) return NextResponse.json({ ok: false, error: validation.error }, { status: 400 });
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("siteContent");
    const content: WhatWeDoDocument = { id: "what-we-do", slides: validation.slides, updatedAt: new Date().toISOString(), updatedBy: session.sub };
    await collection.updateOne({ id: "what-we-do" }, { $set: content }, { upsert: true });
    return NextResponse.json({ ok: true, data: { slides: resolveWhatWeDo(content.slides), updatedAt: content.updatedAt } });
  } catch (error) {
    console.error("[homepage] Could not save What We Do content", error);
    return NextResponse.json({ ok: false, error: "Could not save the homepage slides. Your changes have been kept; please try again." }, { status: 500 });
  }
}
