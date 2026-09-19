/* Re-price existing dues records from naira to US dollars.
 *
 *   node scripts/reprice-dues-usd.mjs            dry run
 *   node scripts/reprice-dues-usd.mjs --apply    writes
 *
 * Records written before the club moved to dollars hold 5000, meaning
 * ₦5,000. Left alone they would read as $5,000 on the dues page. The annual
 * figure is now $20 (DUES_AMOUNT in app/api/dues/route.ts), so every row
 * still carrying the old naira amount is set to that.
 */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";

const APPLY = process.argv.includes("--apply");
const OLD_NAIRA_AMOUNT = 5000;
const NEW_USD_AMOUNT = 20;

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
const dues = client.db(process.env.MONGODB_DB).collection("duesPayments");

const stale = await dues.find({ amount: OLD_NAIRA_AMOUNT }).toArray();
const all = await dues.countDocuments();

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against ${process.env.MONGODB_DB}`);
console.log(`${all} dues records, ${stale.length} still holding the old naira amount of ${OLD_NAIRA_AMOUNT}.`);
for (const d of stale) console.log(`   ${d.userId}  ${d.year}  ${d.status}  ${d.amount} -> ${NEW_USD_AMOUNT}`);

if (!APPLY) {
  console.log("\nNothing written. Re-run with --apply.\n");
} else {
  const res = await dues.updateMany(
    { amount: OLD_NAIRA_AMOUNT },
    { $set: { amount: NEW_USD_AMOUNT, updatedAt: new Date().toISOString() } },
  );
  console.log(`\nUpdated ${res.modifiedCount} records to $${NEW_USD_AMOUNT}.\n`);
}

await client.close();
