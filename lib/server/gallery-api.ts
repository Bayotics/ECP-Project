import { NextRequest, NextResponse } from "next/server";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { getCollection } from "@/lib/server/collections";
import { GalleryError } from "@/lib/server/gallery";
export { clubError, privateHeaders };
export async function galleryAdmin(request: NextRequest) {
  const user = await clubAdmin(request);
  if (!["GET", "HEAD"].includes(request.method) && request.headers.get("sec-fetch-site") === "cross-site") throw new GalleryError("This request must come from the club website.", 403);
  return user;
}
let indexPromise: Promise<void> | null = null;
export async function galleryIndexes() {
  if (!indexPromise) indexPromise = (async () => {
    const albums = await getCollection("galleryAlbums"), media = await getCollection("galleryMedia");
    await Promise.all([albums.createIndex({id:1},{unique:true}), albums.createIndex({status:1,updatedAt:-1}), albums.createIndex({eventId:1}), media.createIndex({id:1},{unique:true}), media.createIndex({status:1,addedAt:-1,id:-1}), media.createIndex({albumId:1,status:1,addedAt:-1,id:-1}), media.createIndex({albumId:1,contentHash:1},{unique:true,partialFilterExpression:{contentHash:{$type:"string"}}})]);
  })().catch(error => { indexPromise = null; throw error; });
  await indexPromise;
}
export function galleryId(value: string) { if (!value || value.length > 100) throw new GalleryError("Choose a valid album or photo.", 400); return value; }
export function galleryJSON(data: unknown, status = 200) { return NextResponse.json({ok:true,data},{status,headers:privateHeaders}); }

export function galleryDocument<T extends object>(value:T):T { return Object.fromEntries(Object.entries(value).filter(([key])=>key!=="_id")) as T; }
