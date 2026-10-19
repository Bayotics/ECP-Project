import { resumeDueVolunteers } from "@/lib/server/volunteer-management";
import { scheduleImportedVolunteerEmails } from "@/lib/server/volunteer-imports";
import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/lib/server/collections";
import { clubAdmin,clubError,privateHeaders } from "@/lib/server/club-api";
import { volunteerAdminFilter } from "@/lib/server/volunteer-admin-filter";
import { csvLine } from "@/lib/volunteer-export";
export const maxDuration=60;
export async function GET(request:NextRequest) {
  try {
    await clubAdmin(request);
    scheduleImportedVolunteerEmails(await resumeDueVolunteers());
    const filter=await volunteerAdminFilter(request.nextUrl.searchParams);
    const committees=await (await getCollection("committees")).find({}).project({id:1,name:1}).toArray();
    const cursor=(await getCollection("volunteers")).aggregate([
      {$match:filter},{$sort:{name:1,id:1}},
      {$lookup:{from:"volunteerSignups",localField:"id",foreignField:"volunteerId",as:"signups"}},
      {$lookup:{from:"events",localField:"signups.eventId",foreignField:"id",as:"events",pipeline:[{$project:{_id:0,id:1,title:1}}]}},
      {$lookup:{from:"users",let:{userId:"$userId",email:"$email"},pipeline:[{$match:{$expr:{$or:[{$eq:["$id","$$userId"]},{$eq:[{$toLower:"$email"},"$$email"]}]},role:{$in:["member","admin","super-admin"]}}},{$set:{_directMatch:{$eq:["$id","$$userId"]}}},{$sort:{_directMatch:-1}},{$project:{_id:0,id:1}},{$limit:1}],as:"linkedMembers"}},
    ],{batchSize:100});
    const encoder=new TextEncoder();let header=false;
    const stream=new ReadableStream<Uint8Array>({
      async pull(controller){try{
        if(!header){header=true;controller.enqueue(encoder.encode("\uFEFF"+csvLine(["Volunteer ID","Member ID","First name","Last name","Email","Phone","City","ZIP","Committees","Areas of interest","Other interests","Availability","Heard about us","Status","Email consent","Consent recorded at","Resume date","Sources","Event sign-ups","Created at","Updated at","Deletion requested at"])));return;}
        const person=await cursor.next();if(!person){await cursor.close();controller.close();return;}
        const parts=String(person.name).split(/\s+/);
        controller.enqueue(encoder.encode(csvLine([person.id,person.userId??person.linkedMembers[0]?.id,person.firstName??parts[0],person.lastName??parts.slice(1).join(" "),person.email,person.phone,person.city,person.zip,(person.committeeIds??[]).map((id:string)=>committees.find(row=>row.id===id)?.name??id).join("; "),(person.interestAreas??[]).join("; "),person.interests,person.availability,person.heardAbout,person.status??"active",person.opportunityEmails?"Yes":"No",person.consentUpdatedAt,person.resumeDate,(person.sources??[person.source??"website"]).join("; "),person.signups.map((signup:{eventId:string;status:string})=>`${person.events.find((event:{id:string})=>event.id===signup.eventId)?.title??signup.eventId} (${signup.status})`).join("; "),person.createdAt,person.updatedAt,person.deletionRequestedAt])));
      }catch(error){await cursor.close();controller.error(error);}},
      async cancel(){await cursor.close();},
    });
    return new NextResponse(stream,{headers:{...privateHeaders,"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="volunteers-${new Date().toISOString().slice(0,10)}.csv"`}});
  }catch(error){return clubError(error);}
}
