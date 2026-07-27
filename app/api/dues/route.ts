import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guards";
import type { DuesPayment } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";
import { sendZellePendingNotification } from "@/lib/server/notifications";

const DUES_AMOUNT = 5000;

export async function GET(request: NextRequest) {
  const { deny } = requireSession(request);
  if (deny) return deny;

  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const col = await getCollection("duesPayments");
    const isAdmin = sessionUser.role === "admin" || sessionUser.role === "super-admin";
    const userId = request.nextUrl.searchParams.get("userId") ?? sessionUser.id;

    if (!isAdmin && userId !== sessionUser.id) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const records = serializeDocuments(
      await col.find({ userId }).sort({ year: -1 }).toArray()
    );

    // Auto-create records for current + past 3 years if none exist
    if (records.length === 0) {
      const currentYear = new Date().getFullYear();
      const now = new Date().toISOString();
      const defaults: DuesPayment[] = [];
      for (let y = currentYear - 3; y <= currentYear; y++) {
        const isPast = y < currentYear;
        defaults.push({
          id: nanoid(),
          userId,
          year: y,
          amount: DUES_AMOUNT,
          status: isPast ? "paid" : "pending",
          dueDate: `${y}-03-31`,
          paidDate: isPast ? `${y}-02-15` : undefined,
          reference: isPast ? `ECP-PAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}` : undefined,
          paymentMethod: isPast ? "bank-transfer" : undefined,
          autoRenew: false,
          createdAt: now,
          updatedAt: now,
        });
      }
      await col.insertMany(defaults);
      return NextResponse.json({ ok: true, data: defaults });
    }

    return NextResponse.json({ ok: true, data: records });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch dues";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as {
      year?: number;
      paymentMethod: DuesPayment["paymentMethod"];
      autoRenew?: boolean;
      zelleRef?: string;
    };

    const year = body.year ?? new Date().getFullYear();
    const col = await getCollection("duesPayments");
    const now = new Date().toISOString();

    // Upsert: find existing or create new
    let dues: DuesPayment | undefined = serializeDocuments(
      await col.find({ userId: sessionUser.id, year }).toArray()
    )[0];

    if (!dues) {
      const newDues: DuesPayment = {
        id: nanoid(),
        userId: sessionUser.id,
        year,
        amount: DUES_AMOUNT,
        status: "pending",
        dueDate: `${year}-03-31`,
        autoRenew: body.autoRenew ?? false,
        createdAt: now,
        updatedAt: now,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await col.insertOne(newDues as any);
      dues = newDues;
    }

    if (body.paymentMethod === "zelle") {
      const ref = `ECP-DUES-${year}-${nanoid(6).toUpperCase()}`;
      await col.updateOne({ id: dues.id }, { $set: { zelleRef: ref, paymentMethod: "zelle", status: "pending", updatedAt: now } });
      const usersCol = await getCollection("users");
      const user = await usersCol.findOne({ id: sessionUser.id });
      if (user) {
        await sendZellePendingNotification({
          payerName: user.displayName,
          payerEmail: user.email,
          amount: DUES_AMOUNT,
          reference: ref,
          type: "dues",
          details: `${year} Annual Dues`,
        });
      }
      return NextResponse.json({ ok: true, data: { ...dues, zelleRef: ref, status: "pending" } });
    }

    return NextResponse.json({ ok: true, data: { ...dues, id: dues.id } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create dues record";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
