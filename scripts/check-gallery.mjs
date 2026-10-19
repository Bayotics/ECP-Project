// Read-only session setup; all browser API writes and photo hosting are mocked.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createGalleryLoader} from './gallery-loader.mjs';
const nativeRequire=createRequire(import.meta.url),{chromium}=nativeRequire(process.env.PLAYWRIGHT_MODULE||'playwright');
process.loadEnvFile('.env.local');const load=createGalleryLoader();
const admin=await(await load('lib/server/collections.ts').getCollection('users')).findOne({role:{$in:['admin','super-admin']},status:'active'});assert.ok(admin);await(await load('lib/server/mongodb.ts').getMongoClient()).close();
const baseUrl=process.env.ECP_TEST_URL||'http://localhost:3000',now=new Date().toISOString();
const image={kind:'image',src:'/gallery/projects/parade/eyo-street.jpg',alt:'Community photo',w:640,h:480};
const albums=[{id:'album-one',title:'Community day',description:'An event album',category:'Community service',eventId:'event-one',status:'published',createdAt:now,updatedAt:now,createdBy:'admin',count:3},{id:'album-two',title:'Draft album',description:'Hidden until ready',category:'Culture',eventId:null,status:'draft',createdAt:now,updatedAt:now,createdBy:'admin',count:0}];
const photos=[{id:'photo-one',albumId:'album-one',media:{...image,alt:'Newest community photo',caption:'Newest upload'},status:'published',addedAt:now,updatedAt:now,uploadedBy:'admin'},{id:'photo-two',albumId:'album-one',media:{...image,alt:'Second community photo',caption:'Second upload'},status:'published',addedAt:'2020-01-01T00:00:00.000Z',updatedAt:now,uploadedBy:'admin'},{id:'photo-three',albumId:'album-one',media:{kind:'youtube',id:'abcdefghijk',title:'Club film'},status:'published',addedAt:'2019-01-01T00:00:00.000Z',updatedAt:now,uploadedBy:'admin'}];
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/A9sAAAAASUVORK5CYII=','base64');
const browser=await chromium.launch({headless:true,channel:'msedge'});let page,checks=0,uploadAttempts=0,adminMode=false,failGallery=false;const errors=[];
async function contrast(scope,label,allowDark=false){const failures=await scope.evaluate((root,allowDark)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');const rgb=v=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=v;ctx.fillRect(0,0,1,1);const a=ctx.getImageData(0,0,1,1).data;return [a[0],a[1],a[2],a[3]/255];},lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0),failures=[];for(const e of root.querySelectorAll('h1,h2,h3,p,label,input,select,textarea,button')){const s=getComputedStyle(e);if(!e.getClientRects().length||s.visibility==='hidden'||s.display==='none'||e.classList.contains('sr-only')||e.disabled||e.type==='checkbox')continue;if(!e.textContent?.trim()&&!['INPUT','SELECT','TEXTAREA'].includes(e.tagName))continue;const parents=[];for(let p=e;p;p=p.parentElement)parents.unshift(p);let bg=[255,255,255];for(const p of parents){const c=rgb(getComputedStyle(p).backgroundColor);if(c)bg=bg.map((v,i)=>c[i]*c[3]+v*(1-c[3]));}const fg=rgb(s.color),a=lum(fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]))),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<4.5)failures.push({text:(e.textContent||e.type).slice(0,70),ratio});if(['INPUT','SELECT','TEXTAREA'].includes(e.tagName)&&s.colorScheme!==(allowDark?'dark':'light'))failures.push({scheme:s.colorScheme});}return failures;},allowDark);assert.deepEqual(failures,[],label);checks++;}
try{
 const context=await browser.newContext({viewport:{width:1366,height:1000},colorScheme:'light'});
 await context.route('**/_next/image?**',route=>route.fulfill({contentType:'image/png',body:png}));
 await context.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;let data=[],status=200;
  if(path==='/api/auth/session')data=adminMode?admin:null;
  if(path==='/api/cart')data={items:[],subtotal:0,total:0,shippingFee:0};
  if(path==='/api/gallery'){
   if(failGallery)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Gallery temporarily unavailable.'})});
   const publishedAlbums=albums.filter(a=>a.status==='published'),publicMedia=photos.filter(p=>p.status==='published'&&publishedAlbums.some(a=>a.id===p.albumId));
   const publicAlbums=publishedAlbums.map(a=>({...a,count:publicMedia.filter(p=>p.albumId===a.id).length,cover:publicMedia.find(p=>p.albumId===a.id)?.media??null,latestAt:now,event:a.eventId?{title:'Community day event',url:'/events/community-day'}:undefined})).filter(a=>a.count);
   const kind=url.searchParams.get('kind'),albumId=url.searchParams.get('albumId'),category=url.searchParams.get('category');
   const filtered=publicMedia.filter(p=>(!albumId||p.albumId===albumId)&&(!category||albums.find(a=>a.id===p.albumId).category===category)&&(kind==='photo'?p.media.kind==='image':kind==='video'?p.media.kind!=='image':true));
   const offset=Number(url.searchParams.get('cursor')||0),items=filtered.slice(offset,offset+2).map(p=>({id:p.id,albumId:p.albumId,albumTitle:albums.find(a=>a.id===p.albumId).title,addedAt:p.addedAt,media:p.media}));
   data={albums:publicAlbums,items,counts:{albums:publicAlbums.length,photos:publicMedia.filter(p=>p.media.kind==='image').length,videos:0,films:publicMedia.filter(p=>p.media.kind==='youtube').length},nextCursor:offset+2<filtered.length?String(offset+2):null};
  }
  if(path==='/api/admin/gallery/albums'){
   if(req.method()==='POST'){const body=req.postDataJSON();const album={...body,id:'created-album',createdAt:now,updatedAt:now,createdBy:admin.id,count:0};albums.push(album);data=album;status=201;}
   else data={albums,events:[{id:'event-one',title:'Community day event',date:'2026-10-20'}]};
  }
  const albumMatch=path.match(/^\/api\/admin\/gallery\/albums\/([^/]+)$/);
  if(albumMatch){const album=albums.find(a=>a.id===albumMatch[1]);Object.assign(album,req.postDataJSON());data=album;}
  if(path==='/api/admin/gallery/photos'){
   if(req.method()==='POST'){
    uploadAttempts++;const body=req.postDataBuffer().toString('latin1');
    if(body.includes('retry.png')&&uploadAttempts<=2)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({ok:false,error:'Photo host is temporarily unavailable.'})});
    const photo={...photos[0],id:'uploaded-'+uploadAttempts,media:{...image,alt:'Uploaded photo'},albumId:'created-album'};photos.push(photo);albums.find(a=>a.id==='created-album').count++;data={photo,duplicate:false};status=201;
   }else{const rows=photos.filter(p=>p.albumId===url.searchParams.get('albumId'));data={items:rows,total:rows.length};}
  }
  const photoMatch=path.match(/^\/api\/admin\/gallery\/photos\/([^/]+)$/);
  if(photoMatch){const photo=photos.find(p=>p.id===photoMatch[1]),body=req.postDataJSON();photo.media={...photo.media,caption:body.caption,alt:body.alt};photo.albumId=body.albumId;photo.status=body.status;data=photo;}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify({ok:true,data})});
 });
 page=await context.newPage();page.setDefaultTimeout(45000);page.setDefaultNavigationTimeout(120000);page.on('pageerror',error=>errors.push(error.message));
 await page.goto(baseUrl+'/gallery',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Open Newest community photo',exact:true}).waitFor();
 await page.getByRole('button',{name:'Load more',exact:true}).click();await page.getByRole('button',{name:'Open Club film',exact:true}).waitFor();
 await page.getByRole('button',{name:'Open Newest community photo',exact:true}).click();await page.getByRole('dialog',{name:'Media viewer'}).waitFor();await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Albums',exact:true}).click();await page.getByRole('heading',{name:'Community day',exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'Draft album',exact:true}).count(),0);
 await page.getByRole('button').filter({has:page.getByRole('heading',{name:'Community day',exact:true})}).click();await page.getByRole('link',{name:'View event: Community day event →',exact:true}).waitFor();
 await page.getByLabel('Gallery media',{exact:true}).selectOption('video');await page.getByRole('button',{name:'Open Club film',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Open Newest community photo',exact:true}).count(),0);
 await page.getByLabel('Gallery media',{exact:true}).selectOption('all');
 for(const colorScheme of ['light','dark'])for(const width of [1366,390]){
  await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:1000});await page.getByRole('button',{name:'Open Newest community photo',exact:true}).waitFor();
  await contrast(page.locator('#gallery-library'),`Public gallery ${colorScheme} ${width}`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(colorScheme==='dark'&&width===390)await page.screenshot({path:'tmp/gallery-mobile.png',animations:'disabled',fullPage:true});
 }
 failGallery=true;await page.getByLabel('Gallery media',{exact:true}).selectOption('photo');await page.getByRole('alert').filter({hasText:'Gallery temporarily unavailable.'}).waitFor();failGallery=false;await page.getByRole('button',{name:'Try again',exact:true}).click();await page.getByRole('button',{name:'Open Newest community photo',exact:true}).waitFor();
 adminMode=true;await context.addCookies([{name:'ecp_auth_token',value:load('lib/server/session.ts').createSessionToken(admin),url:baseUrl,httpOnly:true,sameSite:'Lax'}]);await page.setViewportSize({width:1366,height:1000});
 await page.goto(baseUrl+'/admin/gallery',{waitUntil:'domcontentloaded'});await page.getByRole('link',{name:'Gallery',exact:true}).waitFor();await page.getByRole('button',{name:'Edit Newest community photo',exact:true}).waitFor();
 await page.getByRole('button',{name:'Create album',exact:true}).click();await page.getByRole('dialog').waitFor();await contrast(page.getByRole('dialog'),'Album editor dark');
 await page.getByLabel('Album title',{exact:true}).fill('Volunteer day photos');await page.getByLabel('Description',{exact:true}).fill('Our volunteers in action.');await page.getByLabel('Event (optional)',{exact:true}).selectOption('event-one');await page.getByRole('button',{name:'Save album',exact:true}).click();await page.getByRole('status').filter({hasText:'Album saved.'}).waitFor();
 await page.locator('#gallery-files').setInputFiles([{name:'first.png',mimeType:'image/png',buffer:png},{name:'retry.png',mimeType:'image/png',buffer:png},{name:'invalid.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg/>')}]);
 await page.getByRole('button',{name:'Upload photos',exact:true}).click();await page.getByText('Upload batch finished.',{exact:false}).waitFor();assert.equal(uploadAttempts,2);await page.getByText('Photo host is temporarily unavailable.',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Retry failed uploads',exact:true}).click();await page.getByText('2 of 3 completed',{exact:true}).waitFor();assert.equal(uploadAttempts,3);
 await page.getByRole('button',{name:'Edit album',exact:true}).click();await page.getByLabel('Visibility',{exact:true}).selectOption('published');await page.getByRole('button',{name:'Save album',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});assert.equal(albums.find(a=>a.id==='created-album').status,'published');
 await page.getByRole('button',{name:'Edit Uploaded photo',exact:true}).first().click();await page.getByLabel('Caption',{exact:true}).fill('Edited photo caption');await page.getByLabel('Photo visibility',{exact:true}).selectOption('hidden');await contrast(page.getByRole('dialog'),'Photo editor dark');await page.getByRole('button',{name:'Save photo',exact:true}).click();await page.getByRole('dialog').waitFor({state:'hidden'});await page.getByText('Edited photo caption',{exact:true}).waitFor();
 for(const colorScheme of ['light','dark'])for(const width of [1366,390]){
  await page.emulateMedia({colorScheme});await page.setViewportSize({width,height:1000});await contrast(page.locator('main'),'Admin gallery '+colorScheme+' '+width);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(colorScheme==='light'&&width===1366)await page.screenshot({path:'tmp/gallery-admin.png',animations:'disabled'});
 }
 assert.deepEqual(errors,[]);console.log(`PASS: recent gallery, albums/event link, hidden drafts, pagination, media filters, viewer, API error recovery, admin create/publish, bulk upload with partial failures/retry, invalid-file feedback, caption/hide editing, ${checks} contrast checks and responsive layouts. All browser writes/photo hosting mocked.`);
}catch(error){if(page){console.error('Browser location:',page.url());console.error((await page.locator('body').innerText()).slice(-5000));await page.screenshot({path:'tmp/gallery-qa-failure.png',animations:'disabled'});}throw error;}finally{await browser.close();}
