import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import ts from 'typescript';
const nativeRequire=createRequire(import.meta.url);
const {chromium}=nativeRequire(process.env.PLAYWRIGHT_MODULE || 'playwright');
process.loadEnvFile('.env.local');
const cache=new Map();
function load(file){if(cache.has(file))return cache.get(file);const exports={};cache.set(file,exports);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;new Function('exports','require',output)(exports,name=>name.startsWith('@/')?load(name.slice(2)+'.ts'):nativeRequire(name));return exports;}
const users=await load('lib/server/collections.ts').getCollection('users');
const administrator=await users.findOne({role:{$in:['admin','super-admin']},status:'active'});assert.ok(administrator);
const token=load('lib/server/session.ts').createSessionToken(administrator);
await (await load('lib/server/mongodb.ts').getMongoClient()).close();




// Browser-only mocks: this check never saves records, sends mail, or changes settings.
const baseUrl=process.env.ECP_TEST_URL || 'http://localhost:3000';
const now='2026-10-19T12:00:00Z';
const event={id:'qa-event',title:'QA Community Event',slug:'qa-event',date:'2099-11-21',status:'published',location:'Club Hall',isPublic:true,membersOnly:false,tags:[],accepting:true,isFull:false};
const proposal={id:'qa-proposal',title:'QA Proposal',name:'QA Proposer',email:'qa@example.test',description:'A community event proposal.',proposedDate:'2099-11-21',location:'Club Hall',status:'new',createdAt:now,updatedAt:now,notes:'Notes for review.',emailIssues:0};
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'msedge'}:{})});
let checks=0;
async function contrast(scope, description) {
 const failures=await scope.evaluate(root=>{
  const rgb=value=>{const values=value.match(/[\d.]+/g)?.map(Number);return values&&values.length>=3?[...values.slice(0,3),values[3]??1]:null;};
  const luminance=color=>color.slice(0,3).map(value=>value/255).map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4).reduce((sum,value,i)=>sum+value*[0.2126,0.7152,0.0722][i],0);
  const failures=[];
  for(const el of root.querySelectorAll('h1,h2,h3,p,label,dt,dd,th,td,input:not([type="checkbox"]):not([type="radio"]),select,textarea')) {
   const style=getComputedStyle(el);
   if(!el.getClientRects().length||style.display==='none'||style.visibility==='hidden'||el.classList.contains('sr-only')||el.disabled||el.closest('fieldset[disabled]'))continue;
   if(!['INPUT','SELECT','TEXTAREA'].includes(el.tagName)&&!el.textContent?.trim())continue;
   const ancestors=[];for(let parent=el;parent;parent=parent.parentElement)ancestors.unshift(parent);
   let background=[255,255,255];
   for(const ancestor of ancestors){const c=rgb(getComputedStyle(ancestor).backgroundColor);if(c)background=background.map((value,i)=>c[i]*c[3]+value*(1-c[3]));}
   const foreground=rgb(style.color);if(!foreground)throw Error('Unrecognized computed color '+style.color);
   const actual=foreground.slice(0,3).map((value,i)=>value*foreground[3]+background[i]*(1-foreground[3]));
   const a=luminance(actual),b=luminance(background),ratio=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
   if(ratio<4.5)failures.push({element:el.tagName,text:(el.getAttribute('aria-label')||el.textContent||el.getAttribute('type')||'input').trim().slice(0,90),foreground:style.color,background,ratio:Number(ratio.toFixed(2))});
   if(['INPUT','SELECT','TEXTAREA'].includes(el.tagName)&&style.colorScheme!=='light')failures.push({element:el.tagName,error:'Light controls must keep a light native color scheme',scheme:style.colorScheme});
  }
  return failures;
 });
 assert.deepEqual(failures,[],description);checks++;
}
try {
 for(const colorScheme of ['light','dark'])for(const width of [1366,390]) {
  const context=await browser.newContext({colorScheme,viewport:{width,height:1000}});
  await context.addInitScript(()=>{window.grecaptcha={render:(element)=>{element.textContent='Verification widget';return 1;}};});
  await context.route('https://www.google.com/recaptcha/api.js**',route=>route.fulfill({contentType:'text/javascript',body:'window.ecpRecaptchaReady?.();'}));
  let adminMode=false;
  await context.route('**/api/**',async route=>{
   const req=route.request(),path=new URL(req.url()).pathname;let data=[];
   if(path==='/api/auth/session')data=adminMode?{...administrator,role:'super-admin'}:null;
   if(path==='/api/committees/mine')data=null;
   if(path==='/api/committees/access'){assert.equal(req.method(),'POST');return route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,data:{verified:true}})});}
   if(path==='/api/cart')data={items:[],subtotal:0,total:0,shippingFee:0};
   if(path==='/api/committees/public')data=[{id:'qa-committee',name:'QA Community Service',slug:'qa-community-service',description:'Community service',type:'standing'}];
   if(path==='/api/events'||path==='/api/volunteers/opportunities')data=[event];
   if(path==='/api/admin/proposals')data={proposals:[proposal],total:1,page:0,pageSize:25};
   if(path==='/api/admin/proposals/recipients')data={recipients:[{name:'President',email:'president@example.test'}]};
   if(path==='/api/volunteers/preferences')data={name:'QA Volunteer',email:'qa@example.test',phone:'2155550100',interests:'Mentoring',opportunityEmails:false};
   if(path==='/api/admin/volunteers/integrations')data={mappings:[],keyConfigured:false,endpoint:'https://example.test/api/integrations/volunteers',volunteerUrl:'https://example.test/volunteer',events:[event]};
   if(path==='/api/admin/volunteers/import'){
    assert.equal(req.method(),'POST');const body=req.postDataJSON();assert.equal(body.action,'columns');
    data={headers:['Name','Email','Notes'],mapping:{name:'Name',email:'Email',notes:'Notes'}};
   } else assert.equal(req.method(),'GET','This visual check must never perform an unmocked write.');
   await route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,data})});
  });
  const page=await context.newPage();page.setDefaultNavigationTimeout(60000);page.setDefaultTimeout(30000);
  const theme=`${colorScheme} ${width}px`;
  await page.goto(baseUrl+'/events/propose',{waitUntil:'domcontentloaded'});
  const publicForm=page.getByRole('form',{name:'Event proposal'});await publicForm.getByRole('heading',{name:'Tell us about your idea'}).waitFor();
  await contrast(publicForm,`Proposal form ${theme}`);
  if(colorScheme==='dark'&&width===1366)await page.screenshot({path:'tmp/proposal-dark-fixed.png',fullPage:true});
  await page.goto(baseUrl+'/committees',{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'Our committees',exact:true}).waitFor();await contrast(page.locator('main'),`Public committees ${theme}`);
  await page.goto(baseUrl+'/volunteer',{waitUntil:'domcontentloaded'});
  await page.getByRole('form',{name:'Volunteer sign-up'}).waitFor();await contrast(page.getByRole('form',{name:'Volunteer sign-up'}),`Volunteer form ${theme}`);
  await page.goto(baseUrl+'/volunteer/preferences#token='+'a'.repeat(64),{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Save preferences',exact:true}).waitFor();await contrast(page.locator('main section').first(),`Preferences form ${theme}`);
  adminMode=true;await context.addCookies([{name:'ecp_auth_token',value:token,url:baseUrl,httpOnly:true,sameSite:'Lax'}]);
  await page.goto(baseUrl+'/admin/volunteers/import',{waitUntil:'domcontentloaded'});
  await page.getByLabel('Source',{exact:true}).waitFor();await contrast(page.locator('main'),`Admin import ${theme}`);
  if(colorScheme==='dark'&&width===1366)await page.screenshot({path:'tmp/admin-import-dark-fixed.png'});
  await page.getByLabel('CSV file (up to 1,000 rows, 2 MB)',{exact:true}).setInputFiles({name:'qa.csv',mimeType:'text/csv',buffer:Buffer.from('Name,Email,Notes\nQA Volunteer,qa@example.test,Notes')});
  await page.getByRole('button',{name:'Preview import',exact:true}).waitFor();await contrast(page.locator('main'),`CSV mapping ${theme}`);
  await page.goto(baseUrl+'/admin/volunteers/integrations',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Add event mapping',exact:true}).click();await contrast(page.locator('main'),`Integration forms ${theme}`);
  await page.goto(baseUrl+'/admin/proposals',{waitUntil:'domcontentloaded'});
  await page.getByRole('cell',{name:'QA Proposal',exact:true}).click();await contrast(page.getByRole('dialog'),`Proposal review dialog ${theme}`);
  await page.getByRole('button',{name:'Close',exact:true}).click();await page.getByRole('button',{name:'Notification recipients',exact:true}).click();
  await page.getByRole('dialog').getByLabel('Email',{exact:true}).waitFor();await contrast(page.getByRole('dialog'),`Recipient dialog ${theme}`);
  await context.close();console.log('PASS:',theme);
 }
 console.log(`PASS: ${checks} rendered contrast checks at 4.5:1 or better, desktop/mobile, light/dark themes. All API writes mocked.`);
} finally {await browser.close();}
