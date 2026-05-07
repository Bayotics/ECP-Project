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

/** Lagos LGAs (seed data helper) */
export const LAGOS_LGAS = [
  "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Badagry",
  "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja",
  "Ikorodu", "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin",
  "Ojo", "Oshodi-Isolo", "Shomolu", "Surulere",
] as const;
