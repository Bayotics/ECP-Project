import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@/lib/models";
import { createUserWithPassword } from "@/lib/server/auth";
import { mergeAnonymousCartIntoUser } from "@/lib/server/cart";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { clearCartSessionCookie, getCartSessionId, setAuthSessionCookie } from "@/lib/server/session";

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      email?: string;
      phone?: string;
      lga?: string;
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

    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
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
      status: "pending",
      avatarUrl: payload.avatarUrl,
      phone: payload.phone,
      lga: payload.lga,
      ward: payload.ward,
      occupation: payload.occupation,
      bio: payload.bio,
      joinedAt: new Date().toISOString(),
      membershipId: payload.membershipId,
    };

    await collection.insertOne(user);
    await createUserWithPassword(user, password);
    await mergeAnonymousCartIntoUser(getCartSessionId(request), user.id);

    const response = NextResponse.json({ ok: true, data: user }, { status: 201 });
    setAuthSessionCookie(response, user);
    clearCartSessionCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
