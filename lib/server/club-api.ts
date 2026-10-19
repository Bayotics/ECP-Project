import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/guards";
import { VolunteerError } from "@/lib/server/volunteers";
export async function clubAdmin(request: NextRequest) {
  const session = await getRequestSession(request);
  if (!session || !["admin", "super-admin"].includes(session.role)) throw new VolunteerError("Administrator access required.", 403);
  const origin = request.headers?.get("origin");
  if (!["GET", "HEAD"].includes(request.method) && origin && origin !== request.nextUrl.origin) throw new VolunteerError("This request must come from the club website.", 403);
  return session;
}
export function clubError(error: unknown) {
  if (error instanceof VolunteerError) return NextResponse.json({ ok: false, error: error.message }, { status: error.status, headers: privateHeaders });
  if (error instanceof SyntaxError) return NextResponse.json({ ok: false, error: "Send valid JSON." }, { status: 400, headers: privateHeaders });
  console.error("[club] Request failed", error);
  return NextResponse.json({ ok: false, error: "The request could not be completed. Please try again." }, { status: 503, headers: privateHeaders });
}
export const privateHeaders = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
