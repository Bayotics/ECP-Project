/** CLI-only migration. Public gallery requests never seed or fall back to this library. */
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { ALBUMS, type Album } from "@/lib/content/gallery";
import { getDb, getMongoClient } from "@/lib/server/mongodb";
import { getCollection } from "@/lib/server/collections";
import { galleryIndexes } from "@/lib/server/gallery-api";

export async function migrateGallery(source: Album[] = ALBUMS) {
  const db=await getDb(), migrations=db.collection<{id:string;completedAt:string;albums:number;items:number}>("galleryMigrations"), key="legacy-gallery-v1";
  const completed=await migrations.findOne({id:key});
  if(completed)return {alreadyCompleted:true,albums:completed.albums,items:completed.items,...await applyGalleryCorrections()};
  // Check every referenced local file before inserting anything. No capture dates or event matches are inferred.
  const root=await realpath(path.resolve("public"));
  for(const album of source)for(const item of album.media){
    const files=item.kind==="image"?[item.src]:item.kind==="video"?[item.src,item.poster]:[];
    for(const file of files){
      if(!file.startsWith("/")||file.startsWith("//"))throw Error(`Unsupported legacy gallery path: ${file}`);
      const resolved=await realpath(path.resolve(root,file.slice(1)));
      if(!resolved.startsWith(root+path.sep)||!(await stat(resolved)).isFile())throw Error(`Legacy asset is outside the public folder: ${file}`);
    }
  }
  await galleryIndexes();await migrations.createIndex({id:1},{unique:true});
  const session=(await getMongoClient()).startSession();
  let result: {alreadyCompleted:boolean;albums:number;items:number};
  try{result = await session.withTransaction(async()=>{
    const exists=await migrations.findOne({id:key},{session});if(exists)return {alreadyCompleted:true,albums:exists.albums,items:exists.items};
    const albums=await getCollection("galleryAlbums"), media=await getCollection("galleryMedia"), at=new Date().toISOString();
    for(const album of source){
      const id=`legacy-${album.id}`;
      await albums.updateOne({id},{$setOnInsert:{id,title:album.title,description:album.blurb,category:album.category,eventId:null,status:"published",...(album.href?{storyUrl:album.href}:{}),createdAt:at,updatedAt:at,createdBy:"legacy-migration",revision:0}},{upsert:true,session});
      for(const [index,item] of album.media.entries()){
        const mediaId=`${id}-${String(index).padStart(4,"0")}`;
        await media.updateOne({id:mediaId},{$setOnInsert:{id:mediaId,albumId:id,media:item,status:"published",addedAt:at,updatedAt:at,uploadedBy:"legacy-migration"}},{upsert:true,session});
      }
    }
    const result={albums:source.length,items:source.reduce((count,album)=>count+album.media.length,0)};
    await migrations.insertOne({id:key,completedAt:at,...result},{session});return {alreadyCompleted:false,...result};
  });}finally{await session.endSession();}
  return {...result,...await applyGalleryCorrections()};
}

/** One-time correction for databases seeded before profile portraits were excluded. */
export async function retireGalleryPortraits() {
  const db=await getDb(), migrations=db.collection<{id:string;completedAt:string;hiddenPhotos:number}>("galleryMigrations");
  const id="legacy-gallery-remove-portraits-v1";
  if(await migrations.findOne({id}))return {hiddenPortraits:0};
  await migrations.createIndex({id:1},{unique:true});
  const session=(await getMongoClient()).startSession();
  try{return await session.withTransaction(async()=>{
    if(await migrations.findOne({id},{session}))return {hiddenPortraits:0};
    const at=new Date().toISOString();
    const media=await getCollection("galleryMedia");
    const result=await media.updateMany({albumId:"legacy-leadership",uploadedBy:"legacy-migration","media.kind":"image","media.src":{$regex:"^/gallery/(excos|patrons)/"},status:"published"},{$set:{status:"hidden",updatedAt:at}},{session});
    await (await getCollection("galleryAlbums")).updateOne({id:"legacy-leadership",createdBy:"legacy-migration",status:"published"},{$set:{status:"draft",updatedAt:at},$inc:{revision:1}},{session});
    await migrations.insertOne({id,completedAt:at,hiddenPhotos:result.modifiedCount},{session});
    return {hiddenPortraits:result.modifiedCount};
  });}finally{await session.endSession();}
}

async function applyGalleryCorrections() {
  return {...await retireGalleryPortraits(),...await retireGalleryTail()};
}

/** Remove the screenshot's ferry/train/carnival row and everything after it.
 * These four exact legacy albums comprised that tail of the gallery; newer uploads
 * and earlier albums are not selected by a moving position or date cutoff.
 */
export async function retireGalleryTail() {
  const db=await getDb(), migrations=db.collection<{id:string;completedAt:string;hiddenMedia:number}>("galleryMigrations");
  const id="legacy-gallery-remove-tail-v1";
  if(await migrations.findOne({id}))return {hiddenTailMedia:0};
  await migrations.createIndex({id:1},{unique:true});
  const albumIds=["legacy-lagos","legacy-highway","legacy-health","legacy-back-to-school"];
  const session=(await getMongoClient()).startSession();
  try{return await session.withTransaction(async()=>{
    if(await migrations.findOne({id},{session}))return {hiddenTailMedia:0};
    const at=new Date().toISOString();
    const result=await (await getCollection("galleryMedia")).updateMany({albumId:{$in:albumIds},uploadedBy:"legacy-migration",status:"published"},{$set:{status:"hidden",updatedAt:at}},{session});
    await (await getCollection("galleryAlbums")).updateMany({id:{$in:albumIds},createdBy:"legacy-migration",status:"published"},{$set:{status:"draft",updatedAt:at},$inc:{revision:1}},{session});
    await migrations.insertOne({id,completedAt:at,hiddenMedia:result.modifiedCount},{session});
    return {hiddenTailMedia:result.modifiedCount};
  });}finally{await session.endSession();}
}
