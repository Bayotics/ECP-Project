import { after } from "next/server";
import { registerVolunteer } from "@/lib/server/volunteers";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";
import type { VolunteerInput } from "@/lib/volunteer-input";
import type { VolunteerSource } from "@/lib/volunteer-sources";

export async function importVolunteer(input: VolunteerInput, source: VolunteerSource, externalId?: string) {
  const result = await registerVolunteer(input, true, { imported: true, source, externalId });
  return { reference: result.reference, status: result.status, alreadyRegistered: result.alreadyRegistered, messageIds: result.messageIds };
}

/** Persist first; a slow email provider must not hold up the import response. */
export function scheduleImportedVolunteerEmails(ids: string[]) {
  if (!ids.length) return;
  after(async () => {
    try {
      for (let offset = 0; offset < ids.length; offset += 100) await deliverVolunteerMessages(ids.slice(offset, offset + 100));
    } catch (error) { console.error("[volunteers] Import email delivery deferred to the durable retry queue", error); }
  });
}
