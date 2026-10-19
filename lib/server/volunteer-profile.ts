import type { ClientSession } from "mongodb";
import { getCollection } from "@/lib/server/collections";
import { VolunteerError } from "@/lib/server/volunteer-error";
export async function validateVolunteerCommittees(ids: string[] = [], session: ClientSession, previous: string[] = []) {
  const added = ids.filter(id => !previous.includes(id));
  if (added.length && await (await getCollection("committees")).countDocuments({id:{$in:added},status:"active"},{session}) !== added.length) throw new VolunteerError("One of your selected committees is no longer open. Refresh the committee options and choose again.",400);
}
