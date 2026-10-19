import { NextRequest, NextResponse } from "next/server";
import { findVolunteerAccess } from "@/lib/server/volunteer-access";
import { ensureCoreIndexes } from "@/lib/server/collections";
import { clubError, privateHeaders } from "@/lib/server/club-api";
import { VolunteerError } from "@/lib/server/volunteer-error";
import { deliverVolunteerMessages } from "@/lib/server/volunteer-notifications";
import { manageVolunteering, publicVolunteering, resumeVolunteerIfDue } from "@/lib/server/volunteer-management";
export const maxDuration=60;
export async function GET(request:NextRequest) {
  try {
    let person=await findVolunteerAccess(request.headers.get("authorization"));
    if(!person)throw new VolunteerError("This preference link has expired or is invalid. Request a new link below.",403);
    if(person.status==="paused"&&person.resumeDate){const ids=await resumeVolunteerIfDue(person.id);if(ids.length){try{await deliverVolunteerMessages(ids);}catch{/* queued */}person=(await findVolunteerAccess(request.headers.get("authorization")))!;}}
    return NextResponse.json({ok:true,data:publicVolunteering(person)},{headers:privateHeaders});
  }catch(error){return clubError(error);}
}
export async function PATCH(request:NextRequest) {
  try {
    const body=await request.json(); if(!body||typeof body!=="object"||Array.isArray(body))throw new VolunteerError("Send a valid volunteering form.",400);
    await ensureCoreIndexes();
    const result=await manageVolunteering(request.headers.get("authorization"),body);
    let emailSent=true;try{const delivery=await deliverVolunteerMessages(result.messageIds);emailSent=delivery.confirmationEmailSent??delivery.failed===0;}catch{emailSent=false;}
    return NextResponse.json({ok:true,data:{preferences:publicVolunteering(result.person),emailChanged:result.emailChanged,emailSent,unchanged:result.unchanged}},{headers:privateHeaders});
  }catch(error){if((error as {code?:number})?.code===11000)return clubError(new VolunteerError("That email already has a volunteer record. Contact the club to combine your records.",409));return clubError(error);}
}
