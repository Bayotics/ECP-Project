/* Move users from `lga` to `lagosOrigin`, translating each Lagos LGA into
 * the IBILE division it belongs to.
 *
 *   node scripts/migrate-lagos-origin.mjs            dry run
 *   node scripts/migrate-lagos-origin.mjs --apply    writes
 *
 * The five divisions spell IBILE: Ikeja, Badagry, Ikorodu, Lagos Island,
 * Epe. A record whose LGA is not on the map is left untouched and printed,
 * so nothing is silently guessed at or thrown away.
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

/* Mirrors LGA_TO_DIVISION in lib/constants.ts. */
const LGA_TO_DIVISION = {
  Agege: "Ikeja",
  Alimosho: "Ikeja",
  "Ifako-Ijaiye": "Ikeja",
  Ikeja: "Ikeja",
  Kosofe: "Ikeja",
  Mushin: "Ikeja",
  "Oshodi-Isolo": "Ikeja",
  Shomolu: "Ikeja",
  "Ajeromi-Ifelodun": "Badagry",
  Ajegunle: "Badagry",
  "Amuwo-Odofin": "Badagry",
  Badagry: "Badagry",
  Ojo: "Badagry",
  Ikorodu: "Ikorodu",
  Apapa: "Lagos Island",
  "Eti-Osa": "Lagos Island",
  "Lagos Island": "Lagos Island",
  "Lagos Mainland": "Lagos Island",
  Surulere: "Lagos Island",
  Epe: "Epe",
  "Ibeju-Lekki": "Epe",
};

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const users = client.db(process.env.MONGODB_DB).collection("users");

const all = await users.find({}).toArray();
const carrying = all.filter((u) => u.lga);

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against ${process.env.MONGODB_DB}`);
console.log(`${all.length} users, ${carrying.length} carrying an lga.\n`);

const planned = [];
const unknown = [];

for (const u of carrying) {
  const division = LGA_TO_DIVISION[u.lga];
  if (!division) {
    unknown.push(u);
    continue;
  }
  planned.push({ id: u.id, name: u.displayName, from: u.lga, to: division });
  console.log(`   ${String(u.displayName).padEnd(32)} ${u.lga.padEnd(16)} -> ${division}`);
}

if (unknown.length) {
  console.log(`\n${unknown.length} with an LGA that is not on the map, left alone:`);
  for (const u of unknown) console.log(`   ${u.displayName}  "${u.lga}"`);
}

if (!APPLY) {
  console.log("\nNothing written. Re-run with --apply.\n");
} else {
  for (const p of planned) {
    await users.updateOne({ id: p.id }, { $set: { lagosOrigin: p.to }, $unset: { lga: "" } });
  }
  const after = await users.find({}).toArray();
  console.log(
    `\nDone. ${after.filter((u) => u.lagosOrigin).length} with a Lagos origin, ` +
      `${after.filter((u) => u.lga).length} still carrying an lga.\n`,
  );
}

await client.close();
