import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import {
  RESEND_COOLDOWN_SECONDS,
  lastTokenIssuedAt,
  sendVerificationEmail,
} from "@/lib/server/email-verification";

/* Sends the confirmation link again.
 *
 * Two things this must not become:
 *
 *   An account oracle. The answer is the same whether or not the address is
 *   registered, so nobody can use this to discover who has an account.
 *
 *   A way to send mail to strangers. Anyone can post any address here, so a
 *   per-account cooldown limits how often one address can be mailed. It is
 *   held in the token collection rather than in memory, so it survives a
 *   restart and holds across several server instances.
 */

/* Said no matter what actually happened. */
const NEUTRAL = "If that address has an account awaiting confirmation, a new link is on its way.";

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();

    const { email } = (await request.json().catch(() => ({}))) as { email?: string };
    const address = email?.trim().toLowerCase();

    if (!address || !address.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter your email address." }, { status: 400 });
    }

    const users = await getCollection("users");
    const user = await users.findOne({ email: address });

    /* Nothing to do for an unknown address or one already confirmed, but the
       reply is identical either way. */
    if (!user || user.emailVerified) {
      return NextResponse.json({ ok: true, message: NEUTRAL });
    }

    const last = await lastTokenIssuedAt(user.id);
    if (last) {
      const elapsed = (Date.now() - last.getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        return NextResponse.json(
          { ok: false, error: `Please wait ${wait} more second${wait === 1 ? "" : "s"} before asking again.` },
          { status: 429 },
        );
      }
    }

    const result = await sendVerificationEmail(user);
    if (!result.sent) {
      return NextResponse.json(
        { ok: false, error: "The email could not be sent just now. Please try again shortly." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, message: NEUTRAL });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not resend the email";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
