/* Email bodies for the club.
 *
 * Email clients are not browsers: Outlook still renders through Word, Gmail
 * strips <style> blocks in some contexts, and flexbox is unreliable. So this
 * is table layout with inline styles, which is ugly to read and the only
 * thing that renders the same everywhere.
 *
 * Anything a member supplies is escaped before it goes in, because an email
 * body is HTML and a display name is not to be trusted.
 */

const EKO = {
  green: "#059669",
  red: "#dc2626",
  blue: "#2563eb",
  yellow: "#d97706",
} as const;

const INK = "#0a0a0a";
const MUTED = "#525252";
const LINE = "#e5e5e5";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** The shell every club email sits in: quad bar, wordmark, body, footer. */
function layout(options: { title: string; body: string; preheader: string }): string {
  const quad = [EKO.green, EKO.red, EKO.blue, EKO.yellow]
    .map((c) => `<td width="25%" height="4" style="background:${c};font-size:0;line-height:4px;">&nbsp;</td>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<!-- Shown in the inbox list beside the subject, then hidden. -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f5f5;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="max-width:560px;background:#ffffff;border:1px solid ${LINE};border-radius:16px;overflow:hidden;">
      <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${quad}</tr></table></td></tr>
      <tr><td style="padding:32px 32px 8px;">
        <p style="margin:0;font:400 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.22em;text-transform:uppercase;color:${MUTED};">
          Eko Club Philadelphia
        </p>
      </td></tr>
      <tr><td style="padding:0 32px 32px;font:400 15px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
        ${options.body}
      </td></tr>
      <tr><td style="padding:20px 32px;border-top:1px solid ${LINE};background:#fafafa;">
        <p style="margin:0;font:400 12px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};">
          Eko Club Philadelphia, a Nigerian community association serving the Greater Philadelphia area.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr><td align="center" bgcolor="${EKO.green}" style="border-radius:999px;">
    <a href="${escapeHtml(href)}"
       style="display:inline-block;padding:14px 28px;font:400 15px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;text-decoration:none;border-radius:999px;">
      ${escapeHtml(label)}
    </a>
  </td></tr>
</table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font:500 26px/1.25 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:-0.02em;color:${INK};">${escapeHtml(text)}</h1>`;
}

/** Sent immediately after signup. The link is the only thing that matters here. */
export function verificationEmail(options: {
  name: string;
  verifyUrl: string;
  expiresInHours: number;
}): { subject: string; html: string } {
  const first = options.name.trim().split(/\s+/)[0] || "there";
  const body = `
${heading(`Confirm your email, ${escapeHtml(first)}`)}
<p style="margin:0 0 16px;">
  Thank you for registering with Eko Club Philadelphia. One step is left: confirm that this
  address belongs to you.
</p>
${button(options.verifyUrl, "Confirm my email")}
<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">
  The link works once and expires in ${options.expiresInHours} hours. If the button does not
  work, copy this into your browser:
</p>
<p style="margin:0 0 20px;font-size:13px;word-break:break-all;">
  <a href="${escapeHtml(options.verifyUrl)}" style="color:${EKO.blue};">${escapeHtml(options.verifyUrl)}</a>
</p>
<p style="margin:0;color:${MUTED};font-size:14px;">
  If you did not create this account you can ignore this message and nothing will happen.
</p>`;

  return {
    subject: "Confirm your email address",
    html: layout({
      title: "Confirm your email address",
      preheader: "One step left to finish setting up your Eko Club Philadelphia account.",
      body,
    }),
  };
}

/**
 * Sent once the address is confirmed. It does both jobs the club asked for:
 * it confirms the verification succeeded and the account is now active, and
 * it welcomes the member in. Two separate emails landing seconds apart would
 * read as a glitch rather than as care.
 */
export function welcomeEmail(options: { name: string; portalUrl: string; email?: string }): {
  subject: string;
  html: string;
} {
  const first = options.name.trim().split(/\s+/)[0] || "there";
  const confirmed = options.email
    ? `<span style="color:${INK};">${escapeHtml(options.email)}</span> is confirmed`
    : "Your email address is confirmed";
  const body = `
${heading(`Welcome, ${escapeHtml(first)}`)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${EKO.green};background:#f0fdf4;padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      ${confirmed}, and your account is now active.
    </p>
  </td></tr>
</table>
<p style="margin:0 0 16px;">
  You can sign in to the Eko Club Philadelphia member portal from here on.
</p>
${button(options.portalUrl, "Sign in to the member portal")}
<p style="margin:0 0 12px;">Inside you will find:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:${INK};">
  <li style="margin-bottom:6px;">The member directory, and the committees you can join</li>
  <li style="margin-bottom:6px;">Club events, with the calendar and meeting minutes</li>
  <li style="margin-bottom:6px;">Your dues and payment history</li>
</ul>
<p style="margin:0;color:${MUTED};font-size:14px;">
  Registering is not the same as full membership. If you have not yet applied, you can do so
  from the portal, and the membership committee will review it.
</p>`;

  return {
    subject: "Your email is confirmed. Welcome to Eko Club Philadelphia",
    html: layout({
      title: "Your email is confirmed",
      preheader: "Your address is confirmed, your account is active, and you can sign in now.",
      body,
    }),
  };
}
