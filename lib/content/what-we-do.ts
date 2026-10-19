export const WHAT_WE_DO_IDS = ["programs", "committees", "events", "donate"] as const;
export type WhatWeDoId = (typeof WHAT_WE_DO_IDS)[number];

export interface WhatWeDoSlide {
  id: WhatWeDoId;
  title: string;
  color: string;
  href: string;
  label: string;
  imageUrl: string;
  imageAlt: string;
  description: string;
}

export type WhatWeDoSlideContent = Pick<WhatWeDoSlide, "id" | "imageUrl" | "imageAlt" | "description">;
export interface WhatWeDoContent {
  slides: WhatWeDoSlide[];
  updatedAt?: string;
}
export interface WhatWeDoDocument {
  id: "what-we-do";
  slides: WhatWeDoSlideContent[];
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_WHAT_WE_DO: WhatWeDoSlide[] = [
  {
    id: "programs", color: "#059669", title: "Programs", href: "/programs", label: "View programs",
    description: "Nine recurring community programs every year: highway cleanups, scholarship nights, back to school drives, the turkey giveaway, and the biennial medical mission.",
    imageUrl: "/gallery/projects/highway/spring-crew.jpg", imageAlt: "Eko Club Philadelphia highway cleanup volunteers",
  },
  {
    id: "committees", color: "#dc2626", title: "Committees", href: "/committees", label: "Browse committees",
    description: "Our committees bring community programs to life. Members and volunteers can join in and put their time and skills to work.",
    imageUrl: "/gallery/committee-slider.jpg", imageAlt: "Eko Club Philadelphia committee members",
  },
  {
    id: "events", color: "#2563eb", title: "Events", href: "/events", label: "See all events",
    description: "The parade, service days, health talks and award nights, all on one calendar you can add straight to your own.",
    imageUrl: "/gallery/event-slider.jpg", imageAlt: "An Eko Club Philadelphia community event",
  },
  {
    id: "donate", color: "#d97706", title: "Donate", href: "/donate", label: "Make a gift",
    description: "Every dollar funds scholarships, turkeys at Thanksgiving, coats in winter and backpacks in August. Give once or set up monthly support.",
    imageUrl: "/gallery/projects/thanksgiving/team-and-turkeys.jpg", imageAlt: "Eko Club Philadelphia Thanksgiving volunteers and donations",
  },
];

/** Saved edits change content, while the four pillars and their links stay intact. */
export function resolveWhatWeDo(slides: WhatWeDoSlideContent[] = []): WhatWeDoSlide[] {
  return DEFAULT_WHAT_WE_DO.map(slide => {
    const saved = slides.find(item => item.id === slide.id);
    return saved ? { ...slide, imageUrl: saved.imageUrl, imageAlt: saved.imageAlt, description: saved.description } : { ...slide };
  });
}

export function validateWhatWeDo(input: unknown): { slides: WhatWeDoSlideContent[] } | { error: string } {
  if (!Array.isArray(input) || input.length !== WHAT_WE_DO_IDS.length) return { error: "Provide all four What We Do slides." };
  const slides: WhatWeDoSlideContent[] = [];
  for (const item of input) {
    if (!item || !WHAT_WE_DO_IDS.includes(item.id) || slides.some(slide => slide.id === item.id)) return { error: "Each What We Do pillar must appear exactly once." };
    if (typeof item.description !== "string" || !item.description.trim() || item.description.trim().length > 600) return { error: "Each description must contain between 1 and 600 characters." };
    if (typeof item.imageAlt !== "string" || !item.imageAlt.trim() || item.imageAlt.trim().length > 200) return { error: "Each image description must contain between 1 and 200 characters." };
    if (typeof item.imageUrl !== "string" || item.imageUrl.length > 2048) return { error: "Choose an image for each slide." };
    const imageUrl = item.imageUrl.trim();
    const local = /^\/gallery\/[a-zA-Z0-9_./%-]+$/.test(imageUrl) && !imageUrl.includes("..") && !imageUrl.includes("%");
    let hosted = false;
    try { const url = new URL(imageUrl); hosted = url.protocol === "https:" && url.hostname === "res.cloudinary.com" && !url.username && !url.password && !url.port; } catch { /* Local gallery paths are allowed above. */ }
    if (!local && !hosted) return { error: "Use an existing gallery image or upload a replacement with the image picker." };
    slides.push({ id: item.id, description: item.description.trim(), imageAlt: item.imageAlt.trim(), imageUrl });
  }
  return { slides };
}
