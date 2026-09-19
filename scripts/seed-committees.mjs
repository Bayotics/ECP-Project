/* Replace the mock committees with the club's real ones.
 *
 *   node scripts/seed-committees.mjs            dry run
 *   node scripts/seed-committees.mjs --apply    writes
 *
 * Source: the "ECP Committtee Poll Result 2026" sheet, transcribed in
 * scripts/committees-data.mjs.
 *
 * Volunteer names are matched to seeded member records so a committee can
 * link to a real person; the member's display name and photo are read from
 * the users collection rather than retyped. Any join requests pointing at a
 * committee that no longer exists are removed too.
 */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { COMMITTEES, VOLUNTEER_IDS, POLL_SIZE } from "./committees-data.mjs";

const APPLY = process.argv.includes("--apply");

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const committees = db.collection("committees");
const users = db.collection("users");
const joinRequests = db.collection("committeeJoinRequests");

const roster = await users.find({}).toArray();
const byId = new Map(roster.map((u) => [u.id, u]));

const now = new Date().toISOString();
const unmatched = new Set();

function memberProfile(sheetName) {
  const userId = VOLUNTEER_IDS[sheetName] ?? null;
  const user = userId ? byId.get(userId) : null;
  if (userId && !user) unmatched.add(`${sheetName} (id ${userId} not in users)`);
  if (!userId) unmatched.add(sheetName);
  return {
    /* Only set when the person is genuinely on the roster, so the portal
       can tell a linked member from a name the sheet alone knows. */
    ...(user ? { userId: user.id } : {}),
    name: user ? user.displayName : sheetName,
    /* The poll recorded volunteers, not offices. No chair is invented. */
    role: "Volunteer",
    isChairperson: false,
    isViceChair: false,
    joinedCommitteeAt: "",
    ...(user?.avatarUrl ? { imageUrl: user.avatarUrl } : {}),
  };
}

const docs = COMMITTEES.map((c) => ({
  id: `ecp-cmte-${c.slug}`,
  name: c.name,
  slug: c.slug,
  description: c.description,
  type: c.type,
  status: "active",
  members: c.volunteers.map(memberProfile),
  /* The club has not said when any of these were formed. */
  establishedAt: "",
  month: c.month,
  votes: c.votes,
  pollSize: POLL_SIZE,
  ...(c.programId ? { programId: c.programId } : {}),
  createdAt: now,
  updatedAt: now,
}));

const existing = await committees.find({}).toArray();
const keepIds = new Set(docs.map((d) => d.id));
const doomed = existing.filter((c) => !keepIds.has(c.id));

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against ${process.env.MONGODB_DB}\n`);
console.log(`Removing ${doomed.length} committee${doomed.length === 1 ? "" : "s"}:`);
for (const c of doomed) console.log(`   ${c.id}  ${c.name}  (${(c.members ?? []).length} members)`);

console.log(`\nSeeding ${docs.length} from the poll sheet:`);
for (const d of docs) {
  const linked = d.members.filter((m) => m.userId).length;
  console.log(
    `   ${d.month.padEnd(11)} ${d.name.padEnd(28)} ${String(d.votes).padStart(2)}/${POLL_SIZE} votes, ` +
      `${d.members.length} volunteer${d.members.length === 1 ? "" : "s"} (${linked} linked to a member record)`,
  );
}

if (unmatched.size) {
  console.log("\nVolunteer names with no roster match, seeded as plain names:");
  for (const n of unmatched) console.log(`   ${n}`);
}

const staleRequests = doomed.length
  ? await joinRequests.countDocuments({ committeeId: { $in: doomed.map((c) => c.id) } })
  : 0;
console.log(`\nJoin requests pointing at a removed committee: ${staleRequests}`);

if (!APPLY) {
  console.log("\nNothing written. Re-run with --apply.\n");
} else {
  if (doomed.length) {
    await joinRequests.deleteMany({ committeeId: { $in: doomed.map((c) => c.id) } });
    await committees.deleteMany({ id: { $in: doomed.map((c) => c.id) } });
  }
  for (const d of docs) {
    const { createdAt, ...rest } = d;
    await committees.updateOne({ id: d.id }, { $set: rest, $setOnInsert: { createdAt } }, { upsert: true });
  }
  console.log(`\nDone. committees: ${await committees.countDocuments()}\n`);
}

await client.close();
