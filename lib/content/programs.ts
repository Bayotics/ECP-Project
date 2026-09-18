/* ECP Programs Calendar 2026–2030.

   Source: ECP Website Review Spec — §5 (program, month, sign-up window,
   active years), §6 (committee mapping) and §11 (the program blurbs, used
   verbatim). The spec's per-program "About this program / Quick facts" copy
   lives in the Programs Calendar deck, which hasn't been supplied yet, so
   there are no program detail pages.

   `months` lists the months a program runs (1 = Jan) for the calendar view.
   Programs whose month isn't fixed in the source leave it empty and carry a
   `monthNote` instead — Health Education runs "every other month" without
   naming which, and the Medical Mission is only dated for 2026 (§11: ECI
   Medical Mission, November 2026). */

export type Committee = "Health & Medical" | "Education & Youth" | "Community Service" | "Culture & Heritage";

export type Program = {
  id: string;
  name: string;
  when: string;
  months: number[];
  monthsByYear?: Partial<Record<number, number[]>>;
  monthNote?: string;
  /** One-month sign-up window as MM-DD, or null when the source gives none. */
  signup: { start: string; end: string } | null;
  signupNote?: string;
  /** Years the program runs; empty means every year. */
  activeYears: number[];
  committee: Committee;
  blurb: string;
  accent: string;
  image?: { src: string; alt: string };
  /** Anchor on /projects documenting this program in practice. */
  projectId?: string;
  flagship?: boolean;
};

export const PROGRAM_YEARS = [2026, 2027, 2028, 2029, 2030];

export const EKO = {
  green: "#059669",
  red: "#dc2626",
  blue: "#2563eb",
  yellow: "#d97706",
} as const;

export const PROGRAMS: Program[] = [
  {
    id: "adopt-a-highway",
    name: "Adopt a Highway",
    when: "May",
    months: [5],
    signup: { start: "04-01", end: "04-30" },
    activeYears: [],
    committee: "Community Service",
    blurb:
      "Each spring our members trade weekends for work gloves and roll out along our adopted stretch of highway, clearing litter and restoring the roadside our neighbors drive past every day. It is our most visible act of pride in the place we now call home.",
    accent: EKO.green,
    image: { src: "/gallery/projects/highway/group-at-sign.jpg", alt: "ECP members with collected litter bags beside the Adopt-a-Highway sign" },
    projectId: "adopt-a-highway",
  },
  {
    id: "scholarship-programs",
    name: "Scholarship Programs",
    when: "May",
    months: [5],
    signup: { start: "04-01", end: "04-30" },
    activeYears: [],
    committee: "Education & Youth",
    blurb:
      "We close the academic year by celebrating the scholars among us, outstanding students of Nigerian heritage whose drive deserves a runway. The evening turns a scholarship check into a moment of recognition the whole community shows up for.",
    accent: EKO.blue,
    image: { src: "/gallery/projects/scholarship/2026-awardees.jpg", alt: "Scholarship awardees holding their certificates with ECP members" },
    projectId: "scholarships",
  },
  {
    id: "ronald-mcdonald-house",
    name: "Ronald McDonald House",
    when: "June (or as needed)",
    months: [6],
    signup: { start: "05-01", end: "05-31" },
    activeYears: [],
    committee: "Health & Medical",
    blurb:
      "Members fill the Ronald McDonald House kitchen with the smell of home-cooked meals for families whose children are receiving medical care. Quiet, hands-on service, comfort offered one plate at a time.",
    accent: EKO.red,
    image: { src: "/gallery/projects/rmh/team-with-ronald.jpg", alt: "ECP volunteers in blue shirts beside the Ronald McDonald statue" },
    projectId: "ronald-mcdonald-house",
  },
  {
    id: "back-to-school",
    name: "Back to School Initiatives",
    when: "August",
    months: [8],
    signup: { start: "07-01", end: "07-31" },
    activeYears: [],
    committee: "Education & Youth",
    blurb:
      "As summer winds down we pack backpacks with the supplies that let a child walk into the first day of school standing a little taller. Hundreds of students across the Philadelphia area start the year ready and confident.",
    accent: EKO.blue,
    image: { src: "/gallery/projects/homefront/homefront-donation.jpg", alt: "ECP members and a HomeFront representative with donated school supplies" },
    projectId: "back-to-school",
  },
  {
    id: "independence-day-parade",
    name: "Nigeria Independence Day Parade",
    when: "October",
    months: [10],
    signup: { start: "09-01", end: "09-30" },
    activeYears: [],
    committee: "Culture & Heritage",
    blurb:
      "Green-white-green takes over the street as we march in the Nigeria Independence Day Parade, drums, agbada, gele, and an unmistakable sense of who we are. It is heritage you can hear from a block away.",
    accent: EKO.green,
    image: { src: "/gallery/projects/parade/eyo-procession.jpg", alt: "Eyo masquerades processing down the parade route" },
    projectId: "independence-day-parade",
  },
  {
    id: "thanksgiving-turkey-drive",
    name: "Thanksgiving Turkey Drive",
    when: "November",
    months: [11],
    signup: { start: "10-01", end: "10-31" },
    activeYears: [],
    committee: "Community Service",
    blurb:
      "No table should sit empty in November. Members gather and distribute turkeys and trimmings so families across the area enjoy a full Thanksgiving meal and a reminder that they are not alone.",
    accent: EKO.yellow,
    image: { src: "/gallery/projects/thanksgiving/team-and-turkeys.jpg", alt: "ECP members behind a table of turkeys ready for the giveaway" },
    projectId: "thanksgiving",
  },
  {
    id: "winter-coat-drive",
    name: "Winter Coat Drive",
    when: "Nov – Jan",
    months: [11, 12, 1],
    signup: { start: "10-01", end: "10-31" },
    activeYears: [],
    committee: "Community Service",
    blurb:
      "When the temperature drops, we collect and hand out coats, scarves, and gloves to neighbors facing the cold without them. Every coat donated is, as we like to say, a hug from the community.",
    accent: EKO.blue,
  },
  {
    id: "health-education",
    name: "Health Education",
    when: "Every other month",
    months: [],
    monthNote: "Every other month",
    signup: null,
    signupNote: "Ongoing, monthly",
    activeYears: [],
    committee: "Health & Medical",
    blurb:
      "Through the year we bring in doctors and specialists for frank, practical talks and screenings, heart health, diabetes prevention, mental wellness, nutrition, knowledge that helps our community live longer and better.",
    accent: EKO.red,
    image: { src: "/gallery/projects/health/flyer-heart-health-2025-01.jpg", alt: "Flyer for ECP's Heart Health webinar with Dr. Craig McMackin" },
    projectId: "health-education",
  },
  {
    id: "medical-mission",
    name: "Medical Mission",
    when: "Biennial",
    months: [],
    monthsByYear: { 2026: [11] },
    monthNote: "Biennial",
    signup: null,
    signupNote: "Sign-ups open 6 months prior",
    activeYears: [2026, 2028, 2030],
    committee: "Health & Medical",
    blurb:
      "Our flagship. Every two years a team of medical professionals and volunteers travels to deliver free care, screenings, and supplies to communities that need them, the fullest expression of why this club exists.",
    accent: EKO.red,
    image: { src: "https://i.ytimg.com/vi/9ViSMyqg5_s/hqdefault.jpg", alt: "Eko Club International Medical Mission, Lagos Island" },
    projectId: "medical-missions",
    flagship: true,
  },
];

export const COMMITTEES: Committee[] = ["Health & Medical", "Education & Youth", "Community Service", "Culture & Heritage"];

/* Parent-body (ECI) headline events — spec §11. */
export const ECI_FLAGSHIP: Record<number, { title: string; text: string }> = {
  2026: {
    title: "ECI Medical Mission, November 2026",
    text: "Eko Club International’s flagship medical outreach. As a chapter, ECP rallies volunteers, supplies, and support behind the mission the headline event of the 2026 calendar.",
  },
  2027: {
    title: "ECI 26th Biennial Convention, London 2027",
    text: "The worldwide family of Eko Club gathers in London for the 26th Biennial Convention; business, culture, and reunion. ECP joins delegates from across the globe to represent Philadelphia.",
  },
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isActiveIn(program: Program, year: number) {
  return program.activeYears.length === 0 || program.activeYears.includes(year);
}

export function monthsIn(program: Program, year: number) {
  return program.monthsByYear?.[year] ?? program.months;
}

export type SignupStatus = "open" | "upcoming" | "closed" | "none";

/** Sign-up status for `year`, judged against `today` (a Date or null before
    the browser has told us what day it is). */
export function signupStatus(program: Program, year: number, today: Date | null): SignupStatus {
  if (!program.signup || !today) return "none";
  const [sm, sd] = program.signup.start.split("-").map(Number);
  const [em, ed] = program.signup.end.split("-").map(Number);
  const open = new Date(year, sm - 1, sd);
  const close = new Date(year, em - 1, ed, 23, 59, 59);
  if (today < open) return "upcoming";
  if (today > close) return "closed";
  return "open";
}

export function formatWindow(program: Program) {
  if (!program.signup) return program.signupNote ?? "";
  const fmt = (mmdd: string) => {
    const [m, d] = mmdd.split("-").map(Number);
    return `${MONTHS[m - 1]} ${d}`;
  };
  return `${fmt(program.signup.start)} – ${fmt(program.signup.end)}`;
}
