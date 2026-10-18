import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import {
  RESET_COOLDOWN_SECONDS,
  RESET_TTL_MINUTES,
  lastResetRequestedAt,
  sendPasswordResetEmail,
} from "@/lib/server/password-reset";

/* "Email me a link to set a new password."
 *
 * The answer is the same whether or not an account exists. Saying "no
 * account with that address" would turn this endpoint into a way to find
 * out who belongs to the club, which the member directory is deliberately
 * behind a sign-in to prevent.
 *
 * Everything that could distinguish the two cases — the cooldown, the send
 * failing — is therefore reported the same way too, and the detail goes to
 * the server log instead.
 */

const SAME_ANSWER = {
  ok: true as const,
  message:
    "If that address belongs to an Eko Club Philadelphia account, a link to set a new password is on its way.",
};

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json().catch(() => ({}))) as { email?: string };
    const email = payload.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "An email address is required." }, { status: 400 });
    }

    const users = await getCollection("users");
    const user = serializeDocument(await users.findOne({ email }));

    if (!user) {
      console.warn(`[reset] No account for ${email}; nothing sent.`);
      return NextResponse.json({ ...SAME_ANSWER, expiresInMinutes: RESET_TTL_MINUTES });
    }

    if (user.status === "suspended" || user.status === "revoked") {
      /* A suspended account should not be able to let itself back in. */
      console.warn(`[reset] ${email} is suspended; nothing sent.`);
      return NextResponse.json({ ...SAME_ANSWER, expiresInMinutes: RESET_TTL_MINUTES });
    }

    const last = await lastResetRequestedAt(user.id);
    if (last && Date.now() - last.getTime() < RESET_COOLDOWN_SECONDS * 1000) {
      console.warn(`[reset] ${email} asked again within the cooldown; nothing sent.`);
      return NextResponse.json({ ...SAME_ANSWER, expiresInMinutes: RESET_TTL_MINUTES });
    }

    const result = await sendPasswordResetEmail(user);
    if (!result.sent) {
      console.error(`[reset] Could not email ${email}: ${result.error}`);
    }

    return NextResponse.json({ ...SAME_ANSWER, expiresInMinutes: RESET_TTL_MINUTES });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not start the reset";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
