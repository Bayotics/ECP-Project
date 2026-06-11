import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { NotificationType } from "@/lib/server/notifications";
import type { Recipient } from "@/lib/server/notifications";
import { sendEventNotifications } from "@/lib/server/notifications";
import { ensureCoreIndexes, getCollection, serializeDocument, serializeDocuments } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureCoreIndexes();
    const sessionUser = await getSessionUser(request);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super-admin")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as {
      type: NotificationType;
      channel: "email" | "sms" | "both";
      targetAudience: "all" | "members" | "newsletter" | "rsvps";
    };

    const { type, channel, targetAudience } = body;
    if (!type || !channel || !targetAudience) {
      return NextResponse.json({ ok: false, error: "type, channel, and targetAudience are required" }, { status: 400 });
    }

    const eventsCollection = await getCollection("events");
    const event = serializeDocument(await eventsCollection.findOne({ $or: [{ id }, { slug: id }] }));
    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    // Build recipients list based on audience
    const recipientsMap = new Map<string, Recipient>();

    if (targetAudience === "members" || targetAudience === "all") {
      const usersCollection = await getCollection("users");
      const members = await usersCollection
        .find({ role: { $in: ["member", "admin", "super-admin"] }, status: "active" })
        .toArray();
      for (const u of members) {
        recipientsMap.set(u.email, { email: u.email, name: u.displayName, phone: u.phone });
      }
    }

    if (targetAudience === "newsletter" || targetAudience === "all") {
      const nlCollection = await getCollection("newsletterSubscribers");
      const subscribers = await nlCollection.find({ status: "active" }).toArray();
      for (const s of subscribers) {
        recipientsMap.set(s.email, { email: s.email, name: s.name, phone: s.phone });
      }
    }

    if (targetAudience === "rsvps" || targetAudience === "all") {
      const rsvpsCollection = await getCollection("rsvps");
      const rsvps = serializeDocuments(
        await rsvpsCollection.find({ eventId: event.id, status: "confirmed" }).toArray()
      );
      for (const r of rsvps) {
        recipientsMap.set(r.email, { email: r.email, name: r.name, phone: r.phone });
      }
    }

    const recipients = Array.from(recipientsMap.values());
    const batchResult = await sendEventNotifications(event, recipients, type, channel);

    // Log the notification
    const logsCollection = await getCollection("notificationLogs");
    const log = {
      id: nanoid(),
      eventId: event.id,
      type,
      channel,
      targetAudience,
      recipientCount: recipients.length,
      successCount: batchResult.emailSent + batchResult.smsSent,
      failureCount: batchResult.emailFailed + batchResult.smsFailed,
      sentAt: new Date().toISOString(),
      sentBy: sessionUser.id,
      subject: event.title,
      summary: `${type} sent to ${recipients.length} recipients`,
    };
    await logsCollection.insertOne(log);

    return NextResponse.json({
      ok: true,
      data: { ...batchResult, recipientCount: recipients.length, logId: log.id },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send notifications";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
