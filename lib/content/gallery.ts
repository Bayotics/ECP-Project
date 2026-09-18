/* The photo and film library, grouped into albums.

   Every item here is a file that already lives in /public/gallery or a
   video on the club's own YouTube channel. Captions repeat what the club
   has told us about each set (see the source note at the top of
   lib/content/projects.ts) or describe only what the frame plainly shows.
   Nothing is dated or located beyond that.

   The Lagos album is the exception worth naming: those are pictures of
   Lagos itself, not of club activity, and the album says so. */

import { EKO } from "@/lib/content/programs";
import { WEBINARS, type MediaItem } from "@/lib/content/projects";

export type GalleryCategory =
  | "Community service"
  | "Education"
  | "Culture"
  | "Health"
  | "Leadership"
  | "Lagos";

export type Album = {
  id: string;
  title: string;
  category: GalleryCategory;
  blurb: string;
  accent: string;
  /** Where the story behind this album is told. */
  href?: string;
  media: MediaItem[];
};

const img = (src: string, alt: string, w: number, h: number, caption?: string): MediaItem => ({
  kind: "image",
  src,
  alt,
  w,
  h,
  caption,
});

/* Pixel sizes of the webinar flyers as stored in /public, so the viewer lays
   each one out at its true proportions (several are square). Kept here as
   well as on /projects because both pages open the same files. */
const FLYER_SIZE: Record<string, { w: number; h: number }> = {
  "/gallery/projects/health/flyer-back-pain-2025-09.jpg": { w: 1300, h: 1600 },
  "/gallery/projects/health/flyer-dementia-2026-02.jpg": { w: 1230, h: 1600 },
  "/gallery/projects/health/flyer-healthy-lifestyle-2025-06.jpg": { w: 1300, h: 1600 },
  "/gallery/projects/health/flyer-stroke-2025-05.jpg": { w: 1300, h: 1600 },
  "/gallery/projects/health/flyer-heart-health-2025-01.jpg": { w: 1600, h: 1600 },
  "/gallery/projects/health/flyer-colon-cancer-2024-12.jpg": { w: 1600, h: 1600 },
  "/gallery/projects/health/flyer-gynecologic-2025-03.jpg": { w: 1600, h: 1600 },
  "/gallery/projects/health/flyer-preventive-medicine-2026-04.jpg": { w: 1576, h: 1600 },
};

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "Community service",
  "Education",
  "Culture",
  "Health",
  "Leadership",
  "Lagos",
];

export const ALBUMS: Album[] = [
  {
    id: "parade",
    title: "Nigeria Independence Day Parade",
    category: "Culture",
    accent: EKO.green,
    href: "/projects#independence-day-parade",
    blurb:
      "Every October ECP marches in New York City with the wider Eko Club family. Eyo masquerades, green and white the length of the street, and the Eko Club International banner out front.",
    media: [
      img(
        "/gallery/about/hero-1.jpg",
        "Eyo masquerades in the street in front of the Eko Club International banner",
        1336,
        1027,
        "Eyo on the route, in front of the Eko Club International banner",
      ),
      img("/gallery/projects/parade/eyo-procession.jpg", "Eyo masquerades processing down the parade route", 1200, 1600),
      img(
        "/gallery/projects/parade/contingent.jpg",
        "Members on the parade float waving Nigerian flags, several in Grand Marshal sashes",
        1600,
        1200,
        "On the float, in Grand Marshal sashes",
      ),
      {
        kind: "video",
        src: "/gallery/projects/video/parade.mp4",
        poster: "/gallery/projects/video/parade-poster.jpg",
        alt: "Clip from the parade route",
        caption: "On the route in New York City",
        w: 576,
        h: 1024,
      },
      img("/gallery/projects/parade/eyo-and-flags.jpg", "An Eyo masquerade and flag waving marchers in green and white", 1200, 1600),
      img(
        "/gallery/projects/parade/members-in-aso-oke.jpg",
        "Members in white and green with Nigeria Independence Day Parade marshal sashes",
        1600,
        1411,
        "Parade marshals before the march",
      ),
      img("/gallery/projects/parade/eyo-street.jpg", "Eyo masquerades in the street beside the parade floats", 1600, 1200),
      img("/gallery/projects/parade/members-with-sashes.jpg", "Marchers wearing green and white sashes", 1200, 1600),
      img("/gallery/projects/parade/marchers.jpg", "An Eyo masquerade leading marchers down the street", 1200, 1600),
      img("/gallery/projects/parade/green-and-white.jpg", "Marchers in green and white on the parade route", 1200, 1600),
    ],
  },
  {
    id: "scholarships",
    title: "Scholarship awards",
    category: "Education",
    accent: EKO.blue,
    href: "/projects#scholarships",
    blurb:
      "Two high school graduates and three college students receive ECP scholarships every year. The presentations are the close of the club's academic year.",
    media: [
      img("/gallery/projects/scholarship/2026-awardees.jpg", "Awardees holding their certificates with ECP members", 1600, 1200),
      img("/gallery/projects/scholarship/2026-ceremony-stage.jpg", "The award presentation on stage", 1600, 1200),
      {
        kind: "video",
        src: "/gallery/projects/video/scholarship-2026.mp4",
        poster: "/gallery/projects/video/scholarship-2026-poster.jpg",
        alt: "Clip from the 2026 scholarship award presentation",
        caption: "2026 High School Scholarship Award Presentation",
        w: 864,
        h: 576,
      },
      img("/gallery/projects/scholarship/2026-presentation.jpg", "ECP members with an awardee and her certificate", 1600, 1200),
      img("/gallery/projects/scholarship/2026-awardee.jpg", "An awardee with her certificate and medal between two ECP members", 1600, 1200),
      img("/gallery/projects/scholarship/2026-members.jpg", "ECP members at the 2026 presentation", 1200, 1600),
      img(
        "/gallery/projects/scholarship/2023-recipients-group.jpg",
        "The 2023 recipients with their certificates alongside club members",
        1040,
        688,
        "2023 recipients with Eko Club International and ECP leadership",
      ),
      img("/gallery/projects/scholarship/2023-raqeeb-somoye.jpg", "Raqeeb Somoye with his scholarship certificate", 512, 696, "Raqeeb Somoye, 2023"),
      img("/gallery/projects/scholarship/2023-rhianat-suarau.jpg", "Rhianat Suarau with her scholarship certificate", 504, 696, "Rhianat Suarau, 2023"),
      img("/gallery/projects/scholarship/certificates.jpg", "Three scholarship recipients holding their framed certificates", 1600, 1200),
    ],
  },
  {
    id: "highway",
    title: "Adopt-a-Highway",
    category: "Community service",
    accent: EKO.green,
    href: "/projects#adopt-a-highway",
    blurb:
      "Two miles of Big Oak Road in Bucks County, Pennsylvania, adopted by the club and walked in teams since 2016. The road sign carries the club's name.",
    media: [
      img("/gallery/projects/highway/banner.jpg", "ECP members holding the club banner beneath the Adopt-a-Highway sign", 1600, 1200),
      img("/gallery/projects/highway/group-at-sign.jpg", "ECP members in club shirts with filled litter bags beside the sign", 1600, 1200),
      img("/gallery/event1.JPG", "A crew in orange club polos gathered under the road sign", 1600, 1200),
      img("/gallery/projects/highway/spring-crew.jpg", "A cleanup crew in safety vests with collected trash bags", 1600, 1200),
      img("/gallery/event5.JPG", "A crew in safety vests with bags and litter pickers at the roadside on a grey morning", 1600, 1200),
      img("/gallery/projects/highway/crew-at-sign.jpg", "Four volunteers in safety vests with litter pickers at the sign", 1600, 1200),
      img("/gallery/event6.JPG", "Four volunteers with litter pickers beneath the Adopt-a-Highway sign", 1200, 1600),
      img("/gallery/projects/highway/litter-pick.jpg", "A volunteer picking up litter along the roadside", 1200, 1600),
      img("/gallery/projects/highway/pointing-at-sign.jpg", "Members pointing up at the Eko Club Philadelphia road sign", 1200, 1600),
      img("/gallery/programs/adopt-a-highway.jpg", "A selfie of the crew in club caps and safety vests under the road sign", 1051, 1400),
      img("/gallery/projects/highway/selfie-under-sign.jpg", "A selfie of volunteers under the Adopt-a-Highway sign", 1336, 1002),
      img("/gallery/event2.JPG", "Volunteers in safety vests at the sign post, litter pickers in hand", 1600, 1200),
      img("/gallery/projects/highway/bags-collected.jpg", "Volunteers in safety vests with the bags they filled", 1600, 1200),
      img("/gallery/projects/highway/banner-roadside.jpg", "The club banner held up at the roadside", 1600, 1200),
    ],
  },
  {
    id: "thanksgiving",
    title: "Thanksgiving turkey giveaway",
    category: "Community service",
    accent: EKO.yellow,
    href: "/projects#thanksgiving",
    blurb:
      "Every November the club sets out tables of turkeys and hands them to families in the community, in the hall and out on the street.",
    media: [
      img(
        "/gallery/projects/thanksgiving/team-and-turkeys.jpg",
        "ECP members in club polos behind a table of turkeys, beside the club banner",
        1600,
        1200,
        "The team behind the table, beside the club banner",
      ),
      {
        kind: "video",
        src: "/gallery/projects/video/thanksgiving-street.mp4",
        poster: "/gallery/projects/video/thanksgiving-street-poster.jpg",
        alt: "Clip of the outdoor turkey giveaway",
        caption: "Handing out turkeys on the street",
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
        caption: "Set up in the hall",
        w: 464,
        h: 832,
      },
      img("/gallery/projects/thanksgiving/turkeys.jpg", "Turkeys lined up for the giveaway", 900, 1600),
    ],
  },
  {
    id: "ronald-mcdonald-house",
    title: "Ronald McDonald House",
    category: "Community service",
    accent: EKO.red,
    href: "/projects#ronald-mcdonald-house",
    blurb:
      "Members cook breakfast for the families staying at the Philadelphia Ronald McDonald House, and came back on June 17, 2023 for a full service day.",
    media: [
      img("/gallery/projects/rmh/team-with-ronald.jpg", "ECP volunteers in blue shirts beside the Ronald McDonald statue", 1600, 1200),
      img("/gallery/projects/rmh/wiping-tables.jpg", "A volunteer wiping down dining tables", 712, 472),
      img("/gallery/projects/rmh/gardening.jpg", "A volunteer tending the garden beds", 712, 472),
      img("/gallery/projects/rmh/sweeping-terrace.jpg", "A volunteer sweeping the outdoor dining terrace", 712, 472),
      img("/gallery/projects/rmh/garden-team.jpg", "The volunteer team in the house garden", 1200, 1600),
    ],
  },
  {
    id: "back-to-school",
    title: "Back to school with HomeFront",
    category: "Education",
    accent: EKO.blue,
    href: "/projects#back-to-school",
    blurb:
      "Backpacks, uniforms, sneakers and supplies for children sponsored through HomeFront in Lawrenceville, New Jersey.",
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
  {
    id: "school-outreach",
    title: "School outreach, June 2026",
    category: "Education",
    accent: EKO.blue,
    href: "/projects#school-outreach-2026",
    blurb:
      "A delegation visited a vocational training centre whose motto is “Ability in Disability”, making a school donation and presenting scholarships to its students.",
    media: [
      img(
        "/gallery/projects/outreach-2026/vocational-centre-visit.jpg",
        "The delegation with students and staff outside the vocational training centre",
        1016,
        858,
      ),
    ],
  },
  {
    id: "health",
    title: "Health education",
    category: "Health",
    accent: EKO.red,
    href: "/projects#health-education",
    blurb:
      "The Health Education Team's webinar series with physicians and specialists, many of them from Capital Health. Every session flyer and every recording.",
    media: [
      ...WEBINARS.filter((w) => w.flyer).map((w) =>
        img(w.flyer as string, `Flyer for the ${w.title} webinar`, FLYER_SIZE[w.flyer as string].w, FLYER_SIZE[w.flyer as string].h, `${w.title} · ${w.date}`),
      ),
      ...WEBINARS.map(
        (w): MediaItem => ({
          kind: "youtube",
          id: w.id,
          title: w.title,
          caption: `${w.title} · ${w.speakers} · ${w.dateKind === "held" ? w.date : `published ${w.date}`}`,
        }),
      ),
    ],
  },
  {
    id: "leadership",
    title: "Executive Council and patrons",
    category: "Leadership",
    accent: EKO.blue,
    href: "/about#patrons",
    blurb:
      "The officers serving the club: the Executive Council, the Board of Trustees, and the matrons and patrons who stand behind them. The full roster of members, with years of service and biographies, lives in the member portal.",
    media: [
      img("/gallery/excos/olabisi-dabiri-okoya.png", "Hon. Olabisi Dabiri-Okoya, President", 2000, 2000, "Hon. Olabisi Dabiri-Okoya · President"),
      img("/gallery/excos/adebimpe-daniells.png", "Hon. Adebimpe Daniells, Vice President", 2000, 2000, "Hon. Adebimpe Daniells · Vice President"),
      img(
        "/gallery/excos/olabisi-lawal.png",
        "Hon. Olabisi Lawal, Treasurer and Financial Secretary",
        2000,
        2000,
        "Hon. Olabisi Lawal · Treasurer / Financial Secretary",
      ),
      img(
        "/gallery/excos/folashade-adedeji.png",
        "Hon. Folashade Adedeji, PRO and Social Secretary",
        2000,
        2000,
        "Hon. Folashade Adedeji · PRO / Social Secretary",
      ),
      img("/gallery/excos/bola-okoya.png", "Hon. Bola Okoya, Chairman of the Board of Trustees", 2000, 2000, "Hon. Bola Okoya · Chairman, Board of Trustees"),
      img(
        "/gallery/excos/modupe-mabinuori-olageshin.png",
        "Hon. Elder Modupe Mabinuori-Olageshin, Vice Chairwoman and Treasurer of the Board of Trustees",
        2000,
        2000,
        "Hon. Elder Modupe Mabinuori-Olageshin · Vice Chairwoman / Treasurer, Board of Trustees",
      ),
      img(
        "/gallery/excos/saheed-abdullateef.png",
        "Hon. Saheed Abdullateef, Secretary of the Board of Trustees",
        2000,
        2000,
        "Hon. Saheed Abdullateef · Secretary, Board of Trustees",
      ),
      img("/gallery/patrons/tj-abass.png", "Otunba TJ Abass, Grand Patron", 2000, 2000, "Otunba TJ Abass · Grand Patron"),
      img("/gallery/patrons/ganiyu-mimiko.png", "Dr. Ganiyu Mimiko, Patron", 2000, 2000, "Dr. Ganiyu Mimiko · Patron"),
      img("/gallery/patrons/maryanne-onitolo.png", "Chief (Dr.) Maryanne Onitolo, Matron", 2000, 2000, "Chief (Dr.) Maryanne Onitolo · Matron"),
      img("/gallery/patrons/risikat-oshilaja.png", "Alhaja Risikat Oshilaja, Matron", 2000, 2000, "Alhaja Risikat Oshilaja · Matron"),
    ],
  },
  {
    id: "lagos",
    title: "Lagos, our roots",
    category: "Lagos",
    accent: EKO.yellow,
    href: "/about#lagos-history",
    blurb:
      "Pictures of the city itself rather than of the club: the five divisions of Lagos State, and the streets, water and landmarks our members grew up with.",
    media: [
      img("/gallery/about/ibile/ibile-main.png", "The five divisions of Lagos State: Ikeja, Badagry, Ikorodu, Lagos Island, Epe", 1016, 846, "IBILE, the five divisions of Lagos State"),
      img("/gallery/about/ibile/ikeja-heritage.jpg", "Ikeja heritage", 801, 534, "Ikeja"),
      img("/gallery/about/ibile/badagry-heritage.jpg", "Badagry heritage", 1280, 720, "Badagry"),
      img("/gallery/about/ibile/ikorodu-heritage.jpg", "Ikorodu heritage", 898, 601, "Ikorodu"),
      img("/gallery/about/ibile/lagos-island-heritage.jpg", "Lagos Island heritage", 1170, 694, "Lagos Island"),
      img("/gallery/about/ibile/epe-heritage.jpg", "Epe heritage", 868, 486, "Epe"),
      img("/gallery/hero-bgs/eyo-2025.jpg", "Eyo masquerades gathered before a dais of officials at a Lagos State ceremony", 1280, 856, "Eyo at a Lagos State ceremony, 2025"),
      img("/gallery/eko/eko-4.jpeg", "Lagos Island seen across the lagoon", 2048, 1366),
      img("/gallery/hero-bgs/lagos-island.jpg", "The Lagos waterfront at Civic Centre Towers, seen from the air", 4028, 2265),
      img("/gallery/hero-bgs/national-theatre_standard.jpg", "The National Arts Theatre, Iganmu, Lagos", 764, 573),
      img("/gallery/eko/eko-1.jpeg", "A landscaped roundabout and city traffic on Lagos Island", 2048, 1440),
      img("/gallery/eko/eko-2.jpeg", "A Lagos Carnival float dressed as an Eyo masquerade", 2048, 1365),
      img("/gallery/eko/eko-3.jpeg", "Costumed performers in green and white at the Lagos Carnival", 2048, 1365),
      img("/gallery/eko/eko-5.jpeg", "A Lagos Blue Line train at Marina Station", 2048, 1366),
      img("/gallery/eko/eko-6.jpeg", "Boats moored at a Lagos ferry terminal on the lagoon", 1280, 853),
    ],
  },
];

export const ALL_MEDIA: MediaItem[] = ALBUMS.flatMap((a) => a.media);

export const MEDIA_COUNTS = {
  albums: ALBUMS.length,
  photos: ALL_MEDIA.filter((m) => m.kind === "image").length,
  clips: ALL_MEDIA.filter((m) => m.kind === "video").length,
  films: ALL_MEDIA.filter((m) => m.kind === "youtube").length,
};
