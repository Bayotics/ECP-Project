import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { DuesPayment } from "@/lib/models";
import { isDuesFrequency } from "@/lib/dues";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";
import { getMemberDues, isDuesMember } from "@/lib/server/dues";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!isDuesMember(user)) return NextResponse.json({ ok: false, error: "Membership required" }, { status: 403 });
    const userId = request.nextUrl.searchParams.get("userId") ?? user.id;
    const admin = user.role === "admin" || user.role === "super-admin";
    if (userId !== user.id && !admin) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const target = userId === user.id ? user : await (await getCollection("users")).findOne({ id: userId });
    if (!target) return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
    const { records, summary } = await getMemberDues(target);
    return NextResponse.json({ ok: true, data: records, summary }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[dues] Read failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load dues. Please try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!isDuesMember(user)) return NextResponse.json({ ok: false, error: "Membership required" }, { status: 403 });
    const body = await request.json();
    if (!body || !isDuesFrequency(body.frequency) || (body.catchUp !== undefined && typeof body.catchUp !== "boolean")) {
      return NextResponse.json({ ok: false, error: "Choose yearly, monthly or twice-yearly dues" }, { status: 400 });
    }
    await ensureCoreIndexes();
    const { summary } = await getMemberDues(user);
    if (summary.pendingPayment) return NextResponse.json({ ok: true, data: summary.pendingPayment });
    const quote = body.catchUp ? summary.catchUp : summary.plans.find(plan => plan.frequency === body.frequency);
    if (!quote || quote.amountCents <= 0) return NextResponse.json({ ok: false, error: "No outstanding period to pay" }, { status: 400 });
    const now = new Date().toISOString();
    const payment: DuesPayment = {
      id: nanoid(), userId: user.id, year: Number(quote.coverageStart.slice(0, 4)),
      amount: quote.amountCents / 100, status: "pending", dueDate: quote.coverageStart,
      frequency: body.frequency, coverageStart: quote.coverageStart, coverageEnd: quote.coverageEnd,
      schemaVersion: 2, autoRenew: false, createdAt: now, updatedAt: now,
    };
    const collection = await getCollection("duesPayments");
    try { await collection.insertOne(payment); }
    catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      const existing = await collection.findOne({ userId: user.id, schemaVersion: 2, status: "pending" }, { projection: { _id: 0 } });
      if (existing) return NextResponse.json({ ok: true, data: existing });
      throw error;
    }
    await (await getCollection("users")).updateOne({ id: user.id }, { $set: { duesFrequency: body.frequency } });
    return NextResponse.json({ ok: true, data: payment }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    console.error("[dues] Creation failed", error);
    return NextResponse.json({ ok: false, error: "Unable to prepare payment. Please try again." }, { status: 500 });
  }
}
