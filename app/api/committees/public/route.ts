import { NextResponse } from "next/server";
import { getCollection } from "@/lib/server/collections";
import { publicCommittee } from "@/lib/public-committees";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const rows = await (await getCollection("committees")).find({status: "active"}).sort({name: 1}).toArray();
    return NextResponse.json({ok: true, data: rows.map(publicCommittee)}, {headers: {"Cache-Control": "no-store"}});
  } catch { return NextResponse.json({ok: false, error: "Committee information could not be loaded. Please try again."}, {status: 503}); }
}
