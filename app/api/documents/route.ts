import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import type { Filter } from "mongodb";
import type { OrgDocument } from "@/lib/models";
import { getRequestSession } from "@/lib/server/guards";
import { getCollection, serializeDocuments } from "@/lib/server/collections";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { documentAdmin, documentMetadata, documentPayload } from "@/lib/server/document-access";
export async function GET(request:NextRequest){
  try{
    const session=await getRequestSession(request),params=request.nextUrl.searchParams;
    const access:Filter<OrgDocument>=documentAdmin(session)?{}:{access:session?.role==="member"?{$in:["public","members-only"]}:"public"};
    const filter:Filter<OrgDocument>={$and:[access,...(params.get("access")?[{access:params.get("access") as OrgDocument["access"]}]:[]),...(params.get("category")?[{category:params.get("category") as OrgDocument["category"]}]:[])]};
    const documents=serializeDocuments(await(await getCollection("documents")).find(filter).sort({uploadedAt:-1}).toArray());
    return NextResponse.json({ok:true,data:documents.map(document=>documentMetadata(document,session))},{headers:privateHeaders});
  }catch(error){return clubError(error);}
}
export async function POST(request:NextRequest){
  try{
    const session=await clubAdmin(request),payload=documentPayload(await request.json(),true),at=new Date().toISOString();
    const document={...payload,id:nanoid(),uploadedBy:session.sub,uploadedAt:at,updatedAt:at,simulatedSize:payload.simulatedSize??"N/A"} as OrgDocument;
    await(await getCollection("documents")).insertOne(document);
    return NextResponse.json({ok:true,data:document},{status:201,headers:privateHeaders});
  }catch(error){return clubError(error);}
}
