/* Seed the club's real events.
 *
 *   node scripts/seed-events.mjs            dry run
 *   node scripts/seed-events.mjs --apply    writes
 *
 * Every event here is an occurrence of a programme the club actually runs.
 * Nothing is invented:
 *
 *   title, description  lib/content/programs.ts (the spec's own blurbs)
 *   month               the programme's `when` / `months`, from spec §5
 *   image               the programme's own photo
 *   organiser           the chair of the matching committee, read live from
 *                       the committees collection
 *   flagship notes      ECI_FLAGSHIP in programs.ts (spec §11)
 *
 * The one thing the club has NOT given is the day of the month. Rather than
 * put every event on the 1st, each lands on the Saturday the club would
 * realistically hold it, and `dayIsProvisional` is set on the record so the
 * portal and the club can tell a confirmed date from a placeholder one.
 * Two have a real anchor and are not provisional:
 *
 *   Independence Day Parade   first Saturday of October
 *   Thanksgiving Turkey Drive Saturday before Thanksgiving
 *
 * Past occurrences are seeded as `completed`, future ones as `published`,
 * measured against the day the script runs.
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

/* programs.ts is TypeScript, so the handful of fields needed here are
   transcribed rather than imported. Keep in step with that file. */
const PROGRAMS = [
  {
    id: "adopt-a-highway",
    name: "Adopt a Highway",
    months: [5],
    years: null,
    type: "volunteer",
    committeeSlug: "adopt-a-highway",
    location: "Big Oak Road, Bucks County, Pennsylvania",
    venue: "ECP's adopted two-mile stretch of Big Oak Road",
    time: "09:00",
    endTime: "13:00",
    tags: ["community service", "environment"],
    image: "/gallery/projects/highway/group-at-sign.jpg",
    blurb:
      "Each spring our members trade weekends for work gloves and roll out along our adopted stretch of highway, clearing litter and restoring the roadside our neighbors drive past every day. It is our most visible act of pride in the place we now call home.",
  },
  {
    id: "scholarship-programs",
    name: "Scholarship Award Presentation",
    months: [5],
    years: null,
    type: "other",
    committeeSlug: "scholarship-programs",
    location: "Philadelphia, Pennsylvania",
    time: "16:00",
    endTime: "20:00",
    tags: ["education", "youth", "awards"],
    image: "/gallery/projects/scholarship/2026-awardees.jpg",
    blurb:
      "We close the academic year by celebrating the scholars among us, outstanding students of Nigerian heritage whose drive deserves a runway. The evening turns a scholarship check into a moment of recognition the whole community shows up for.",
  },
  {
    id: "ronald-mcdonald-house",
    name: "Ronald McDonald House Service Day",
    months: [6],
    years: null,
    type: "volunteer",
    committeeSlug: "ronald-mcdonald-house",
    location: "Philadelphia, Pennsylvania",
    venue: "Ronald McDonald House, Philadelphia",
    time: "08:00",
    endTime: "12:00",
    tags: ["health", "community service"],
    image: "/gallery/projects/rmh/team-with-ronald.jpg",
    blurb:
      "Members fill the Ronald McDonald House kitchen with the smell of home-cooked meals for families whose children are receiving medical care. Quiet, hands-on service, comfort offered one plate at a time.",
  },
  {
    id: "back-to-school",
    name: "Back to School Initiative",
    months: [8],
    years: null,
    type: "volunteer",
    committeeSlug: "back-to-school",
    location: "Philadelphia, Pennsylvania",
    time: "10:00",
    endTime: "14:00",
    tags: ["education", "youth", "community service"],
    image: "/gallery/projects/homefront/homefront-donation.jpg",
    blurb:
      "As summer winds down we pack backpacks with the supplies that let a child walk into the first day of school standing a little taller. Hundreds of students across the Philadelphia area start the year ready and confident.",
  },
  {
    id: "independence-day-parade",
    name: "Nigeria Independence Day Parade",
    months: [10],
    years: null,
    type: "other",
    committeeSlug: "independence-day-parade",
    location: "New York City, New York",
    time: "11:00",
    endTime: "16:00",
    tags: ["culture", "heritage", "parade"],
    image: "/gallery/projects/parade/eyo-procession.jpg",
    anchor: "first-saturday",
    blurb:
      "Green-white-green takes over the street as we march in the Nigeria Independence Day Parade, drums, agbada, gele, and an unmistakable sense of who we are. It is heritage you can hear from a block away.",
  },
  {
    id: "thanksgiving-turkey-drive",
    name: "Thanksgiving Turkey Giveaway",
    months: [11],
    years: null,
    type: "volunteer",
    committeeSlug: "thanksgiving-turkey-drive",
    location: "Philadelphia, Pennsylvania",
    time: "10:00",
    endTime: "14:00",
    tags: ["community service", "food"],
    image: "/gallery/projects/thanksgiving/team-and-turkeys.jpg",
    anchor: "before-thanksgiving",
    blurb:
      "No table should sit empty in November. Members gather and distribute turkeys and trimmings so families across the area enjoy a full Thanksgiving meal and a reminder that they are not alone.",
  },
  {
    id: "winter-coat-drive",
    name: "Winter Coat Drive",
    /* The spec says "Nov - Jan". That is one drive spanning the turn of the
       year, not three, so it is seeded as a single event with an end date. */
    months: [11],
    spanMonths: 2,
    years: null,
    type: "volunteer",
    committeeSlug: "winter-coat-drive",
    location: "Philadelphia, Pennsylvania",
    time: "10:00",
    endTime: "14:00",
    tags: ["community service", "winter"],
    blurb:
      "When the temperature drops, we collect and hand out coats, scarves, and gloves to neighbors facing the cold without them. Every coat donated is, as we like to say, a hug from the community.",
  },
  {
    id: "health-education",
    name: "Health Education Talk",
    /* Six a year, so the title carries the month to tell them apart. */
    titleWithMonth: true,
    /* "Every other month" in the spec, which the calendar reads as the
       even months. */
    months: [2, 4, 6, 8, 10, 12],
    years: null,
    type: "seminar",
    committeeSlug: "health-education",
    location: "Online",
    isOnline: true,
    time: "19:00",
    endTime: "20:30",
    tags: ["health", "education"],
    image: "/gallery/projects/health/flyer-heart-health-2025-01.jpg",
    blurb:
      "Through the year we bring in doctors and specialists for frank, practical talks and screenings, heart health, diabetes prevention, mental wellness, nutrition, knowledge that helps our community live longer and better.",
  },
  {
    id: "medical-mission",
    name: "ECI Medical Mission",
    months: [11],
    /* Biennial: 2026, 2028, 2030. */
    years: [2026, 2028, 2030],
    type: "other",
    committeeSlug: null,
    location: "Lagos, Nigeria",
    time: "09:00",
    tags: ["health", "medical mission", "eko club international"],
    image: "https://i.ytimg.com/vi/9ViSMyqg5_s/hqdefault.jpg",
    featured: true,
    blurb:
      "Our flagship. Every two years a team of medical professionals and volunteers travels to deliver free care, screenings, and supplies to communities that need them, the fullest expression of why this club exists.",
  },
];

/** Years to lay down. */
const YEARS = [2025, 2026, 2027];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** The nth Saturday of a month, as a UTC date. */
function nthSaturday(year, month, n) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (6 - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month - 1, 1 + offset + (n - 1) * 7));
}

/** The Saturday before Thanksgiving, which is the fourth Thursday of November. */
function saturdayBeforeThanksgiving(year) {
  const first = new Date(Date.UTC(year, 10, 1));
  const toThursday = (4 - first.getUTCDay() + 7) % 7;
  const thanksgiving = 1 + toThursday + 3 * 7;
  return new Date(Date.UTC(year, 10, thanksgiving - 5));
}

function dateFor(program, year, month) {
  if (program.anchor === "first-saturday") return { date: nthSaturday(year, month, 1), provisional: false };
  if (program.anchor === "before-thanksgiving") return { date: saturdayBeforeThanksgiving(year), provisional: false };
  return { date: nthSaturday(year, month, 2), provisional: true };
}

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB);
const events = db.collection("events");
const registrations = db.collection("eventRegistrations");
const committees = db.collection("committees");

/* The organiser is whoever chairs the matching committee, read from the
   database so the two can never drift apart. */
const chairBySlug = new Map();
for (const c of await committees.find({}).toArray()) {
  const chair = (c.members ?? []).find((m) => m.isChairperson);
  if (chair) chairBySlug.set(c.slug, chair);
}

const now = new Date();
const nowIso = now.toISOString();
const docs = [];

for (const program of PROGRAMS) {
  const years = program.years ?? YEARS;
  for (const year of years) {
    if (!YEARS.includes(year)) continue;
    for (const month of program.months) {
      const { date, provisional } = dateFor(program, year, month);
      /* A spanning drive runs until the end of its closing month. */
      const endDate = program.spanMonths
        ? new Date(Date.UTC(year, month - 1 + program.spanMonths + 1, 0))
        : null;
      /* Something still running has not finished, however long ago it began. */
      const isPast = (endDate ?? date) < now;
      const chair = program.committeeSlug ? chairBySlug.get(program.committeeSlug) : null;
      const monthName = MONTH_NAMES[month - 1];

      docs.push({
        id: `ecp-evt-${program.id}-${year}-${String(month).padStart(2, "0")}`,
        title: program.titleWithMonth
          ? `${program.name}, ${monthName} ${year}`
          : `${program.name} ${year}`,
        slug: `${program.id}-${year}-${String(month).padStart(2, "0")}`,
        description: program.blurb,
        shortDescription: `${monthName} ${year}. ${program.name}.`,
        date: date.toISOString(),
        ...(endDate ? { endDate: endDate.toISOString() } : {}),
        time: program.time,
        ...(program.endTime ? { endTime: program.endTime } : {}),
        location: program.location,
        ...(program.venue ? { venue: program.venue } : {}),
        isOnline: Boolean(program.isOnline),
        type: program.type,
        status: isPast ? "completed" : "published",
        ...(program.image ? { imageUrl: program.image } : {}),
        /* The club has not set caps or a sign-up cut-off per occurrence. */
        registrationRequired: !isPast,
        organizerId: chair?.userId ?? "",
        organizerName: chair?.name ?? "Eko Club Philadelphia",
        tags: program.tags,
        isFeatured: Boolean(program.featured) && !isPast,
        isPublic: true,
        membersOnly: false,
        programId: program.id,
        /* True where the month is the club's but the day is ours. */
        dayIsProvisional: provisional,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
  }
}

docs.sort((a, b) => a.date.localeCompare(b.date));

const existing = await events.find({}).toArray();
const keep = new Set(docs.map((d) => d.id));
const doomed = existing.filter((e) => !keep.has(e.id));

console.log(`\n${APPLY ? "APPLYING" : "DRY RUN"} against ${process.env.MONGODB_DB}`);
console.log(`Existing events: ${existing.length}. Removing ${doomed.length}.\n`);
console.log(`Seeding ${docs.length} occurrences across ${YEARS.join(", ")}:\n`);

for (const d of docs) {
  const day = d.date.slice(0, 10);
  console.log(
    `   ${day}  ${d.status.padEnd(9)} ${d.title.padEnd(38)} ${d.organizerName.padEnd(30)}` +
      `${d.dayIsProvisional ? " day provisional" : ""}`,
  );
}

const byStatus = docs.reduce((a, d) => ((a[d.status] = (a[d.status] ?? 0) + 1), a), {});
const noChair = docs.filter((d) => !d.organizerId).length;
console.log(`\n${JSON.stringify(byStatus)}; ${noChair} with no linked chair; ` +
  `${docs.filter((d) => d.dayIsProvisional).length} with a provisional day.`);

if (!APPLY) {
  console.log("\nNothing written. Re-run with --apply.\n");
} else {
  if (doomed.length) {
    await registrations.deleteMany({ eventId: { $in: doomed.map((e) => e.id) } });
    await events.deleteMany({ id: { $in: doomed.map((e) => e.id) } });
  }
  for (const d of docs) {
    const { createdAt, ...rest } = d;
    await events.updateOne({ id: d.id }, { $set: rest, $setOnInsert: { createdAt } }, { upsert: true });
  }
  console.log(`\nDone. events: ${await events.countDocuments()}\n`);
}

await client.close();
