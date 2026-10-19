export function validateVolunteerCap(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= 100_000
    ? null : "Volunteer cap must be a whole number from 0 to 100,000, or left blank for unlimited places.";
}
