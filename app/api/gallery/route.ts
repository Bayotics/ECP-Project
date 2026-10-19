import { NextRequest, NextResponse } from "next/server";
import { readGallery } from "@/lib/server/gallery";
import { clubError } from "@/lib/server/club-api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try { return NextResponse.json({ok:true,data:await readGallery(request.nextUrl.searchParams)},{headers:{"Cache-Control":"no-store"}}); }
  catch(error) { return clubError(error); }
}
