export const SOCIAL_PLATFORMS = [
  { key: "linkedinUrl", label: "LinkedIn", domain: "linkedin.com", placeholder: "https://www.linkedin.com/in/your-name" },
  { key: "instagramUrl", label: "Instagram", domain: "instagram.com", placeholder: "https://www.instagram.com/your-name" },
  { key: "facebookUrl", label: "Facebook", domain: "facebook.com", placeholder: "https://www.facebook.com/your-name" },
] as const;

export type SocialProfileKey = (typeof SOCIAL_PLATFORMS)[number]["key"];
export type SocialProfiles = Partial<Record<SocialProfileKey, string>>;

/** Accept profile URLs only on the named network, never executable or unrelated links. */
export function normalizeSocialProfile(key: SocialProfileKey, value: unknown): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length > 2048 || /\s/.test(raw)) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    const domain = SOCIAL_PLATFORMS.find((platform) => platform.key === key)!.domain;
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    if (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`)) return null;
    if (!url.pathname.replace(/\//g, "")) return null;
    url.protocol = "https:";
    return url.toString();
  } catch {
    return null;
  }
}

export function parseSocialProfiles(input: object):
  | { ok: true; values: SocialProfiles }
  | { ok: false; error: string; field: SocialProfileKey } {
  const source = input as Record<string, unknown>;
  const values: SocialProfiles = {};
  for (const platform of SOCIAL_PLATFORMS) {
    if (source[platform.key] === undefined) continue;
    const value = normalizeSocialProfile(platform.key, source[platform.key]);
    if (value === null) return { ok: false, field: platform.key, error: `Enter a valid ${platform.label} profile URL, or leave it blank.` };
    values[platform.key] = value;
  }
  return { ok: true, values };
}
