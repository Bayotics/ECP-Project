import { NextRequest, NextResponse } from "next/server";
import { clubAdmin,clubError,privateHeaders } from "@/lib/server/club-api";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { newsletterBody } from "@/lib/server/newsletter-api";
import { updateNewsletterSubscriber,deleteNewsletterSubscriber,deliverNewsletterMessages,newsletterAdminRow } from "@/lib/server/newsletter";
export async function PATCH(request:NextRequest,context:{params:Promise<{id:string}>}) {
  try {
    await clubAdmin(request);const body=newsletterBody(await request.json());await ensureCoreIndexes();
    const {id}=await context.params,result=await updateNewsletterSubscriber(id,body);
    if(result.messageId)try{await deliverNewsletterMessages([result.messageId]);}catch{/* durable retry */}
    return NextResponse.json({ok:true,data:await newsletterAdminRow(result.person)},{headers:privateHeaders});
  }catch(error){return clubError(error);}
}
export async function DELETE(request:NextRequest,context:{params:Promise<{id:string}>}) {
  try{await clubAdmin(request);await ensureCoreIndexes();const {id}=await context.params;await deleteNewsletterSubscriber(id);return NextResponse.json({ok:true},{headers:privateHeaders});}
  catch(error){return clubError(error);}
}
