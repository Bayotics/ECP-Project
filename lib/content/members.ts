/* The ECP roster.

   Sources, all supplied by the club:
   - "ECP MEMBERS DATABASE WITH YR JOIN.xlsx", sheet "ECP LIST" ("Directory of
     ECP Members 2026") for who is a member and the year they joined.
   - The same workbook's first sheet ("Members Roaster") for profession and
     Lagos connection, matched on first and last name only. Its POSITION
     column is an older executive and is deliberately NOT used.
   - The Member Spotlight badge artwork in the club's Drive folder, which
     carries each person's name and current office; those are the offices
     shown here, and they match what /about already publishes.
   - "Bims Bio 2026.docx" and "Hon. Abdullateef.pptx" for two biographies;
     the Mimiko and Onitolo biographies are the ones already on /about.

   Deliberately absent: home addresses, phone numbers, email addresses and
   dates of birth. The workbook holds all four for every member and none of
   them belong in a page that ships to the browser. Contact details for
   members stay in the database behind the members API.

   Photographs are the badge artwork at /gallery/members, cropped to the
   portrait at render time (the name and role are baked into the bottom of
   each badge and turn into a smudge at card size, so the site sets them as
   real text instead). */

export type Office = "exco" | "trustees" | "patron";

export type Member = {
  slug: string;
  /** Exactly as the club's own badge artwork prints it. */
  name: string;
  /** Current office, or "Member". */
  role: string;
  office?: Office;
  /** Year the member joined ECP. */
  joined?: number;
  joinedNote?: string;
  profession?: string;
  /** Where in Lagos the member's family is from. */
  from?: string;
  photo?: string;
  /** Point down the badge, as a percentage, that the portrait crop centres on. */
  focusY?: number;
  bio?: string[];
};

/** How far the portrait crop zooms into the badge artwork. */
export const MEMBER_ZOOM = 2.3;
export const MEMBER_FOCUS_Y = 34;

const photo = (slug: string) => `/gallery/members/${slug}.jpg`;

export const MEMBERS: Member[] = [
  {
    slug: "olabisi-dabiri-okoya",
    name: "Hon. Olabisi Dabiri-Okoya",
    role: "President",
    office: "exco",
    joined: 2004,
    profession: "Teacher",
    from: "Lagos Island",
    photo: photo("olabisi-dabiri-okoya"),
  },
  {
    slug: "bola-okoya",
    name: "Hon. Bola Okoya",
    role: "Chairman, Board of Trustees",
    office: "trustees",
    joined: 2004,
    profession: "Accountant and financial consultant",
    from: "Lagos Island",
    photo: photo("bola-okoya"),
  },
  {
    slug: "patricia-abiggs",
    name: "Hon. Patricia Abiggs",
    role: "Member",
    joined: 2014,
    photo: photo("patricia-abiggs"),
  },
  {
    slug: "victoria-arowolo",
    name: "Hon. Victoria Arowolo",
    role: "Member",
    joined: 2015,
    from: "Lagos Island",
    photo: photo("victoria-arowolo"),
  },
  {
    slug: "funmi-ayantuga",
    name: "Hon. Funmi Ayantuga",
    role: "Member",
    joined: 2015,
  },
  {
    slug: "titilayo-balogun",
    name: "Hon. Titilayo Balogun",
    role: "Member",
    joined: 2016,
    joinedNote: "Joined 2016, rejoined 2022",
    from: "Lagos Island",
    photo: photo("titilayo-balogun"),
  },
  {
    slug: "abolore-olufemi",
    name: "Hon. Abolore Olufemi",
    role: "Member",
    joined: 2016,
    from: "Lagos Island",
  },
  {
    slug: "saheed-abdullateef",
    name: "Hon. Saheed Abdullateef",
    role: "Secretary, Board of Trustees",
    office: "trustees",
    joined: 2017,
    profession: "Founder, McLati Logistics LLC",
    from: "Lagos Island",
    photo: photo("saheed-abdullateef"),
    bio: [
      "Hon. Saheed Omotola Abdullateef (SOA) is the owner and founder of McLati Logistics LLC, a professional transportation company based in Reading, Pennsylvania. The company specialises in the safe and reliable delivery of general freight, with a strong commitment to safety, efficiency and customer satisfaction.",
      "Alongside his professional work he has served in community and organisational leadership: former President of Eko Club Philadelphia, and former Chief Whip and Public Relations Officer of Eko Club International from 2019 to 2025.",
    ],
  },
  {
    slug: "bolanle-bello",
    name: "Hon. Bolanle Bello",
    role: "Member",
    joined: 2017,
    photo: photo("bolanle-bello"),
  },
  {
    slug: "olabisi-lawal",
    name: "Hon. Olabisi Lawal",
    role: "Treasurer / Financial Secretary",
    office: "exco",
    joined: 2017,
    profession: "Social worker",
    from: "Lagos Island",
    photo: photo("olabisi-lawal"),
  },
  {
    slug: "bintu-paseda",
    name: "Hon. Bintu Paseda",
    role: "Member",
    joined: 2017,
    photo: photo("bintu-paseda"),
  },
  {
    slug: "simisoluwa-spruell",
    name: "Hon. Simisoluwa Spruell",
    role: "Member",
    joined: 2017,
    photo: photo("simisoluwa-spruell"),
  },
  {
    slug: "wale-lawal",
    name: "Hon. Wale Lawal",
    role: "Member",
    joined: 2018,
    photo: photo("wale-lawal"),
  },
  {
    slug: "folashade-adedeji",
    name: "Hon. Folashade Adedeji",
    role: "PRO / Social Secretary",
    office: "exco",
    joined: 2022,
    photo: photo("folashade-adedeji"),
  },
  {
    slug: "monsurat-suleiman",
    name: "Hon. Monsurat Suleiman",
    role: "Member",
    joined: 2023,
    photo: photo("monsurat-suleiman"),
  },
  {
    slug: "folashade-small",
    name: "Hon. Folashade Small",
    role: "Member",
    joined: 2023,
    photo: photo("folashade-small"),
  },
  {
    slug: "adebimpe-daniells",
    name: "Hon. Adebimpe Daniells",
    role: "Vice President",
    office: "exco",
    joined: 2023,
    profession: "Senior Solutions Architect, AWS",
    photo: photo("adebimpe-daniells"),
    bio: [
      "Adebimpe Daniells is a technologist, author and speaker with deep expertise in cloud computing, AI and machine learning, and digital transformation. As a Senior Solutions Architect and AI specialist for Private Equity at AWS, she advises leading PE firms on cloud migration, modernisation and AI driven value creation across their portfolio companies. She specialises in developing and implementing AI decision making strategies, helping organisations build and deploy production AI workloads on AWS.",
      "She authored the memoir Serendipity, was named one of the Society of Women Engineers’ “Women Engineers You Should Know 2024”, and received the Amazon Women in Engineering Technology Innovator Award 2025. She is a member of Phi Beta Kappa and the Golden Key International Honour Society, and speaks at industry conferences including the SWE Conference, the George Mason Cloud Summit and the World AgriTech Summit.",
    ],
  },
  {
    slug: "modupe-mabinuori-olageshin",
    name: "Hon. Elder Modupe Mabinuori-Olageshin",
    role: "Vice Chairwoman / Treasurer, Board of Trustees",
    office: "trustees",
    joined: 2024,
    photo: photo("modupe-mabinuori-olageshin"),
  },
  {
    slug: "adebimpe-badru-adenusi",
    name: "Hon. (Dr) Adebimpe Badru-Adenusi",
    role: "Member",
    joined: 2024,
    photo: photo("adebimpe-badru-adenusi"),
  },
  {
    slug: "funmi-smith",
    name: "Hon. Funmi Smith",
    role: "Member",
    joined: 2024,
    photo: photo("funmi-smith"),
  },
  {
    slug: "funmi-eregha",
    name: "Hon. Funmi Eregha",
    role: "Member",
    photo: photo("funmi-eregha"),
  },
  {
    slug: "tj-abass",
    name: "Otunba TJ Abass",
    role: "Grand Patron",
    office: "patron",
    photo: photo("tj-abass"),
  },
  {
    slug: "ganiyu-mimiko",
    name: "Dr. Ganiyu Mimiko",
    role: "Patron",
    office: "patron",
    joined: 2017,
    profession: "Project Manager, Connecticut Department of Transportation",
    photo: photo("ganiyu-mimiko"),
    bio: [
      "Dr. Ganiyu Mimiko was born in Ondo City. He attended Ansar-Ud-Deen primary school, Okelisa from 1963 to 1969, Jubilee Secondary Modern School in 1970 and Independence Grammar School in 1971, before transferring to Ondo Boys High School where he completed his secondary education from 1972 to 1975.",
      "He worked with Monier Construction Company in Port Harcourt from 1975 to 1982 as Laboratory Technical Manager before leaving for the United States. He earned a BS in Civil Engineering from the University of the District of Columbia in 1988 and joined the Connecticut Department of Transportation in 1989, where he manages construction projects. He went on to an MS in Environmental Engineering from the University of New Haven in 1993 and a PhD in Engineering Management from National University in 2009.",
      "He is a former president of the Yoruba Community Club, a former president and current Treasurer of the Ondo Elite Club of Rhode Island, and serves on the Human Rights and Relations Commission in Hamden, Connecticut.",
    ],
  },
  {
    slug: "maryanne-onitolo",
    name: "Chief (Dr.) Maryanne Onitolo",
    role: "Matron",
    office: "patron",
    profession: "Family Nurse Practitioner",
    photo: photo("maryanne-onitolo"),
    bio: [
      "Maryanne Onitolo, MSN, FNP-BC, DNP, is a board certified Family Nurse Practitioner licensed in New York and New Jersey, and a graduate of Monmouth University in New Jersey.",
      "Known for her dedication, leadership and commitment to serving others, she is a mentor, leader and educator, and a proud mother of three children, all of whom have pursued careers in medicine. In recognition of her service she was honoured with the traditional chieftaincy title of Yeye Apesin of Ijora Kingdom, Lagos, by HRM Oba Fatai Aremu Aromire, the Ojora of Lagos. Outside work she enjoys cooking, decorating and spending time with her family.",
    ],
  },
  {
    slug: "risikat-oshilaja",
    name: "Alhaja Risikat Oshilaja",
    role: "Matron",
    office: "patron",
    photo: photo("risikat-oshilaja"),
  },
];

export const OFFICE_LABEL: Record<Office, string> = {
  exco: "Executive Council",
  trustees: "Board of Trustees",
  patron: "Matrons and patrons",
};

export const FOUNDED = 2004;

export function initials(name: string) {
  const parts = name
    .replace(/^(Hon\.|Chief|Dr\.?|Otunba|Alhaja|Alhaji|Elder|\(Dr\)|\(Dr\.\))\s*/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

/** Longest-serving first, then alphabetical; members with no join year last. */
export function byTenure(a: Member, b: Member) {
  if (a.joined && b.joined && a.joined !== b.joined) return a.joined - b.joined;
  if (a.joined && !b.joined) return -1;
  if (!a.joined && b.joined) return 1;
  return a.name.localeCompare(b.name);
}

export const MEMBER_STATS = {
  total: MEMBERS.length,
  withPhoto: MEMBERS.filter((m) => m.photo).length,
  exco: MEMBERS.filter((m) => m.office === "exco").length,
  trustees: MEMBERS.filter((m) => m.office === "trustees").length,
  patrons: MEMBERS.filter((m) => m.office === "patron").length,
  earliest: Math.min(...MEMBERS.filter((m) => m.joined).map((m) => m.joined as number)),
};
