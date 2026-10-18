import { parseSocialProfiles } from "@/lib/social-profiles";
import { requireSession } from "@/lib/server/guards";
import { NextRequest, NextResponse } from "next/server";
import type { UpdateUserInput } from "@/lib/models";
import { publicUser } from "@/lib/models/user";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { deleteCredential, updateCredentialEmail } from "@/lib/server/auth";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;
  const { id } = await context.params;
  if (session?.sub !== id && session?.role !== "admin" && session?.role !== "super-admin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("users");
    const user = serializeDocument(await collection.findOne({ id }));

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: publicUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;
  const { id } = await context.params;
  const admin = session?.role === "admin" || session?.role === "super-admin";
  if (!admin && session?.sub !== id) return NextResponse.json({ ok: false, error: "You can only edit your own profile." }, { status: 403 });
  try {
    const payload = (await request.json()) as UpdateUserInput;
    const editable = new Set(["firstName", "lastName", "displayName", "phone", "lagosOrigin", "ward", "occupation", "bio", "avatarUrl", "linkedinUrl", "instagramUrl", "facebookUrl"]);
    if (!admin && Object.keys(payload).some((key) => !editable.has(key))) return NextResponse.json({ ok: false, error: "This field can only be changed by an administrator." }, { status: 403 });
    if (["status", "sessionVersion", "accountStatusHistory", "id", "joinedAt"].some(key => key in payload)) return NextResponse.json({ ok: false, error: "Use the account access controls to change membership status" }, { status: 400 });
    const social = parseSocialProfiles(payload);
    if (!social.ok) return NextResponse.json({ ok: false, error: social.error }, { status: 400 });
    await ensureCoreIndexes();
    const collection = await getCollection("users");

    const result = await collection.findOneAndUpdate(
      { id },
      { $set: { ...payload, ...social.values } },
      { returnDocument: "after" }
    );

    const user = serializeDocument(result);
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    if (payload.email) {
      await updateCredentialEmail(id, payload.email);
    }

    return NextResponse.json({ ok: true, data: publicUser(user) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update user";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { session, deny } = await requireSession(request);
  if (deny) return deny;
  if (session?.role !== "admin" && session?.role !== "super-admin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  try {
    await ensureCoreIndexes();
    const { id } = await context.params;
    const collection = await getCollection("users");
    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    await deleteCredential(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
