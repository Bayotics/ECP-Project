import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guards";
import type { Filter } from "mongodb";
import type { CreateDonationInput, Donation } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { getNextSequence, padSequence } from "@/lib/server/counters";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { deny } = requireSession(request);
  if (deny) return deny;

  try {
    await ensureCoreIndexes();
    const collection = await getCollection("donations");
    const params = request.nextUrl.searchParams;
    const filter: Filter<Donation> = {};

    const userId = params.get("userId");
    const status = params.get("status");
    const cause = params.get("cause");
    const donorEmail = params.get("donorEmail");

    if (userId) filter.userId = userId;
    if (status) filter.status = status as Donation["status"];
    if (cause) filter.cause = cause as Donation["cause"];
    if (donorEmail) filter.donorEmail = donorEmail.trim().toLowerCase();

    const donations = serializeDocuments(await collection.find(filter).sort({ createdAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: donations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch donations";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateDonationInput>;

    if (!payload.donorName?.trim()) return badRequest("Donor name is required");
    if (typeof payload.amount !== "number") return badRequest("Donation amount is required");
    if (!payload.type) return badRequest("Donation type is required");
    if (!payload.cause) return badRequest("Donation cause is required");

    const seq = await getNextSequence("donations");
    const referenceNumber = `DON-${new Date().getFullYear()}-${padSequence(seq)}`;
    const now = new Date().toISOString();
    const donation: Donation = {
      id: nanoid(),
      referenceNumber,
      userId: payload.userId,
      donorName: payload.donorName.trim(),
      donorEmail: payload.donorEmail?.trim().toLowerCase() ?? "",
      donorPhone: payload.donorPhone,
      isAnonymous: payload.isAnonymous ?? false,
      amount: payload.amount,
      type: payload.type,
      cause: payload.cause,
      message: payload.message,
      paymentMethod: payload.paymentMethod,
      paymentReference: payload.paymentReference,
      paystackRef: payload.paystackRef,
      paystackSubscriptionCode: payload.paystackSubscriptionCode,
      paypalOrderId: payload.paypalOrderId,
      paypalCaptureId: payload.paypalCaptureId,
      zelleRef: payload.zelleRef,
      status: "pending",
      isRecurring: payload.isRecurring ?? payload.type !== "one-time",
      autoRenew: payload.autoRenew ?? false,
      nextChargeDate: payload.nextChargeDate,
      acknowledgedAt: payload.acknowledgedAt,
      acknowledgedBy: payload.acknowledgedBy,
      receiptSentAt: payload.receiptSentAt,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection("donations");
    await collection.insertOne(donation);
    return NextResponse.json({ ok: true, data: donation }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create donation";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
