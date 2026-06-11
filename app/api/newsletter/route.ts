import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { NewsletterSource, NewsletterSubscriber } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super-admin")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getCollection("newsletterSubscribers");
    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const source = params.get("source");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (source) filter.source = source;

    const subscribers = serializeDocuments(
      await collection.find(filter).sort({ subscribedAt: -1 }).toArray()
    );
    return NextResponse.json({ ok: true, data: subscribers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch subscribers";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as {
      email?: string;
      name?: string;
      phone?: string;
      source?: NewsletterSource;
      tags?: string[];
    };

    if (!payload.email?.trim()) return badRequest("Email is required");
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(payload.email.trim())) return badRequest("Invalid email address");

    const collection = await getCollection("newsletterSubscribers");
    const email = payload.email.trim().toLowerCase();

    // If already subscribed, re-activate if unsubscribed
    const existing = await collection.findOne({ email });
    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { ok: false, error: "This email is already subscribed." },
          { status: 409 }
        );
      }
      // Re-subscribe
      await collection.updateOne(
        { email },
        { $set: { status: "active", unsubscribedAt: undefined, subscribedAt: new Date().toISOString() } }
      );
      const updated = await collection.findOne({ email });
      return NextResponse.json({ ok: true, data: updated });
    }

    const subscriber: NewsletterSubscriber = {
      id: nanoid(),
      email,
      name: payload.name?.trim(),
      phone: payload.phone?.trim(),
      source: payload.source ?? "website",
      status: "active",
      tags: payload.tags ?? [],
      subscribedAt: new Date().toISOString(),
    };

    await collection.insertOne(subscriber);
    return NextResponse.json({ ok: true, data: subscriber }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to subscribe";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
