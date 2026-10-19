import { createHash } from "crypto";
import { nanoid } from "nanoid";
import type { Filter } from "mongodb";
import type { GalleryAlbum, GalleryMedia, GalleryResponse, PublicGalleryAlbum } from "@/lib/models/gallery";
import { getCollection } from "@/lib/server/collections";
import { volunteerTransaction as transaction } from "@/lib/server/volunteer-transaction";
import { uploadImage, cloudinaryConfigured } from "@/lib/server/cloudinary";
import { VolunteerError as GalleryError } from "@/lib/server/volunteer-error";
import { galleryFileError, gallerySignature } from "@/lib/gallery-input";
export { GalleryError };

function text(value: unknown, label: string, max: number, required = false): string {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw new GalleryError(`Enter a valid ${label}${required ? ` (up to ${max} characters)` : ""}.`, 400);
  return value.trim();
}
export function galleryBody(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new GalleryError("Send valid gallery details.", 400);
  return value as Record<string, unknown>;
}
export async function saveGalleryAlbum(body: Record<string, unknown>, actor: string, id?: string) {
  const patch: Partial<GalleryAlbum> = {};
  if (!id || body.title !== undefined) patch.title = text(body.title, "album title", 150, true);
  if (!id || body.description !== undefined) patch.description = text(body.description ?? "", "description", 2000);
  if (!id || body.category !== undefined) patch.category = text(body.category ?? "Club life", "category", 80, true);
  if (!id || body.status !== undefined) {
    if (!["draft", "published"].includes((body.status ?? "draft") as string)) throw new GalleryError("Choose Draft or Published.", 400);
    patch.status = (body.status ?? "draft") as GalleryAlbum["status"];
  }
  if (!id || body.eventId !== undefined) {
    const eventId = body.eventId === null || body.eventId === "" || body.eventId === undefined ? null : text(body.eventId, "event", 100, true);
    if (eventId && !await (await getCollection("events")).findOne({ id: eventId })) throw new GalleryError("The selected event no longer exists.", 400);
    patch.eventId = eventId;
  }
  const albums = await getCollection("galleryAlbums"), at = new Date().toISOString();
  if (id) {
    const result = await albums.findOneAndUpdate({ id }, { $set: { ...patch, updatedAt: at }, $inc: { revision: 1 } }, { returnDocument: "after" });
    if (!result) throw new GalleryError("Album not found.", 404);
    return result;
  }
  const album: GalleryAlbum = { id: nanoid(), title: patch.title!, description: patch.description!, category: patch.category!, eventId: patch.eventId, status: patch.status!, createdAt: at, updatedAt: at, createdBy: actor, revision: 0 };
  await albums.insertOne(album); return album;
}

export async function addGalleryPhoto(file: File, albumId: string, caption: string, alt: string, actor: string) {
  const problem = galleryFileError(file); if (problem) throw new GalleryError(problem, 400);
  caption = text(caption, "caption", 500); alt = text(alt, "photo description", 300);
  if (!await (await getCollection("galleryAlbums")).findOne({ id: albumId })) throw new GalleryError("Choose an existing album before uploading.", 400);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!gallerySignature(buffer, file.type)) throw new GalleryError("This file’s contents do not match its image type.", 400);
  const contentHash = createHash("sha256").update(buffer).digest("hex"), photos = await getCollection("galleryMedia");
  const existing = await photos.findOne({ albumId, contentHash });
  if (existing) return { photo: existing, duplicate: true };
  if (!cloudinaryConfigured) throw new GalleryError("Photo hosting is not configured on the server.", 503);
  const shared = await photos.findOne({ contentHash, publicId: { $type: "string" } });
  // Deterministic IDs + overwrite:false let a retry recover a hosted asset after a DB outage.
  // https://cloudinary.com/documentation/upload_images#preventing_duplicate_uploads
  const hosted = shared?.media.kind === "image" ? { url: shared.media.src, publicId: shared.publicId!, width: shared.media.w, height: shared.media.h, bytes: shared.bytes } : await uploadImage(buffer, "gallery", { publicId: `photo_${contentHash}`, overwrite: false });
  if (!hosted.url.startsWith("https://res.cloudinary.com/") || !hosted.publicId.startsWith("ecp/gallery/") || !Number.isFinite(hosted.width) || !Number.isFinite(hosted.height) || hosted.width <= 0 || hosted.height <= 0) throw new GalleryError("The image host did not return a valid photo. Please retry the upload.", 503);
  return transaction(async session => {
    const album = await (await getCollection("galleryAlbums")).findOne({ id: albumId }, { session });
    if (!album) throw new GalleryError("The destination album no longer exists.", 409);
    const duplicate = await photos.findOne({ albumId, contentHash }, { session });
    if (duplicate) return { photo: duplicate, duplicate: true };
    const at = new Date().toISOString();
    const photo: GalleryMedia = { id: nanoid(), albumId, media: { kind: "image", src: hosted.url, w: hosted.width, h: hosted.height, alt: alt || caption || file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "), ...(caption ? { caption } : {}) }, status: "published", contentHash, publicId: hosted.publicId, bytes: hosted.bytes, originalName: file.name.slice(0,255), uploadedBy: actor, addedAt: at, updatedAt: at };
    await photos.insertOne(photo, { session });
    await (await getCollection("galleryAlbums")).updateOne({ id: albumId }, { $set: { updatedAt: at }, $inc: { revision: 1 } }, { session });
    return { photo, duplicate: false };
  });
}

export async function updateGalleryMedia(id: string, body: Record<string, unknown>) {
  const caption = body.caption !== undefined ? text(body.caption, "caption", 500) : undefined;
  const alt = body.alt !== undefined ? text(body.alt, "photo description", 300, true) : undefined;
  if (body.status !== undefined && !["published", "hidden"].includes(body.status as string)) throw new GalleryError("Choose Published or Hidden.", 400);
  const albumId = body.albumId !== undefined ? text(body.albumId, "album", 100, true) : undefined;
  return transaction(async session => {
    const photos = await getCollection("galleryMedia"), albums = await getCollection("galleryAlbums");
    const photo = await photos.findOne({ id }, { session });
    if (!photo) throw new GalleryError("Photo not found.", 404);
    if (!await albums.findOne({ id: albumId ?? photo.albumId }, { session })) throw new GalleryError("Destination album not found.", 400);
    if (albumId && albumId !== photo.albumId && photo.contentHash && await photos.findOne({ albumId, contentHash: photo.contentHash, id: { $ne: id } }, { session })) throw new GalleryError("This photo already exists in the selected album.", 409);
    const media = { ...photo.media };
    if (caption !== undefined) media.caption = caption;
    if (alt !== undefined) { if (media.kind === "youtube") media.title = alt; else media.alt = alt; }
    const patch = { media, albumId: albumId ?? photo.albumId, status: (body.status ?? photo.status) as GalleryMedia["status"], updatedAt: new Date().toISOString() };
    await photos.updateOne({ id }, { $set: patch }, { session });
    await albums.updateMany({ id: { $in: [photo.albumId, patch.albumId] } }, { $set: { updatedAt: patch.updatedAt }, $inc: { revision: 1 } }, { session });
    return { ...photo, ...patch };
  });
}

function cursor(value: string | null): { at: string; id: string } | null {
  if (!value) return null;
  try {
    if (value.length > 512) throw Error();
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed.at !== "string" || new Date(parsed.at).toISOString() !== parsed.at || typeof parsed.id !== "string" || !parsed.id || parsed.id.length > 100) throw Error();
    return parsed;
  } catch { throw new GalleryError("This gallery page link is invalid. Refresh the gallery.", 400); }
}
export async function readGallery(params: URLSearchParams): Promise<GalleryResponse> {
  const albumId = params.get("albumId") ?? "", kind = params.get("kind") ?? "all", category = params.get("category") ?? "";
  if (albumId.length > 100 || category.length > 80 || !["all", "photo", "video"].includes(kind)) throw new GalleryError("Choose a valid gallery filter.", 400);
  const limit = params.has("limit") ? Number(params.get("limit")) : 36;
  if (!Number.isInteger(limit) || limit < 1 || limit > 60) throw new GalleryError("Gallery page size must be between 1 and 60.", 400);
  const after = cursor(params.get("cursor"));
  const albums = await (await getCollection("galleryAlbums")).find({ status: "published" }).toArray();
  const photos = await getCollection("galleryMedia"), albumMap = new Map(albums.map(album => [album.id, album]));
  const publicFilter: Filter<GalleryMedia> = { status: "published", albumId: { $in: albums.map(album => album.id) } };
  const grouped = await photos.aggregate<{ _id: string; count: number; cover: GalleryMedia["media"]; latestAt: string; photos: number; videos: number; films: number }>([
    { $match: publicFilter }, { $sort: { addedAt: -1, id: -1 } },
    { $group: { _id: "$albumId", count: { $sum: 1 }, cover: { $first: "$media" }, latestAt: { $first: "$addedAt" }, photos: { $sum: { $cond: [{ $eq: ["$media.kind", "image"] },1,0] } }, videos: { $sum: { $cond: [{ $eq: ["$media.kind", "video"] },1,0] } }, films: { $sum: { $cond: [{ $eq: ["$media.kind", "youtube"] },1,0] } } } },
    { $sort: { latestAt: -1, _id: -1 } },
  ]).toArray();
  const events = await (await getCollection("events")).find({ id: { $in: albums.flatMap(album => album.eventId ? [album.eventId] : []) }, status: "published", isPublic: true, membersOnly: { $ne: true } }).project({ id: 1, title: 1, slug: 1 }).toArray();
  const publicAlbums: PublicGalleryAlbum[] = grouped.map(group => {
    const album = albumMap.get(group._id)!, event = events.find(row => row.id === album.eventId);
    return { id: album.id, title: album.title, description: album.description, category: album.category, count: group.count, cover: group.cover, latestAt: group.latestAt, ...(event ? { event: { title: event.title, url: `/events/${encodeURIComponent(event.slug)}` } } : {}), ...(album.storyUrl?.startsWith("/") && !album.storyUrl.startsWith("//") ? { storyUrl: album.storyUrl } : {}) };
  });
  const selected = publicAlbums.filter(album => (!albumId || album.id === albumId) && (!category || album.category === category));
  const filter: Filter<GalleryMedia> = { status: "published", albumId: { $in: selected.map(album => album.id) }, ...(kind === "photo" ? { "media.kind": "image" } : kind === "video" ? { "media.kind": { $in: ["video", "youtube"] } } : {}) };
  if (after) filter.$or = [{ addedAt: { $lt: after.at } }, { addedAt: after.at, id: { $lt: after.id } }];
  const page = await photos.find(filter).sort({ addedAt: -1, id: -1 }).limit(limit+1).toArray(), shown = page.slice(0,limit), last = shown.at(-1);
  return { items: shown.map(photo => ({ id: photo.id, albumId: photo.albumId, albumTitle: albumMap.get(photo.albumId)!.title, addedAt: photo.addedAt, media: photo.media })), albums: publicAlbums, counts: { albums: publicAlbums.length, photos: grouped.reduce((n,g)=>n+g.photos,0), videos: grouped.reduce((n,g)=>n+g.videos,0), films: grouped.reduce((n,g)=>n+g.films,0) }, nextCursor: page.length > limit && last ? Buffer.from(JSON.stringify({ at: last.addedAt, id: last.id })).toString("base64url") : null };
}
