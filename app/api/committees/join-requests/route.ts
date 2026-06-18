import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { CommitteeJoinRequest } from "@/lib/models";
import { ensureCoreIndexes, getCollection, serializeDocuments } from "@/lib/server/collections";

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const collection = await getCollection("committeeJoinRequests");
    const params = request.nextUrl.searchParams;

    const filter: Record<string, unknown> = {};
    const committeeId = params.get("committeeId");
    const userId = params.get("userId");
    const status = params.get("status");

    if (committeeId) filter.committeeId = committeeId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;

    const requests = serializeDocuments(
      await collection.find(filter).sort({ requestedAt: -1 }).toArray()
    );
    return NextResponse.json({ ok: true, data: requests });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch join requests";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const payload = (await request.json()) as Partial<CommitteeJoinRequest>;

    if (!payload.committeeId) return NextResponse.json({ ok: false, error: "committeeId is required" }, { status: 400 });
    if (!payload.userId) return NextResponse.json({ ok: false, error: "userId is required" }, { status: 400 });
    if (!payload.userName) return NextResponse.json({ ok: false, error: "userName is required" }, { status: 400 });
    if (!payload.userEmail) return NextResponse.json({ ok: false, error: "userEmail is required" }, { status: 400 });
    if (!payload.committeeName) return NextResponse.json({ ok: false, error: "committeeName is required" }, { status: 400 });

    const col = await getCollection("committeeJoinRequests");

    // prevent duplicate pending request
    const existing = await col.findOne({ committeeId: payload.committeeId, userId: payload.userId, status: "pending" });
    if (existing) {
      return NextResponse.json({ ok: false, error: "You already have a pending request for this committee" }, { status: 409 });
    }

    const joinRequest: CommitteeJoinRequest = {
      id: nanoid(),
      committeeId: payload.committeeId,
      committeeName: payload.committeeName,
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail,
      message: payload.message,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    await col.insertOne(joinRequest);
    return NextResponse.json({ ok: true, data: joinRequest }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit join request";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
