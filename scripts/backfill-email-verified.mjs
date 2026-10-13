/* Mark accounts that predate email verification as verified.
 *
 *   node scripts/backfill-email-verified.mjs            dry run
 *   node scripts/backfill-email-verified.mjs --apply    writes
 *
 * Login now refuses any account whose address is not confirmed. Every user
 * created before that existed has no `emailVerified` field at all, and none
 * of them can confirm an address because they never received a link: the
 * seeded members were entered from the club's own roster and the demo
 * accounts were created by hand.
 *
 * Without this they would every one be locked out. They are treated as
 * verified because the club vouched for them directly, which is a stronger
 * signal than a link in an inbox. Only records genuinely missing the field
 * are touched, so a real self-registered account still waiting to confirm
 * is left exactly as it is.
 */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";

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
const users = client.db(process.env.MONGODB_DB).collection("users");

const all = await users.find({}).toArray();
const missing = all.filter((u) => u.emailVerified === undefined);
const pendingUnverified = all.filter((u) => u.emailVerified === false);

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against ${process.env.MONGODB_DB}`);
console.log(`${all.length} users.\n`);
console.log(`  missing the field, will be marked verified : ${missing.length}`);
console.log(`  explicitly unverified, left alone          : ${pendingUnverified.length}`);
console.log(`  already verified                           : ${all.filter((u) => u.emailVerified === true).length}\n`);

for (const u of missing) {
  console.log(`   ${String(u.displayName ?? u.email).padEnd(34)} ${u.role.padEnd(12)} ${u.status}`);
}

if (!APPLY) {
  console.log("\nNothing written. Re-run with --apply.\n");
} else {
  const now = new Date().toISOString();
  const result = await users.updateMany(
    { emailVerified: { $exists: false } },
    { $set: { emailVerified: true, emailVerifiedAt: now } },
  );
  const after = await users.find({}).toArray();
  console.log(`\nUpdated ${result.modifiedCount}.`);
  console.log(`verified: ${after.filter((u) => u.emailVerified === true).length}, ` +
    `unverified: ${after.filter((u) => u.emailVerified === false).length}, ` +
    `missing: ${after.filter((u) => u.emailVerified === undefined).length}\n`);
}

await client.close();
