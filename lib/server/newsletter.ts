import { createHash, randomBytes } from "crypto";
import { nanoid } from "nanoid";
import type { ClientSession } from "mongodb";
import type { NewsletterAdminRow, NewsletterMessage, NewsletterSource, NewsletterSubscriber } from "@/lib/models/newsletter";
import { getCollection } from "@/lib/server/collections";
import { volunteerTransaction as transaction } from "@/lib/server/volunteer-transaction";
import { newsletterConfirmationEmail } from "@/lib/server/email-templates";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { VolunteerError as NewsletterError } from "@/lib/server/volunteer-error";

export { NewsletterError };
export const hashNewsletterToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newsletterSources: NewsletterSource[] = ["website", "footer", "admin", "rsvp", "import"];
export function newsletterEmail(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) throw new NewsletterError("Enter a valid email address.", 400);
  return value.trim().toLowerCase();
}
function activation() {
  const token = randomBytes(32).toString("hex");
  return { token, subscriptionVersion: nanoid(), unsubscribeTokenHash: hashNewsletterToken(token) };
}
async function queueConfirmation(person: NewsletterSubscriber, token: string, session: ClientSession) {
  const message: NewsletterMessage = { id: nanoid(), subscriberId: person.id, subscriptionVersion: person.subscriptionVersion!, to: person.email, ...newsletterConfirmationEmail(person.email, `${siteUrl()}/newsletter/unsubscribe#token=${token}`), status: "pending", attempts: 0, createdAt: new Date().toISOString() };
  await (await getCollection("newsletterMessages")).insertOne(message, { session });
  return message.id;
}
export function newsletterMetadata(body: Record<string, unknown>) {
  const patch: Pick<NewsletterSubscriber, "name" | "phone" | "tags"> = { tags: [] };
  for (const [key, limit] of [["name", 150], ["phone", 40]] as const) {
    if (body[key] !== undefined && (typeof body[key] !== "string" || body[key].length > limit)) throw new NewsletterError(`Enter a valid ${key}.`, 400);
    if (typeof body[key] === "string") patch[key] = body[key].trim();
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 20 || body.tags.some(tag => typeof tag !== "string" || !tag.trim() || tag.length > 50)) throw new NewsletterError("Use up to 20 text tags of 50 characters each.", 400);
    patch.tags = [...new Set(body.tags.map(tag => tag.trim()))];
  }
  return patch;
}
export async function subscribeNewsletter(email: string, source: NewsletterSource, metadata: ReturnType<typeof newsletterMetadata> = { tags: [] }) {
  email = newsletterEmail(email);
  return transaction(async session => {
    const people = await getCollection("newsletterSubscribers");
    const existing = await people.findOne({ email }, { session, collation: { locale: "en", strength: 2 } });
    if (existing) throw new NewsletterError(existing.status === "active" ? "This email is already subscribed to the newsletter." : "This email has previously unsubscribed. Contact the club if you would like to subscribe again.", 409);
    const { token, ...proof } = activation(), at = new Date().toISOString();
    const person: NewsletterSubscriber = { id: nanoid(), email, ...metadata, source, status: "active", subscribedAt: at, updatedAt: at, ...proof };
    await people.insertOne(person, { session });
    return { person, messageId: await queueConfirmation(person, token, session) };
  });
}

export async function unsubscribeNewsletter(token: unknown) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) throw new NewsletterError("This unsubscribe link is invalid. Open the link in your newsletter email.", 400);
  return transaction(async session => {
    const people = await getCollection("newsletterSubscribers");
    const person = await people.findOne({ unsubscribeTokenHash: hashNewsletterToken(token) }, { session });
    if (!person) throw new NewsletterError("This unsubscribe link is no longer valid. Use the link in your latest newsletter email.", 404);
    if (person.status === "unsubscribed") return { alreadyUnsubscribed: true };
    const at = new Date().toISOString();
    await people.updateOne({ id: person.id }, { $set: { status: "unsubscribed", unsubscribedAt: at, updatedAt: at } }, { session });
    await (await getCollection("newsletterMessages")).updateMany({ subscriberId: person.id, status: { $in: ["pending", "failed"] } }, { $set: { status: "superseded" } }, { session });
    return { alreadyUnsubscribed: false };
  });
}

export async function updateNewsletterSubscriber(id: string, body: Record<string, unknown>) {
  if (body.status !== undefined && !["active", "unsubscribed"].includes(body.status as string)) throw new NewsletterError("Select Active or Unsubscribed.", 400);
  const metadata = newsletterMetadata(body);
  return transaction(async session => {
    const people = await getCollection("newsletterSubscribers"), outbox = await getCollection("newsletterMessages");
    const person = await people.findOne({ id }, { session });
    if (!person) throw new NewsletterError("Subscriber not found.", 404);
    const at = new Date().toISOString(), patch: Partial<NewsletterSubscriber> = { updatedAt: at };
    for (const key of ["name", "phone", "tags"] as const) if (body[key] !== undefined) Object.assign(patch, { [key]: metadata[key] });
    let token: string | undefined;
    if (body.status && body.status !== person.status) {
      patch.status = body.status as NewsletterSubscriber["status"];
      if (body.status === "active") { const proof = activation(); token = proof.token; Object.assign(patch, { subscriptionVersion: proof.subscriptionVersion, unsubscribeTokenHash: proof.unsubscribeTokenHash, subscribedAt: at }); }
      else patch.unsubscribedAt = at;
      await outbox.updateMany({ subscriberId: id, status: { $in: ["pending", "failed"] } }, { $set: { status: "superseded" } }, { session });
    }
    const updated = { ...person, ...patch };
    if (token) delete updated.unsubscribedAt;
    await people.updateOne({ id }, { $set: patch, ...(token ? { $unset: { unsubscribedAt: "" as const } } : {}) }, { session });
    return { person: updated, messageId: token ? await queueConfirmation(updated, token, session) : undefined };
  });
}

export async function deleteNewsletterSubscriber(id: string) {
  return transaction(async session => {
    const result = await (await getCollection("newsletterSubscribers")).deleteOne({ id }, { session });
    if (!result.deletedCount) throw new NewsletterError("Subscriber not found.", 404);
    await (await getCollection("newsletterMessages")).deleteMany({ subscriberId: id }, { session });
  });
}

export async function queueNewsletterConfirmation(id: string) {
  return transaction(async session => {
    const people = await getCollection("newsletterSubscribers"), outbox = await getCollection("newsletterMessages");
    const person = await people.findOne({ id }, { session });
    if (!person) throw new NewsletterError("Subscriber not found.", 404);
    if (person.status !== "active") throw new NewsletterError("Unsubscribed addresses cannot receive newsletter confirmations.", 409);
    const message = person.subscriptionVersion ? await outbox.findOne({ subscriberId: id, subscriptionVersion: person.subscriptionVersion }, { session }) : null;
    if (message) return message.status === "sent" || message.status === "superseded" ? undefined : message.id;
    const { token, ...proof } = activation();
    await people.updateOne({ id }, { $set: { ...proof, updatedAt: new Date().toISOString() } }, { session });
    return queueConfirmation({ ...person, ...proof }, token, session);
  });
}

export async function newsletterAdminRow(person: NewsletterSubscriber): Promise<NewsletterAdminRow> {
  const message = person.subscriptionVersion ? await (await getCollection("newsletterMessages")).findOne({ subscriberId: person.id, subscriptionVersion: person.subscriptionVersion }) : null;
  // Explicit whitelist keeps token hashes and outbox HTML out of every admin response.
  return { id: person.id, email: person.email, name: person.name, phone: person.phone, tags: person.tags ?? [], source: person.source, status: person.status, subscribedAt: person.subscribedAt, unsubscribedAt: person.unsubscribedAt, updatedAt: person.updatedAt, confirmationStatus: message?.status ?? "not-recorded", confirmationSentAt: message?.sentAt, confirmationError: message?.status === "failed" ? message.error : undefined };
}

export async function deliverNewsletterMessages(ids?: string[]) {
  const outbox = await getCollection("newsletterMessages"), now = new Date().toISOString();
  const available = { $or: [{ status: { $in: ["pending", "failed"] as NewsletterMessage["status"][] } }, { status: "sending" as const, leaseUntil: { $lte: now } }] };
  const candidates = await outbox.find({ ...(ids ? { id: { $in: ids } } : {}), ...available }).sort({ createdAt: 1, id: 1 }).limit(100).toArray();
  let sent = 0, failed = 0;
  for (const candidate of candidates) {
    const message = await outbox.findOneAndUpdate({ id: candidate.id, ...available }, { $set: { status: "sending", leaseUntil: new Date(Date.now()+120000).toISOString() }, $inc: { attempts: 1 } }, { returnDocument: "after" });
    if (!message) continue;
    const person = await (await getCollection("newsletterSubscribers")).findOne({ id: message.subscriberId, status: "active", subscriptionVersion: message.subscriptionVersion, email: message.to });
    if (!person) { await outbox.updateOne({ id: message.id }, { $set: { status: "superseded" }, $unset: { leaseUntil: "" } }); continue; }
    const result = await sendEmail({ to: message.to, subject: message.subject, html: message.html, tags: { type: "newsletter-subscription", subscriberId: person.id } });
    await outbox.updateOne({ id: message.id }, { $set: result.ok ? { status: "sent", sentAt: new Date().toISOString(), error: "" } : { status: "failed", error: result.error }, $unset: { leaseUntil: "" } });
    if (result.ok) sent++; else failed++;
  }
  return { sent, failed };
}
