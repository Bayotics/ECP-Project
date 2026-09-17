/* Documented ECP projects — what the programs look like in practice.

   Every statement here traces to a club source:
   - "Adopt A Highway.pdf" and "Back to School Time.pdf" (ECP website files)
   - "Eko Club Philly Happenings!" newsletter (2023)
   - the club's original "Annual Service Programs" page (Website.jpg)
   - the Eko Club Philadelphia YouTube channel (webinar titles, speakers,
     descriptions) and the webinar flyers (session dates)
   - the EVENTS and Gallery Drive folders (photos and clips), with event
     identification confirmed by the club.
   Nothing is dated or located beyond what those sources say. */

export type MediaItem =
  | { kind: "image"; src: string; alt: string; caption?: string; w: number; h: number }
  | { kind: "video"; src: string; poster: string; alt: string; caption?: string; w: number; h: number }
  | { kind: "youtube"; id: string; title: string; caption?: string };

export type ProjectCategory = "Community service" | "Education" | "Health" | "Culture";

export type Project = {
  id: string;
  title: string;
  category: ProjectCategory;
  /** Program on /programs this project belongs to. */
  programId?: string;
  kicker: string;
  when: string;
  where?: string;
  body: string[];
  facts: { value: string; label: string }[];
  groups: { heading?: string; text?: string; media: MediaItem[] }[];
  accent: string;
  cover: { src: string; alt: string };
};

const img = (src: string, alt: string, w: number, h: number, caption?: string): MediaItem => ({
  kind: "image",
  src,
  alt,
  w,
  h,
  caption,
});

export const FEATURED_VIDEO = {
  id: "7tPKtaQwfwA",
  title: "Eko Club Philadelphia (ECP) Initiatives",
  length: "4 min",
};

export const PROJECTS: Project[] = [
  {
    id: "adopt-a-highway",
    title: "Adopt-A-Highway, Bucks County",
    category: "Community service",
    programId: "adopt-a-highway",
    kicker: "Environment",
    when: "Ongoing · documented since April 2016",
    where: "Big Oak Road, Bucks County, PA",
    body: [
      "ECP adopted a two-mile stretch of Big Oak Road in Bucks County, Pennsylvania, between Stony Hill Road and Pine Grove Road. Members walk it in teams, picking up the visible trash and waste along the roadside.",
      "On April 16, 2016, volunteers gave up their Saturday morning to clear litter from the adopted stretch, and the crews have kept coming back since, in spring safety vests and summer club shirts, under the road sign that carries the club’s name.",
    ],
    facts: [
      { value: "2 mi", label: "of road adopted" },
      { value: "2016", label: "first documented cleanup" },
    ],
    groups: [
      {
        media: [
          img("/gallery/projects/highway/banner.jpg", "ECP members holding the Eko Club Philadelphia banner beneath the Adopt-a-Highway sign", 1600, 1200),
          img("/gallery/projects/highway/group-at-sign.jpg", "ECP members in club shirts with filled litter bags beside the sign", 1600, 1200),
          img("/gallery/projects/highway/spring-crew.jpg", "A cleanup crew in safety vests with collected trash bags", 1600, 1200),
          img("/gallery/projects/highway/crew-at-sign.jpg", "Four volunteers in safety vests with litter pickers at the sign", 1600, 1200),
          img("/gallery/projects/highway/litter-pick.jpg", "A volunteer picking up litter along the roadside", 1200, 1600),
          img("/gallery/projects/highway/pointing-at-sign.jpg", "Members pointing up at the Eko Club Philadelphia road sign", 1200, 1600),
          img("/gallery/projects/highway/selfie-under-sign.jpg", "A selfie of volunteers under the Adopt-a-Highway sign", 1336, 1002),
          img("/gallery/projects/highway/bags-collected.jpg", "Volunteers in safety vests with the bags they filled", 1600, 1200),
          img("/gallery/projects/highway/banner-roadside.jpg", "The club banner held up at the roadside", 1600, 1200),
        ],
      },
    ],
    accent: "#059669",
    cover: { src: "/gallery/projects/highway/banner.jpg", alt: "ECP members with the club banner beneath the Adopt-a-Highway sign" },
  },
  {
    id: "scholarships",
    title: "ECP Scholarship Awards",
    category: "Education",
    programId: "scholarship-programs",
    kicker: "Scholarships",
    when: "Every year",
    body: [
      "Each year the club awards scholarships to two high school graduates and three college students — a long-term investment in the students of our community.",
    ],
    facts: [
      { value: "2", label: "high school awards a year" },
      { value: "3", label: "college awards a year" },
    ],
    groups: [
      {
        heading: "2026 High School Scholarship Award Presentation",
        media: [
          img("/gallery/projects/scholarship/2026-awardees.jpg", "Awardees holding their certificates with ECP members", 1600, 1200),
          img("/gallery/projects/scholarship/2026-ceremony-stage.jpg", "The award presentation on stage", 1600, 1200),
          {
            kind: "video",
            src: "/gallery/projects/video/scholarship-2026.mp4",
            poster: "/gallery/projects/video/scholarship-2026-poster.jpg",
            alt: "Clip from the 2026 scholarship award presentation",
            w: 864,
            h: 576,
          },
          img("/gallery/projects/scholarship/2026-presentation.jpg", "ECP members with an awardee and her certificate", 1600, 1200),
          img("/gallery/projects/scholarship/2026-awardee.jpg", "An awardee with her certificate and medal between two ECP members", 1600, 1200),
          img("/gallery/projects/scholarship/2026-members.jpg", "ECP members at the 2026 presentation", 1200, 1600),
        ],
      },
      {
        heading: "2023 High School Scholarships",
        text: "The 2023 high school awards went to Raqeeb Somoye and Rhianat Suarau of Harry S. Truman High School in Levittown, PA. Eko Club International President (Hon.) Saheed Olushi joined ECP President Olabisi Dabiri-Okoya at the ceremony and congratulated the recipients.",
        media: [
          img("/gallery/projects/scholarship/2023-recipients-group.jpg", "The 2023 recipients with their certificates alongside club members", 1040, 688),
          img("/gallery/projects/scholarship/2023-raqeeb-somoye.jpg", "Raqeeb Somoye with his scholarship certificate", 512, 696, "Raqeeb Somoye"),
          img("/gallery/projects/scholarship/2023-rhianat-suarau.jpg", "Rhianat Suarau with her scholarship certificate", 504, 696, "Rhianat Suarau"),
        ],
      },
      {
        heading: "From the archive",
        media: [img("/gallery/projects/scholarship/certificates.jpg", "Three scholarship recipients holding their framed certificates", 1600, 1200)],
      },
    ],
    accent: "#2563eb",
    cover: { src: "/gallery/projects/scholarship/2026-awardees.jpg", alt: "Scholarship awardees with ECP members" },
  },
  {
    id: "ronald-mcdonald-house",
    title: "Ronald McDonald House, Philadelphia",
    category: "Community service",
    programId: "ronald-mcdonald-house",
    kicker: "Family care",
    when: "Make-A-Meal · service day June 17, 2023",
    where: "Philadelphia Ronald McDonald House",
    body: [
      "Through the Make-A-Meal program, ECP members cook breakfast at the Philadelphia Ronald McDonald House for the families staying there while their children receive care.",
      "On Saturday, June 17, 2023, members came back for a community service project, cleaning the indoor and outdoor dining tables and chairs, sweeping, gardening, wiping, and sanitizing toys and high-touch surfaces.",
    ],
    facts: [
      { value: "Breakfast", label: "cooked for resident families" },
      { value: "Jun 17", label: "2023 service day, 12–3 pm" },
    ],
    groups: [
      {
        media: [
          img("/gallery/projects/rmh/team-with-ronald.jpg", "ECP volunteers in blue shirts beside the Ronald McDonald statue", 1600, 1200),
          img("/gallery/projects/rmh/wiping-tables.jpg", "A volunteer wiping down dining tables", 712, 472),
          img("/gallery/projects/rmh/gardening.jpg", "A volunteer tending the garden beds", 712, 472),
          img("/gallery/projects/rmh/sweeping-terrace.jpg", "A volunteer sweeping the outdoor dining terrace", 712, 472),
          img("/gallery/projects/rmh/garden-team.jpg", "The volunteer team in the house garden", 1200, 1600),
        ],
      },
    ],
    accent: "#dc2626",
    cover: { src: "/gallery/projects/rmh/team-with-ronald.jpg", alt: "ECP volunteers beside the Ronald McDonald statue" },
  },
  {
    id: "back-to-school",
    title: "Back to School with HomeFront",
    category: "Education",
    programId: "back-to-school",
    kicker: "Children & families",
    when: "Back-to-school season",
    where: "HomeFront, Lawrenceville, NJ",
    body: [
      "ECP sponsored two children through HomeFront in Lawrenceville, New Jersey, donating backpacks, school uniforms, sneakers and other back-to-school essentials, because buying all of that at once can be very difficult for some parents.",
      "So many supplies came in that the club provided for at least twelve more children as well.",
    ],
    facts: [
      { value: "2", label: "children sponsored" },
      { value: "12+", label: "more children supplied" },
    ],
    groups: [
      {
        media: [
          img(
            "/gallery/projects/homefront/homefront-donation.jpg",
            "ECP members, a young student and a HomeFront representative with donated supplies",
            1200,
            1600,
            "From left: Hon. Paseda, Master Fuad Abdullateef, Ms. Sydney Gecha, Hon. Okoya & Mrs. Abdullateef",
          ),
          img("/gallery/projects/homefront/back-to-school-bags.jpg", "Filled bags beneath a “Let’s Send Them Back to School” sign", 1200, 1600),
          img("/gallery/projects/homefront/supplies.jpg", "Backpacks, sneakers and school supplies ready for delivery", 1200, 1600),
          img("/gallery/projects/homefront/homefront-team.jpg", "ECP members with the HomeFront representative", 1200, 1600),
        ],
      },
    ],
    accent: "#2563eb",
    cover: { src: "/gallery/projects/homefront/homefront-donation.jpg", alt: "ECP members with a HomeFront representative and donated supplies" },
  },
  {
    id: "thanksgiving",
    title: "Thanksgiving Turkey Giveaway",
    category: "Community service",
    programId: "thanksgiving-turkey-drive",
    kicker: "Food support",
    when: "Every November",
    body: [
      "Every year ECP hosts a Thanksgiving food drive for families in need in our community. Members set out tables of turkeys and hand them out in the hall, and out on the street.",
    ],
    facts: [{ value: "Annual", label: "Thanksgiving food drive" }],
    groups: [
      {
        media: [
          img("/gallery/projects/thanksgiving/team-and-turkeys.jpg", "ECP members behind a table of turkeys", 1600, 1200),
          {
            kind: "video",
            src: "/gallery/projects/video/thanksgiving-street.mp4",
            poster: "/gallery/projects/video/thanksgiving-street-poster.jpg",
            alt: "Clip of the outdoor turkey giveaway",
            w: 1024,
            h: 576,
          },
          img("/gallery/projects/thanksgiving/handing-out.jpg", "A member handing a turkey to a neighbor", 1200, 1600),
          img("/gallery/projects/thanksgiving/distribution.jpg", "Members handing out turkeys across the table", 1200, 1600),
          img("/gallery/projects/thanksgiving/serving-table.jpg", "A member at the turkey table", 1200, 1600),
          {
            kind: "video",
            src: "/gallery/projects/video/thanksgiving-hall.mp4",
            poster: "/gallery/projects/video/thanksgiving-hall-poster.jpg",
            alt: "Clip of the giveaway set up in the hall",
            w: 464,
            h: 832,
          },
          img("/gallery/projects/thanksgiving/turkeys.jpg", "Turkeys lined up for the giveaway", 900, 1600),
        ],
      },
    ],
    accent: "#d97706",
    cover: { src: "/gallery/projects/thanksgiving/team-and-turkeys.jpg", alt: "ECP members behind a table of turkeys" },
  },
  {
    id: "independence-day-parade",
    title: "Nigeria Independence Day Parade, New York City",
    category: "Culture",
    programId: "independence-day-parade",
    kicker: "Heritage",
    when: "October",
    where: "New York City",
    body: [
      "ECP marches with the wider Eko Club family at the Nigeria Independence Day Parade in New York City; Eyo masquerades, green-and-white flags and sashes, gele and agbada, and the Eko Club International banner out on the street.",
    ],
    facts: [{ value: "Eyo", label: "masquerades on the route" }],
    groups: [
      {
        media: [
          img("/gallery/projects/parade/eyo-procession.jpg", "Eyo masquerades processing down the parade route", 1200, 1600),
          img("/gallery/projects/parade/eyo-and-flags.jpg", "An Eyo masquerade and flag-waving marchers in green and white", 1200, 1600),
          {
            kind: "video",
            src: "/gallery/projects/video/parade.mp4",
            poster: "/gallery/projects/video/parade-poster.jpg",
            alt: "Clip of the parade",
            w: 576,
            h: 1024,
          },
          img("/gallery/projects/parade/members-in-aso-oke.jpg", "Marchers in green-and-white attire and gele on the parade route", 1600, 1411),
          img("/gallery/projects/parade/eyo-street.jpg", "Eyo masquerades in the street beside the parade floats", 1600, 1200),
          img("/gallery/projects/parade/members-with-sashes.jpg", "Marchers wearing green-and-white sashes", 1200, 1600),
          img("/gallery/projects/parade/marchers.jpg", "An Eyo masquerade leading marchers down the street", 1200, 1600),
          img("/gallery/projects/parade/contingent.jpg", "The contingent in green and white gathered on the route", 1600, 1200),
        ],
      },
    ],
    accent: "#059669",
    cover: { src: "/gallery/projects/parade/eyo-procession.jpg", alt: "Eyo masquerades on the parade route" },
  },
  {
    id: "school-outreach-2026",
    title: "School Outreach & Scholarship Presentation",
    category: "Education",
    kicker: "Outreach",
    when: "June 2026",
    body: [
      "In June 2026 an ECP delegation visited a vocational training centre whose motto is “Ability in Disability”, making a school donation and presenting scholarships to its students.",
    ],
    facts: [{ value: "2026", label: "school donation & scholarships" }],
    groups: [
      {
        media: [
          img("/gallery/projects/outreach-2026/vocational-centre-visit.jpg", "The delegation with students and staff outside the vocational training centre", 1016, 858),
        ],
      },
    ],
    accent: "#2563eb",
    cover: { src: "/gallery/projects/outreach-2026/vocational-centre-visit.jpg", alt: "The delegation with students outside the vocational training centre" },
  },
];

/* Health Education webinars, Eko Club Philadelphia YouTube channel.
   `date` is the session date from the event flyer where one exists; the
   three without a flyer show when the recording was published instead. */
export type Webinar = {
  id: string;
  title: string;
  speakers: string;
  affiliation?: string;
  date: string;
  dateKind: "held" | "published";
  sort: string;
  flyer?: string;
};

export const WEBINARS: Webinar[] = [
  {
    id: "oflrXiS23B8",
    title: "Preventive Medicine: Healthy Nutrition, Regular Exercise & Cancer Screening Guidelines",
    speakers: "Dr. Amna Karim",
    affiliation: "In partnership with Capital Health",
    date: "Apr 25, 2026",
    dateKind: "held",
    sort: "2026-04-25",
    flyer: "/gallery/projects/health/flyer-preventive-medicine-2026-04.jpg",
  },
  {
    id: "CU5guLvLmLs",
    title: "Understanding Dementia: More Than Forgetfulness",
    speakers: "Janine Santora, APN, FNP-C, MSN, SCRN, CNRN",
    affiliation: "Capital Institute for Neurosciences",
    date: "Feb 21, 2026",
    dateKind: "held",
    sort: "2026-02-21",
    flyer: "/gallery/projects/health/flyer-dementia-2026-02.jpg",
  },
  {
    id: "_V_rryTybPc",
    title: "Back Pain: Prevention Strategies and the Latest Advances in Medical & Physical Therapy Treatments",
    speakers: "Dr. Lee Buono & Dr. Matthew Toth",
    affiliation: "Capital Health Medical Center, Hopewell, NJ",
    date: "Sep 6, 2025",
    dateKind: "held",
    sort: "2025-09-06",
    flyer: "/gallery/projects/health/flyer-back-pain-2025-09.jpg",
  },
  {
    id: "7WHQ-Pcj2RE",
    title: "Preventive Medicine / Healthy Lifestyle",
    speakers: "Dr. Ruby Zucker",
    affiliation: "Internal Medicine, Capital Health Primary Care",
    date: "Jun 7, 2025",
    dateKind: "held",
    sort: "2025-06-07",
    flyer: "/gallery/projects/health/flyer-healthy-lifestyle-2025-06.jpg",
  },
  {
    id: "OAxWq75bvcA",
    title: "An Overview of Stroke",
    speakers: "Dr. Daniel Landau",
    affiliation: "Neurology, Capital Health Regional Medical Center",
    date: "May 3, 2025",
    dateKind: "held",
    sort: "2025-05-03",
    flyer: "/gallery/projects/health/flyer-stroke-2025-05.jpg",
  },
  {
    id: "jQl5l84S9nI",
    title: "Gynecologic Cancer Awareness",
    speakers: "Dr. Mona Saleh",
    affiliation: "Capital Health Cancer Center, Gynecologic Oncology",
    date: "Mar 8, 2025",
    dateKind: "held",
    sort: "2025-03-08",
    flyer: "/gallery/projects/health/flyer-gynecologic-2025-03.jpg",
  },
  {
    id: "Xch24yV_YyE",
    title: "Heart Health",
    speakers: "Dr. Craig McMackin",
    affiliation: "Capital Health Medical Center",
    date: "Jan 11, 2025",
    dateKind: "held",
    sort: "2025-01-11",
    flyer: "/gallery/projects/health/flyer-heart-health-2025-01.jpg",
  },
  {
    id: "cpDJHB6QCnQ",
    title: "Colon Cancer Seminar: Rectal and Colon Cancer — A Comparison and New Innovations",
    speakers: "Dr. John Smith Berry IV",
    affiliation: "Capital Health Medical Center, Hopewell, NJ",
    date: "Dec 7, 2024",
    dateKind: "held",
    sort: "2024-12-07",
    flyer: "/gallery/projects/health/flyer-colon-cancer-2024-12.jpg",
  },
  {
    id: "ZBrIccFO360",
    title: "Prostate Cancer and Bladder Screening",
    speakers: "Dr. Eric Mayer",
    affiliation: "Capital Health Hospital, NJ",
    date: "Jan 2025",
    dateKind: "published",
    sort: "2025-01-12",
  },
  {
    id: "kVcIzUiiISg",
    title: "Breast Cancer: A Family Affair",
    speakers: "Mrs. Ify Anne Nwabukwu & Dr. Esther Peter",
    date: "Jan 2025",
    dateKind: "published",
    sort: "2025-01-12",
  },
  {
    id: "NKYv3XgCsF8",
    title: "Mental Health Awareness",
    speakers: "Dr. Babatunde Adetunji",
    date: "Jan 2025",
    dateKind: "published",
    sort: "2025-01-12",
  },
];

export const HEALTH_INTRO =
  "ECP’s Health Education Team hosts webinars with physicians and specialists, many from Capital Health, for residents of Mercer County, Bucks County and Burlington, and for the Nigerian community. The recordings live on the club’s YouTube channel, and you can watch them right here.";

/* ECI (parent body) medical missions — YouTube. */
export const MEDICAL_MISSION_VIDEOS = [
  {
    id: "m5DbyNDaVEM",
    title: "Eko Club International Annual Medical Mission and Equipment Donation in Ikorodu",
    note: "Published December 2024",
  },
  {
    id: "9ViSMyqg5_s",
    title: "Eko Club International Medical Mission — Day 2, Lagos Island",
    note: "Published January 2025 · Eko Club International",
  },
];

export const MEDICAL_MISSION_TEXT =
  "Eko Club International’s flagship medical outreach runs every two years. As a chapter, ECP rallies volunteers, supplies, and support behind the mission.";

export const YOUTUBE_CHANNEL = "https://www.youtube.com/channel/UC5vGWJ-a0-NZ6dJp-c_aQ6Q";
