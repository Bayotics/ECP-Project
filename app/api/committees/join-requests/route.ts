import { NextRequest, NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/guards";
import { getCollection, serializeDocuments } from "@/lib/server/collections";
import { privateHeaders } from "@/lib/server/club-api";
export async function GET(request: NextRequest) {
  const viewer = await getRequestSession(request);
  if (!viewer) return NextResponse.json({ok:false,error:"Authentication required"},{status:401});
  const admin = ["admin","super-admin"].includes(viewer.role);
  const filter: Record<string,unknown> = admin ? {} : {userId:viewer.sub};
  for (const key of ["committeeId","status"]) {const value=request.nextUrl.searchParams.get(key);if(value)filter[key]=value;}
  if(admin && request.nextUrl.searchParams.get("userId"))filter.userId=request.nextUrl.searchParams.get("userId");
  try { return NextResponse.json({ok:true,data:serializeDocuments(await (await getCollection("committeeJoinRequests")).find(filter).sort({requestedAt:-1}).toArray())},{headers:privateHeaders}); }
  catch {return NextResponse.json({ok:false,error:"Could not load committee requests."},{status:503,headers:privateHeaders});}
}
export async function POST(request: NextRequest) {
  if (!await getRequestSession(request)) return NextResponse.json({ok:false,error:"Authentication required"},{status:401});
  return NextResponse.json({ok:false,error:"Committee approval requests have been replaced. Use Join committee on the committee page."},{status:410,headers:privateHeaders});
}
