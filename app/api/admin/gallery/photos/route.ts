import { GALLERY_FILE_LIMIT } from "@/lib/gallery-input";
import { NextRequest } from "next/server";
import { getCollection, serializeDocuments } from "@/lib/server/collections";
import { addGalleryPhoto, GalleryError } from "@/lib/server/gallery";
import { galleryDocument, galleryAdmin, galleryIndexes, galleryJSON, galleryId, clubError } from "@/lib/server/gallery-api";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function GET(request: NextRequest) {
 try {
  await galleryAdmin(request);
  const albumId = galleryId(request.nextUrl.searchParams.get("albumId")??"");
  const page = Number(request.nextUrl.searchParams.get("page")??0);
  if(!Number.isInteger(page)||page<0||page>100000) throw new GalleryError("Choose a valid page.",400);
  const collection=await getCollection("galleryMedia"), filter={albumId};
  const [items,total]=await Promise.all([collection.find(filter).sort({addedAt:-1,id:-1}).skip(page*36).limit(36).toArray(),collection.countDocuments(filter)]);
  return galleryJSON({items:serializeDocuments(items),total});
 } catch(error) { return clubError(error); }
}
export async function POST(request: NextRequest) {
 try {
  const actor=await galleryAdmin(request);
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) throw new GalleryError("Send photos using the gallery upload form.",400);
  // One file per request keeps each upload within serverless multipart limits.
  const length=Number(request.headers.get("content-length")??0);
  if(length>GALLERY_FILE_LIMIT+65536) throw new GalleryError("Each photo must be 4 MB or smaller.",413);
  const form=await request.formData(), file=form.get("file"), albumId=form.get("albumId");
  if(!(file instanceof File)||typeof albumId!=="string"||form.getAll("file").length!==1) throw new GalleryError("Choose one photo and a destination album.",400);
  const caption=form.get("caption")??"", alt=form.get("alt")??"";
  if(typeof caption!=="string"||typeof alt!=="string") throw new GalleryError("Send valid photo descriptions.",400);
  await galleryIndexes();
  const result=await addGalleryPhoto(file,galleryId(albumId),caption,alt,actor.sub);
  return galleryJSON({...result,photo:galleryDocument(result.photo)},result.duplicate?200:201);
 } catch(error) { return clubError(error); }
}
