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

/**
 * Sent to every administrator the moment an applicant settles the fee.
 *
 * It leads with what the committee has to do next, because the two payment
 * methods leave the club in different positions: a PayPal capture is money
 * already received, while a Zelle transfer is only what the applicant says
 * they have sent and still has to be found in the club's account. Saying
 * "payment received" for both would have somebody approving an application
 * nobody had checked.
 */
export function applicationFeeAdminEmail(options: {
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  method: "paypal" | "zelle";
  reference?: string;
  amountUSD: number;
  appliedAt: string;
  adminUrl: string;
}): { subject: string; html: string } {
  const byZelle = options.method === "zelle";
  const name = escapeHtml(options.applicantName);

  const verdict = byZelle
    ? {
        colour: EKO.yellow,
        tint: "#fffbeb",
        line: `${name} says they have sent $${options.amountUSD} by Zelle. Nothing is confirmed until the treasurer finds it in the club account.`,
        todo: "Check the club's Zelle account, then mark the fee confirmed on the application.",
      }
    : {
        colour: EKO.green,
        tint: "#f0fdf4",
        line: `${name} paid the $${options.amountUSD} application fee by PayPal. The money has been captured.`,
        todo: "The application is ready for the membership committee to review.",
      };

  const row = (label: string, value?: string) =>
    value?.trim()
      ? `<tr>
           <td style="padding:6px 12px 6px 0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};white-space:nowrap;">${escapeHtml(label)}</td>
           <td style="padding:6px 0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">${escapeHtml(value)}</td>
         </tr>`
      : "";

  const applied = (() => {
    const d = new Date(options.appliedAt);
    return Number.isNaN(d.getTime())
      ? options.appliedAt
      : d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
  })();

  const body = `
${heading("New membership application")}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${verdict.colour};background:${verdict.tint};padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      ${verdict.line}
    </p>
  </td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
  ${row("Applicant", options.applicantName)}
  ${row("Email", options.applicantEmail)}
  ${row("Phone", options.applicantPhone)}
  ${row("Fee", `$${options.amountUSD} by ${byZelle ? "Zelle" : "PayPal"}`)}
  ${row("Reference", options.reference)}
  ${row("Applied", applied)}
</table>

<p style="margin:0 0 4px;">${escapeHtml(verdict.todo)}</p>
${button(options.adminUrl, "Open the application")}

<p style="margin:0;color:${MUTED};font-size:14px;">
  You are receiving this because you are an administrator of Eko Club Philadelphia.
</p>`;

  return {
    subject: byZelle
      ? `Zelle payment reported: ${options.applicantName}'s application`
      : `Fee paid: ${options.applicantName}'s membership application`,
    html: layout({
      title: "New membership application",
      preheader: byZelle
        ? `${options.applicantName} reported a Zelle transfer. Needs confirming.`
        : `${options.applicantName} paid the application fee by PayPal.`,
      body,
    }),
  };
}

/**
 * The applicant's own receipt, sent at the same moment the administrators
 * are told. It is the only record they have that the form and the money
 * arrived, so it repeats both back to them.
 *
 * As with the administrators' copy, PayPal and Zelle are not described in
 * the same words. Telling someone their Zelle transfer is "received" when
 * the treasurer has not yet found it would have them believe a step is
 * finished that is not.
 */
export function applicationReceivedEmail(options: {
  name: string;
  method: "paypal" | "zelle";
  amountUSD: number;
  reference?: string;
  statusUrl: string;
  /** Where the two written references go. */
  referencesEmail: string;
}): { subject: string; html: string } {
  const byZelle = options.method === "zelle";
  const first = options.name.trim().split(/\s+/)[0] || "there";

  const fee = byZelle
    ? {
        colour: EKO.yellow,
        tint: "#fffbeb",
        line: `We have noted that you sent $${options.amountUSD} by Zelle. The treasurer checks the club account and confirms it, usually within a few days. You do not need to do anything else about the fee.`,
      }
    : {
        colour: EKO.green,
        tint: "#f0fdf4",
        line: `Your $${options.amountUSD} application fee has been paid by PayPal and is received in full.`,
      };

  const body = `
${heading(`Thank you, ${escapeHtml(first)}`)}
<p style="margin:0 0 16px;">
  Your membership application for Eko Club Philadelphia has been received.
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${fee.colour};background:${fee.tint};padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      ${fee.line}
    </p>
  </td></tr>
</table>

${
  options.reference?.trim()
    ? `<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">
         Your reference number: <span style="color:${INK};">${escapeHtml(options.reference.trim())}</span>
       </p>`
    : ""
}

<p style="margin:0 0 12px;">What happens next:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:${INK};">
  <li style="margin-bottom:6px;">The membership committee reviews your application.</li>
  <li style="margin-bottom:6px;">You may be invited to meet the committee.</li>
  <li style="margin-bottom:6px;">The Exco signs off on the committee's recommendation.</li>
</ul>
<p style="margin:0 0 16px;">
  We email you at every step, and you can check where your application stands at any time.
</p>
${button(options.statusUrl, "Track my application")}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${EKO.blue};background:#eff6ff;padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      One thing is still yours to do: send your two written references to
      <a href="mailto:${escapeHtml(options.referencesEmail)}" style="color:${EKO.blue};">${escapeHtml(options.referencesEmail)}</a>.
    </p>
  </td></tr>
</table>

<p style="margin:0;color:${MUTED};font-size:14px;">
  The $${options.amountUSD} application fee is non-refundable. If anything above looks wrong,
  reply to this message and we will put it right.
</p>`;

  return {
    subject: byZelle
      ? "We have your application, and we are confirming your Zelle transfer"
      : "Your application and payment are received",
    html: layout({
      title: "Your application has been received",
      preheader: byZelle
        ? "Your application is in. The treasurer is confirming your Zelle transfer."
        : `Your application is in and the $${options.amountUSD} fee is paid.`,
      body,
    }),
  };
}

/**
 * Sent to the applicant each time an administrator moves the application on.
 *
 * Only what the applicant should see goes in: the internal review notes
 * stay internal, which is why this takes a status and nothing else from
 * the review.
 */
export function applicationStatusEmail(options: {
  name: string;
  status: "pending" | "under-review" | "interview" | "approved" | "rejected";
  statusUrl: string;
  portalUrl: string;
  contactEmail: string;
}): { subject: string; html: string } {
  const first = escapeHtml(options.name.trim().split(/\s+/)[0] || "there");

  type Copy = {
    subject: string;
    preheader: string;
    title: string;
    colour: string;
    tint: string;
    banner: string;
    paragraphs: string[];
    cta?: { href: string; label: string };
  };

  const COPY: Record<typeof options.status, Copy> = {
    pending: {
      subject: "Your membership application has been received",
      preheader: "Your application is with Eko Club Philadelphia.",
      title: `Thank you, ${first}`,
      colour: EKO.yellow,
      tint: "#fffbeb",
      banner: "Your application has been received and is waiting to be reviewed.",
      paragraphs: ["We will write to you again as soon as the membership committee picks it up."],
      cta: { href: options.statusUrl, label: "Track my application" },
    },
    "under-review": {
      subject: "Your application is now under review",
      preheader: "The membership committee has started reviewing your application.",
      title: `Your application is under review, ${first}`,
      colour: EKO.blue,
      tint: "#eff6ff",
      banner: "The membership committee has begun reviewing your application.",
      paragraphs: [
        "There is nothing for you to do at this stage. If the committee needs anything further, they will ask you directly.",
        "If you have not yet sent your two written references, that is the one thing worth doing now.",
      ],
      cta: { href: options.statusUrl, label: "Track my application" },
    },
    interview: {
      subject: "We would like to meet you",
      preheader: "The membership committee would like to meet you.",
      title: `Let us meet, ${first}`,
      colour: EKO.yellow,
      tint: "#fffbeb",
      banner: "The membership committee would like to meet you before deciding.",
      paragraphs: [
        "Somebody from the committee will be in touch shortly to agree a time that suits you. It is a conversation, not a test: they want to know you, and you should ask them whatever you want to know about the club.",
      ],
      cta: { href: options.statusUrl, label: "See my application" },
    },
    approved: {
      subject: "Your membership application has been approved",
      preheader: "Welcome to Eko Club Philadelphia.",
      title: `Welcome to the club, ${first}`,
      colour: EKO.green,
      tint: "#f0fdf4",
      banner: "Your membership application has been approved.",
      paragraphs: [
        "Eko o ni baje. You are a member of Eko Club Philadelphia, and we are glad to have you.",
        "Sign in to the member portal to complete your profile, see the directory and the committees you can join, and find the next club event.",
      ],
      cta: { href: options.portalUrl, label: "Sign in to the member portal" },
    },
    rejected: {
      subject: "About your membership application",
      preheader: "An update on your Eko Club Philadelphia application.",
      title: `Thank you for applying, ${first}`,
      colour: EKO.red,
      tint: "#fef2f2",
      banner: "Your application was not successful on this occasion.",
      paragraphs: [
        "We are sorry to send this news. It is not a judgement of you, and it does not shut the door: you are welcome to apply again, and to come to any club event that is open to the public in the meantime.",
        "If you would like to understand the decision, write to us and we will talk it through with you.",
      ],
    },
  };

  const copy = COPY[options.status];

  const body = `
${heading(copy.title)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${copy.colour};background:${copy.tint};padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      ${escapeHtml(copy.banner)}
    </p>
  </td></tr>
</table>

${copy.paragraphs.map((p) => `<p style="margin:0 0 16px;">${escapeHtml(p)}</p>`).join("\n")}
${copy.cta ? button(copy.cta.href, copy.cta.label) : ""}

<p style="margin:0;color:${MUTED};font-size:14px;">
  Any questions, write to
  <a href="mailto:${escapeHtml(options.contactEmail)}" style="color:${EKO.blue};">${escapeHtml(options.contactEmail)}</a>.
</p>`;

  return {
    subject: copy.subject,
    html: layout({ title: copy.subject, preheader: copy.preheader, body }),
  };
}

/**
 * Sent when an application is approved and a membership number issued.
 *
 * This replaces the plain "approved" note, because it carries something
 * the member needs to keep: their club number, which is also the password
 * they sign in with the first time. It says plainly that the number is
 * temporary as a password, since it travels by email in the clear.
 */
export function membershipApprovedEmail(options: {
  name: string;
  membershipId: string;
  email: string;
  loginUrl: string;
  contactEmail: string;
  /** False when the account already had its own password, untouched. */
  passwordSet: boolean;
}): { subject: string; html: string } {
  const first = escapeHtml(options.name.trim().split(/\s+/)[0] || "there");
  const id = escapeHtml(options.membershipId);

  const credentials = options.passwordSet
    ? `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border:1px solid ${LINE};border-radius:12px;padding:16px 18px;">
    <p style="margin:0 0 10px;font:400 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
      How to sign in
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:4px 12px 4px 0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};">Email</td>
        <td style="padding:4px 0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">${escapeHtml(options.email)}</td>
      </tr>
      <tr>
        <td style="padding:4px 12px 4px 0;font:400 13px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${MUTED};">Password</td>
        <td style="padding:4px 0;font:500 14px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:${INK};letter-spacing:0.04em;">${id}</td>
      </tr>
    </table>
  </td></tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${EKO.yellow};background:#fffbeb;padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      Your membership number is your password only until you change it. Because it has travelled
      by email, please set a password of your own as soon as you sign in. The portal will ask you.
    </p>
  </td></tr>
</table>`
    : `
<p style="margin:0 0 20px;">
  Sign in with the email address and password you already use for the portal. Your membership
  number is now on your account.
</p>`;

  const body = `
${heading(`Welcome to the club, ${first}`)}

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;">
  <tr><td style="border-left:3px solid ${EKO.green};background:#f0fdf4;padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      Your membership application has been approved.
    </p>
  </td></tr>
</table>

<p style="margin:0 0 16px;">
  Eko o ni baje. You are a member of Eko Club Philadelphia, and we are glad to have you.
</p>

<p style="margin:0 0 8px;font:400 11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:${MUTED};">
  Your membership number
</p>
<p style="margin:0 0 20px;font:500 24px/1.3 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:0.06em;color:${INK};">
  ${id}
</p>
<p style="margin:0 0 20px;">
  Keep it. It identifies you to the club, on your dues and anywhere the Exco asks for it.
</p>

${credentials}

${button(options.loginUrl, "Sign in to the member portal")}

<p style="margin:0 0 12px;">Inside you will find:</p>
<ul style="margin:0 0 20px;padding-left:20px;color:${INK};">
  <li style="margin-bottom:6px;">The member directory, and the committees you can join</li>
  <li style="margin-bottom:6px;">Club events, with the calendar and meeting minutes</li>
  <li style="margin-bottom:6px;">Your dues and payment history</li>
</ul>

<p style="margin:0;color:${MUTED};font-size:14px;">
  Any questions, write to
  <a href="mailto:${escapeHtml(options.contactEmail)}" style="color:${EKO.blue};">${escapeHtml(options.contactEmail)}</a>.
</p>`;

  return {
    subject: `Welcome to Eko Club Philadelphia. Your membership number is ${options.membershipId}`,
    html: layout({
      title: "Your membership application has been approved",
      preheader: `Approved. Your membership number is ${options.membershipId}.`,
      body,
    }),
  };
}

/** The reset link. Short-lived, single use, and says so. */
export function passwordResetEmail(options: {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
}): { subject: string; html: string } {
  const first = options.name.trim().split(/\s+/)[0] || "there";

  const body = `
${heading(`Set a new password, ${escapeHtml(first)}`)}
<p style="margin:0 0 16px;">
  Somebody asked to reset the password on your Eko Club Philadelphia account. If that was you,
  use the button below.
</p>
${button(options.resetUrl, "Choose a new password")}
<p style="margin:0 0 16px;color:${MUTED};font-size:14px;">
  The link works once and expires in ${options.expiresInMinutes} minutes. If the button does not
  work, copy this into your browser:
</p>
<p style="margin:0 0 20px;font-size:13px;word-break:break-all;">
  <a href="${escapeHtml(options.resetUrl)}" style="color:${EKO.blue};">${escapeHtml(options.resetUrl)}</a>
</p>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0;">
  <tr><td style="border-left:3px solid ${EKO.yellow};background:#fffbeb;padding:12px 16px;border-radius:0 8px 8px 0;">
    <p style="margin:0;font:400 14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${INK};">
      If you did not ask for this, you can ignore this message. Your password has not changed, and
      nobody can change it without this link.
    </p>
  </td></tr>
</table>`;

  return {
    subject: "Reset your Eko Club Philadelphia password",
    html: layout({
      title: "Reset your password",
      preheader: `A link to set a new password. It expires in ${options.expiresInMinutes} minutes.`,
      body,
    }),
  };
}
