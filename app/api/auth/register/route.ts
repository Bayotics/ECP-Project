import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@/lib/models";
import { createUserWithPassword } from "@/lib/server/auth";
import { mergeAnonymousCartIntoUser } from "@/lib/server/cart";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { clearCartSessionCookie, getCartSessionId } from "@/lib/server/session";
import { sendVerificationEmail } from "@/lib/server/email-verification";
import { passwordProblem } from "@/lib/models/password";

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      email?: string;
      phone?: string;
      lagosOrigin?: string;
      ward?: string;
      occupation?: string;
      bio?: string;
      avatarUrl?: string;
      membershipId?: string;
      password?: string;
    };

    const firstName = payload.firstName?.trim();
    const lastName = payload.lastName?.trim();
    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? "";

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ ok: false, error: "First name, last name, email, and password are required." }, { status: 400 });
    }

    /* The same rule the reset and change-password flows apply, so a
       password accepted here is one the member can set again later. */
    const problem = passwordProblem(password);
    if (problem) {
      return NextResponse.json({ ok: false, error: problem }, { status: 400 });
    }

    const collection = await getCollection("users");
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const user: User = {
      id: nanoid(),
      email,
      firstName,
      lastName,
      displayName: payload.displayName?.trim() || `${firstName} ${lastName}`,
      role: "applicant",
      /* Pending until the email is confirmed; verification flips it to
         active, and login refuses anything still pending. */
      status: "pending",
      avatarUrl: payload.avatarUrl,
      phone: payload.phone,
      lagosOrigin: payload.lagosOrigin,
      ward: payload.ward,
      occupation: payload.occupation,
      bio: payload.bio,
      joinedAt: new Date().toISOString(),
      membershipId: payload.membershipId,
      emailVerified: false,
    };

    await collection.insertOne(user);
    await createUserWithPassword(user, password);
    await mergeAnonymousCartIntoUser(getCartSessionId(request), user.id);

    /* The account exists from here on. If the email cannot go out, the
       registration still stands and the page offers to send it again,
       rather than reporting a failure for an account that was created. */
    const verification = await sendVerificationEmail(user);

    /* No session cookie is set here. The account stays `pending` and cannot
       sign in until the address is confirmed, so handing out a session at
       registration would defeat the gate entirely. */
    const response = NextResponse.json(
      { ok: true, data: user, verificationEmailSent: verification.sent },
      { status: 201 },
    );
    clearCartSessionCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
