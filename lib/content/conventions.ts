export interface ConventionVideo {
  videoId: string;
  title: string;
}

export interface Convention {
  id: string;
  title: string;
  year: number;
  location: string;
  videos: ConventionVideo[];
}

export interface ConventionsContent {
  conventions: Convention[];
  updatedAt?: string;
}

export interface ConventionsDocument extends ConventionsContent {
  id: "conventions";
  updatedAt: string;
  updatedBy: string;
}

export const CONVENTION_HISTORY_URL = "https://www.ekoclubevents.org/past-events";

// Initial archive from the public convention history's /api/convention-events,
// retrieved 19 October 2026. Saved admin content replaces this entire list.
export const DEFAULT_CONVENTIONS: Convention[] = [
  {
    id: "chicago-2009",
    title: "Eko Club International, The 6th International Convention",
    year: 2009,
    location: "O’Hare Marriott Hotels, Chicago, Illinois",
    videos: [
      { videoId: "pOmHDbl-2eU", title: "Welcome and keynote address" },
      { videoId: "zXLAVEnw4mo", title: "Welcome and keynote address (continued)" },
      { videoId: "DeW4gkmCeiM", title: "Farewell Speech by Otunba" },
    ],
  },
  {
    id: "dallas-2007",
    title: "Eko Club International 5th Annual Convention",
    year: 2007,
    location: "Dallas",
    videos: [
      { videoId: "az0OPNXnvCQ", title: "Convention Banquet Dinner Fundraising Event" },
      { videoId: "9LYmLY3sy7w", title: "Economic & Business Session: Mayor of Dallas meeting and 911 Emergency Centre Tour" },
      { videoId: "zfvdbDz-iD8", title: "Economic Session" },
      { videoId: "8oG6V8bZvx4", title: "Eko International Election" },
      { videoId: "k4UpYvL2c9s", title: "Saturday Gala Night — Part 1" },
      { videoId: "Kuf5EftT9Lg", title: "Saturday Gala Night — Part 2" },
      { videoId: "X_Xuoltes7Q", title: "Saturday Gala Night — Part 3" },
      { videoId: "hqyXj7pYnDY", title: "Meeting with Oba of Lagos" },
    ],
  },
];

/** Only IDs from recognized YouTube URLs become public links or image paths. */
export function getYouTubeVideoId(input: string): string | null {
  const value = input.trim();
  const valid = (id: string | null) => id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  if (valid(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (["youtu.be", "www.youtu.be"].includes(url.hostname)) return valid(/^\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null);
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(url.hostname)) return null;
    if (url.pathname === "/watch") return valid(url.searchParams.get("v"));
    return valid(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/.exec(url.pathname)?.[1] ?? null);
  } catch { return null; }
}

export const youtubeVideoUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`;
export const youtubeThumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

export function validateConventions(input: unknown): { conventions: Convention[] } | { error: string } {
  if (!Array.isArray(input) || input.length > 30) return { error: "Provide a list of up to 30 conventions." };
  const conventions: Convention[] = [];
  const seenVideos = new Set<string>();
  for (const item of input) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || conventions.some(convention => convention.id === item.id)) return { error: "Each convention must have a unique, valid identifier." };
    if (typeof item.title !== "string" || !item.title.trim() || item.title.trim().length > 200) return { error: "Each convention needs a title of 1–200 characters." };
    if (!Number.isInteger(item.year) || item.year < 1900 || item.year > 2100) return { error: "Enter a convention year between 1900 and 2100." };
    if (typeof item.location !== "string" || !item.location.trim() || item.location.trim().length > 200) return { error: "Each convention needs a location of 1–200 characters." };
    if (!Array.isArray(item.videos) || item.videos.length < 1 || item.videos.length > 30) return { error: "Each convention needs between 1 and 30 videos." };
    const videos: ConventionVideo[] = [];
    for (const video of item.videos) {
      const videoId = video && typeof video.videoId === "string" ? getYouTubeVideoId(video.videoId) : null;
      if (!videoId) return { error: "Enter a valid YouTube video URL or 11-character video ID for every video." };
      if (seenVideos.has(videoId)) return { error: "A YouTube video can only appear once in the convention archive." };
      if (typeof video.title !== "string" || !video.title.trim() || video.title.trim().length > 200) return { error: "Each video needs a title of 1–200 characters." };
      seenVideos.add(videoId);
      videos.push({ videoId, title: video.title.trim() });
    }
    conventions.push({ id: item.id, title: item.title.trim(), year: item.year, location: item.location.trim(), videos });
  }
  return { conventions };
}
