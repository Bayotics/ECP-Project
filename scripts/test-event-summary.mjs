import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire=createRequire(import.meta.url);
function load(file,mocks={}) {
  const exports={};const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('exports','require',output)(exports,name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('@/')?load(name.slice(2)+'.ts',mocks):nativeRequire(name));return exports;
}
const {calculateEventSummary,formatSummaryEventDate}=load('lib/event-summary.ts');
const now=new Date('2026-10-19T16:00:00Z');
const event=(id,patch={})=>({id,slug:id,title:id,date:'2026-11-21',type:'volunteer',status:'published',isPublic:true,membersOnly:false,registrationRequired:true,registrationMode:'form',...patch});
const signup=(eventId,email,patch={})=>({eventId,email,status:'confirmed',registeredAt:'2026-06-01T12:00:00Z',guestCount:0,...patch});

test('upcoming count and next five events share the same published public 90-day window',()=>{
  const events=[event('thanksgiving',{date:'2026-11-21'}),event('winter-coats',{date:'2026-12-01'}),event('year-end-party',{date:'2026-12-28',type:'meetup'}),event('four',{date:'2026-12-29'}),event('five',{date:'2027-01-02'}),event('six',{date:'2027-01-10'}),event('draft',{status:'draft'}),event('cancelled',{status:'cancelled'}),event('completed',{status:'completed'}),event('private',{isPublic:false}),event('member-only',{membersOnly:true}),event('past',{date:'2026-10-18'}),event('outside',{date:'2027-01-17'}),event('invalid',{date:'bad'})];
  const result=calculateEventSummary(events,[],7,now);
  assert.equal(result.upcomingEventCount,6);assert.equal(result.activeCommittees,7);
  assert.deepEqual(result.upcomingEvents.map(row=>row.id),['thanksgiving','winter-coats','year-end-party','four','five']);
  assert.equal(result.windowStart,'2026-10-19');assert.equal(result.windowEnd,'2027-01-17');
});
test('today respects scheduled club time and the 90-day boundary across daylight-saving changes',()=>{
  const result=calculateEventSummary([event('already-started',{date:'2026-10-19',time:'09:00'}),event('later-today',{date:'2026-10-19',time:'18:00'}),event('date-only',{date:'2026-10-19'}),event('last-minute',{date:'2027-01-17T04:59:00Z'}),event('past-window',{date:'2027-01-17T05:00:00Z'})],[],0,now);
  assert.deepEqual(result.upcomingEvents.map(row=>row.id),['later-today','date-only','last-minute']);
});
test('open opportunities exclude full events, closed deadlines, unpublished events and absent registration methods',()=>{
  const events=[event('open-form'),event('open-link',{registrationMode:'link',registrationUrl:'https://example.test'}),event('full',{maxAttendees:3}),event('closed',{registrationDeadline:'2026-10-18'}),event('today-deadline',{registrationDeadline:'2026-10-19'}),event('no-form',{registrationMode:undefined}),event('no-registration',{registrationRequired:false}),event('cancelled',{status:'cancelled'}),event('past',{date:'2026-10-01'}),event('private',{isPublic:false}),event('future-open',{date:'2027-05-01'}),event('not-volunteer',{type:'meetup'})];
  const registrations=[signup('full','person@example.test',{guestCount:2})];
  assert.equal(calculateEventSummary(events,registrations,0,now).openVolunteerOpportunities,4);
});
test('yearly volunteers count people once, including guest/member duplicates and changed emails',()=>{
  const events=[event('a'),event('b',{status:'completed'}),event('cancelled',{status:'cancelled'}),event('not-volunteer',{type:'meetup'})];
  const registrations=[signup('a','GUEST@example.test'),signup('b',' guest@example.test ',{userId:'member'}),signup('a','new-email@example.test',{userId:'member'}),signup('a','second@example.test'),signup('a','old@example.test',{registeredAt:'2026-01-01T04:59:00Z'}),signup('a','first-minute@example.test',{registeredAt:'2026-01-01T05:00:00Z'}),signup('a','cancelled@example.test',{status:'cancelled'}),signup('a','waitlisted@example.test',{status:'waitlisted'}),signup('a','future@example.test',{registeredAt:'2026-12-01T00:00:00Z'}),signup('cancelled','invalid-event@example.test'),signup('not-volunteer','other@example.test')];
  assert.equal(calculateEventSummary(events,registrations,0,now).volunteersSignedUpThisYear,3);
});
test('empty database results are real zeroes, with no fallback events',()=>{
  const result=calculateEventSummary([],[],0,now);
  assert.equal(result.upcomingEventCount,0);assert.equal(result.openVolunteerOpportunities,0);assert.equal(result.activeCommittees,0);assert.equal(result.volunteersSignedUpThisYear,0);assert.deepEqual(result.upcomingEvents,[]);
});
test('year rollover follows Philadelphia rather than UTC or the browser timezone',()=>{
  const events=[event('v',{date:'2027-02-01'})];
  const records=[signup('v','prior@example.test',{registeredAt:'2026-12-31T23:59:00Z'}),signup('v','new@example.test',{registeredAt:'2027-01-01T05:00:00Z'})];
  assert.equal(calculateEventSummary(events,records,0,new Date('2027-01-01T01:00:00Z')).calendarYear,2026);
  const next=calculateEventSummary(events,records,0,new Date('2027-01-01T06:00:00Z'));
  assert.equal(next.calendarYear,2027);assert.equal(next.volunteersSignedUpThisYear,1);
});
test('date labels preserve date-only records and identify provisional dates',()=>{
  assert.equal(formatSummaryEventDate(event('day',{date:'2026-11-21'})),'Nov 21, 2026');
  assert.equal(formatSummaryEventDate(event('legacy',{date:'2026-11-21T00:00:00.000Z'})),'Nov 21, 2026');
  assert.equal(formatSummaryEventDate(event('month',{date:'2026-11-21',dayIsProvisional:true})),'Nov 2026 · day to be confirmed');
});
test('UTC-midnight calendar seeds use their separately stored Philadelphia start time',()=>{
  const result=calculateEventSummary([event('past',{date:'2026-10-19T00:00:00.000Z',time:'09:00'}),event('later',{date:'2026-10-19T00:00:00.000Z',time:'18:00'}),event('invalid-calendar',{date:'2026-02-31'})],[],0,now);
  assert.equal(result.upcomingEventCount,1);assert.equal(result.upcomingEvents[0].id,'later');
});
test('server reads database counts and projects only aggregate public output',async()=>{
  const queries=[];
  const {getEventSummary}=load('lib/server/event-summary.ts',{'@/lib/server/collections':{getCollection:async name=>({
    countDocuments:async filter=>{queries.push({name,filter});return 12;},
    find:filter=>{queries.push({name,filter});return{project:projection=>{queries.push({name,projection});return{toArray:async()=>name==='events'?[event('a')]:name==='volunteers'?[{id:'person',generalRegisteredAt:'2026-06-01T12:00:00Z'}]:[{eventId:'a',volunteerId:'person',status:'confirmed',registeredAt:'2026-06-01T12:00:00Z'}]};}};},
  })}});
  const result=await getEventSummary(now);
  assert.equal(result.activeCommittees,12);assert.equal(result.volunteersSignedUpThisYear,1);
  assert.ok(queries.some(query=>query.name==='committees'&&query.filter.status==='active'));
  assert.ok(!JSON.stringify(result).includes('private@example.test'));
});
test('endpoint does not turn database errors into invented zeroes',async()=>{
  const route=load('app/api/events/summary/route.ts',{'next/server':{NextResponse:{json:(body,options)=>({body,...options})}},'@/lib/server/event-summary':{getEventSummary:async()=>{throw Error('Mock outage');}}});
  const result=await route.GET();assert.equal(result.status,503);assert.equal(result.body.data,undefined);assert.match(result.body.error,/could not be loaded/);
});
