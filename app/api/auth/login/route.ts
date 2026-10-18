import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/server/auth";
import { mergeAnonymousCartIntoUser } from "@/lib/server/cart";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { clearCartSessionCookie, getCartSessionId, setAuthSessionCookie } from "@/lib/server/session";
import { accountIsRestricted, publicUser } from "@/lib/models/user";

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as { email?: string; password?: string };
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const userId = await verifyCredentials(email, password);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
    }

    const collection = await getCollection("users");
    const user = serializeDocument(await collection.findOne({ id: userId }));
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    if (accountIsRestricted(user.status)) {
      return NextResponse.json({ ok: false, reason: `account-${user.status}`, error: `Your membership has been ${user.status}. Contact the club administrators. Portal access will be restored only after reinstatement.` }, { status: 403 });
    }

    /* The gate. An unconfirmed address gets no session, so the portal is
       unreachable until the member follows the link. `reason` lets the
       login page offer to send a new one instead of showing a dead end.
       Credentials were already checked above, so saying the address is
       unconfirmed tells the caller nothing they did not already prove. */
    if (user.emailVerified === false) {
      return NextResponse.json(
        {
          ok: false,
          reason: "email-unverified",
          email: user.email,
          error: "Confirm your email address before signing in. Check your inbox for the link we sent.",
        },
        { status: 403 },
      );
    }

    const loggedIn = serializeDocument(await collection.findOneAndUpdate(
      { id: user.id, status: user.status, sessionVersion: user.sessionVersion ?? { $exists: false } },
      { $set: { lastLoginAt: new Date().toISOString() } }, { returnDocument: "after" },
    ));
    if (!loggedIn) return NextResponse.json({ ok: false, error: "Account access changed. Please try signing in again." }, { status: 403 });
    await mergeAnonymousCartIntoUser(getCartSessionId(request), user.id);

    const response = NextResponse.json({ ok: true, data: publicUser(loggedIn) });
    setAuthSessionCookie(response, loggedIn);
    clearCartSessionCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
