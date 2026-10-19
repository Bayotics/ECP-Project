// Browser journey checks. All API writes and email delivery are mocked.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire=createRequire(import.meta.url),{chromium}=nativeRequire(process.env.PLAYWRIGHT_MODULE||'playwright'),cache=new Map();
process.loadEnvFile('.env.local');
function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(exports,name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):nativeRequire(name));return exports;}
const users=await load('lib/server/collections.ts').getCollection('users'),admin=await users.findOne({role:{$in:['admin','super-admin']},status:'active'});assert.ok(admin);
const committeeFixtures=(await (await load('lib/server/collections.ts').getCollection('committees')).find({status:'active'}).sort({name:1}).limit(3).toArray()).map(load('lib/public-committees.ts').publicCommittee);assert.ok(committeeFixtures.length>=2);
await (await load('lib/server/mongodb.ts').getMongoClient()).close();
const baseUrl=process.env.ECP_TEST_URL||'http://localhost:3000',browser=await chromium.launch({headless:true,channel:'msedge'});
try {
 const context=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:1000}}),errors=[];
 await context.addInitScript(()=>{window.grecaptcha={render:(element,options)=>{element.textContent='QA CAPTCHA';setTimeout(()=>options.callback('captcha-proof'),0);return 1;}};});
 await context.route('https://www.google.com/recaptcha/api.js**',route=>route.fulfill({contentType:'text/javascript',body:'window.ecpRecaptchaReady?.();'}));
 let verified=false,memberMode=false,joinCount=0,requestCount=0,saveCount=0;const joined=new Set(),history=[];
 const data=()=>({name:memberMode?admin.displayName:'QA Volunteer',committees:committeeFixtures.map(c=>({...c,status:'active',role:memberMode?'Member':'Volunteer',joined:joined.has(c.id),joinedAt:joined.has(c.id)?new Date().toISOString():null})),history});
 await context.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;let response=[];
  if(path==='/api/auth/session')response=memberMode?admin:null;
  if(path==='/api/cart')response={items:[],subtotal:0,total:0,shippingFee:0};
  if(path==='/api/committees/public')response=committeeFixtures;
  if(path==='/api/committees/mine'){
   if(req.method()==='POST'){const body=req.postDataJSON();assert.ok(verified||memberMode);assert.deepEqual(Object.keys(body).sort(),['action','committeeId']);const was=joined.has(body.committeeId);if(body.action==='join')joined.add(body.committeeId);else joined.delete(body.committeeId);if(was!==joined.has(body.committeeId)){history.unshift({id:String(++joinCount),committeeName:committeeFixtures.find(c=>c.id===body.committeeId).name,action:body.action,status:body.action==='join'?'active':'left',role:memberMode?'Member':'Volunteer',at:new Date().toISOString()});}response={...data(),unchanged:false,emailQueued:false};}
   else response=verified||memberMode?data():null;
  }
  if(path==='/api/committees/access/request'){assert.equal(req.method(),'POST');const body=req.postDataJSON();assert.equal(body.email,'qa@example.test');assert.equal(body.recaptchaToken,'captcha-proof');assert.equal(body.committeeId,committeeFixtures[0].id);requestCount++;response={message:'A private confirmation link has been emailed.'};}
  if(path==='/api/committees/access'){assert.equal(req.method(),'POST');assert.equal(req.headers()['authorization'],'Bearer '+'a'.repeat(64));verified=true;response={verified:true};}
  if(path==='/api/volunteers/preferences')response={name:'QA Volunteer',firstName:'QA',lastName:'Volunteer',email:'qa@example.test',phone:'',interests:'',committeeIds:[],interestAreas:[],opportunityEmails:false,status:'active',updatedAt:new Date().toISOString()};
  if(path==='/api/volunteers/preferences'&&req.method()==='PATCH'){assert.equal(Object.hasOwn(req.postDataJSON(),'committeeIds'),false);saveCount++;response={preferences:response,emailChanged:false,emailSent:true,unchanged:false};}
  if(path==='/api/users')response=[admin];
  await route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,data:response})});
 });
 const page=await context.newPage();page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(baseUrl+'/committees',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:`Join ${committeeFixtures[0].name}`,exact:true}).click();
 await page.getByText('QA CAPTCHA',{exact:true}).waitFor();await page.getByLabel('Volunteer email',{exact:true}).fill('qa@example.test');await page.getByRole('button',{name:'Email confirmation link',exact:true}).click();await page.getByRole('status').filter({hasText:'A private confirmation link has been emailed.'}).waitFor();assert.equal(joinCount,0);
 await page.goto(baseUrl+'/committees#token='+'a'.repeat(64)+'&join='+encodeURIComponent(committeeFixtures[0].id),{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:`Leave ${committeeFixtures[0].name}`,exact:true}).waitFor();assert.equal(new URL(page.url()).hash,'');
 await page.getByRole('button',{name:`Join ${committeeFixtures[1].name}`,exact:true}).click();await page.getByRole('button',{name:`Leave ${committeeFixtures[1].name}`,exact:true}).waitFor();
 await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:`Leave ${committeeFixtures[0].name}`,exact:true}).click();await page.getByRole('button',{name:`Join ${committeeFixtures[0].name}`,exact:true}).waitFor();assert.equal(requestCount,1);
 await page.getByText('Your committee history',{exact:true}).click();assert.ok((await page.getByLabel('Committee memberships').innerText()).includes('Philadelphia time'));
 await page.setViewportSize({width:390,height:1000});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'tmp/committee-volunteer-mobile.png',fullPage:true,animations:'disabled'});
 await page.goto(baseUrl+'/volunteer/preferences#token='+'a'.repeat(64),{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Save preferences',exact:true}).waitFor();await page.getByRole('button',{name:`Join ${committeeFixtures[0].name}`,exact:true}).click();await page.getByRole('button',{name:`Leave ${committeeFixtures[0].name}`,exact:true}).waitFor();
 await page.getByRole('button',{name:'Save preferences',exact:true}).click();await page.getByRole('status').filter({hasText:'Your volunteering changes have been saved.'}).waitFor();await page.getByRole('button',{name:`Leave ${committeeFixtures[0].name}`,exact:true}).waitFor();assert.equal(saveCount,1);
 memberMode=true;verified=false;
 await context.addCookies([{name:'ecp_auth_token',value:load('lib/server/session.ts').createSessionToken(admin),url:baseUrl,httpOnly:true,sameSite:'Lax'}]);
 await page.setViewportSize({width:1366,height:1000});await page.goto(baseUrl+'/member/committees',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:`Leave ${committeeFixtures[0].name}`,exact:true}).click();await page.getByRole('button',{name:`Join ${committeeFixtures[0].name}`,exact:true}).waitFor();
 await page.goto(baseUrl+'/member/profile',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:`Join ${committeeFixtures[0].name}`,exact:true}).click();await page.getByRole('button',{name:`Leave ${committeeFixtures[0].name}`,exact:true}).waitFor();await page.getByLabel('Committee memberships').scrollIntoViewIfNeeded();await page.screenshot({path:'tmp/committee-member-profile.png',animations:'disabled'});
 assert.deepEqual(errors,[]);assert.ok(history.some(h=>h.role==='Member'));assert.ok(history.some(h=>h.role==='Volunteer'));console.log('PASS: first volunteer email verification, automatic confirmed join, returning one-click multi-committee join/leave, private volunteer profile, member committee page and profile, dated history, dark mobile layout. All API writes and emails mocked.');
} finally {await browser.close();}
