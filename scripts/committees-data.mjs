/* ECP committees, from the club's own "ECP Committtee Poll Result 2026"
 * sheet (tab: "arrange the poll result according to the time of...").
 *
 * The sheet has five columns: month, initiative / committee, votes,
 * voter % (N=7), and committed volunteers. All five are carried across.
 * The percentage is not stored because it is just votes ÷ 7; the page
 * computes it so the two can never disagree.
 *
 * Volunteer names are written informally in the sheet ("Hon. Aunty Bisi
 * Okoya", "Hon. Abdul Lateef"). Each is matched to a seeded member id where
 * the person is unambiguous. One entry, "Hon. ~kAdarallah masha allah",
 * could not be matched to anyone on the roster and is seeded with the name
 * as written and no user link, so it shows up for the club to correct
 * rather than being silently dropped.
 *
 * NOT in the sheet, and therefore not invented here: chairpersons, and the
 * date each committee was formed. Both read as N/A until the club says.
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

/** Poll size, the "N=7" in the sheet's header. */
export const POLL_SIZE = 7;

export const COMMITTEES = [
  {
    slug: "adopt-a-highway",
    name: "Adopt A Highway",
    month: "May",
    votes: 4,
    type: "standing",
    programId: "adopt-a-highway",
    description:
      "Keeps the two-mile stretch of Big Oak Road in Bucks County that the club adopted clear of litter, walking it in teams each spring.",
    volunteers: ["Hon. Alhaji Bola Okoya", "Hon. Aunty Bisi Okoya", "Hon. Abdul Lateef", "Hon. Simi Spruell"],
  },
  {
    slug: "scholarship-programs",
    name: "Scholarship Programs",
    month: "May",
    votes: 2,
    type: "standing",
    programId: "scholarship-programs",
    description:
      "Runs the annual scholarship awards: two high school graduates and three college students, and the evening that recognises them.",
    volunteers: ["Hon. Adebimpe Daniells", "Hon. Alhaji Bola Okoya"],
  },
  {
    slug: "ronald-mcdonald-house",
    name: "Ronald McDonald House",
    month: "June",
    votes: 1,
    type: "standing",
    programId: "ronald-mcdonald-house",
    description:
      "Cooks breakfast and runs service days at the Philadelphia Ronald McDonald House for families whose children are receiving care.",
    volunteers: ["Hon. Alhaji Bola Okoya"],
  },
  {
    slug: "summer-picnic",
    name: "Summer Picnic",
    month: "Summer",
    votes: 3,
    type: "ad-hoc",
    description: "Plans the club's summer picnic.",
    volunteers: ["Hon. Aunty Bisi Okoya", "Hon. Abdul Lateef", "Hon. Simi Spruell"],
  },
  {
    slug: "back-to-school",
    name: "Back to School Initiatives",
    month: "August",
    votes: 2,
    type: "standing",
    programId: "back-to-school",
    description:
      "Collects and hands out backpacks, uniforms, sneakers and school supplies so children start the year ready.",
    volunteers: ["Hon. Adebimpe Daniells", "Hon. Aunty Bisi Okoya"],
  },
  {
    slug: "independence-day-parade",
    name: "Independence Day Parade",
    month: "October",
    votes: 2,
    type: "standing",
    programId: "independence-day-parade",
    description:
      "Organises the club's contingent at the Nigeria Independence Day Parade: the Eyo, the flags, the gele and agbada, and the banner.",
    volunteers: ["Hon. Adebimpe Daniells", "Hon. Aunty Bisi Okoya"],
  },
  {
    slug: "thanksgiving-turkey-drive",
    name: "Thanksgiving Turkey Drive",
    month: "November",
    votes: 4,
    type: "standing",
    programId: "thanksgiving-turkey-drive",
    description:
      "Gathers and hands out turkeys and trimmings each November so families across the area have a full Thanksgiving meal.",
    volunteers: ["Hon. Alhaji Bola Okoya", "Hon. Aunty Bisi Okoya", "Hon. Abdul Lateef", "Hon. Simi Spruell"],
  },
  {
    slug: "end-of-year-party",
    name: "End of Year Party",
    month: "December",
    votes: 3,
    type: "ad-hoc",
    description: "Plans the club's end of year party in December.",
    volunteers: ["Hon. ~kAdarallah masha allah", "Hon. Aunty Bisi Okoya", "Hon. Simi Spruell"],
  },
  {
    slug: "winter-coat-drive",
    name: "Winter Coat Drive",
    month: "Nov – Jan",
    votes: 1,
    type: "standing",
    programId: "winter-coat-drive",
    description:
      "Collects and hands out coats, scarves and gloves to neighbours facing the cold without them.",
    volunteers: ["Hon. Shade Smalls"],
  },
  {
    slug: "health-education",
    name: "Health Education",
    month: "Bi-Monthly",
    votes: 2,
    type: "standing",
    programId: "health-education",
    description:
      "Brings in doctors and specialists for practical talks and screenings, and publishes the recordings on the club's channel.",
    volunteers: ["Hon. Alhaji Bola Okoya", "Hon. Aunty Bisi Okoya"],
  },
];
