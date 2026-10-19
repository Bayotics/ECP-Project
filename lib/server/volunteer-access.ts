import { createHash, randomBytes } from "crypto";
import type { ClientSession } from "mongodb";
import { getCollection } from "@/lib/server/collections";
import { siteUrl } from "@/lib/server/email";

export const hashVolunteerToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function volunteerPreferencesUrl(volunteerId: string, session: ClientSession) {
  const token = randomBytes(32).toString("hex");
  await (await getCollection("volunteerAccessTokens")).insertOne({ volunteerId, tokenHash: hashVolunteerToken(token), createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 90 * 86400000) }, { session });
  // Fragment tokens are never sent in HTTP request URLs or referrer headers.
  return `${siteUrl()}/volunteer/preferences#token=${token}`;
}

export async function findVolunteerAccess(authorization: string | null, session?: ClientSession) {
  const token = authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) return null;
  const access = await (await getCollection("volunteerAccessTokens")).findOne({ tokenHash: hashVolunteerToken(token), expiresAt: { $gt: new Date() } }, { session });
  if (!access) return null;
  return (await getCollection("volunteers")).findOne({ id: access.volunteerId }, { session });
}
