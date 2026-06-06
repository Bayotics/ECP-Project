import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest) {
  return NextResponse.json({ ok: true, data: { success: true } });
}
