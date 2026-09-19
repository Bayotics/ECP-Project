/* Push the member spotlight badges to Cloudinary and point avatarUrl at them.
 *
 *   node scripts/upload-member-photos.mjs           dry run
 *   node scripts/upload-member-photos.mjs --apply   uploads and updates the database
 *
 * The badges are square artwork with the member's name and role printed
 * across the bottom, which is unreadable at card size. Rather than crop in
 * CSS on every page, the crop happens once here: Cloudinary stores an
 * already square portrait, so an avatar seeded from a badge and an avatar a
 * member uploads themselves behave identically everywhere.
 *
 * Needs CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET
 * in .env.local.
 */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync } from "fs";
import { v2 as cloudinary } from "cloudinary";
import { MEMBERS } from "./members-data.mjs";

const APPLY = process.argv.includes("--apply");

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      if (!line || line.startsWith("#") || !line.includes("=")) continue;
      const i = line.indexOf("=");
      const k = line.slice(0, i).trim();
      const v = line.slice(i + 1).trim().replace(/^"|"$/g, "");
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

loadEnv();

const { MONGODB_URI, MONGODB_DB } = process.env;

/* CLOUDINARY_URL is the form the dashboard hands you; the three separate
   variables work too. */
function cloudinaryCredentials() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    try {
      const u = new URL(url);
      if (u.hostname && u.username && u.password) {
        return {
          cloud_name: u.hostname,
          api_key: decodeURIComponent(u.username),
          api_secret: decodeURIComponent(u.password),
        };
      }
    } catch {
      /* fall through to the separate variables */
    }
  }
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    return { cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET };
  }
  return null;
}

const creds = cloudinaryCredentials();
if (!creds) {
  console.error(
    "\nCloudinary is not configured. Put CLOUDINARY_URL in .env.local (or the three\n" +
      "CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET variables), then run this again.\n",
  );
  process.exit(1);
}

cloudinary.config({ ...creds, secure: true });
const CLOUDINARY_CLOUD_NAME = creds.cloud_name;

/* The source badges are 1100x1100. The portrait sits centred horizontally
   with the face about 34% of the way down, and a 2.3x zoom frames it
   without catching the printed name below. That gives a 478px square at
   (311, 135), resized to a 512px avatar. */
const SRC = 1100;
const ZOOM = 2.3;
const FOCUS_Y = 0.34;
const SIDE = Math.round(SRC / ZOOM);
const X = Math.round(SRC / 2 - SIDE / 2);
const Y = Math.round(SRC * FOCUS_Y - SIDE / 2);

const CROP = [
  { crop: "crop", x: X, y: Y, width: SIDE, height: SIDE },
  { crop: "fill", width: 512, height: 512 },
  { fetch_format: "auto", quality: "auto" },
];

const withPhoto = MEMBERS.filter((m) => m.photo);
console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} to cloud "${CLOUDINARY_CLOUD_NAME}"`);
console.log(`Crop from the ${SRC}px badge: ${SIDE}px square at (${X}, ${Y}), delivered at 512px.`);
console.log(`${withPhoto.length} member photos to upload into ecp/avatars.\n`);

const missing = withPhoto.filter((m) => !existsSync(`public/gallery/members/${m.photo}.jpg`));
if (missing.length) {
  console.error("Missing source files:");
  for (const m of missing) console.error(`   public/gallery/members/${m.photo}.jpg`);
  process.exit(1);
}

if (!APPLY) {
  for (const m of withPhoto) console.log(`   ${m.slug.padEnd(30)} -> ecp/avatars/ecp-${m.slug}`);
  console.log("\nNothing was uploaded. Re-run with --apply.\n");
  process.exit(0);
}

const client = new MongoClient(MONGODB_URI);
await client.connect();
const users = client.db(MONGODB_DB).collection("users");

let done = 0;
for (const m of withPhoto) {
  const id = `ecp-${m.slug}`;
  const result = await cloudinary.uploader.upload(`public/gallery/members/${m.photo}.jpg`, {
    folder: "ecp/avatars",
    public_id: id,
    overwrite: true,
    resource_type: "image",
    transformation: CROP,
  });
  const updated = await users.updateOne({ id }, { $set: { avatarUrl: result.secure_url } });
  done += 1;
  console.log(`   ${String(done).padStart(2)}/${withPhoto.length}  ${m.slug.padEnd(30)} ${updated.matchedCount ? "ok" : "NO USER ROW"}`);
}

console.log(`\nUploaded ${done} photos and updated avatarUrl on ${done} member records.\n`);
await client.close();
