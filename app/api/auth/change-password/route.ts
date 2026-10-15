import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { hasCredential, upsertCredential, verifyUserPassword } from "@/lib/server/auth";
import { getSessionUser } from "@/lib/server/session";
import { passwordProblem } from "@/lib/models/password";

/* Changing your own password while signed in.
 *
 * The current password is required even though the session already proves
 * who they are: a session is a browser left open, and somebody at a
 * borrowed laptop should not be able to lock the member out of their own
 * account.
 *
 * The one exception is an account that has no password at all, which the
 * club's older seeded member records are. There is nothing to prove, so
 * asking for it would leave them unable to set one.
 */

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });
    }

    const payload = (await request.json().catch(() => ({}))) as {
      currentPassword?: string;
      newPassword?: string;
    };

    const newPassword = payload.newPassword ?? "";
    const problem = passwordProblem(newPassword, {
      rejecting: [user.membershipId, payload.currentPassword],
    });
    if (problem) {
      return NextResponse.json({ ok: false, error: problem, field: "newPassword" }, { status: 400 });
    }

    const needsCurrent = await hasCredential(user.id);
    if (needsCurrent) {
      const current = payload.currentPassword ?? "";
      if (!current) {
        return NextResponse.json(
          { ok: false, error: "Enter your current password.", field: "currentPassword" },
          { status: 400 },
        );
      }
      if (!(await verifyUserPassword(user.id, current))) {
        return NextResponse.json(
          { ok: false, error: "That is not your current password.", field: "currentPassword" },
          { status: 400 },
        );
      }
    }

    await upsertCredential(user.id, user.email, newPassword);

    const users = await getCollection("users");
    const updated = serializeDocument(
      await users.findOneAndUpdate(
        { id: user.id },
        { $unset: { mustChangePassword: "" } },
        { returnDocument: "after" },
      ),
    );

    return NextResponse.json({ ok: true, data: updated ?? user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not change the password";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
