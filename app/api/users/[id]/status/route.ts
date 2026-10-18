import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { getCollection } from "@/lib/server/collections";
import { notifyAccountStatus } from "@/lib/server/account-status";
import { accountIsRestricted, publicUser, type AccountStatusChange, type UserStatus } from "@/lib/models/user";

const STATUSES: UserStatus[] = ["active", "inactive", "pending", "suspended", "revoked"];
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getSessionUser(request);
    if (!actor) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (actor.role !== "admin" && actor.role !== "super-admin") return NextResponse.json({ ok: false, error: "Only administrators can change account access" }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    if (!body || !STATUSES.includes(body.status) || Object.keys(body).some(key => !["status", "reason"].includes(key)) || (body.reason !== undefined && (typeof body.reason !== "string" || body.reason.length > 500))) return NextResponse.json({ ok: false, error: "Choose a valid status and a reason of up to 500 characters" }, { status: 400 });
    const users = await getCollection("users");
    const target = await users.findOne({ id });
    if (!target) return NextResponse.json({ ok: false, error: "Member not found" }, { status: 404 });
    if (target.id === actor.id || target.role === "admin" || target.role === "super-admin") return NextResponse.json({ ok: false, error: "These membership controls cannot change administrator access" }, { status: 403 });
    if (accountIsRestricted(target.status) && !["active", "suspended", "revoked"].includes(body.status)) return NextResponse.json({ ok: false, error: "Choose reinstate to restore a restricted member" }, { status: 400 });
    if (target.status === body.status) return NextResponse.json({ ok: true, data: publicUser(target), unchanged: true });
    const change: AccountStatusChange = {
      id: nanoid(), fromStatus: target.status, toStatus: body.status, reason: body.reason?.trim() || undefined,
      changedAt: new Date().toISOString(), changedBy: actor.id, notificationStatus: "pending",
    };
    const updated = await users.findOneAndUpdate({ id, role: target.role, status: target.status, sessionVersion: target.sessionVersion ?? { $exists: false } }, {
      $set: { status: body.status }, $inc: { sessionVersion: 1 }, $push: { accountStatusHistory: change },
    }, { returnDocument: "after" });
    if (!updated) return NextResponse.json({ ok: false, error: "The account changed. Refresh the member and try again." }, { status: 409 });
    let notified = false;
    try { notified = await notifyAccountStatus(updated.id, change.id); }
    catch (error) { console.error("[account-status] Notification queued for retry", error); }
    return NextResponse.json({ ok: true, data: publicUser(updated), notified, ...(!notified ? { warning: "Account access was updated. The notification is queued for retry because email delivery has not been confirmed." } : {}) });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    console.error("[account-status] Update failed", error);
    return NextResponse.json({ ok: false, error: "Unable to change account access" }, { status: 500 });
  }
}
