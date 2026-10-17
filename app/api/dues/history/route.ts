import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { getMemberDues, isDuesMember } from "@/lib/server/dues";
import { buildDuesHistoryPdf } from "@/lib/server/dues-pdf";

export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    if (!isDuesMember(user)) return NextResponse.json({ ok: false, error: "Membership required" }, { status: 403 });
    const { records, summary } = await getMemberDues(user);
    const bytes = await buildDuesHistoryPdf(user, records, summary);
    return new NextResponse(Buffer.from(bytes), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="ecp-dues-payment-history.pdf"',
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    console.error("[dues] PDF export failed", error);
    return NextResponse.json({ ok: false, error: "Unable to export payment history" }, { status: 500 });
  }
}
