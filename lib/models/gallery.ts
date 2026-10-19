import type { MediaItem } from "@/lib/content/projects";

export interface GalleryAlbum {
  id: string;
  title: string;
  description: string;
  category: string;
  eventId?: string | null;
  status: "draft" | "published";
  storyUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  revision?: number;
}
export interface GalleryMedia {
  id: string;
  albumId: string;
  media: MediaItem;
  status: "published" | "hidden";
  addedAt: string;
  updatedAt: string;
  uploadedBy: string;
  originalName?: string;
  publicId?: string;
  contentHash?: string;
  bytes?: number;
}
export interface PublicGalleryItem {
  id: string;
  albumId: string;
  albumTitle: string;
  addedAt: string;
  media: MediaItem;
}
export interface PublicGalleryAlbum {
  id: string;
  title: string;
  description: string;
  category: string;
  count: number;
  cover: MediaItem | null;
  latestAt: string | null;
  event?: { title: string; url: string };
  storyUrl?: string;
}
export interface GalleryResponse {
  items: PublicGalleryItem[];
  albums: PublicGalleryAlbum[];
  counts: { albums: number; photos: number; videos: number; films: number };
  nextCursor: string | null;
}
