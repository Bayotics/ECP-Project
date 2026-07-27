import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/server/guards";
import type { Filter } from "mongodb";
import type { User } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";
import { createUserWithPassword } from "@/lib/server/auth";

interface CreateUserPayload extends Omit<User, "id" | "joinedAt"> {
  password?: string;
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { deny } = requireSession(request);
  if (deny) return deny;

  try {
    await ensureCoreIndexes();
    const collection = await getCollection("users");
    const params = request.nextUrl.searchParams;
    const filter: Filter<User> = {};

    const role = params.get("role");
    const status = params.get("status");
    const email = params.get("email");

    if (role) filter.role = role as User["role"];
    if (status) filter.status = status as User["status"];
    if (email) filter.email = email.trim().toLowerCase();

    const users = serializeDocuments(await collection.find(filter).sort({ joinedAt: -1 }).toArray());
    return NextResponse.json({ ok: true, data: users });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CreateUserPayload>;

    if (!payload.firstName?.trim()) return badRequest("First name is required");
    if (!payload.lastName?.trim()) return badRequest("Last name is required");
    if (!payload.email?.trim()) return badRequest("Email is required");

    const collection = await getCollection("users");
    const email = payload.email.trim().toLowerCase();
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: false, error: "An account with this email already exists" }, { status: 409 });
    }

    const user: User = {
      id: nanoid(),
      email,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      displayName: payload.displayName?.trim() || `${payload.firstName.trim()} ${payload.lastName.trim()}`,
      role: payload.role ?? "member",
      status: payload.status ?? "active",
      avatarUrl: payload.avatarUrl,
      phone: payload.phone,
      lga: payload.lga,
      ward: payload.ward,
      occupation: payload.occupation,
      bio: payload.bio,
      joinedAt: new Date().toISOString(),
      lastLoginAt: payload.lastLoginAt,
      membershipId: payload.membershipId,
    };

    await collection.insertOne(user);
    await createUserWithPassword(user, payload.password);

    return NextResponse.json({ ok: true, data: user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
