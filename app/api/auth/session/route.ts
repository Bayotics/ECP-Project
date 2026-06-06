import { NextRequest, NextResponse } from "next/server";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { clearAuthSessionCookie, getSessionUser } from "@/lib/server/session";

export async function GET(request: NextRequest) {
  try {
    await ensureCoreIndexes();
    const user = await getSessionUser(request);
    const response = NextResponse.json({ ok: true, data: user });

    if (!user) {
      clearAuthSessionCookie(response);
    }

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load session";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
