/* The photo and film library, grouped into albums.

   Every item here is a file that already lives in /public/gallery or a
   video on the club's own YouTube channel. Captions repeat what the club
   has told us about each set (see the source note at the top of
   lib/content/projects.ts) or describe only what the frame plainly shows.
   Nothing is dated or located beyond that.

   The source includes only the albums retained by the club. Removed
   portraits and the albums below the requested gallery cutoff are excluded. */

import { EKO } from "@/lib/content/programs";
import type { MediaItem } from "@/lib/content/projects";

export type GalleryCategory =
  | "Community service"
  | "Education"
  | "Culture";

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

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "Community service",
  "Education",
  "Culture",
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

];

export const ALL_MEDIA: MediaItem[] = ALBUMS.flatMap((a) => a.media);

export const MEDIA_COUNTS = {
  albums: ALBUMS.length,
  photos: ALL_MEDIA.filter((m) => m.kind === "image").length,
  clips: ALL_MEDIA.filter((m) => m.kind === "video").length,
  films: ALL_MEDIA.filter((m) => m.kind === "youtube").length,
};
