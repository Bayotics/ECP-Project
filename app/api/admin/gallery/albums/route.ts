import { NextRequest } from "next/server";
import { getCollection, serializeDocuments } from "@/lib/server/collections";
import { galleryBody, saveGalleryAlbum } from "@/lib/server/gallery";
import { galleryDocument, galleryAdmin, galleryIndexes, galleryJSON, clubError } from "@/lib/server/gallery-api";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
 try {
  await galleryAdmin(request);
  const [albums, counts, events] = await Promise.all([
    (await getCollection("galleryAlbums")).find({}).sort({updatedAt:-1,id:-1}).toArray(),
    (await getCollection("galleryMedia")).aggregate<{_id:string;count:number}>([{$group:{_id:"$albumId",count:{$sum:1}}}]).toArray(),
    (await getCollection("events")).find({}).project({id:1,title:1,date:1}).sort({date:-1}).toArray(),
  ]);
  return galleryJSON({albums:serializeDocuments(albums).map(album=>({...album,count:counts.find(c=>c._id===album.id)?.count??0})),events:events.map(event=>({id:event.id,title:event.title,date:event.date}))});
 } catch(error) { return clubError(error); }
}
export async function POST(request: NextRequest) {
 try { const actor = await galleryAdmin(request); await galleryIndexes(); return galleryJSON(galleryDocument(await saveGalleryAlbum(galleryBody(await request.json()),actor.sub)),201); }
 catch(error) { return clubError(error); }
}
