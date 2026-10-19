import type { Filter } from "mongodb";
import type { Volunteer,VolunteerSignup } from "@/lib/models/volunteer";
import { volunteerSource } from "@/lib/volunteer-sources";
import { getCollection } from "@/lib/server/collections";
import { VolunteerError } from "@/lib/server/volunteer-error";
export async function volunteerAdminFilter(params:URLSearchParams):Promise<Filter<Volunteer>> {
  const q=(params.get("q")||"").trim(),eventId=params.get("eventId")||"",committeeId=params.get("committeeId")||"",status=params.get("status")||"",state=params.get("state")||"",scope=params.get("scope")||"",source=params.get("source")||"",deletion=params.get("deletion")||"";
  if(q.length>100||eventId.length>100||committeeId.length>100||(status&&!["confirmed","waitlisted","cancelled"].includes(status))||(state&&!["active","paused","inactive"].includes(state))||(scope&&!["general","event"].includes(scope))||(source&&!volunteerSource(source))||(deletion&&deletion!=="requested"))throw new VolunteerError("Invalid volunteer filters.",400);
  const filter:Filter<Volunteer>={},and:Filter<Volunteer>[]=[];
  if(source)and.push({$or:[{sources:volunteerSource(source)!},{source:volunteerSource(source)!},...(source==="website"?[{source:{$exists:false}}]:[])]});
  if(state)and.push(state==="active"?{$or:[{status:"active"},{status:{$exists:false}}]}:{status:state as Volunteer["status"]});
  if(and.length)filter.$and=and;
  if(committeeId)filter.committeeIds=committeeId;
  if(deletion)filter.deletionRequestedAt={$exists:true};
  if(scope==="general")filter.generalRegisteredAt={$exists:true};
  if(q){const escaped=q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");filter.$or=["name","firstName","lastName","email","phone","city","zip"].map(key=>({[key]:{$regex:escaped,$options:"i"}}));}
  if(eventId||status||scope==="event"){
    const signupFilter:Filter<VolunteerSignup>={};if(eventId)signupFilter.eventId=eventId;if(status)signupFilter.status=status as VolunteerSignup["status"];
    filter.id={$in:await (await getCollection("volunteerSignups")).distinct("volunteerId",signupFilter)};
  }
  return filter;
}
