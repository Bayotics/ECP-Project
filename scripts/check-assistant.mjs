// Browser UI tests: all assistant, email and other API requests are mocked.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});let page,checks=0;const errors=[];
const document={title:'Download the ECP Constitution (PDF)',url:'/documents/ecp-constitution.pdf',kind:'document'};
let requests=[],fail=false,available=true,delay=0;
async function contrast(scope,label,allowDark=false){const failures=await scope.evaluate((root,allowDark)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');const rgb=v=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=v;ctx.fillRect(0,0,1,1);const a=ctx.getImageData(0,0,1,1).data;return [a[0],a[1],a[2],a[3]/255];},lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),failures=[];for(const e of root.querySelectorAll('h1,h2,h3,p,label,input,select,textarea,button')){const s=getComputedStyle(e);if(!e.getClientRects().length||s.visibility==='hidden'||s.display==='none'||e.classList.contains('sr-only')||e.disabled||e.type==='checkbox')continue;if(!e.textContent?.trim()&&!['INPUT','SELECT','TEXTAREA'].includes(e.tagName))continue;const parents=[];for(let p=e;p;p=p.parentElement)parents.unshift(p);let bg=[255,255,255];for(const p of parents){const c=rgb(getComputedStyle(p).backgroundColor);if(c)bg=bg.map((v,i)=>c[i]*c[3]+v*(1-c[3]));}const fg=rgb(s.color),a=lum(fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]))),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<4.5)failures.push({text:(e.textContent||e.type).slice(0,70),ratio});if(['INPUT','SELECT','TEXTAREA'].includes(e.tagName)&&s.colorScheme!==(allowDark?'dark':'light'))failures.push({scheme:s.colorScheme});}return failures;},allowDark);assert.deepEqual(failures,[],label);checks++;}
try{
 const context=await browser.newContext({viewport:{width:1366,height:1000},colorScheme:'light'});
 await context.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;let data=[];
  if(path==='/api/auth/session')data=null;
  if(path==='/api/cart')data={items:[],subtotal:0,total:0,shippingFee:0};
  if(path==='/api/assistant'){
   if(request.method()==='GET')data={available,documents:[document]};
   else{
    const body=request.postDataJSON();requests.push(body);assert.ok(body.messages.every(turn=>['user','assistant'].includes(turn.role)));assert.ok(!body.messages.some(turn=>turn.content.includes('Hello! I’m the ECP assistant.')));
    if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
    if(fail)return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({ok:false,error:'The assistant is busy. Please try again shortly.'})});
    const content=body.messages.at(-1).content;
    data=content.includes('events')?{answer:'Open Events from the navigation, then open an event card for details.',links:[{title:'Events calendar',url:'/events',kind:'page'}]}:{answer:'Use the public constitution download below.\nYou can also read it on the Constitution page.',links:[document]};
   }
  }
  await route.fulfill({contentType:'application/json',body:JSON.stringify({ok:true,data})});
 });
 page=await context.newPage();page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(120000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://localhost:3000/contact',{waitUntil:'domcontentloaded'});await page.locator('div[aria-hidden="true"][class*="z-[100]"]').waitFor({state:'hidden',timeout:120000});await page.getByRole('button',{name:'Open AI assistant',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'ECP AI Assistant'});await dialog.getByRole('link',{name:'↓ Download the ECP Constitution (PDF)',exact:true}).waitFor();assert.equal(requests.length,0);
 await dialog.getByRole('button',{name:'Download the constitution',exact:true}).click();await dialog.getByRole('article',{name:'Assistant answer'}).filter({hasText:'Use the public constitution download below.'}).waitFor();assert.equal(requests.length,1);assert.equal(await dialog.getByRole('link',{name:'↓ Download the ECP Constitution (PDF)',exact:true}).getAttribute('href'),document.url);assert.equal(await dialog.getByRole('link',{name:'↓ Download the ECP Constitution (PDF)',exact:true}).getAttribute('target'),'_blank');
 await dialog.getByLabel('Your club question',{exact:true}).fill('What events are coming up?');await dialog.getByRole('button',{name:'Send message',exact:true}).click();await dialog.getByRole('link',{name:'→ Events calendar',exact:true}).waitFor();assert.equal(requests[1].messages.length,3);
 await dialog.getByLabel('Your club question',{exact:true}).fill('<img src=x onerror=alert(1)>');await dialog.getByRole('button',{name:'Send message',exact:true}).click();await dialog.getByText('<img src=x onerror=alert(1)>',{exact:true}).waitFor();assert.equal(await dialog.locator('img').count(),0);
 fail=true;await dialog.getByLabel('Your club question',{exact:true}).fill('Tell me more');await dialog.getByRole('button',{name:'Send message',exact:true}).click();await dialog.getByRole('alert').filter({hasText:'The assistant is busy.'}).waitFor();const userCount=await dialog.getByRole('article',{name:'Your message',exact:true}).count();fail=false;await dialog.getByRole('button',{name:'Retry last message',exact:true}).click();await dialog.getByRole('alert').waitFor({state:'hidden'});assert.equal(await dialog.getByRole('article',{name:'Your message',exact:true}).count(),userCount);
 await dialog.getByRole('button',{name:'Clear chat',exact:true}).click();assert.equal(await dialog.getByRole('article',{name:'Your message',exact:true}).count(),0);
 for(const colorScheme of ['light','dark'])for(const width of [1366,390]){
  await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:844});await contrast(dialog,`Assistant ${colorScheme} ${width}`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width);if(width===390&&colorScheme==='dark')await page.screenshot({path:'tmp/assistant-mobile.png',animations:'disabled'});
 }
 delay=1500;await dialog.getByRole('button',{name:'Download the constitution',exact:true}).click();await dialog.getByRole('status').filter({hasText:'Looking up club information'}).waitFor();await dialog.getByRole('button',{name:'Clear chat',exact:true}).click();await page.waitForTimeout(1800);assert.equal(await dialog.getByRole('article',{name:'Your message',exact:true}).count(),0);assert.equal(await dialog.getByText('Use the public constitution download below.',{exact:false}).count(),0);delay=0;
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Open AI assistant');
 available=false;await page.getByRole('button',{name:'Open AI assistant',exact:true}).click();await dialog.getByRole('status').filter({hasText:'temporarily unavailable'}).waitFor();assert.equal(await dialog.getByLabel('Your club question',{exact:true}).isDisabled(),true);assert.equal(await dialog.getByRole('link',{name:'↓ Download the ECP Constitution (PDF)',exact:true}).count(),1);
 assert.deepEqual(errors,[]);console.log(`PASS: public downloads, real request/history shape, follow-ups, safe text rendering, error/retry without duplicate messages, clear cancels stale replies, keyboard focus, offline state, and ${checks} desktop/mobile light/dark contrast checks. All API calls mocked.`);
}catch(error){if(page){console.error((await page.locator('body').innerText()).slice(-4000));await page.screenshot({path:'tmp/assistant-qa-failure.png',animations:'disabled'});}throw error;}finally{await browser.close();}
