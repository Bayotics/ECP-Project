import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";
import { checkMembershipId, suggestMembershipId } from "@/lib/server/membership-activation";

/* The next club membership number, for the approval dialog to offer.
 *
 * A suggestion only. Nothing is reserved by asking, so an administrator
 * who opens the dialog and changes their mind does not leave a hole in the
 * club's register. The number is checked again, for real, when the
 * approval is saved.
 *
 * It also answers "is this one free?", so the dialog can say so while the
 * administrator is still typing rather than after they press approve.
 */

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();

    const sessionUser = await getSessionUser(request);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super-admin")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const check = request.nextUrl.searchParams.get("check");
    if (check !== null) {
      const result = await checkMembershipId(check);
      return NextResponse.json({
        ok: true,
        data: {
          available: result.ok,
          value: result.ok ? result.value : null,
          problem: result.ok ? null : result.problem,
        },
      });
    }

    return NextResponse.json({ ok: true, data: { suggested: await suggestMembershipId() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not suggest a membership number";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
