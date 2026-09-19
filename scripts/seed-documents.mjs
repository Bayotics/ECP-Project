/* Seed the club's real documents: upload each file to Cloudinary, then
 * write one record per file into the documents collection.
 *
 *   node scripts/seed-documents.mjs <folder>            dry run
 *   node scripts/seed-documents.mjs <folder> --apply    uploads and writes
 *
 * <folder> defaults to private/documents. Download the club's Drive folder
 * ("Meeting Minutes") as a zip, unpack it there, and run this. private/ is
 * gitignored, so nothing the club owns ends up in the repo or in public/.
 *
 * Existing mock records with no file attached are removed, because a
 * document you cannot download is not a document.
 *
 * Needs CLOUDINARY_URL (or the three CLOUDINARY_* variables) in .env.local.
 */
import { MongoClient } from "mongodb";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { nanoid } from "nanoid";

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FOLDER = args.find((a) => !a.startsWith("--")) ?? "private/documents";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    if (!process.env[k]) process.env[k] = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  }
}

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
      /* fall through */
    }
  }
  const { CLOUDINARY_CLOUD_NAME: n, CLOUDINARY_API_KEY: k, CLOUDINARY_API_SECRET: s } = process.env;
  return n && k && s ? { cloud_name: n, api_key: k, api_secret: s } : null;
}

const creds = cloudinaryCredentials();
if (!creds) {
  console.error("\nCloudinary is not configured. Put CLOUDINARY_URL in .env.local.\n");
  process.exit(1);
}
cloudinary.config({ ...creds, secure: true });

if (!existsSync(FOLDER)) {
  console.error(`\nNo such folder: ${FOLDER}\nUnpack the club's Drive zip there first.\n`);
  process.exit(1);
}

const MONTHS = "january february march april may june july august september october november december".split(" ");

/** "ECP April 2026 Meeting Minutes.pdf" -> label, period, category. */
function describe(filename) {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  const lower = base.toLowerCase();

  const year = (base.match(/\b(19|20)\d{2}\b/) ?? [])[0] ?? null;
  const month =
    MONTHS.find((m) => lower.includes(m)) ??
    (lower.includes(" jan ") || lower.includes("jan ") ? "january" : null);
  const monthTitle = month ? month[0].toUpperCase() + month.slice(1) : null;
  const period = monthTitle && year ? `${monthTitle} ${year}` : year ?? null;

  const isMinutes = /minute/.test(lower);
  return {
    label: isMinutes && period ? `${period} meeting minutes` : base,
    period,
    category: isMinutes ? "minutes" : "other",
    /* Sort key: newest first, by the meeting the document covers. */
    sortKey: year ? `${year}-${String(month ? MONTHS.indexOf(month) + 1 : 0).padStart(2, "0")}` : "0000-00",
  };
}

const EXT_TYPE = { ".pdf": "pdf", ".docx": "docx", ".doc": "doc", ".xlsx": "xlsx" };

const files = readdirSync(FOLDER)
  .filter((f) => EXT_TYPE[path.extname(f).toLowerCase()])
  .sort();

if (files.length === 0) {
  console.error(`\n${FOLDER} has no .pdf, .doc, .docx or .xlsx files.\n`);
  process.exit(1);
}

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} from ${FOLDER} to cloud "${creds.cloud_name}"`);
console.log(`${files.length} file${files.length === 1 ? "" : "s"} found.\n`);

const planned = files.map((f) => {
  const full = path.join(FOLDER, f);
  const meta = describe(f);
  return { file: f, full, bytes: statSync(full).size, ...meta, fileType: EXT_TYPE[path.extname(f).toLowerCase()] };
});

for (const p of planned) {
  console.log(`   ${p.file.padEnd(46)} ${(p.period ?? "period N/A").padEnd(16)} ${(p.bytes / 1024).toFixed(0)} KB`);
}

if (!APPLY) {
  console.log("\nNothing uploaded. Re-run with --apply.\n");
  process.exit(0);
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const documents = client.db(process.env.MONGODB_DB).collection("documents");

/* Mock records carry no file. Drop them rather than leave dead rows. */
const removed = await documents.deleteMany({ url: { $exists: false } });
console.log(`\nRemoved ${removed.deletedCount} record${removed.deletedCount === 1 ? "" : "s"} with no file attached.`);

const now = new Date().toISOString();
let done = 0;

for (const p of planned.sort((a, b) => b.sortKey.localeCompare(a.sortKey))) {
  const publicId = `ecp/documents/${p.file.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "-").toLowerCase()}`;
  const uploaded = await cloudinary.uploader.upload(p.full, {
    public_id: publicId,
    resource_type: "raw",
    overwrite: true,
    /* Keep the original name on the download so members get a sensible
       filename rather than the public id. */
    use_filename: false,
  });

  await documents.updateOne(
    { publicId },
    {
      $set: {
        name: p.file,
        label: p.label,
        category: p.category,
        access: "members-only",
        fileType: p.fileType,
        url: uploaded.secure_url,
        publicId,
        sizeBytes: uploaded.bytes ?? p.bytes,
        simulatedSize: `${((uploaded.bytes ?? p.bytes) / 1024 / 1024).toFixed(1)} MB`,
        period: p.period ?? undefined,
        description: p.category === "minutes" ? `Minutes of the ${p.period ?? "club"} general meeting.` : undefined,
        uploadedBy: "seed",
        updatedAt: now,
      },
      $setOnInsert: { id: nanoid(), uploadedAt: now },
    },
    { upsert: true },
  );

  done += 1;
  console.log(`   ${String(done).padStart(2)}/${planned.length}  ${p.file}`);
}

console.log(`\nDone. documents: ${await documents.countDocuments()}\n`);
await client.close();
