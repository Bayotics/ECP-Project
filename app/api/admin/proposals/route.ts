import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import { PROPOSAL_STATUSES, type EventProposal } from "@/lib/models/proposal";
import { getCollection, serializeDocuments, ensureCoreIndexes } from "@/lib/server/collections";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteers";
export async function GET(request: NextRequest) {
  try {
    await clubAdmin(request); await ensureCoreIndexes();
    const status = request.nextUrl.searchParams.get("status") || "";
    const page = Number(request.nextUrl.searchParams.get("page") || 0);
    if ((status && !PROPOSAL_STATUSES.includes(status as typeof PROPOSAL_STATUSES[number])) || !Number.isSafeInteger(page) || page < 0 || page > 100000) throw new VolunteerError("Invalid proposal filters.", 400);
    const filter: Filter<EventProposal> = status ? { status: status as EventProposal["status"] } : {};
    const proposals = await getCollection("proposals");
    const [rows, total] = await Promise.all([proposals.find(filter).sort({ createdAt: -1, id: 1 }).skip(page * 25).limit(25).toArray(), proposals.countDocuments(filter)]);
    const issues = await (await getCollection("proposalMessages")).find({ proposalId: { $in: rows.map(row => row.id) }, status: { $ne: "sent" } }).project({ proposalId: 1 }).toArray();
    return NextResponse.json({ ok: true, data: { proposals: serializeDocuments(rows).map(({ contentHash: _hash, submissionId: _submission, ...row }) => { void _hash; void _submission; return { ...row, emailIssues: issues.filter(issue => issue.proposalId === row.id).length }; }), total, page, pageSize: 25 } }, { headers: privateHeaders });
  } catch (error) { return clubError(error); }
}
