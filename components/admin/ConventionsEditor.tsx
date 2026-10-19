"use client";

import { useEffect, useState } from "react";
import { Btn, FormField, FormInput } from "@/components/admin/AdminUI";
import { ConventionThumbnail } from "@/components/home/ConventionsSection";
import { apiRequest } from "@/lib/client/api";
import { getYouTubeVideoId, validateConventions, youtubeVideoUrl, type Convention, type ConventionsContent } from "@/lib/content/conventions";

function swap<T>(items: T[], from: number, to: number): T[] {
  const result = [...items];
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}

export default function ConventionsEditor() {
  const [conventions, setConventions] = useState<Convention[]>([]);
  const [saved, setSaved] = useState<Convention[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ConventionsContent>("/api/site-content/conventions", { signal: controller.signal }).then(content => {
      if (controller.signal.aborted) return;
      setConventions(content.conventions); setSaved(content.conventions); setLoaded(true); setError("");
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load conventions."); });
    return () => controller.abort();
  }, [attempt]);
  const dirty = JSON.stringify(conventions) !== JSON.stringify(saved);
  function change(next: Convention[]) { setConventions(next); setSuccess(""); setError(""); }
  function edit(id: string, patch: Partial<Convention>) { change(conventions.map(item => item.id === id ? { ...item, ...patch } : item)); }
  async function save() {
    setError(""); setSuccess("");
    const validation = validateConventions(conventions);
    if ("error" in validation) { setError(validation.error); return; }
    setSaving(true);
    try {
      const content = await apiRequest<ConventionsContent>("/api/site-content/conventions", { method: "PUT", body: JSON.stringify(validation) });
      setConventions(content.conventions); setSaved(content.conventions);
      setSuccess("Convention videos saved. They will appear when visitors open or refresh the homepage.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save conventions. Your changes have been kept."); }
    finally { setSaving(false); }
  }
  return <section aria-labelledby="conventions-editor-heading" className="space-y-5 border-t border-neutral-300 pt-8">
    <div>
      <h2 id="conventions-editor-heading" className="text-xl font-semibold text-neutral-950">Our Conventions</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-700">Add the club’s convention videos here. Paste a YouTube link or video ID; the thumbnail is generated automatically. Conventions and videos appear in the order below.</p>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{!loaded && <button onClick={() => setAttempt(value => value + 1)} className="ml-3 underline">Retry</button>}</p>}
    {success && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</p>}
    {!loaded ? <p className="text-sm text-neutral-700">Loading conventions…</p> : <fieldset disabled={saving} className="min-w-0 space-y-5">
      <legend className="sr-only">Convention video archive</legend>
      {conventions.map((convention, index) => <details key={convention.id} open={index === 0 || undefined} className="rounded-2xl border border-neutral-300 bg-white p-5">
        <summary className="cursor-pointer text-base font-semibold text-neutral-950">{convention.title || "New convention"} · {convention.year || "Year required"} ({convention.videos.length} {convention.videos.length === 1 ? "video" : "videos"})</summary>
        <div className="mt-5 space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
            <FormField label="Convention title *"><FormInput aria-label={`Convention ${index + 1} title`} maxLength={200} value={convention.title} onChange={event => edit(convention.id, { title: event.target.value })} /></FormField>
            <FormField label="Year *"><FormInput aria-label={`Convention ${index + 1} year`} type="number" min={1900} max={2100} value={convention.year || ""} onChange={event => edit(convention.id, { year: Number(event.target.value) })} /></FormField>
          </div>
          <FormField label="Location *"><FormInput aria-label={`Convention ${index + 1} location`} maxLength={200} value={convention.location} onChange={event => edit(convention.id, { location: event.target.value })} /></FormField>
          <div className="space-y-4">
            {convention.videos.map((video, videoIndex) => {
              const videoId = getYouTubeVideoId(video.videoId);
              return <div key={videoIndex} className="grid min-w-0 gap-4 rounded-xl border border-neutral-200 p-4 md:grid-cols-[10rem_1fr]">
                <div className="overflow-hidden rounded-lg self-start">{videoId ? <a href={youtubeVideoUrl(videoId)} target="_blank" rel="noopener noreferrer" aria-label={`Preview ${video.title || `video ${videoIndex + 1}`} on YouTube (opens in a new tab)`}><ConventionThumbnail key={videoId} videoId={videoId} /></a> : <p className="flex aspect-video items-center justify-center bg-neutral-100 p-3 text-center text-xs text-neutral-600">Enter a YouTube link to preview its thumbnail.</p>}</div>
                <div className="min-w-0 space-y-3">
                  <FormField label="Video title *"><FormInput aria-label={`Convention ${index + 1} video ${videoIndex + 1} title`} value={video.title} maxLength={200} onChange={event => edit(convention.id, { videos: convention.videos.map((item, position) => position === videoIndex ? { ...item, title: event.target.value } : item) })} /></FormField>
                  <FormField label="YouTube link or video ID *"><FormInput aria-label={`Convention ${index + 1} video ${videoIndex + 1} YouTube link or ID`} value={video.videoId} maxLength={2048} onChange={event => edit(convention.id, { videos: convention.videos.map((item, position) => position === videoIndex ? { ...item, videoId: event.target.value } : item) })} /></FormField>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <button type="button" disabled={videoIndex === 0} onClick={() => edit(convention.id, { videos: swap(convention.videos, videoIndex, videoIndex - 1) })} className="min-h-9 text-green-800 underline disabled:opacity-40">Move video {videoIndex + 1} up</button>
                    <button type="button" disabled={videoIndex === convention.videos.length - 1} onClick={() => edit(convention.id, { videos: swap(convention.videos, videoIndex, videoIndex + 1) })} className="min-h-9 text-green-800 underline disabled:opacity-40">Move video {videoIndex + 1} down</button>
                    <button type="button" onClick={() => edit(convention.id, { videos: convention.videos.filter((_, position) => position !== videoIndex) })} className="min-h-9 text-red-800 underline">Remove video {videoIndex + 1}</button>
                  </div>
                </div>
              </div>;
            })}
          </div>
          <Btn variant="secondary" disabled={convention.videos.length >= 30} onClick={() => edit(convention.id, { videos: [...convention.videos, { title: "", videoId: "" }] })}>Add video</Btn>
          <div className="flex flex-wrap gap-4 border-t border-neutral-200 pt-4 text-sm">
            <button type="button" disabled={index === 0} onClick={() => change(swap(conventions, index, index - 1))} className="min-h-10 text-green-800 underline disabled:opacity-40">Move convention up</button>
            <button type="button" disabled={index === conventions.length - 1} onClick={() => change(swap(conventions, index, index + 1))} className="min-h-10 text-green-800 underline disabled:opacity-40">Move convention down</button>
            <button type="button" onClick={() => change(conventions.filter(item => item.id !== convention.id))} className="min-h-10 text-red-800 underline">Remove convention</button>
          </div>
        </div>
      </details>)}
      {conventions.length === 0 && <p className="text-sm text-neutral-700">No conventions listed. Saving this empty list hides the homepage section.</p>}
      <Btn variant="secondary" disabled={conventions.length >= 30} onClick={() => change([...conventions, { id: crypto.randomUUID(), title: "", year: new Date().getFullYear(), location: "", videos: [{ title: "", videoId: "" }] }])}>Add convention</Btn>
      <div className="flex flex-wrap items-center gap-3">
        <Btn variant="primary" disabled={!dirty} onClick={() => void save()}>{saving ? "Saving…" : "Save conventions"}</Btn>
        <Btn variant="secondary" disabled={!dirty} onClick={() => { setConventions(saved); setError(""); setSuccess(""); }}>Discard convention changes</Btn>
        <span className="text-sm text-neutral-700">{dirty ? "You have unsaved convention changes." : "All convention changes saved."}</span>
      </div>
    </fieldset>}
  </section>;
}
