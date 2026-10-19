import Image from "next/image";
import type { MediaItem } from "@/lib/content/projects";

export default function GalleryThumbnail({ media, priority = false }: { media: MediaItem; priority?: boolean }) {
  const src = media.kind === "youtube" ? `https://i.ytimg.com/vi/${media.id}/hqdefault.jpg` : media.kind === "video" ? media.poster : media.src;
  return <>
    <Image src={src} alt={media.kind === "youtube" ? media.title : media.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" priority={priority} className="object-contain" />
    {media.kind !== "image" && <span className="absolute bottom-3 right-3 rounded-full bg-black/80 px-3 py-1 text-xs text-white">▶ {media.kind === "youtube" ? "Film" : "Video"}</span>}
  </>;
}
