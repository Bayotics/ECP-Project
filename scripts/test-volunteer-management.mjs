import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
const nativeRequire=createRequire(import.meta.url);
function load(file,mocks={},cache=new Map()) {
 if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 new Function('exports','require',code)(exports,name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('@/')?load(name.slice(2)+'.ts',mocks,cache):nativeRequire(name));return exports;
}
const validate=load('lib/volunteer-input.ts').validateVolunteerInput;
const profile={firstName:' Jane ',lastName:' Doe ',email:' JANE@example.test ',phone:'2155550100',city:'Philadelphia',zip:'19104',committeeIds:['committee','committee'],interestAreas:['Mentoring','Food drives'],availability:'Sundays',heardAbout:'A friend',opportunityEmails:true};
test('public profile requires separate names and email while the other new fields are optional',()=>{
 const value=validate(profile,true).value;assert.equal(value.name,'Jane Doe');assert.equal(value.firstName,'Jane');assert.equal(value.email,'jane@example.test');assert.deepEqual(value.committeeIds,['committee']);assert.equal(value.opportunityEmails,true);
 for(const field of ['firstName','lastName','email'])assert.ok(validate({...profile,[field]:''},true).error);
 assert.ok(validate({name:'Legacy Full Name',email:'legacy@example.test'},true).error);
 assert.ok(validate({name:'Legacy Full Name',email:'legacy@example.test'}).value);
 assert.ok(validate({firstName:'Jane',lastName:'Doe',email:'jane@example.test'},true).value);
 for(const change of [{committeeIds:['']},{committeeIds:{}},{interestAreas:['x'.repeat(81)]},{city:'x'.repeat(101)},{availability:{}},{opportunityEmails:'yes'}])assert.ok(validate({...profile,...change},true).error);
});
test('public committee data comes from saved records without member IDs, bios or private links',()=>{
 const result=load('lib/public-committees.ts').publicCommittee({id:'committee',name:'Community Service',slug:'community-service',description:'Serving neighbours',type:'standing',month:'November',members:[{name:'Committee Chair',isChairperson:true,userId:'private-member-id',bio:'Private biography',socialLinks:[{platform:'email',url:'mailto:private@example.test'}]}]});
 assert.equal(result.chairName,'Committee Chair');assert.equal(result.name,'Community Service');
 assert.doesNotMatch(JSON.stringify(result),/private-member-id|Private biography|private@example/);
});
const {volunteerCanReceive}=load('lib/volunteer-status.ts');
test('pause blocks opportunities; inactive blocks volunteer mail except requested access and change confirmations',()=>{
 assert.equal(volunteerCanReceive({status:'active',opportunityEmails:true},'opportunity'),true);
 assert.equal(volunteerCanReceive({status:'active',opportunityEmails:false},'opportunity'),false);
 assert.equal(volunteerCanReceive({status:'paused',opportunityEmails:true},'opportunity'),false);
 assert.equal(volunteerCanReceive({status:'paused'},'signup'),true);
 for(const kind of ['signup','welcome','opportunity',undefined])assert.equal(volunteerCanReceive({status:'inactive',opportunityEmails:true},kind),false);
 for(const kind of ['management','access'])assert.equal(volunteerCanReceive({status:'inactive'},kind),true);
});
class VolunteerError extends Error{constructor(message,status){super(message);this.status=status;}}
function managementHarness({valid=true,conflict=false,delivery={failed:0}}={}) {
 const state={person:{id:'person',name:'Jane Doe',firstName:'Jane',lastName:'Doe',email:'jane@example.test',phone:'',interests:'Mentoring',notes:'PRIVATE NOTES',userId:'member-id',status:'active',committeeIds:[],interestAreas:[],opportunityEmails:false,createdAt:'2026-01-01T12:00:00Z',updatedAt:'2026-01-01T12:00:00Z'},changes:[],confirmations:[],staffNotices:0,revoked:0,suppressed:0};
 const people={findOne:async filter=>{
  if(filter.email&&filter.id?.$ne)return conflict?{id:'another-person'}:null;
  if(filter.status&&filter.status!==state.person.status)return null;
  if(filter.resumeDate&&(!state.person.resumeDate||state.person.resumeDate>load('lib/dues.ts').clubDate()))return null;
  return {...state.person};
 },updateOne:async(_,update)=>{Object.assign(state.person,update.$set);}};
 const mocks={
  'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status??200,headers:options.headers})}},
  '@/lib/server/guards':{getRequestSession:async()=>null},
  '@/lib/server/volunteers':{VolunteerError},'@/lib/server/volunteer-error':{VolunteerError},
  '@/lib/server/volunteer-access':{findVolunteerAccess:async()=>valid?{...state.person}:null},
  '@/lib/server/volunteer-transaction':{volunteerTransaction:async work=>work({})},
  '@/lib/server/volunteer-notifications':{queueVolunteerChange:async(person,action,at)=>{state.confirmations.push({person,action,at});return ['confirmation'];},queueVolunteerDeletionNotice:async()=>{state.staffNotices++;return ['staff-notice'];},deliverVolunteerMessages:async()=>delivery},
  '@/lib/server/collections':{ensureCoreIndexes:async()=>{},getCollection:async name=>name==='volunteers'?people:name==='volunteerChanges'?{insertOne:async doc=>state.changes.push(doc)}:name==='committees'?{countDocuments:async filter=>filter.id.$in.includes('invalid')?0:filter.id.$in.length}:name==='volunteerAccessTokens'?{deleteMany:async()=>{state.revoked++;}}:name==='volunteerMessages'?{updateMany:async()=>{state.suppressed++;}}:{updateMany:async(_,update)=>{state.externalEmail=update.$set.email;}}},
 };
 const cache=new Map();return {state,service:load('lib/server/volunteer-management.ts',mocks,cache),route:load('app/api/volunteers/preferences/route.ts',mocks,cache)};
}
const req=body=>({headers:new Headers({Authorization:'Bearer '+'a'.repeat(64)}),json:async()=>body});
test('private management response only exposes agreed profile and lifecycle fields',async()=>{
 const invalid=managementHarness({valid:false});assert.equal((await invalid.route.GET(req({}))).status,403);assert.equal(invalid.state.changes.length,0);
 const h=managementHarness(),response=await h.route.GET(req({}));assert.equal(response.status,200);assert.equal(response.headers['Cache-Control'],'private, no-store');
 assert.equal(response.body.data.notes,undefined);assert.equal(response.body.data.userId,undefined);assert.equal(response.body.data.id,undefined);assert.equal(response.body.data.firstName,'Jane');assert.deepEqual(response.body.data.committeeIds,[]);
});
test('profile changes persist structured fields, timestamps and one confirmation without overwriting membership or notes',async()=>{
 const h=managementHarness();const response=await h.route.PATCH(req({...profile,notes:'INJECTED',source:'other',userId:'someone-else',action:'profile'}));
 assert.equal(response.status,200);assert.equal(h.state.person.city,'Philadelphia');assert.equal(h.state.person.notes,'PRIVATE NOTES');assert.equal(h.state.person.userId,'member-id');assert.equal(h.state.person.source,undefined);
 assert.equal(h.state.changes.length,1);assert.equal(h.state.changes[0].action,'profile-updated');assert.ok(Number.isFinite(Date.parse(h.state.changes[0].at)));assert.equal(h.state.confirmations.length,1);
});
test('email changes reject collisions and retire old private links while preserving member identity',async()=>{
 const conflict=managementHarness({conflict:true});assert.equal((await conflict.route.PATCH(req({...profile,email:'other@example.test'}))).status,409);assert.equal(conflict.state.changes.length,0);
 const h=managementHarness();const result=await h.route.PATCH(req({...profile,email:'new@example.test'}));assert.equal(result.status,200);assert.equal(result.body.data.emailChanged,true);assert.equal(h.state.revoked,1);assert.equal(h.state.externalEmail,'new@example.test');assert.equal(h.state.person.userId,'member-id');assert.equal(h.state.confirmations[0].person.email,'new@example.test');
});
test('pause dates are validated; manual resume is audited and consent is preserved',async()=>{
 const h=managementHarness();assert.equal((await h.route.PATCH(req({action:'pause',resumeDate:'2000-01-01'}))).status,400);assert.equal((await h.route.PATCH(req({action:'pause',resumeDate:'2099-02-30'}))).status,400);
 assert.equal((await h.route.PATCH(req({action:'pause',resumeDate:'2099-12-31'}))).status,200);assert.equal(h.state.person.status,'paused');assert.equal(h.state.person.resumeDate,'2099-12-31');
 await h.route.PATCH(req({action:'resume'}));assert.equal(h.state.person.status,'active');assert.equal(h.state.person.opportunityEmails,false);assert.equal(h.state.changes[1].action,'resumed');
 await h.route.PATCH(req({action:'pause'}));assert.equal(h.state.person.resumeDate,null);
});
test('unsubscribe and resubscribe are idempotent, suppress queued mail and record explicit consent',async()=>{
 const h=managementHarness();await h.route.PATCH(req({action:'unsubscribe'}));assert.equal(h.state.person.status,'inactive');assert.equal(h.state.person.opportunityEmails,false);assert.equal(h.state.suppressed,1);
 const repeated=await h.route.PATCH(req({action:'unsubscribe'}));assert.equal(repeated.body.data.unchanged,true);assert.equal(h.state.confirmations.length,1);
 await h.route.PATCH(req({action:'resubscribe'}));assert.equal(h.state.person.status,'active');assert.equal(h.state.person.opportunityEmails,true);assert.ok(h.state.person.consentUpdatedAt);assert.equal(h.state.confirmations.length,2);
 await h.route.PATCH(req({action:'resubscribe'}));assert.equal(h.state.confirmations.length,2);
});
test('scheduled resume records one change only when the Philadelphia resume date has arrived',async()=>{
 const h=managementHarness();h.state.person.status='paused';h.state.person.resumeDate='2099-12-31';assert.deepEqual(await h.service.resumeVolunteerIfDue('person'),[]);
 h.state.person.resumeDate='2000-01-01';await h.service.resumeVolunteerIfDue('person');assert.equal(h.state.person.status,'active');assert.equal(h.state.changes[0].action,'resumed');
 assert.deepEqual(await h.service.resumeVolunteerIfDue('person'),[]);assert.equal(h.state.confirmations.length,1);
});
test('deletion requests stop volunteer mail, notify admins and preserve both records pending review',async()=>{
 const h=managementHarness();const result=await h.route.PATCH(req({action:'request-deletion'}));assert.equal(result.status,200);assert.equal(h.state.person.status,'inactive');assert.ok(h.state.person.deletionRequestedAt);assert.equal(h.state.person.userId,'member-id');assert.equal(h.state.person.name,'Jane Doe');assert.equal(h.state.staffNotices,1);assert.equal(h.state.changes[0].action,'deletion-requested');
 await h.route.PATCH(req({action:'request-deletion'}));assert.equal(h.state.staffNotices,1);assert.equal(h.state.confirmations.length,1);
});
test('every volunteer email template includes a private management link and escapes untrusted text',()=>{
 const templates=load('lib/server/email-templates.ts'),url='https://example.test/volunteer/preferences#token='+'a'.repeat(64),person={name:'<script>Jane</script>',email:'jane@example.test',phone:'',interests:'',notes:''};
 const emails=[templates.volunteerWelcomeEmail(person.name,url),...['general','confirmed','waitlisted','cancelled'].map(status=>templates.volunteerEmail({volunteer:person,status,reference:'ref',audience:'volunteer',url:'https://example.test/volunteer',preferencesUrl:url})),...['paused','resumed','unsubscribed','resubscribed','profile-updated','deletion-requested'].map(action=>templates.volunteerChangeEmail(person.name,action,'2026-10-19T12:00:00Z',url))];
 for(const email of emails){assert.match(email.html,/Manage my volunteering/);assert.ok(email.html.includes(url));assert.doesNotMatch(email.html,/<script>/);}
});
test('CSV exports quote newlines and commas and neutralize spreadsheet formulas',()=>{
 const {csvCell,csvLine}=load('lib/volunteer-export.ts');
 assert.equal(csvCell('Doe, "Jane"'),'"Doe, ""Jane"""');
 for(const value of ['  =HYPERLINK("bad")','+12155550100','@SUM(A1)','-1+2'])assert.equal(csvCell(value).slice(0,2),'"'+String.fromCharCode(39));
 assert.equal(csvLine(['Line 1\nLine 2','plain']),'"Line 1\nLine 2","plain"\r\n');

});
test('table and export share literal search, committee, event, status and source constraints',async()=>{
 let signupFilter;
 const {volunteerAdminFilter}=load('lib/server/volunteer-admin-filter.ts',{'@/lib/server/volunteer-error':{VolunteerError},'@/lib/server/collections':{getCollection:async()=>({distinct:async(_,filter)=>{signupFilter=filter;return ['person'];}})}});
 const filter=await volunteerAdminFilter(new URLSearchParams({q:'A+.*[x]',committeeId:'committee',eventId:'event',status:'waitlisted',state:'inactive',source:'eventbrite'}));
 assert.equal(filter.committeeIds,'committee');assert.deepEqual(filter.id,{$in:['person']});assert.deepEqual(signupFilter,{eventId:'event',status:'waitlisted'});const regex=new RegExp(filter.$or[0].name.$regex);assert.equal(regex.test('A+.*[x]'),true);assert.equal(regex.test('AAAAotherx'),false);assert.ok(filter.$and.some(row=>row.status==='inactive'));
 await assert.rejects(volunteerAdminFilter(new URLSearchParams({state:'unknown'})),/Invalid/);
});
test('CSV export is admin-only and committee mutation endpoints reject visitors and members',async()=>{
 for(const role of [null,'member']){
  let reads=0;
  const mocks={'next/server':{NextResponse:{json:(body,options={})=>({body,status:options.status??200})}},'@/lib/server/guards':{getRequestSession:async()=>role?{role}:null,requireSession:async()=>({deny:{status:401}})},'@/lib/server/volunteers':{VolunteerError},'@/lib/server/volunteer-error':{VolunteerError},'@/lib/server/collections':{ensureCoreIndexes:async()=>{reads++;},getCollection:async()=>{reads++;}}};
  assert.equal((await load('app/api/admin/volunteers/export/route.ts',mocks).GET({})).status,403);
  assert.equal((await load('app/api/committees/route.ts',mocks).POST({})).status,403);
  const detail=load('app/api/committees/[id]/route.ts',mocks);assert.equal((await detail.PATCH({},{})).status,403);assert.equal((await detail.DELETE({},{})).status,403);assert.equal(reads,0);
 }
});

test('CSV imports retain explicitly mapped multi-part first and last names',()=>{
 const {previewVolunteerCsv}=load('lib/volunteer-csv.ts');
 const row=previewVolunteerCsv('First,Last,Email\nMary Jane,Smith,mary@example.test',{firstName:'First',lastName:'Last',email:'Email'})[0];
 assert.equal(row.value.firstName,'Mary Jane');assert.equal(row.value.lastName,'Smith');assert.equal(row.value.name,'Mary Jane Smith');
});

test('management confirmation reports the volunteer delivery independently of a failed admin notice',async()=>{
 const h=managementHarness({delivery:{failed:1,confirmationEmailSent:true}});
 const response=await h.route.PATCH(req({action:'request-deletion'}));assert.equal(response.status,200);assert.equal(response.body.data.emailSent,true);
});
