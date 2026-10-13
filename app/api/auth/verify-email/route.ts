import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { consumeVerificationToken } from "@/lib/server/email-verification";
import { sendEmail, siteUrl } from "@/lib/server/email";
import { welcomeEmail } from "@/lib/server/email-templates";

/* Confirms an address from the link in the verification email.
 *
 * POST rather than GET, and the page calls it: mail clients and security
 * scanners prefetch links, and a GET that spends a single-use token would
 * be burned before the member ever clicked. The page at
 * /auth/verify-email reads the token from the URL and posts it here.
 */

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();

    const { token } = (await request.json().catch(() => ({}))) as { token?: string };
    const result = await consumeVerificationToken(token ?? "");

    if (result.status !== "ok") {
      const messages = {
        invalid: "That confirmation link is not valid. Ask for a new one below.",
        expired: "That confirmation link has expired. Ask for a new one below.",
        "already-used": "That link has already been used. Try signing in.",
      } as const;
      return NextResponse.json(
        { ok: false, reason: result.status, error: messages[result.status] },
        { status: 400 },
      );
    }

    const users = await getCollection("users");
    const user = await users.findOne({ id: result.userId });
    if (!user) {
      return NextResponse.json(
        { ok: false, reason: "invalid", error: "That account no longer exists." },
        { status: 400 },
      );
    }

    /* Already verified is a success, not an error: a member who clicks the
       link twice has done nothing wrong. */
    if (user.emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true });
    }

    /* The account was created `pending` and is activated here, which is what
       lets it sign in. A suspended account stays suspended: confirming an
       address is not a way back in past an administrator's decision. */
    const nextStatus = user.status === "pending" ? "active" : user.status;

    await users.updateOne(
      { id: user.id },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: new Date().toISOString(),
          status: nextStatus,
        },
      },
    );

    /* The welcome note is a courtesy. If it fails the address is still
       confirmed, so it must not turn a successful verification into an error. */
    const { subject, html } = welcomeEmail({
      name: user.displayName ?? user.firstName ?? "",
      email: result.email,
      portalUrl: `${siteUrl()}/auth/login`,
    });
    const welcome = await sendEmail({
      to: result.email,
      subject,
      html,
      tags: { type: "welcome" },
    });
    if (!welcome.ok) console.error("[verify] welcome email failed:", welcome.error);

    return NextResponse.json({ ok: true, alreadyVerified: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ ok: false, reason: "error", error: message }, { status: 500 });
  }
}
