import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { CreateOrderInput, Order } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { getNextSequence, padSequence } from "@/lib/server/counters";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

function calcTotals(items: Order["items"], shippingFee = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  return { subtotal, total: subtotal + shippingFee - discount };
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("orders");
    const params = request.nextUrl.searchParams;
    const filter: Filter<Order> = {};

    const userId = params.get("userId");
    const status = params.get("status");
    const orderNumber = params.get("orderNumber");

    if (userId) filter.userId = userId;
    if (status) filter.status = status as Order["status"];
    if (orderNumber) filter.orderNumber = orderNumber;

    const orders = serializeDocuments(await collection.find(filter).sort({ createdAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateOrderInput>;

    if (!payload.customerName?.trim()) return badRequest("Customer name is required");
    if (!payload.customerEmail?.trim()) return badRequest("Customer email is required");
    if (!Array.isArray(payload.items) || payload.items.length === 0) return badRequest("At least one order item is required");

    const seq = await getNextSequence("orders");
    const orderNumber = `ECP-${new Date().getFullYear()}-${padSequence(seq)}`;
    const shippingFee = payload.shippingFee ?? 0;
    const discount = payload.discount ?? 0;
    const { subtotal, total } = calcTotals(payload.items as Order["items"], shippingFee, discount);
    const now = new Date().toISOString();

    const order: Order = {
      id: nanoid(),
      orderNumber,
      userId: payload.userId,
      customerName: payload.customerName.trim(),
      customerEmail: payload.customerEmail.trim().toLowerCase(),
      items: payload.items as Order["items"],
      subtotal,
      shippingFee,
      discount,
      total,
      shippingAddress: payload.shippingAddress,
      paymentMethod: payload.paymentMethod,
      paymentStatus: "unpaid",
      paymentReference: payload.paymentReference,
      status: "pending",
      notes: payload.notes,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getCollection("orders");
    await collection.insertOne(order);
    return NextResponse.json({ ok: true, data: order }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
