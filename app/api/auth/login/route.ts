import { NextRequest, NextResponse } from "next/server";
import { verifyCredentials } from "@/lib/server/auth";
import { mergeAnonymousCartIntoUser } from "@/lib/server/cart";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { clearCartSessionCookie, getCartSessionId, setAuthSessionCookie } from "@/lib/server/session";

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
    const now = new Date().toISOString();
    const result = await collection.findOneAndUpdate(
      { id: userId },
      { $set: { lastLoginAt: now } },
      { returnDocument: "after" }
    );

    const user = serializeDocument(result);
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    if (user.status === "suspended") {
      return NextResponse.json({ ok: false, error: "This account has been suspended." }, { status: 403 });
    }

    await mergeAnonymousCartIntoUser(getCartSessionId(request), user.id);

    const response = NextResponse.json({ ok: true, data: user });
    setAuthSessionCookie(response, user);
    clearCartSessionCookie(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
