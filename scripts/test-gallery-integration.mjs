// Real MongoDB in an isolated disposable database; photo hosting is always mocked.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {createGalleryLoader} from './gallery-loader.mjs';
if(process.env.RUN_GALLERY_DB_TEST!=='1')throw Error('Set RUN_GALLERY_DB_TEST=1 to run isolated gallery tests.');
process.loadEnvFile('.env.local');
const databaseName=`ecp_gallery_test_${Date.now().toString(36)}_${randomUUID().slice(0,8)}`;
process.env.MONGODB_DB=databaseName;
let hostedCalls=0,providerOK=true,insertOK=true;
const assets=new Map(),mocks={'@/lib/server/cloudinary':{cloudinaryConfigured:true,uploadImage:async(buffer,folder,options)=>{
  hostedCalls++;assert.equal(folder,'gallery');assert.equal(options.overwrite,false);assert.match(options.publicId,/^photo_[a-f0-9]{64}$/);
  if(!providerOK)throw Error('Mock photo hosting outage');
  if(!assets.has(options.publicId))assets.set(options.publicId,{url:`https://res.cloudinary.com/test/image/upload/ecp/gallery/${options.publicId}.png`,publicId:`ecp/gallery/${options.publicId}`,width:640,height:480,bytes:buffer.length});
  return assets.get(options.publicId);
}}};
const load=createGalleryLoader(mocks),{getMongoClient}=load('lib/server/mongodb.ts'),client=await getMongoClient(),db=client.db(databaseName),nativeRequire=createRequire(import.meta.url);
assert.match(databaseName,/^ecp_gallery_test_[a-z0-9]+_[a-f0-9]{8}$/);
try{
 const collections=load('lib/server/collections.ts');
 mocks['@/lib/server/collections']={...collections,getCollection:async name=>{const collection=await collections.getCollection(name);if(name==='galleryMedia'&&!insertOK)return new Proxy(collection,{get(target,key){if(key==='insertOne')return async()=>{throw Error('Mock metadata outage');};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}});return collection;}};
 const {NextRequest}=nativeRequire('next/server'),{createSessionToken}=load('lib/server/session.ts');
 const admin={id:'gallery-admin',email:'admin@example.test',role:'admin',status:'active',emailVerified:true},member={id:'gallery-member',email:'member@example.test',role:'member',status:'active',emailVerified:true};
 await db.collection('users').insertMany([admin,member]);
 const adminHeaders={cookie:`ecp_auth_token=${createSessionToken(admin)}`},memberHeaders={cookie:`ecp_auth_token=${createSessionToken(member)}`};
 function request(path,method='GET',body,headers=adminHeaders){return new NextRequest(`https://club.example${path}`,{method,headers:{origin:'https://club.example',...(body!==undefined?{'content-type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});}
 const albumsRoute=load('app/api/admin/gallery/albums/route.ts'),albumRoute=load('app/api/admin/gallery/albums/[id]/route.ts'),photosRoute=load('app/api/admin/gallery/photos/route.ts'),photoRoute=load('app/api/admin/gallery/photos/[id]/route.ts'),publicRoute=load('app/api/gallery/route.ts'),service=load('lib/server/gallery.ts');
 const context=id=>({params:Promise.resolve({id})});
 const patchAlbum=(id,body)=>albumRoute.PATCH(request(`/api/admin/gallery/albums/${id}`,'PATCH',body),context(id));
 const patchPhoto=(id,body,headers=adminHeaders)=>photoRoute.PATCH(request(`/api/admin/gallery/photos/${id}`,'PATCH',body,headers),context(id));
 const read=async query=>{const response=await publicRoute.GET(request(`/api/gallery${query?'?'+query:''}`,'GET',undefined,{}));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');return(await response.json()).data;};
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/A9sAAAAASUVORK5CYII=','base64');
 const file=(suffix='')=>new File([png,Buffer.from(suffix)],`photo${suffix}.png`,{type:'image/png'});
 function upload(albumId,photo=file(),headers=adminHeaders){const form=new FormData();form.append('albumId',albumId);form.append('file',photo);return photosRoute.POST(new NextRequest('https://club.example/api/admin/gallery/photos',{method:'POST',headers:{origin:'https://club.example',...headers},body:form}));}
 for(const headers of [{},memberHeaders]){
  assert.equal((await albumsRoute.GET(request('/api/admin/gallery/albums','GET',undefined,headers))).status,403);
  assert.equal((await albumsRoute.POST(request('/api/admin/gallery/albums','POST',{title:'Denied'},headers))).status,403);
  assert.equal((await upload('denied',file(),headers)).status,403);
  assert.equal((await patchPhoto('denied',{status:'hidden'},headers)).status,403);
 }
 assert.equal(hostedCalls,0);
 assert.equal((await albumsRoute.POST(request('/api/admin/gallery/albums','POST',{title:'Denied'},{...adminHeaders,origin:'https://evil.test'}))).status,403);
 assert.equal((await albumsRoute.POST(request('/api/admin/gallery/albums','POST',{title:'Denied'},{...adminHeaders,'sec-fetch-site':'cross-site'}))).status,403);
 assert.equal((await albumsRoute.POST(request('/api/admin/gallery/albums','POST',{title:''}))).status,400);
 assert.equal((await albumsRoute.POST(request('/api/admin/gallery/albums','POST',{title:'Test',eventId:'missing'}))).status,400);
 await db.collection('events').insertMany([{id:'event-public',title:'Public event',slug:'public-event',status:'published',isPublic:true,membersOnly:false,date:'2026-10-20'},{id:'event-private',title:'Private event',slug:'private-event',status:'published',isPublic:true,membersOnly:true,date:'2026-10-20'}]);
 const created=await albumsRoute.POST(request('/api/admin/gallery/albums','POST',{title:'Event photos',eventId:'event-public',status:'draft',createdBy:'forged'}));assert.equal(created.status,201);
 const album=(await created.json()).data;assert.equal(album.createdBy,admin.id);assert.equal(album._id,undefined);
 assert.equal((await upload(album.id,new File(['fake'],'fake.png',{type:'image/png'}))).status,400);
 assert.equal((await upload(album.id,new File([png],'fake.svg',{type:'image/svg+xml'}))).status,400);
 assert.equal((await upload(album.id,new File([],'empty.png',{type:'image/png'}))).status,400);
 assert.equal((await upload(album.id,new File([new Uint8Array(4*1024*1024+1)],'large.png',{type:'image/png'}))).status,400);
 assert.equal((await upload('missing')).status,400);assert.equal(hostedCalls,0);
 const uploaded=await upload(album.id);assert.equal(uploaded.status,201);const photo=(await uploaded.json()).data.photo;
 assert.equal(photo.uploadedBy,admin.id);assert.equal(photo.media.kind,'image');assert.ok(photo.media.alt);assert.equal(photo._id,undefined);
 assert.deepEqual((await read()).counts,{albums:0,photos:0,videos:0,films:0});
 await patchAlbum(album.id,{status:'published'});
 let gallery=await read();assert.equal(gallery.items.length,1);assert.equal(gallery.albums[0].event.url,'/events/public-event');
 for(const secret of ['publicId','contentHash','uploadedBy','createdBy','originalName','_id','eventId'])assert.ok(!Object.hasOwn(gallery.items[0],secret));
 assert.equal((await upload(album.id)).status,200);assert.equal(hostedCalls,1);assert.equal(await db.collection('galleryMedia').countDocuments({albumId:album.id}),1);
 const race=await Promise.all(Array.from({length:5},()=>upload(album.id,file('race'))));assert.equal(race.filter(response=>response.status===201).length,1);assert.equal(race.filter(response=>response.status===200).length,4);assert.equal(await db.collection('galleryMedia').countDocuments({albumId:album.id}),2);
 const second=await service.saveGalleryAlbum({title:'Second album',status:'published',eventId:'event-private'},admin.id);
 const before=hostedCalls;assert.equal((await upload(second.id)).status,201);assert.equal(hostedCalls,before);gallery=await read();assert.equal(gallery.albums.find(row=>row.id===second.id).event,undefined);
 assert.equal((await patchPhoto(photo.id,{caption:'Updated caption',alt:'A meaningful description',addedAt:'2099-01-01T00:00:00Z',media:{src:'https://evil.test/image.png'}})).status,200);
 let stored=await db.collection('galleryMedia').findOne({id:photo.id});assert.equal(stored.addedAt,photo.addedAt);assert.equal(stored.media.src,photo.media.src);assert.equal(stored.media.caption,'Updated caption');
 assert.equal((await patchPhoto(photo.id,{albumId:second.id})).status,409);
 assert.equal((await patchPhoto(photo.id,{status:'hidden'})).status,200);assert.ok(!(await read()).items.some(row=>row.id===photo.id));
 const hiddenDuplicate=await upload(album.id);assert.equal((await hiddenDuplicate.json()).data.photo.status,'hidden');
 await patchPhoto(photo.id,{status:'published'});await patchAlbum(second.id,{status:'draft'});assert.ok(!(await read()).albums.some(row=>row.id===second.id));
 console.log('PASS: admin/live-session protection, origin checks, image type/signature/size validation, event albums, draft and hidden privacy, cloud asset reuse, concurrent deduplication, safe metadata editing and public projections.');
 // Deterministic public IDs recover a hosted asset after a failed metadata transaction.
 insertOK=false;const retryFile=file('retry');await assert.rejects(()=>service.addGalleryPhoto(retryFile,album.id,'','',admin.id),/Mock metadata outage/);insertOK=true;
 assert.equal(await db.collection('galleryMedia').countDocuments({originalName:'photoretry.png'}),0);
 const assetCount=assets.size;await service.addGalleryPhoto(retryFile,album.id,'','',admin.id);assert.equal(assets.size,assetCount);
 providerOK=false;await assert.rejects(()=>service.addGalleryPhoto(file('provider'),album.id,'','',admin.id),/Mock photo hosting outage/);providerOK=true;assert.equal(await db.collection('galleryMedia').countDocuments({originalName:'photoprovider.png'}),0);
 await db.collection('galleryMedia').insertMany([
  {id:'old-photo',albumId:album.id,status:'published',addedAt:'2020-01-01T00:00:00.000Z',updatedAt:'2020-01-01T00:00:00.000Z',uploadedBy:admin.id,media:{kind:'image',src:'/gallery/old.jpg',alt:'Old',w:100,h:100}},
  {id:'new-video',albumId:album.id,status:'published',addedAt:'2090-01-01T00:00:00.000Z',updatedAt:'2090-01-01T00:00:00.000Z',uploadedBy:admin.id,media:{kind:'video',src:'/gallery/clip.mp4',poster:'/gallery/poster.jpg',alt:'Clip',w:100,h:100}},
  {id:'new-film',albumId:album.id,status:'published',addedAt:'2090-01-01T00:00:00.000Z',updatedAt:'2090-01-01T00:00:00.000Z',uploadedBy:admin.id,media:{kind:'youtube',id:'abcdefghijk',title:'Film'}},
 ]);
 gallery=await read('limit=2');assert.deepEqual(gallery.items.map(row=>row.id),['new-video','new-film']);assert.equal(gallery.counts.videos,1);assert.equal(gallery.counts.films,1);
 const ids=[...gallery.items.map(row=>row.id)];while(gallery.nextCursor){gallery=await read(`limit=2&cursor=${gallery.nextCursor}`);ids.push(...gallery.items.map(row=>row.id));}assert.equal(new Set(ids).size,ids.length);assert.equal(ids.at(-1),'old-photo');
 assert.equal((await read('kind=video')).items.length,2);assert.ok((await read('kind=photo')).items.every(row=>row.media.kind==='image'));assert.equal((await read('category=Missing')).items.length,0);
 const target=await service.saveGalleryAlbum({title:'Move target',status:'published',category:'Culture'},admin.id);await patchPhoto('old-photo',{albumId:target.id});assert.equal((await read(`albumId=${target.id}`)).items[0].id,'old-photo');
 for(const query of ['cursor=invalid','kind=invalid','limit=999','limit=0','albumId='+'x'.repeat(101)])assert.equal((await publicRoute.GET(request('/api/gallery?'+query))).status,400);
 assert.equal((await photosRoute.GET(request(`/api/admin/gallery/photos?albumId=${album.id}&page=-1`))).status,400);
 assert.equal((await patchAlbum('missing',{title:'Missing'})).status,404);assert.equal((await patchPhoto('missing',{caption:'Missing'})).status,404);
 console.log('PASS: atomic metadata rollback and upload retry recovery, provider failures, globally recent-first stable pagination without duplicates, media/category/album filters, moving photos, and preserved video/YouTube support.');
 const {migrateGallery}=load('lib/server/gallery-migration.ts');
 const migrated=await migrateGallery();assert.ok(migrated.items>0);assert.equal(migrated.alreadyCompleted,false);
 const legacy=await db.collection('galleryAlbums').findOne({createdBy:'legacy-migration'});await db.collection('galleryAlbums').updateOne({id:legacy.id},{$set:{title:'Admin edited legacy',status:'draft'}});
 const legacyPhoto=await db.collection('galleryMedia').findOne({albumId:legacy.id});await db.collection('galleryMedia').deleteOne({id:legacyPhoto.id});
 assert.equal((await migrateGallery()).alreadyCompleted,true);assert.equal((await db.collection('galleryAlbums').findOne({id:legacy.id})).title,'Admin edited legacy');assert.equal(await db.collection('galleryMedia').countDocuments({id:legacyPhoto.id}),0);
 assert.equal((await db.collection('galleryAlbums').findOne({id:legacy.id})).eventId,null);
 console.log(`PASS: all legacy assets exist; one-time migration preserves ${migrated.albums} albums / ${migrated.items} media items, retains edits and does not resurrect removed photos.`);
}finally{await db.dropDatabase();await client.close();console.log('Isolated gallery test database removed.');}
