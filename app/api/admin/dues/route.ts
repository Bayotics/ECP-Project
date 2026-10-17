import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { getCollection, serializeDocuments } from "@/lib/server/collections";
import { getMemberDues } from "@/lib/server/dues";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin" && user.role !== "super-admin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const page = Math.max(0, Math.floor(Number(request.nextUrl.searchParams.get("page")) || 0));
    const collection = await getCollection("users");
    const filter = { role: { $in: ["member", "admin", "super-admin"] as ("member" | "admin" | "super-admin")[] } };
    const [members, total] = await Promise.all([collection.find(filter).sort({ displayName: 1, id: 1 }).skip(page * 25).limit(25).toArray(), collection.countDocuments(filter)]);
    const data = await Promise.all(members.map(async member => ({
      id: member.id, name: member.displayName, email: member.email, membershipId: member.membershipId,
      summary: (await getMemberDues(member)).summary,
    })));
    const failures = serializeDocuments(await (await getCollection("duesReminders")).find({ status: "failed" }).sort({ month: -1 }).limit(20).toArray());
    return NextResponse.json({ ok: true, data, failures, page, total }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[dues] Admin read failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load member dues" }, { status: 500 });
  }
}
