import { NextResponse } from "next/server";
import { clearAuthSessionCookie } from "@/lib/server/session";

export async function POST() {
  const response = NextResponse.json({ ok: true, data: null });
  clearAuthSessionCookie(response);
  return response;
}
