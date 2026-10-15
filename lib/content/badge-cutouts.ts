/* Which members have a cut-out, and so get the pop-out.
 *
 * The badge draws a member one of two ways. With a cut-out, the head rises
 * clear of the ring as it does on the club's printed badge. Without one,
 * the whole portrait sits inside the ring, which crops the background away
 * just as cleanly; only the head does not break the line.
 *
 * The twelve below are the ones the club supplied with the background
 * already removed. Attempting removal on the rest left scraps of wall and
 * signage beside people's heads, which is worse than no pop-out at all, so
 * they take the portrait path instead.
 *
 * Hand over a cut-out PNG for anyone else and adding their slug here turns
 * the pop-out on; nothing else needs to change.
 */
export const BADGE_CUTOUTS = new Set([
  "adebimpe-daniells",
  "bintu-paseda",
  "bolanle-bello",
  "folashade-small",
  "funmi-eregha",
  "monsurat-suleiman",
  "olabisi-lawal",
  "patricia-abiggs",
  "risikat-oshilaja",
  "saheed-abdullateef",
  "simisoluwa-spruell",
  "tj-abass",
]);
/** The cut-out path for a slug, or undefined when there is no clean one. */
export function cutoutFor(slug: string): string | undefined {
  return BADGE_CUTOUTS.has(slug) ? `/gallery/people/cutout/${slug}.png` : undefined;
}

/** The slug behind a `/gallery/people/<slug>.jpg` portrait path. */
export function slugFromPhoto(photo: string): string {
  return photo.replace(/^.*\//, "").replace(/\.[^.]+$/, "");
}
