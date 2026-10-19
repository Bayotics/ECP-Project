import { NextRequest } from "next/server";
import { galleryBody, saveGalleryAlbum } from "@/lib/server/gallery";
import { galleryDocument, galleryAdmin, galleryJSON, galleryId, clubError } from "@/lib/server/gallery-api";
export async function PATCH(request: NextRequest, context: {params:Promise<{id:string}>}) {
 try { const actor = await galleryAdmin(request); const {id}=await context.params; return galleryJSON(galleryDocument(await saveGalleryAlbum(galleryBody(await request.json()),actor.sub,galleryId(id)))); }
 catch(error) { return clubError(error); }
}
