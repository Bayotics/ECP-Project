import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { upsertCredential } from "@/lib/server/auth";
import { consumeResetToken, inspectResetToken } from "@/lib/server/password-reset";
import { passwordProblem } from "@/lib/models/password";

/* Setting a new password from a reset link.
 *
 * GET inspects the token so the page can show the form or explain why it
 * cannot. POST spends it and writes the password. The two are separate so
 * that opening the page does not burn the link.
 */

const WHY: Record<string, string> = {
  invalid: "That reset link is not one of ours. Ask for a new one.",
  expired: "That reset link has expired. Ask for a new one.",
  "already-used": "That reset link has already been used. Ask for a new one.",
};

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const token = request.nextUrl.searchParams.get("token") ?? "";
    const result = await inspectResetToken(token);

    if (result.status !== "ok") {
      return NextResponse.json(
        { ok: false, reason: result.status, error: WHY[result.status] },
        { status: 400 },
      );
    }

    /* The address is echoed so the page can say whose password this sets.
       The token was a secret only its holder has, so this tells them
       nothing they did not already have. */
    return NextResponse.json({ ok: true, data: { email: result.email } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not check that link";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json().catch(() => ({}))) as {
      token?: string;
      password?: string;
    };

    const password = payload.password ?? "";

    /* The password is checked before the token is spent, so a password the
       rules refuse does not cost the member their link. */
    const problem = passwordProblem(password);
    if (problem) {
      return NextResponse.json({ ok: false, error: problem }, { status: 400 });
    }

    const result = await consumeResetToken(payload.token ?? "");
    if (result.status !== "ok") {
      return NextResponse.json(
        { ok: false, reason: result.status, error: WHY[result.status] },
        { status: 400 },
      );
    }

    const users = await getCollection("users");
    const user = serializeDocument(await users.findOne({ id: result.userId }));
    if (!user) {
      return NextResponse.json({ ok: false, error: "That account no longer exists." }, { status: 404 });
    }

    await upsertCredential(user.id, user.email, password);

    /* The password is now one they chose, so the prompt to change it goes
       away. Following a link sent to the address also proves they hold it,
       which is the same thing email confirmation establishes. */
    await users.updateOne(
      { id: user.id },
      {
        $set: {
          emailVerified: true,
          emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
        },
        $unset: { mustChangePassword: "" },
      },
    );

    return NextResponse.json({ ok: true, data: { email: user.email } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not set the new password";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
