/* ECP committees, from the club's own "ECP Committtee Poll Result 2026"
 * sheet (tab: "arrange the poll result according to the time of...").
 *
 * Each committee carries its month and one chairperson: the first name
 * listed against it in the sheet. The poll's vote counts and the rest of
 * the volunteer list are deliberately not stored; a committee shows who
 * chairs it, not how the sitting was arrived at.
 *
 * Names are written informally in the sheet ("Hon. Aunty Bisi Okoya",
 * "Hon. Abdul Lateef") and are matched to a seeded member id where the
 * person is unambiguous. One entry, "Hon. ~kAdarallah masha allah", could
 * not be matched to anyone on the roster and is seeded with the name as
 * written and no user link, so it shows up for the club to correct rather
 * than being silently dropped.
 *
 * NOT in the sheet, and therefore not invented here: the date each
 * committee was formed. It reads as N/A until the club says.
 *
 * Descriptions are the club's own programme blurbs from
 * lib/content/programs.ts for the eight committees that run a programme;
 * the two planning committees get a one-line description built from the
 * sheet's own label and month.
 */

/** Sheet name -> seeded member id. */
export const VOLUNTEER_IDS = {
  "Hon. Alhaji Bola Okoya": "ecp-bola-okoya",
  "Hon. Aunty Bisi Okoya": "ecp-olabisi-dabiri-okoya",
  "Hon. Abdul Lateef": "ecp-saheed-abdullateef",
  "Hon. Simi Spruell": "ecp-simisoluwa-spruell",
  "Hon. Adebimpe Daniells": "ecp-adebimpe-daniells",
  "Hon. Shade Smalls": "ecp-folashade-small",
  /* Unmatched: written this way in the sheet and not on the roster. */
  "Hon. ~kAdarallah masha allah": null,
};

export const COMMITTEES = [
  {
    slug: "adopt-a-highway",
    name: "Adopt A Highway",
    month: "May",
    type: "standing",
    programId: "adopt-a-highway",
    description:
      "Keeps the two-mile stretch of Big Oak Road in Bucks County that the club adopted clear of litter, walking it in teams each spring.",
    chair: "Hon. Alhaji Bola Okoya",
  },
  {
    slug: "scholarship-programs",
    name: "Scholarship Programs",
    month: "May",
    type: "standing",
    programId: "scholarship-programs",
    description:
      "Runs the annual scholarship awards: two high school graduates and three college students, and the evening that recognises them.",
    chair: "Hon. Adebimpe Daniells",
  },
  {
    slug: "ronald-mcdonald-house",
    name: "Ronald McDonald House",
    month: "June",
    type: "standing",
    programId: "ronald-mcdonald-house",
    description:
      "Cooks breakfast and runs service days at the Philadelphia Ronald McDonald House for families whose children are receiving care.",
    chair: "Hon. Alhaji Bola Okoya",
  },
  {
    slug: "summer-picnic",
    name: "Summer Picnic",
    month: "Summer",
    type: "ad-hoc",
    description: "Plans the club's summer picnic.",
    chair: "Hon. Aunty Bisi Okoya",
  },
  {
    slug: "back-to-school",
    name: "Back to School Initiatives",
    month: "August",
    type: "standing",
    programId: "back-to-school",
    description:
      "Collects and hands out backpacks, uniforms, sneakers and school supplies so children start the year ready.",
    chair: "Hon. Adebimpe Daniells",
  },
  {
    slug: "independence-day-parade",
    name: "Independence Day Parade",
    month: "October",
    type: "standing",
    programId: "independence-day-parade",
    description:
      "Organises the club's contingent at the Nigeria Independence Day Parade: the Eyo, the flags, the gele and agbada, and the banner.",
    chair: "Hon. Adebimpe Daniells",
  },
  {
    slug: "thanksgiving-turkey-drive",
    name: "Thanksgiving Turkey Drive",
    month: "November",
    type: "standing",
    programId: "thanksgiving-turkey-drive",
    description:
      "Gathers and hands out turkeys and trimmings each November so families across the area have a full Thanksgiving meal.",
    chair: "Hon. Alhaji Bola Okoya",
  },
  {
    slug: "end-of-year-party",
    name: "End of Year Party",
    month: "December",
    type: "ad-hoc",
    description: "Plans the club's end of year party in December.",
    chair: "Hon. ~kAdarallah masha allah",
  },
  {
    slug: "winter-coat-drive",
    name: "Winter Coat Drive",
    month: "Nov – Jan",
    type: "standing",
    programId: "winter-coat-drive",
    description:
      "Collects and hands out coats, scarves and gloves to neighbours facing the cold without them.",
    chair: "Hon. Shade Smalls",
  },
  {
    slug: "health-education",
    name: "Health Education",
    month: "Bi-Monthly",
    type: "standing",
    programId: "health-education",
    description:
      "Brings in doctors and specialists for practical talks and screenings, and publishes the recordings on the club's channel.",
    chair: "Hon. Alhaji Bola Okoya",
  },
];
