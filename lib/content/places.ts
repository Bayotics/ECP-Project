import { EKO } from "@/lib/content/programs";

/* Places an ECP member in Philadelphia actually needs.
 *
 * A note on the diplomatic posts, because it trips people up: Nigeria has
 * no embassy or consulate in Philadelphia. The Embassy is in Washington
 * DC and the Consulate General, which is the one that handles passports
 * and NIN for anyone living in Pennsylvania, is in New York. Both are a
 * drive away, so each entry carries how far it is and members are told to
 * book before travelling rather than turning up.
 *
 * Every map link is built from a search query rather than stored
 * coordinates, so Google resolves the pin from the name and address. A
 * slightly stale street number still lands on the right building, which
 * would not be true of a hard-coded latitude.
 *
 * Addresses and phone numbers change. Anything here should be checked
 * against the organisation's own site before a member travels, which is
 * what `officialUrl` is for.
 */

export type PlaceCategory =
  | "Consular and immigration"
  | "Community and culture"
  | "Travel"
  | "Civic"
  | "Health";

export const PLACE_CATEGORIES: PlaceCategory[] = [
  "Consular and immigration",
  "Community and culture",
  "Travel",
  "Civic",
  "Health",
];

/** Colour per category, from the club's four. */
export const CATEGORY_ACCENT: Record<PlaceCategory, string> = {
  "Consular and immigration": EKO.green,
  "Community and culture": EKO.yellow,
  Travel: EKO.blue,
  Civic: EKO.blue,
  Health: EKO.red,
};

export type Place = {
  id: string;
  name: string;
  category: PlaceCategory;
  /** One line on why a member would go. */
  what: string;
  street?: string;
  city: string;
  /** Shown when the place is not in Philadelphia. */
  travelNote?: string;
  phone?: string;
  officialUrl?: string;
  /** Anything a member should know before setting off. */
  tip?: string;
  /** A real photograph, when the club supplies one. */
  photo?: { src: string; alt: string };
};

export const PLACES: Place[] = [
  /* ── Consular and immigration ─────────────────────────────── */
  {
    id: "nigeria-consulate-new-york",
    name: "Consulate General of Nigeria, New York",
    category: "Consular and immigration",
    what:
      "The consulate covering Pennsylvania. Passport applications and renewals, NIN enrolment and verification, visas, and the legalisation of Nigerian documents.",
    street: "828 Second Avenue",
    city: "New York, NY 10017",
    travelNote: "About two hours from Philadelphia. Amtrak from 30th Street Station is the usual way.",
    officialUrl: "https://www.nigeriahouse.com",
    tip: "Book an appointment online first and take printed confirmation. Walk-ins are usually turned away, and the busiest months are the summer.",
  },
  {
    id: "nigeria-embassy-washington",
    name: "Embassy of Nigeria, Washington DC",
    category: "Consular and immigration",
    what:
      "Nigeria's mission to the United States. Consular matters of the kind the New York consulate cannot settle, plus official and diplomatic business.",
    street: "3519 International Court NW",
    city: "Washington, DC 20008",
    travelNote: "About two and a half hours from Philadelphia.",
    officialUrl: "https://www.nigeriaembassyusa.org",
    tip: "For a passport or NIN, New York is your consulate, not Washington. Call ahead before making the trip.",
  },
  {
    id: "uscis-philadelphia",
    name: "USCIS Philadelphia Field Office",
    category: "Consular and immigration",
    what:
      "Biometrics appointments, green card and naturalisation interviews, and the oath ceremony for new citizens.",
    street: "1600 Callowhill Street",
    city: "Philadelphia, PA 19130",
    officialUrl: "https://www.uscis.gov/about-us/find-a-uscis-office/field-offices",
    tip: "Entry is by appointment notice only. Take the notice and photo ID, and leave phones and bags to a minimum.",
  },
  {
    id: "nationalities-service-center",
    name: "Nationalities Service Center",
    category: "Consular and immigration",
    what:
      "Low cost immigration legal help, English classes, and resettlement support for immigrants across Philadelphia.",
    street: "1216 Arch Street",
    city: "Philadelphia, PA 19107",
    officialUrl: "https://nscphila.org",
    tip: "A good first call before paying a private immigration lawyer.",
  },
  {
    id: "hias-pennsylvania",
    name: "HIAS Pennsylvania",
    category: "Consular and immigration",
    what:
      "Free and low cost immigration legal services, citizenship assistance, and help for immigrants facing removal.",
    city: "Philadelphia, PA",
    officialUrl: "https://hiaspa.org",
  },

  /* ── Community and culture ────────────────────────────────── */
  {
    id: "acana",
    name: "African Cultural Alliance of North America",
    category: "Community and culture",
    what:
      "ACANA, the anchor organisation for West African families in Southwest Philadelphia. Legal aid, housing help, youth programmes, and the African festival each summer.",
    street: "5530 Chester Avenue",
    city: "Philadelphia, PA 19143",
    officialUrl: "https://acanaus.org",
    tip: "The closest thing Philadelphia has to a one-stop shop for a newly arrived Nigerian family.",
  },
  {
    id: "office-of-immigrant-affairs",
    name: "Philadelphia Office of Immigrant Affairs",
    category: "Community and culture",
    what:
      "The city's own office for immigrant residents. Language access, know-your-rights guidance, and referrals into city services regardless of status.",
    street: "City Hall, 1400 John F. Kennedy Boulevard",
    city: "Philadelphia, PA 19107",
    officialUrl: "https://www.phila.gov/departments/office-of-immigrant-affairs/",
  },
  {
    id: "african-american-museum",
    name: "African American Museum in Philadelphia",
    category: "Community and culture",
    what:
      "The first museum built by a major American city to tell African American history. Worth a Saturday with the children.",
    street: "701 Arch Street",
    city: "Philadelphia, PA 19106",
    officialUrl: "https://www.aampmuseum.org",
  },

  /* ── Travel ───────────────────────────────────────────────── */
  {
    id: "phl-airport",
    name: "Philadelphia International Airport",
    category: "Travel",
    what:
      "PHL. No direct flight to Lagos, so most members connect through New York, Washington, Atlanta or Europe.",
    street: "8000 Essington Avenue",
    city: "Philadelphia, PA 19153",
    officialUrl: "https://www.phl.org",
    tip: "The SEPTA Airport Line runs from Center City and 30th Street and is far cheaper than parking.",
  },
  {
    id: "30th-street-station",
    name: "William H. Gray III 30th Street Station",
    category: "Travel",
    what:
      "Philadelphia's Amtrak hub, and the way most members reach the Nigerian consulate in New York or the embassy in Washington.",
    street: "2955 Market Street",
    city: "Philadelphia, PA 19104",
    officialUrl: "https://www.amtrak.com/stations/phl",
    tip: "Book the New York train in advance; walk-up fares on the day are steep.",
  },

  /* ── Civic ────────────────────────────────────────────────── */
  {
    id: "philadelphia-city-hall",
    name: "Philadelphia City Hall",
    category: "Civic",
    what:
      "Marriage licences, the Register of Wills, city records, and the council chamber. The Office of Immigrant Affairs sits here too.",
    street: "1400 John F. Kennedy Boulevard",
    city: "Philadelphia, PA 19107",
    officialUrl: "https://www.phila.gov",
  },
  {
    id: "penndot-arch-street",
    name: "PennDOT Driver License Center, Arch Street",
    category: "Civic",
    what:
      "Pennsylvania driver's licence, learner's permit, REAL ID and state photo ID.",
    street: "801 Arch Street",
    city: "Philadelphia, PA 19107",
    officialUrl: "https://www.dmv.pa.gov",
    tip: "Take proof of identity, your social security card and two proofs of Pennsylvania residence. REAL ID needs the originals, not copies.",
  },

  /* ── Health ───────────────────────────────────────────────── */
  {
    id: "ronald-mcdonald-house-philadelphia",
    name: "Philadelphia Ronald McDonald House",
    category: "Health",
    what:
      "A home for families whose children are receiving treatment in the city. ECP cooks and serves here, so members know it well.",
    street: "3925 Chestnut Street",
    city: "Philadelphia, PA 19104",
    officialUrl: "https://philarmh.org",
    tip: "Speak to the Ronald McDonald House committee chair if you want to join a service day.",
  },
  {
    id: "chop",
    name: "Children's Hospital of Philadelphia",
    category: "Health",
    what: "CHOP, one of the leading children's hospitals in the country, and the reason many families are in the city at all.",
    street: "3401 Civic Center Boulevard",
    city: "Philadelphia, PA 19104",
    officialUrl: "https://www.chop.edu",
  },
];

/* ── Maps ──────────────────────────────────────────────────────
   Built from a search query, not coordinates. `output=embed` needs
   no API key, which keeps this working without another secret to
   manage. */

export function mapQuery(place: Place): string {
  return [place.name, place.street, place.city].filter(Boolean).join(", ");
}

export function mapEmbedUrl(place: Place): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery(place))}&output=embed`;
}

export function directionsUrl(place: Place): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapQuery(place))}`;
}

export function fullAddress(place: Place): string {
  return [place.street, place.city].filter(Boolean).join(", ");
}
