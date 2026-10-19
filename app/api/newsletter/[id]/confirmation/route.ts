import { NextRequest, NextResponse } from "next/server";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { queueNewsletterConfirmation, deliverNewsletterMessages, newsletterAdminRow, NewsletterError } from "@/lib/server/newsletter";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await clubAdmin(request);
    await ensureCoreIndexes();
    const { id } = await context.params;
    const messageId = await queueNewsletterConfirmation(id);
    if (messageId) try { await deliverNewsletterMessages([messageId]); } catch { /* durable retry */ }
    const person = await (await getCollection("newsletterSubscribers")).findOne({ id });
    if (!person) throw new NewsletterError("Subscriber not found.", 404);
    return NextResponse.json({ ok: true, data: await newsletterAdminRow(person) }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
