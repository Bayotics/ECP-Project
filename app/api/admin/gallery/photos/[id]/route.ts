import { NextRequest } from "next/server";
import { galleryBody, updateGalleryMedia } from "@/lib/server/gallery";
import { galleryDocument, galleryAdmin, galleryJSON, galleryId, clubError } from "@/lib/server/gallery-api";
export async function PATCH(request: NextRequest, context: {params:Promise<{id:string}>}) {
 try { await galleryAdmin(request); const {id}=await context.params; return galleryJSON(galleryDocument(await updateGalleryMedia(galleryId(id),galleryBody(await request.json())))); }
 catch(error) { return clubError(error); }
}
