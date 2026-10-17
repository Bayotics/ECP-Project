import { Sendridge, SendridgeError } from "sendridge";

/* Transactional email, through Sendridge.
 *
 * Configuration, all server side:
 *
 *   SENDRIDGE_API_KEY   from the Sendridge dashboard. Grants full sending
 *                       access, so it must never reach the browser.
 *   EMAIL_FROM          the sender, e.g. "Eko Club Philadelphia
 *                       <no-reply@ekoclubphiladelphia.org>". The domain has
 *                       to be verified in Sendridge or sends are refused
 *                       with a PermissionError.
 *   EMAIL_REPLY_TO      optional. Where a member's reply should land, since
 *                       nobody reads no-reply.
 *   SENDRIDGE_BASE_URL  optional. Overrides the API host, for a local stub
 *                       during development. Leave unset in production.
 *
 * `sendEmail` never throws. A club member signing up should not see a 500
 * because an email provider had a bad minute, so callers get a result they
 * can decide about instead of an exception that aborts registration.
 */

/* Reply-To only needs to route the reply, so it is reduced to the address. */
function bareAddress(value: string): string {
  const angled = value.match(/<([^>]+)>/);
  return (angled ? angled[1] : value).trim();
}

/* Passed through whole: the display name in "Eko Club Philadelphia
   <info@…>" is what inboxes show as the sender. Stripping it leaves them
   showing "info". */
const FROM = (process.env.EMAIL_FROM ?? process.env.SMTP_FROM ?? "").trim();
const REPLY_TO = process.env.EMAIL_REPLY_TO ? bareAddress(process.env.EMAIL_REPLY_TO) : undefined;

/** False until credentials are present, so callers can degrade politely. */
export const emailConfigured = Boolean(process.env.SENDRIDGE_API_KEY && FROM);

let client: Sendridge | null = null;
function getClient(): Sendridge | null {
  if (!emailConfigured) return null;
  /* SENDRIDGE_BASE_URL points the SDK somewhere else, which is how a local
     stub is used in development. Unset in production, where it defaults to
     the real API. */
  const baseUrl = process.env.SENDRIDGE_BASE_URL?.trim();
  client ??= new Sendridge(process.env.SENDRIDGE_API_KEY, baseUrl ? { baseUrl } : undefined);
  return client;
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string; retryable: boolean };

/** Strips tags for the plain-text alternative, so every email has both parts. */
export function htmlToText(html: string): string {
  return (
    html
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      /* The preheader is the line inboxes show beside the subject. It is
         hidden in the HTML, so it must not be repeated in the text part. */
      .replace(/<div[^>]*display:\s*none[\s\S]*?<\/div>/gi, "")
      .replace(/<br\s*\/?>/gi, "\n")
      /* Attributes and all: <li style="..."> is what the templates emit. */
      .replace(/<li[^>]*>/gi, "\n  - ")
      .replace(/<\/(p|div|h[1-6]|tr|li|ul|ol|table)>/gi, "\n")
      .replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 ($1)")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .split("\n")
      /* Trim first: collapsing blank runs before this leaves lines that are
         only whitespace, which then read as blanks anyway. */
      .map((line) => line.trimEnd().replace(/^[ \t]+(?!- )/, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

export async function sendEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Free-form labels for filtering in the Sendridge dashboard. */
  tags?: Record<string, string>;
}): Promise<SendResult> {
  const sendridge = getClient();
  if (!sendridge) {
    console.warn(
      `[email] Not configured, so "${options.subject}" was not sent. ` +
        "Set SENDRIDGE_API_KEY and EMAIL_FROM in .env.local.",
    );
    return { ok: false, error: "Email is not configured on this server", retryable: false };
  }

  try {
    const result = await sendridge.emails.send({
      from: FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? htmlToText(options.html),
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      ...(options.tags ? { tags: options.tags } : {}),
    });
    return { ok: true, id: result.id };
  } catch (caught) {
    /* A bad key or an unverified domain will not fix itself on a retry, so
       the distinction is recorded for whoever reads the logs. */
    const retryable =
      caught instanceof SendridgeError &&
      (caught.statusCode === null || caught.statusCode === 429 || caught.statusCode >= 500);

    let error = caught instanceof Error ? caught.message : "Email send failed";

    if (caught instanceof SendridgeError) {
      /* "Invalid request data" alone sends you hunting. The per-field
         details say which field, e.g. {"from":["Invalid email"]}, so they
         are folded into the logged message rather than discarded. */
      if (caught.details) {
        const fields = Object.entries(caught.details)
          .map(([field, problems]) => `${field}: ${problems.join(", ")}`)
          .join("; ");
        if (fields) error = `${error} (${fields})`;
      }
      console.error(
        `[email] "${options.subject}" failed with ${caught.statusCode ?? "no status"}: ${error}`,
      );
      if (caught.statusCode === 401) {
        console.error("[email] Check SENDRIDGE_API_KEY in .env.local.");
      }
      if (caught.statusCode === 403) {
        console.error(
          `[email] Sendridge refused the sender "${FROM}". Verify that domain in the ` +
            "Sendridge dashboard before sending from it.",
        );
      }
    } else {
      console.error(`[email] "${options.subject}" failed: ${error}`, caught);
    }

    return { ok: false, error, retryable };
  }
}

/** The public origin, for links inside emails. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}
