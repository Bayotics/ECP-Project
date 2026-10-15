import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes, getCollection, serializeDocument } from "@/lib/server/collections";
import { getSessionUser } from "@/lib/server/session";
import { notifyApplicantOfStatus } from "@/lib/server/applicant-notifications";
import type { ApplicationStatus, StatusTimelineEvent } from "@/lib/models/membership";

/* Moving an application on, and telling the applicant.
 *
 * This is its own endpoint rather than another PATCH because a status
 * change is not a field edit: it appends to the timeline the applicant
 * reads, and it sends them an email. The generic PATCH stays for notes and
 * messages, which must not email anybody.
 *
 * Administrators only. The endpoint writes to an applicant's record and
 * sends mail in the club's name, so it is not left open the way a read is.
 */

const STATUSES: ApplicationStatus[] = ["pending", "under-review", "interview", "approved", "rejected"];

/* The line that goes on the applicant's timeline for each move. The email
   says more; this is the one sentence the status page shows. */
const TIMELINE_NOTE: Record<ApplicationStatus, string> = {
  pending: "Application received.",
  "under-review": "Your application is now under review by the membership committee.",
  interview: "You have been invited to meet the membership committee. Check your email for details.",
  approved: "Congratulations. Your membership application has been approved.",
  rejected: "Your application was not successful on this occasion.",
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await ensureCoreIndexes();

    const sessionUser = await getSessionUser(request);
    if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "super-admin")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as {
      status?: ApplicationStatus;
      /** Internal only. Saved on the record, never emailed. */
      notes?: string;
    };

    if (!body.status || !STATUSES.includes(body.status)) {
      return NextResponse.json(
        { ok: false, error: `Status must be one of: ${STATUSES.join(", ")}` },
        { status: 400 },
      );
    }
    const status = body.status;

    const collection = await getCollection("membershipApplications");
    const existing = await collection.findOne({ id });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Membership application not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const entry: StatusTimelineEvent = {
      status,
      date: now,
      /* The applicant reads this, so an internal note is not used as the
         message even when one was supplied. */
      message: TIMELINE_NOTE[status],
    };

    const result = await collection.findOneAndUpdate(
      { id },
      {
        $set: {
          status,
          reviewedAt: now,
          reviewedBy: sessionUser.id,
          ...(body.notes?.trim() ? { reviewNotes: body.notes.trim() } : {}),
        },
        $push: { statusHistory: entry },
      },
      { returnDocument: "after" },
    );

    const application = serializeDocument(result);
    if (!application) {
      return NextResponse.json({ ok: false, error: "Membership application not found" }, { status: 404 });
    }

    /* After the write, and it cannot throw: a mail failure must not make
       the administrator think the review did not save, because it did. */
    const notified = await notifyApplicantOfStatus(application, status);

    return NextResponse.json({
      ok: true,
      data: application,
      applicantNotified: notified.sent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update the application status";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
