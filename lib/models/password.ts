/* One password rule, shared by the browser and the server.
 *
 * The browser checks it so the member is told before they submit; the
 * server checks it again because a POST can arrive from anywhere. Keeping
 * the rule in one place is what stops the two drifting apart and a form
 * accepting something the API then refuses.
 */

export const PASSWORD_MIN_LENGTH = 8;

/**
 * Returns what is wrong with a proposed password, or null if nothing is.
 *
 * `rejecting` holds values it must not be: a new member's membership
 * number, say, which they were emailed in the clear and are being asked to
 * replace. Choosing it again would leave them exactly where they started.
 */
export function passwordProblem(
  password: string,
  options: { rejecting?: (string | undefined | null)[] } = {},
): string | null {
  if (!password) return "Enter a new password.";
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Your password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (/^\s|\s$/.test(password)) {
    return "A password cannot start or end with a space.";
  }

  const lowered = password.trim().toLowerCase();
  for (const forbidden of options.rejecting ?? []) {
    if (forbidden && forbidden.trim().toLowerCase() === lowered) {
      return "Choose a password different from the one you were given.";
    }
  }
  return null;
}
