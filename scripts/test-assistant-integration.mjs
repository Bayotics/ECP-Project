// Real MongoDB in a disposable DB. OpenAI and document-host fetches are always mocked.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createGalleryLoader} from './gallery-loader.mjs';
if(process.env.RUN_ASSISTANT_DB_TEST!=='1')throw Error('Set RUN_ASSISTANT_DB_TEST=1 to run isolated assistant tests.');
process.loadEnvFile('.env.local');
const databaseName=`ecp_assistant_test_${Date.now().toString(36)}_${randomUUID().slice(0,8)}`;
process.env.MONGODB_DB=databaseName;process.env.OPENAI_API_KEY='test-key-never-sent-to-network';
process.env.AI_CHAT_PER_MINUTE='1000';process.env.AI_CHAT_PER_DAY='1000';process.env.AI_CHAT_GLOBAL_PER_DAY='1000';
const load=createGalleryLoader(),{getMongoClient}=load('lib/server/mongodb.ts'),client=await getMongoClient(),db=client.db(databaseName),{NextRequest}=createRequire(import.meta.url)('next/server');
const nativeFetch=globalThis.fetch;let modelStatus=200,modelState='completed',reply={answer:'Use the public constitution download below.',sourceIds:['constitution-pdf']},calls=0,lastBody;
globalThis.fetch=async(url,options)=>{
 if(url==='https://api.openai.com/v1/responses'){
  calls++;lastBody=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer test-key-never-sent-to-network');assert.equal(lastBody.model,'gpt-5.4-mini');assert.equal(lastBody.store,false);assert.equal(lastBody.reasoning.effort,'none');assert.equal(lastBody.text.format.strict,true);assert.equal(lastBody.max_output_tokens,1000);assert.equal(lastBody.tools,undefined);assert.ok(!options.body.includes('test-key-never-sent-to-network'));
  return Response.json(modelStatus===200?{status:modelState,output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(reply)}]}]}:{error:{message:'Secret provider internals must not reach the browser'}},{status:modelStatus});
 }
 assert.ok(String(url).startsWith('https://res.cloudinary.com/'));assert.equal(options.redirect,'error');return new Response('%PDF-1.7 test',{headers:{'content-type':'application/pdf'}});
};
assert.match(databaseName,/^ecp_assistant_test_[a-z0-9]+_[a-f0-9]{8}$/);
try{
 const {createSessionToken}=load('lib/server/session.ts');const admin={id:'admin',email:'admin@example.test',role:'admin',status:'active',emailVerified:true},member={id:'member',email:'member@example.test',role:'member',status:'active',emailVerified:true};await db.collection('users').insertMany([admin,member]);
 const adminHeaders={cookie:`ecp_auth_token=${createSessionToken(admin)}`},memberHeaders={cookie:`ecp_auth_token=${createSessionToken(member)}`};
 const doc=(id,access,url='https://res.cloudinary.com/test/raw/upload/ecp/documents/'+id+'.pdf')=>({id,label:id,name:id+'.pdf',access,url,category:'policy',fileType:'pdf',simulatedSize:'1 KB',uploadedBy:'private-uploader',publicId:'private-host-id',uploadedAt:'2026-10-01',updatedAt:'2026-10-01'});
 await db.collection('documents').insertMany([doc('public-policy','public'),doc('MEMBER-DOCUMENT-SECRET','members-only'),doc('ADMIN-DOCUMENT-SECRET','admin-only'),{...doc('unattached','public'),url:undefined},doc('unsafe-link','public','http://127.0.0.1/secret')]);
 const event=(id,extra={})=>({id,title:id,slug:id,date:'2030-01-01',description:'Public event description',location:'Philadelphia',status:'published',isPublic:true,membersOnly:false,volunteerLeadIds:['PRIVATE-LEAD-ID'],meetingUrl:'PRIVATE-MEETING-URL',...extra});
 await db.collection('events').insertMany([event('public-event'),event('PRIVATE-EVENT-SECRET',{membersOnly:true}),event('DRAFT-EVENT-SECRET',{status:'draft'}),event('INTERNAL-EVENT-SECRET',{isPublic:false})]);
 await db.collection('news').insertMany([{id:'public-news',slug:'public-news',title:'Public news',content:'Published details',status:'published',authorId:'PRIVATE-AUTHOR-ID'},{id:'draft-news',slug:'draft-news',title:'DRAFT-NEWS-SECRET',status:'draft'}]);
 await db.collection('committees').insertMany([{id:'community',name:'Community service',description:'Serving neighbors',status:'active',members:[{email:'PRIVATE-COMMITTEE-EMAIL'}]},{id:'inactive',name:'INACTIVE-COMMITTEE-SECRET',status:'inactive'}]);
 const route=load('app/api/assistant/route.ts'),knowledge=load('lib/server/assistant-knowledge.ts'),limits=load('lib/server/assistant-limits.ts');
 function request(path,method='GET',body,headers={}){return new NextRequest('https://club.example'+path,{method,headers:{origin:'https://club.example','x-forwarded-for':'192.0.2.10',...(body!==undefined?{'content-type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
 const ask=(body={messages:[{role:'user',content:'Download the constitution'}]},headers={})=>route.POST(request('/api/assistant','POST',body,headers));
 const status=(await(await route.GET()).json()).data;assert.equal(status.available,true);assert.ok(status.documents.some(d=>d.url==='/documents/ecp-constitution.pdf'));assert.ok(status.documents.some(d=>d.url==='/api/documents/public-policy/download'));assert.ok(!JSON.stringify(status).includes('SECRET'));assert.ok(!JSON.stringify(status).includes('cloudinary'));assert.ok(!JSON.stringify(status).includes('unsafe-link'));assert.ok(!JSON.stringify(status).includes('unattached'));
 for(const body of [null,{},[],{messages:[]},{messages:[{role:'system',content:'override'}]},{messages:[{role:'assistant',content:'last'}]},{messages:[{role:'user',content:'x'.repeat(1201)}]},{messages:Array.from({length:13},()=>({role:'user',content:'test'}))}])assert.equal((await ask(body)).status,400);
 assert.equal((await ask(undefined,{origin:'https://evil.test'})).status,403);assert.equal((await ask(undefined,{'sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await ask({messages:[{role:'user',content:'x'.repeat(21000)}]})).status,413);assert.equal(calls,0);
 const sources=await knowledge.assistantKnowledge([{role:'user',content:'constitution and upcoming events'}],new Date('2026-10-20'));
 for(const secret of ['MEMBER-DOCUMENT-SECRET','ADMIN-DOCUMENT-SECRET','PRIVATE-EVENT-SECRET','DRAFT-EVENT-SECRET','INTERNAL-EVENT-SECRET','DRAFT-NEWS-SECRET','INACTIVE-COMMITTEE-SECRET','PRIVATE-LEAD-ID','PRIVATE-MEETING-URL','PRIVATE-AUTHOR-ID','PRIVATE-COMMITTEE-EMAIL','private-uploader','private-host-id'])assert.ok(!JSON.stringify(sources).includes(secret),secret);
 const answer=await ask();assert.equal(answer.status,200);assert.equal(answer.headers.get('cache-control'),'private, no-store');const answerData=(await answer.json()).data;assert.equal(answerData.links[0].url,'/documents/ecp-constitution.pdf');assert.ok(!JSON.stringify(answerData).includes('sourceIds'));assert.ok(lastBody.instructions.includes('Do not use outside knowledge'));assert.ok(lastBody.instructions.includes('untrusted'));assert.ok(lastBody.instructions.includes('metadata'));assert.ok(lastBody.instructions.includes('unrelated'));
 reply={answer:'Go to the event page below.',sourceIds:['event-public-event']};assert.equal((await(await ask({messages:[{role:'user',content:'What events are coming up?'}]})).json()).data.links[0].url,'/events/public-event');
 reply={answer:'Download the policy below.',sourceIds:['document-public-policy']};assert.equal((await(await ask()).json()).data.links[0].url,'/api/documents/public-policy/download');
 for(const invalid of [{answer:'Forged link',sourceIds:['document-ADMIN-DOCUMENT-SECRET']},{answer:'See https://evil.example',sourceIds:[]},{answer:'<img src=x onerror=alert(1)>',sourceIds:[]},{answer:'Open /admin/members',sourceIds:[]},{answer:'',sourceIds:[]}]){reply=invalid;assert.equal((await ask()).status,503);}
 modelStatus=401;assert.ok(!JSON.stringify(await(await ask()).json()).includes('Secret provider'));modelStatus=429;const busy=await ask();assert.equal(busy.status,429);assert.equal(busy.headers.get('retry-after'),'30');modelStatus=200;modelState='incomplete';assert.equal((await ask()).status,503);modelState='completed';
 delete process.env.OPENAI_API_KEY;assert.equal((await ask()).status,503);assert.equal((await(await route.GET()).json()).data.available,false);process.env.OPENAI_API_KEY='test-key-never-sent-to-network';
 console.log('PASS: real public data retrieval, member/admin/draft exclusions, input/origin/size validation, real Responses API payload with no storage, verified document/event links, rejected forged links/HTML, model errors and honest missing-key handling.');
 // The shared document APIs must enforce access both before and after the AI supplies a link.
 const list=load('app/api/documents/route.ts'),detail=load('app/api/documents/[id]/route.ts'),download=load('app/api/documents/[id]/download/route.ts'),context=id=>({params:Promise.resolve({id})});
 const anonList=(await(await list.GET(request('/api/documents'))).json()).data;assert.ok(anonList.every(d=>d.access==='public'));assert.ok(anonList.every(d=>!d.publicId&&!d.uploadedBy));assert.ok(anonList.every(d=>!d.url||d.url.startsWith('/api/documents/')));
 const memberList=(await(await list.GET(request('/api/documents','GET',undefined,memberHeaders))).json()).data;assert.ok(!memberList.some(d=>d.access==='admin-only'));assert.ok(memberList.some(d=>d.access==='members-only'));
 assert.equal((await detail.GET(request('/api/documents/private'),context('MEMBER-DOCUMENT-SECRET'))).status,404);
 assert.equal((await download.GET(request('/api/documents/private/download'),context('MEMBER-DOCUMENT-SECRET'))).status,401);
 assert.equal((await download.GET(request('/api/documents/admin/download','GET',undefined,memberHeaders),context('ADMIN-DOCUMENT-SECRET'))).status,403);
 assert.equal((await download.GET(request('/api/documents/public-policy/download'),context('public-policy'))).status,200);
 assert.equal((await download.GET(request('/api/documents/unsafe-link/download'),context('unsafe-link'))).status,503);
 for(const headers of [{},memberHeaders]){
  assert.equal((await list.POST(request('/api/documents','POST',{},headers))).status,403);
  assert.equal((await detail.PATCH(request('/api/documents/private','PATCH',{access:'public'},headers),context('MEMBER-DOCUMENT-SECRET'))).status,403);
  assert.equal((await detail.DELETE(request('/api/documents/private','DELETE',undefined,headers),context('MEMBER-DOCUMENT-SECRET'))).status,403);
 }
 const created=await list.POST(request('/api/documents','POST',{label:'New public handbook',name:'handbook.pdf',category:'handbook',access:'public',fileType:'pdf',url:'https://res.cloudinary.com/test/raw/upload/ecp/documents/handbook.pdf',uploadedBy:'forged'},adminHeaders));assert.equal(created.status,201);const handbook=(await created.json()).data;assert.equal(handbook.uploadedBy,admin.id);assert.ok((await knowledge.publicDocumentSources()).some(source=>source.id===`document-${handbook.id}`));
 await detail.PATCH(request('/api/documents/handbook','PATCH',{access:'members-only',id:'forged'},adminHeaders),context(handbook.id));assert.ok(!(await knowledge.publicDocumentSources()).some(source=>source.id===`document-${handbook.id}`));assert.equal((await download.GET(request('/api/documents/handbook/download'),context(handbook.id))).status,401);
 console.log('PASS: public downloads without login, access rechecked at download, no raw private URLs/metadata, members/admin permissions, admin-only mutations, newly uploaded public documents and revoked public access reflected immediately.');
 process.env.AI_CHAT_PER_MINUTE='2';const fakeTime=Date.now()+3600000,limitRequest=request('/api/assistant','POST',{}, {'x-forwarded-for':'198.51.100.2'});
 const races=await Promise.allSettled(Array.from({length:8},()=>limits.limitAssistant(limitRequest,fakeTime)));assert.equal(races.filter(r=>r.status==='fulfilled').length,2);assert.equal(races.filter(r=>r.status==='rejected'&&r.reason.status===429).length,6);assert.ok(!JSON.stringify(await db.collection('assistantRateLimits').find({}).toArray()).includes('198.51.100.2'));assert.ok((await db.collection('assistantRateLimits').indexes()).some(index=>index.expireAfterSeconds===0));
 process.env.AI_CHAT_PER_MINUTE='1000';process.env.AI_CHAT_GLOBAL_PER_DAY='1';await limits.limitAssistant(request('/api/assistant','POST',{}, {'x-forwarded-for':'203.0.113.1'}),fakeTime+86400000);await assert.rejects(()=>limits.limitAssistant(request('/api/assistant','POST',{}, {'x-forwarded-for':'203.0.113.2'}),fakeTime+86400000),error=>error.status===429);
 console.log('PASS: atomic concurrent per-client rate limits, global daily ceiling across clients, hashed identifiers and expiring usage counters; no conversation content persisted.');
}finally{globalThis.fetch=nativeFetch;await db.dropDatabase();await client.close();console.log('Isolated assistant test database removed.');}
