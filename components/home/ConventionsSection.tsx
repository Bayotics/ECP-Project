"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { apiRequest } from "@/lib/client/api";
import { CONVENTION_HISTORY_URL, youtubeThumbnailUrl, youtubeVideoUrl, type Convention, type ConventionsContent } from "@/lib/content/conventions";

export function ConventionThumbnail({ videoId }: { videoId: string }) {
  const [failed, setFailed] = useState(false);
  return <div className="relative aspect-video overflow-hidden bg-neutral-950">
    {!failed && <Image src={youtubeThumbnailUrl(videoId)} alt="" fill sizes="(max-width: 640px) 85vw, (max-width: 1024px) 45vw, 380px" className="object-contain" onError={() => setFailed(true)} />}
    {failed && <span className="absolute inset-x-0 bottom-3 text-center text-xs text-white/80">Preview unavailable</span>}
    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/10">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-800 text-white shadow-lg transition-colors group-hover:bg-green-700">
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 h-6 w-6"><path d="M8 5v14l11-7z" /></svg>
      </span>
    </span>
  </div>;
}

function ConventionRow({ convention }: { convention: Convention }) {
  const rail = useRef<HTMLUListElement>(null);
  function scroll(direction: number) {
    const element = rail.current;
    if (element) element.scrollBy({ left: direction * element.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <article aria-labelledby={`convention-${convention.id}`} className="min-w-0">
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-800">{convention.year} · {convention.location}</p>
        <h3 id={`convention-${convention.id}`} className="max-w-3xl text-xl font-semibold leading-snug text-neutral-950 sm:text-2xl">{convention.title}</h3>
        <p className="mt-2 text-sm text-neutral-600">{convention.videos.length} {convention.videos.length === 1 ? "video" : "videos"}</p>
      </div>
      {convention.videos.length > 1 && <div className="flex shrink-0 gap-2">
        <button type="button" aria-label={`Previous videos: ${convention.year} ${convention.location}`} onClick={() => scroll(-1)} className="h-11 w-11 rounded-full border border-neutral-300 text-xl text-green-900 transition-colors hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800">←</button>
        <button type="button" aria-label={`Next videos: ${convention.year} ${convention.location}`} onClick={() => scroll(1)} className="h-11 w-11 rounded-full border border-neutral-300 text-xl text-green-900 transition-colors hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800">→</button>
      </div>}
    </div>
    <ul ref={rail} aria-label={`${convention.year} convention videos`} tabIndex={0} className="flex snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain rounded-2xl pb-5 focus-visible:outline-2 focus-visible:outline-green-800">
      {convention.videos.map(video => <li key={video.videoId} className="min-w-0 basis-[85%] shrink-0 snap-start sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]">
        <a href={youtubeVideoUrl(video.videoId)} target="_blank" rel="noopener noreferrer" className="group block h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800">
          <ConventionThumbnail videoId={video.videoId} />
          <div className="p-5">
            <h4 className="min-h-12 text-base font-semibold leading-relaxed text-neutral-950">{video.title}</h4>
            <p className="mt-4 text-sm font-semibold text-green-800">Watch on YouTube <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></p>
          </div>
        </a>
      </li>)}
    </ul>
  </article>;
}

export default function ConventionsSection() {
  const [conventions, setConventions] = useState<Convention[] | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ConventionsContent>("/api/site-content/conventions", { signal: controller.signal }).then(content => {
      if (!controller.signal.aborted) { setConventions(content.conventions); setError(""); }
    }).catch(() => { if (!controller.signal.aborted) setError("Convention videos are temporarily unavailable."); });
    return () => controller.abort();
  }, [attempt]);
  if (!error && conventions?.length === 0) return null;
  return <section id="our-conventions" aria-labelledby="conventions-heading" className="bg-[#f4f7f3] px-4 py-20 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="mb-12 max-w-2xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-green-800">Our shared history</p>
        <h2 id="conventions-heading" className="text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">Our Conventions</h2>
        <p className="mt-5 text-base leading-relaxed text-neutral-700">Relive the conversations, celebrations and connections from Eko Club International conventions.</p>
      </div>
      {error ? <div role="alert" className="rounded-2xl border border-neutral-300 bg-white p-6 text-neutral-800">{error} <button onClick={() => setAttempt(value => value + 1)} className="ml-2 font-semibold text-green-800 underline">Retry</button></div> : conventions === null ? <p role="status" className="text-sm text-neutral-700">Loading convention videos…</p> : <div className="space-y-12">{conventions.map(convention => <ConventionRow key={convention.id} convention={convention} />)}</div>}
      <a href={CONVENTION_HISTORY_URL} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-green-900 underline decoration-green-800/40 underline-offset-4 hover:decoration-green-800">Explore the full convention history <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
    </div>
  </section>;
}
