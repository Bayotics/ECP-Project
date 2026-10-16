/* Dates and times in the club's own timezone.
 *
 * An interview is arranged for a wall-clock time in Philadelphia. The
 * administrator types "5 November, 6:30 pm" meaning half past six there,
 * and the applicant must read exactly that, whichever machine formats it
 * and whichever timezone that machine happens to be set to.
 *
 * So the two directions are kept explicit. Going in, the typed date and
 * time are read as Philadelphia wall time and stored as a real instant.
 * Coming out, that instant is always formatted back in Philadelphia time
 * and labelled, so a member reading the email in Lagos can see which
 * clock the time belongs to.
 *
 * Nothing here assumes the host's timezone, which on a server is usually
 * UTC and on a laptop is whatever the owner set.
 */

export const CLUB_TIME_ZONE = "America/New_York";

/** How far `timeZone` is from UTC at `instant`, in milliseconds. */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(instant)
    .filter((p) => p.type !== "literal");

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  /* Some runtimes render midnight as hour 24 rather than 0. */
  const hour = get("hour") % 24;

  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asIfUtc - instant.getTime();
}

/**
 * Reads a date and a time typed into the browser's own date and time
 * inputs as club wall time, and returns the instant they name.
 *
 * `date` is "YYYY-MM-DD" and `time` is "HH:MM", which is exactly what
 * `<input type="date">` and `<input type="time">` produce.
 *
 * Returns null when either is missing or malformed, so a caller can tell
 * "not filled in" from a real instant rather than quietly storing an
 * Invalid Date.
 */
export function clubWallTimeToInstant(
  date: string | undefined,
  time: string | undefined,
  timeZone: string = CLUB_TIME_ZONE,
): Date | null {
  if (!date || !time) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) return null;
  /* Browsers emit "HH:MM", and "HH:MM:SS" when the input has seconds. */
  const match = time.trim().match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  /* Read the wall time as though it were UTC, then slide it by the zone's
     offset. The offset is looked up twice: the first guess can land on the
     wrong side of a daylight-saving change, and the second pass uses the
     offset in force at the corrected instant. */
  const asUtc = new Date(`${date}T${match[1]}:${match[2]}:00.000Z`);
  if (Number.isNaN(asUtc.getTime())) return null;

  let instant = new Date(asUtc.getTime() - zoneOffsetMs(asUtc, timeZone));
  instant = new Date(asUtc.getTime() - zoneOffsetMs(instant, timeZone));

  return Number.isNaN(instant.getTime()) ? null : instant;
}

/**
 * The club-time rendering of an instant, e.g.
 * "Thursday, 5 November 2026 at 6:30 PM EST".
 *
 * The zone abbreviation is part of it on purpose: members read these in
 * Lagos and in London, and "6:30 PM" on its own is an ambiguity nobody
 * notices until somebody misses an interview.
 */
export function formatClubDateTime(
  iso: string | undefined,
  timeZone: string = CLUB_TIME_ZONE,
): string {
  if (!iso) return "";
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";

  const date = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(instant);

  return `${date} at ${time}`;
}

/** Just the time part, for a compact line. */
export function formatClubTime(iso: string, timeZone: string = CLUB_TIME_ZONE): string {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(instant);
}

/** The date and time inputs' values for an instant, for pre-filling a form. */
export function instantToClubWallTime(
  iso: string | undefined,
  timeZone: string = CLUB_TIME_ZONE,
): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) return { date: "", time: "" };

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
    .formatToParts(instant)
    .filter((p) => p.type !== "literal");

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = String(Number(get("hour")) % 24).padStart(2, "0");

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}
