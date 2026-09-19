/* Replace the mock users with the club's real roster.
 *
 *   node scripts/seed-members.mjs            dry run, prints the plan
 *   node scripts/seed-members.mjs --apply    writes to the database
 *
 * What it does:
 *   1. Deletes every user except the two login accounts named in
 *      KEEP_USER_IDS, along with their auth credentials.
 *   2. Cleans references the deleted users left behind: committee
 *      memberships, RSVPs and dues records are removed, and membership
 *      applications keep their row but lose the dangling userId.
 *   3. Upserts the 25 real members, keyed on a stable id derived from the
 *      slug so the script is safe to run again.
 *
 * Seeded members get NO auth credential, so none of them can sign in. The
 * club creates a login for a member from the admin Members screen, which
 * sets a password at the same time.
 */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { MEMBERS, KEEP_USER_IDS } from "./members-data.mjs";

const APPLY = process.argv.includes("--apply");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    const entries = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
      });
    for (const [k, v] of entries) if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Add it to .env.local.");
  process.exit(1);
}

const photoUrl = (slug) => `/gallery/members/${slug}.jpg`;

/** A stable id so re-running updates rather than duplicates. */
const idFor = (slug) => `ecp-${slug}`;

function toUser(m) {
  const user = {
    id: idFor(m.slug),
    email: m.email.trim().toLowerCase(),
    firstName: m.firstName,
    lastName: m.lastName,
    displayName: m.displayName,
    role: "member",
    status: "active",
    title: m.title,
    joinedAt: m.joinedAt ?? "",
  };
  if (m.office) user.office = m.office;
  if (m.occupation) user.occupation = m.occupation;
  if (m.lga) user.lga = m.lga;
  if (m.bio) user.bio = m.bio;
  if (m.photo) user.avatarUrl = photoUrl(m.photo);
  return user;
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(process.env.MONGODB_DB);

const users = db.collection("users");
const credentials = db.collection("authCredentials");

const existing = await users.find({}).toArray();
const doomed = existing.filter((u) => !KEEP_USER_IDS.includes(u.id));
const kept = existing.filter((u) => KEEP_USER_IDS.includes(u.id));
const doomedIds = doomed.map((u) => u.id);

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against ${process.env.MONGODB_DB}\n`);

console.log(`Keeping ${kept.length} login account${kept.length === 1 ? "" : "s"}:`);
for (const u of kept) console.log(`   ${u.id}  ${u.email}  (${u.role})`);

console.log(`\nDeleting ${doomed.length} mock user${doomed.length === 1 ? "" : "s"}:`);
for (const u of doomed) console.log(`   ${u.id}  ${u.email}  ${u.displayName}  (${u.role})`);

const seedUsers = MEMBERS.map(toUser);
const withPhoto = seedUsers.filter((u) => u.avatarUrl).length;
const placeholderEmails = seedUsers.filter((u) => u.email.endsWith(".invalid")).length;
console.log(
  `\nSeeding ${seedUsers.length} real members ` +
    `(${withPhoto} with a photo, ${placeholderEmails} on placeholder .invalid addresses, 0 able to sign in).`,
);

/* Collisions: a real member whose email already belongs to a kept login
   account would violate the unique index. */
const keptEmails = new Set(kept.map((u) => u.email.toLowerCase()));
const clashes = seedUsers.filter((u) => keptEmails.has(u.email));
if (clashes.length) {
  console.log("\nEmail clashes with a kept login account, these will be skipped:");
  for (const c of clashes) console.log(`   ${c.email}`);
}
const toSeed = seedUsers.filter((u) => !keptEmails.has(u.email));

/* References the deleted users leave behind. */
const rsvpCount = doomedIds.length ? await db.collection("rsvps").countDocuments({ userId: { $in: doomedIds } }) : 0;
const duesCount = doomedIds.length ? await db.collection("duesPayments").countDocuments({ userId: { $in: doomedIds } }) : 0;
const appCount = doomedIds.length
  ? await db.collection("membershipApplications").countDocuments({ userId: { $in: doomedIds } })
  : 0;
const committeeDocs = await db.collection("committees").find({}).toArray();
const committeeHits = committeeDocs.reduce(
  (n, c) => n + (c.members ?? []).filter((m) => doomedIds.includes(m.userId)).length,
  0,
);

console.log("\nReferences to clean:");
console.log(`   rsvps deleted:                  ${rsvpCount}`);
console.log(`   duesPayments deleted:           ${duesCount}`);
console.log(`   committee memberships removed:  ${committeeHits}`);
console.log(`   applications keeping their row, losing userId: ${appCount}`);

if (!APPLY) {
  console.log("\nNothing was written. Re-run with --apply to make these changes.\n");
  await client.close();
  process.exit(0);
}

if (doomedIds.length) {
  await db.collection("rsvps").deleteMany({ userId: { $in: doomedIds } });
  await db.collection("duesPayments").deleteMany({ userId: { $in: doomedIds } });
  await db
    .collection("membershipApplications")
    .updateMany({ userId: { $in: doomedIds } }, { $unset: { userId: "" } });
  await db
    .collection("committees")
    .updateMany({}, { $pull: { members: { userId: { $in: doomedIds } } } });
  await credentials.deleteMany({ userId: { $in: doomedIds } });
  await users.deleteMany({ id: { $in: doomedIds } });
}

for (const user of toSeed) {
  await users.updateOne({ id: user.id }, { $set: user }, { upsert: true });
  /* Belt and braces: make sure a seeded member has no way to sign in. */
  await credentials.deleteOne({ userId: user.id });
}

const finalCount = await users.countDocuments();
const finalCreds = await credentials.countDocuments();
console.log(`\nDone. users: ${finalCount}, authCredentials: ${finalCreds}\n`);

await client.close();
