// Real MongoDB in an isolated disposable database; every email is mocked.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import ts from 'typescript';
if (process.env.RUN_COMMITTEE_DB_TEST !== '1') throw Error('Set RUN_COMMITTEE_DB_TEST=1.');
process.loadEnvFile('.env.local');
const databaseName = `ecp_committee_test_${Date.now().toString(36)}_${randomUUID().slice(0,8)}`;
process.env.MONGODB_DB=databaseName;
const nativeRequire=createRequire(import.meta.url),cache=new Map(),delivered=[];
let captchaOK=true,providerOK=true,queueOK=true;
const mocks={
 '@/lib/server/email':{siteUrl:()=> 'https://club.example',sendEmail:async message=>{delivered.push(message);return providerOK?{ok:true,id:randomUUID()}:{ok:false,error:'Mock outage'};}},
 '@/lib/server/recaptcha':{verifyRecaptcha:async()=>captchaOK?{ok:true}:{ok:false,status:400,error:'Complete CAPTCHA.'}},
};
function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,name=>Object.hasOwn(mocks,name)?mocks[name]:name.startsWith('@/')?load(name.slice(2)+'.ts'):nativeRequire(name));return exports;}
const {getMongoClient}=load('lib/server/mongodb.ts'),client=await getMongoClient(),db=client.db(databaseName);
assert.match(databaseName,/^ecp_committee_test_[a-z0-9]+_[a-f0-9]{8}$/);
try {
 const collections=load('lib/server/collections.ts');
 mocks['@/lib/server/collections']={...collections,ensureCoreIndexes:async()=>{},getCollection:async name=>{
  const collection=await collections.getCollection(name);
  if(name==='committeeMessages'&&!queueOK)return new Proxy(collection,{get(target,key){if(key==='insertMany')return async()=>{throw Error('Mock queue rollback');};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});
  return collection;
 }};
 await Promise.all([
  db.collection('committeeMemberships').createIndex({committeeId:1,userId:1},{unique:true,partialFilterExpression:{userId:{$type:'string'}}}),
  db.collection('committeeMemberships').createIndex({committeeId:1,volunteerId:1},{unique:true,partialFilterExpression:{volunteerId:{$type:'string'}}}),
  ...['users','volunteers','committees','committeeMembershipChanges','committeeMessages'].map(name=>db.collection(name).createIndex({id:1},{unique:true})),
  db.collection('volunteerAccessTokens').createIndex({tokenHash:1},{unique:true}),
 ]);
 const user=(id,role='member')=>({id,role,status:'active',displayName:id,email:`${id}@example.test`,emailVerified:true});
 const member=user('member'),chair=user('chair'),admin=user('admin','admin'),other=user('other');
 await db.collection('users').insertMany([member,chair,admin,other,{...user('blocked'),status:'suspended'}]);
 const volunteer=(id,email)=>({id,name:id,email,firstName:id,lastName:'Person',phone:'',notes:'',interests:'',status:'active',opportunityEmails:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
 const linked={...volunteer('linked',member.email),userId:member.id},guest=volunteer('guest','guest@example.test');
 await db.collection('volunteers').insertMany([linked,guest]);
 const lead={userId:chair.id,name:chair.displayName,role:'Chairperson',isChairperson:true,isViceChair:false,joinedCommitteeAt:'2026-01-01T00:00:00Z'};
 const committee=id=>({id,name:`Committee ${id}`,slug:id,description:'Community service',status:'active',type:'standing',members:[lead]});
 await db.collection('committees').insertMany([committee('a'),committee('b'),{...committee('closed'),status:'inactive'}, {...committee('fallback'),members:[]}]);
 const server=load('lib/server/committee-memberships.ts'),notifications=load('lib/server/committee-notifications.ts');
 const mine=load('app/api/committees/mine/route.ts'),access=load('app/api/committees/access/route.ts'),requestAccess=load('app/api/committees/access/request/route.ts');
 const {NextRequest}=nativeRequire('next/server'),{createSessionToken}=load('lib/server/session.ts');
 const authCookie=`ecp_auth_token=${createSessionToken(member)}`;
 function request(path,method='GET',body,headers={}){return new NextRequest(`https://club.example${path}`,{method,headers:{origin:'https://club.example',...(body?{'content-type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});}
 async function post(id,action,headers={cookie:authCookie},extra={}){return mine.POST(request('/api/committees/mine','POST',{committeeId:id,action,...extra},headers));}
 const legacy=load('app/api/committees/join-requests/route.ts'),review=load('app/api/committees/join-requests/[id]/route.ts');
 assert.equal((await legacy.GET(request('/api/committees/join-requests'))).status,401);
 assert.equal((await legacy.POST(request('/api/committees/join-requests','POST',{}, {cookie:authCookie}))).status,410);
 assert.equal((await review.PATCH(request('/api/committees/join-requests/old','PATCH',{status:'approved'},{cookie:authCookie}),{params:Promise.resolve({id:'old'})})).status,403);
 assert.equal((await post('a','join',{})).status,401);
 assert.equal((await post('a','join',{cookie:authCookie,origin:'https://evil.test'})).status,403);
 assert.equal((await post('a','join',{cookie:`ecp_auth_token=${createSessionToken({...user('blocked')})}`})).status,401);
 const results=await Promise.all(Array.from({length:6},()=>post('a','join',undefined,{userId:other.id,role:'Chairperson'})));
 assert.ok(results.every(r=>r.status===200));
 assert.equal(await db.collection('committeeMembershipChanges').countDocuments({committeeId:'a'}),1);
 assert.equal(await db.collection('committeeMessages').countDocuments({}),2);
 let roster=(await db.collection('committees').findOne({id:'a'})).members;
 assert.equal(roster.filter(m=>m.userId===member.id).length,1);assert.equal(roster.find(m=>m.userId===member.id).role,'Member');assert.ok(!roster.some(m=>m.userId===other.id));
 assert.equal(await db.collection('committeeMemberships').countDocuments({committeeId:'a',userId:member.id,volunteerId:linked.id}),1);
 assert.ok((await db.collection('volunteers').findOne({id:linked.id})).committeeIds.includes('a')); 
 assert.ok(delivered.some(m=>m.to===chair.email));assert.ok(delivered.some(m=>m.to===member.email&&m.html.includes('Manage my volunteering')));
 await post('b','join');await post('a','leave');await post('b','leave');
 const history=await db.collection('committeeMembershipChanges').find({userId:member.id}).toArray();assert.equal(history.length,4);assert.ok(history.every(h=>h.at&&h.role==='Member'));assert.equal(history.filter(h=>h.status==='left').length,2);
 console.log('PASS: six concurrent joins create one place, audit and notification pair; live member identity and role cannot be forged; multi-committee membership and leaving the last committee work.');
 captchaOK=false;assert.equal((await requestAccess.POST(request('/api/committees/access/request','POST',{email:guest.email,committeeId:'a'}))).status,400);captchaOK=true;
 const before=await db.collection('committeeMembershipChanges').countDocuments({});
 const first=await requestAccess.POST(request('/api/committees/access/request','POST',{email:guest.email,committeeId:'a',recaptchaToken:'mock'}));assert.equal(first.status,200);
 assert.equal(await db.collection('committeeMembershipChanges').countDocuments({}),before);
 const welcome=delivered.find(m=>m.to===guest.email&&m.subject==='Confirm your committee access');assert.ok(welcome);
 const token=welcome.html.match(/#token=([a-f0-9]{64})/)[1];assert.ok(welcome.html.includes('&amp;join=a'));assert.ok(welcome.html.includes('Manage my volunteering'));
 assert.ok(!JSON.stringify(await db.collection('volunteerAccessTokens').find({volunteerId:guest.id}).toArray()).includes(token));
 await requestAccess.POST(request('/api/committees/access/request','POST',{email:guest.email,committeeId:'a',recaptchaToken:'mock'}));assert.equal(await db.collection('volunteerMessages').countDocuments({volunteerId:guest.id,kind:'access'}),1);
 const bad=await access.POST(request('/api/committees/access','POST',{}, {authorization:`Bearer ${'a'.repeat(64)}`}));assert.equal(bad.status,401);
 const confirmed=await access.POST(request('/api/committees/access','POST',{}, {authorization:`Bearer ${token}`}));assert.equal(confirmed.status,200);
 const cookie=confirmed.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=lax/i);assert.match(cookie,/Max-Age=2592000/i);
 const guestCookie={cookie:cookie.split(';')[0]};
 assert.ok((await (await mine.GET(request('/api/committees/mine','GET',null,guestCookie))).json()).data);
 assert.equal((await post('a','join',guestCookie)).status,200);assert.equal((await post('b','join',guestCookie)).status,200);assert.equal((await post('a','leave',guestCookie)).status,200);
 assert.equal((await db.collection('committeeMemberships').findOne({volunteerId:guest.id,committeeId:'a'})).status,'left');
 assert.deepEqual((await db.collection('volunteers').findOne({id:guest.id})).committeeIds,['b']);
 await load('lib/server/volunteer-management.ts').manageVolunteering(`Bearer ${token}`,{action:'profile',firstName:'Guest',lastName:'Person',email:guest.email,phone:'',interests:'',opportunityEmails:false});
 assert.deepEqual((await db.collection('volunteers').findOne({id:guest.id})).committeeIds,['b']);
 assert.equal((await (await mine.GET(request('/api/committees/mine'))).json()).data,null);
 const forgotten=await access.DELETE(request('/api/committees/access','DELETE',null,guestCookie));assert.match(forgotten.headers.get('set-cookie'),/Max-Age=0/i);
 console.log('PASS: CAPTCHA-protected email verification changes nothing before proof; tokens are hashed and non-enumerating; secure cookie enables subsequent one-click joins/leaves without forms.');
 const {volunteerPreferencesUrl}=load('lib/server/volunteer-access.ts'),{volunteerTransaction}=load('lib/server/volunteer-transaction.ts');
 const linkedUrl=await volunteerTransaction(s=>volunteerPreferencesUrl(linked.id,s)),linkedToken=new URL(linkedUrl).hash.slice(7);
 const linkedHeaders={authorization:`Bearer ${linkedToken}`};
 await post('a','join');assert.ok((await (await mine.GET(request('/api/committees/mine','GET',null,linkedHeaders))).json()).data.committees.find(c=>c.id==='a').joined);
 await post('a','leave',linkedHeaders);assert.equal((await (await mine.GET(request('/api/committees/mine','GET',null,{cookie:authCookie}))).json()).data.committees.find(c=>c.id==='a').joined,false);
 assert.equal(await db.collection('committeeMemberships').countDocuments({committeeId:'a',userId:member.id}),1);
 assert.equal((await post('closed','join')).status,409);
 await db.collection('committees').updateOne({id:'closed'},{$push:{members:{userId:member.id,name:member.displayName,role:'Secretary',isChairperson:false,isViceChair:false,joinedCommitteeAt:'2025-01-01'}}});
 assert.equal((await post('closed','leave')).status,200);assert.equal((await db.collection('committeeMembershipChanges').findOne({committeeId:'closed'})).role,'Secretary');
 queueOK=false;await assert.rejects(()=>server.changeCommitteeMembership({userId:member.id,volunteerId:linked.id,email:member.email,name:member.displayName,role:'Member'},'b','join'),/Mock queue rollback/);queueOK=true;
 assert.ok(!(await db.collection('committees').findOne({id:'b'})).members.some(m=>m.userId===member.id));
 providerOK=false;const failed=await post('fallback','join');assert.equal((await failed.json()).data.emailQueued,true);providerOK=true;
 const pending=await db.collection('committeeMessages').find({status:'failed'}).toArray();assert.equal(pending.length,2);assert.ok(pending.some(m=>m.to===admin.email));
 await notifications.deliverCommitteeMessages();assert.equal(await db.collection('committeeMessages').countDocuments({status:'failed'}),0);
 const sends=delivered.length;await notifications.deliverCommitteeMessages();assert.equal(delivered.length,sends);
 assert.equal((await (await mine.GET(request('/api/committees/mine','GET',null,{cookie:authCookie,authorization:`Bearer ${token}`}))).json()).data.name,'Guest Person');
 await db.collection('volunteerAccessTokens').updateMany({volunteerId:guest.id},{$set:{expiresAt:new Date(Date.now()-1000)}});
 assert.equal((await (await mine.GET(request('/api/committees/mine','GET',null,guestCookie))).json()).data,null);
 console.log('PASS: shared member/volunteer identity, existing committee roles, closed-committee departure, atomic rollback, fallback lead notices, durable retry, no resend and token expiry.');
} finally {await db.dropDatabase();await client.close();console.log('Isolated committee test database removed.');}
