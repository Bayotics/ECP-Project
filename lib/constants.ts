/** App-wide string constants */

export const APP_NAME = "Eko Club Philadelphia";
export const APP_TAGLINE = "A Chapter of Eko Club International";
export const APP_DESCRIPTION =
  "Eko Club Philadelphia is a chapter of Eko Club International — a non-profit organization uniting Lagosians in the diaspora through cultural celebration, community development, and the advancement of Lagos State.";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Navigation */
export const PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
] as const;

/** Route paths */
export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  memberDashboard: "/member/dashboard",
  adminDashboard: "/admin/dashboard",
} as const;

/** Pagination */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Roles */
export const ROLES = {
  ADMIN: "admin",
  MEMBER: "member",
  GUEST: "guest",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/* Where in Lagos a member traces their roots to, recorded as one of the
   five administrative divisions rather than one of the twenty LGAs. The
   divisions spell IBILE, which is how Lagosians name them:

     I  Ikeja        B  Badagry      I  Ikorodu
     L  Lagos Island E  Epe

   A division is the thing people actually identify with, and it does not
   churn the way LGA boundaries and names do. */
export const IBILE_DIVISIONS = [
  "Ikeja",
  "Badagry",
  "Ikorodu",
  "Lagos Island",
  "Epe",
] as const;

export type IbileDivision = (typeof IBILE_DIVISIONS)[number];

/** Which division each Lagos LGA sits in, for reading older records. */
export const LGA_TO_DIVISION: Record<string, IbileDivision> = {
  Agege: "Ikeja",
  Alimosho: "Ikeja",
  "Ifako-Ijaiye": "Ikeja",
  Ikeja: "Ikeja",
  Kosofe: "Ikeja",
  Mushin: "Ikeja",
  "Oshodi-Isolo": "Ikeja",
  Shomolu: "Ikeja",
  "Ajeromi-Ifelodun": "Badagry",
  Ajegunle: "Badagry",
  "Amuwo-Odofin": "Badagry",
  Badagry: "Badagry",
  Ojo: "Badagry",
  Ikorodu: "Ikorodu",
  Apapa: "Lagos Island",
  "Eti-Osa": "Lagos Island",
  "Lagos Island": "Lagos Island",
  "Lagos Mainland": "Lagos Island",
  Surulere: "Lagos Island",
  Epe: "Epe",
  "Ibeju-Lekki": "Epe",
};
