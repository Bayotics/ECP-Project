/**
 * Format a number as Nigerian Naira currency.
 */
export function formatNaira(
  amount: number,
  opts?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    ...opts,
  }).format(amount);
}

/**
 * Format a date to a human-readable string.
 */
export function formatDate(
  date: Date | string,
  opts?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...opts,
  }).format(new Date(date));
}

/**
 * Truncate a string to a specified length with an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Format a compact number (e.g., 1200 → "1.2K").
 */
export function formatCompact(n: number): string {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

/**
 * Returns initials from a full name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
