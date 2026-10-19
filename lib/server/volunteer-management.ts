import { nanoid } from "nanoid";
import type { ClientSession } from "mongodb";
import type { Volunteer, VolunteerChange } from "@/lib/models/volunteer";
import { getCollection } from "@/lib/server/collections";
import { findVolunteerAccess } from "@/lib/server/volunteer-access";
import { volunteerTransaction } from "@/lib/server/volunteer-transaction";
import { queueVolunteerChange, queueVolunteerDeletionNotice } from "@/lib/server/volunteer-notifications";
import { validateVolunteerInput } from "@/lib/volunteer-input";
import { validateVolunteerCommittees } from "@/lib/server/volunteer-profile";
import { VolunteerError } from "@/lib/server/volunteer-error";
import { clubDate } from "@/lib/dues";

export function publicVolunteering(person: Volunteer) {
  const parts=person.name.split(/\s+/);
  return {name:person.name,firstName:person.firstName??parts[0]??"",lastName:person.lastName??parts.slice(1).join(" "),email:person.email,phone:person.phone,city:person.city??"",zip:person.zip??"",interests:person.interests,committeeIds:person.committeeIds??[],interestAreas:person.interestAreas??[],availability:person.availability??"",heardAbout:person.heardAbout??"",opportunityEmails:person.opportunityEmails===true,status:person.status??"active",resumeDate:person.resumeDate??null,deletionRequestedAt:person.deletionRequestedAt??null,updatedAt:person.updatedAt};
}
async function recordChange(person: Volunteer, action: VolunteerChange["action"], fields: string[], previous: Volunteer, session: ClientSession) {
  const change:VolunteerChange={id:nanoid(),volunteerId:person.id,action,at:person.updatedAt,changedFields:fields,emailConsent:person.opportunityEmails===true,fromStatus:previous.status??"active",toStatus:person.status??"active",...(action==="paused"?{resumeDate:person.resumeDate??null}:{})};
  await (await getCollection("volunteerChanges")).insertOne(change,{session});
  return queueVolunteerChange(person,action,change.at,session);
}
export async function resumeVolunteerIfDue(id: string) {
  return volunteerTransaction(async session=>{
    const people=await getCollection("volunteers");
    const person=await people.findOne({id,status:"paused",resumeDate:{$type:"string",$lte:clubDate()}},{session});
    if(!person)return [] as string[];
    const updated={...person,status:"active" as const,resumeDate:null,updatedAt:new Date().toISOString()};
    await people.updateOne({id,status:"paused"},{$set:{status:"active",resumeDate:null,updatedAt:updated.updatedAt}},{session});
    return recordChange(updated,"resumed",["status","resumeDate"],person,session);
  });
}
export async function resumeDueVolunteers() {
  const people=await (await getCollection("volunteers")).find({status:"paused",resumeDate:{$type:"string",$lte:clubDate()}}).project({id:1}).limit(100).toArray();
  const ids:string[]=[]; for(const person of people)ids.push(...await resumeVolunteerIfDue(person.id)); return ids;
}
export async function manageVolunteering(authorization: string|null, body: Record<string,unknown>) {
  return volunteerTransaction(async session=>{
    const person=await findVolunteerAccess(authorization,session);
    if(!person)throw new VolunteerError("This private link has expired or is invalid. Request a fresh link.",403);
    const action=body.action??"profile";
    const people=await getCollection("volunteers");
    let patch:Partial<Volunteer>={},kind:VolunteerChange["action"]="profile-updated";
    if(action==="profile") {
      const result=validateVolunteerInput({...body,notes:"",eventId:""},true);
      if("error"in result)throw new VolunteerError(result.error,400);
      if(typeof body.opportunityEmails!=="boolean")throw new VolunteerError("Choose your email consent preference.",400);
      const {name,email,phone,interests,firstName,lastName,city,zip,committeeIds,interestAreas,availability,heardAbout}=result.value;
      if(email!==person.email&&await people.findOne({email,id:{$ne:person.id}},{session}))throw new VolunteerError("That email already has a volunteer record. Contact the club to combine your records.",409);
      await validateVolunteerCommittees(committeeIds,session,person.committeeIds);
      patch={name,email,phone,interests,firstName,lastName,city:city??"",zip:zip??"",committeeIds:committeeIds??person.committeeIds??[],interestAreas:interestAreas??[],availability:availability??"",heardAbout:heardAbout??"",opportunityEmails:body.opportunityEmails};
      if(patch.opportunityEmails!==person.opportunityEmails)patch.consentUpdatedAt=new Date().toISOString();
    } else if(action==="pause") {
      let resumeDate:string|null=null;
      if(body.resumeDate!==undefined&&body.resumeDate!==null&&body.resumeDate!=="") {
        if(typeof body.resumeDate!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(body.resumeDate)||!Number.isFinite(Date.parse(body.resumeDate))||new Date(body.resumeDate).toISOString().slice(0,10)!==body.resumeDate||body.resumeDate<=clubDate())throw new VolunteerError("Choose a valid future resume date, or leave it blank to pause until you resume.",400);
        resumeDate=body.resumeDate;
      }
      if(person.status==="inactive")throw new VolunteerError("Resubscribe before pausing opportunities.",409);
      patch={status:"paused",resumeDate}; kind="paused";
    } else if(action==="resume"||action==="resubscribe") {
      patch={status:"active",resumeDate:null,...(action==="resubscribe"?{opportunityEmails:true}:{})};kind=action==="resubscribe"?"resubscribed":"resumed";
    } else if(action==="unsubscribe") {
      patch={status:"inactive",resumeDate:null,opportunityEmails:false};kind="unsubscribed";
    } else if(action==="request-deletion") {
      if(person.deletionRequestedAt)return {person,emailChanged:false,messageIds:[] as string[],unchanged:true};
      patch={deletionRequestedAt:new Date().toISOString(),status:"inactive",resumeDate:null,opportunityEmails:false};kind="deletion-requested";
    } else throw new VolunteerError("Choose a valid volunteering action.",400);
    if(patch.opportunityEmails !== undefined && patch.opportunityEmails !== person.opportunityEmails)patch.consentUpdatedAt=new Date().toISOString();
    const changed=Object.keys(patch).filter(key=>JSON.stringify(person[key as keyof Volunteer]??null)!==JSON.stringify(patch[key as keyof Volunteer]??null));
    if(!changed.length)return {person,emailChanged:false,messageIds:[] as string[],unchanged:true};
    const updated={...person,...patch,updatedAt:new Date().toISOString()};
    await people.updateOne({id:person.id},{$set:{...patch,updatedAt:updated.updatedAt}},{session});
    const emailChanged=updated.email!==person.email;
    if(emailChanged) {
      await (await getCollection("volunteerExternalRegistrations")).updateMany({volunteerId:person.id},{$set:{email:updated.email}},{session});
      await (await getCollection("volunteerAccessTokens")).deleteMany({volunteerId:person.id},{session});
    }
    // Suppress already queued mail immediately. Management acknowledgements and
    // private links explicitly requested by the person remain deliverable.
    if(updated.status==="inactive")await (await getCollection("volunteerMessages")).updateMany({volunteerId:person.id,audience:"volunteer",kind:{$nin:["management","access"]},status:{$in:["pending","failed"]}},{$set:{status:"superseded"}},{session});
    const messageIds=await recordChange(updated,kind,changed,person,session);
    if(kind==="deletion-requested")messageIds.push(...await queueVolunteerDeletionNotice(updated,session));
    return {person:updated,emailChanged,messageIds,unchanged:false};
  });
}
