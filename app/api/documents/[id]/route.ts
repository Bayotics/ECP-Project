import { NextRequest, NextResponse } from "next/server";
import { getCollection, serializeDocument } from "@/lib/server/collections";
import { getRequestSession } from "@/lib/server/guards";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { documentVisible, documentMetadata, documentPayload } from "@/lib/server/document-access";
import { VolunteerError } from "@/lib/server/volunteer-error";
type Context={params:Promise<{id:string}>};
export async function GET(request:NextRequest,context:Context){
  try{
    const {id}=await context.params,session=await getRequestSession(request),document=serializeDocument(await(await getCollection("documents")).findOne({id}));
    if(!document||!documentVisible(document,session))throw new VolunteerError("Document not found or unavailable for public access.",404);
    return NextResponse.json({ok:true,data:documentMetadata(document,session)},{headers:privateHeaders});
  }catch(error){return clubError(error);}
}
export async function PATCH(request:NextRequest,context:Context){
  try{
    await clubAdmin(request);const {id}=await context.params,payload=documentPayload(await request.json());
    const document=serializeDocument(await(await getCollection("documents")).findOneAndUpdate({id},{$set:{...payload,updatedAt:new Date().toISOString()}},{returnDocument:"after"}));
    if(!document)throw new VolunteerError("Document not found.",404);
    return NextResponse.json({ok:true,data:document},{headers:privateHeaders});
  }catch(error){return clubError(error);}
}
export async function DELETE(request:NextRequest,context:Context){
  try{
    await clubAdmin(request);const {id}=await context.params,result=await(await getCollection("documents")).deleteOne({id});
    if(!result.deletedCount)throw new VolunteerError("Document not found.",404);
    return NextResponse.json({ok:true},{headers:privateHeaders});
  }catch(error){return clubError(error);}
}
