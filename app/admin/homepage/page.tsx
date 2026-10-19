"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader, Btn, FormField, FormInput, FormTextarea } from "@/components/admin/AdminUI";
import ImageUploader from "@/components/media/ImageUploader";
import WhatWeDoCardFace from "@/components/home/WhatWeDoCardFace";
import ConventionsEditor from "@/components/admin/ConventionsEditor";
import { apiRequest } from "@/lib/client/api";
import { DEFAULT_WHAT_WE_DO, validateWhatWeDo, type WhatWeDoContent, type WhatWeDoSlide } from "@/lib/content/what-we-do";

export default function AdminHomepagePage() {
  const [slides, setSlides] = useState<WhatWeDoSlide[]>(DEFAULT_WHAT_WE_DO);
  const [saved, setSaved] = useState<WhatWeDoSlide[]>(DEFAULT_WHAT_WE_DO);
  const [selected, setSelected] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<WhatWeDoContent>("/api/site-content/what-we-do", { signal: controller.signal }).then(content => {
      if (controller.signal.aborted) return;
      setError("");
      setSlides(content.slides); setSaved(content.slides); setLoaded(true);
    }).catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Could not load homepage slides."); });
    return () => controller.abort();
  }, [loadAttempt]);

  const dirty = JSON.stringify(slides) !== JSON.stringify(saved);
  const current = slides[selected];
  function edit(patch: Partial<WhatWeDoSlide>) {
    setSlides(previous => previous.map((slide, index) => index === selected ? { ...slide, ...patch } : slide));
    setSuccess("");
  }
  async function save() {
    setError(""); setSuccess("");
    const validation = validateWhatWeDo(slides);
    if ("error" in validation) { setError(validation.error); return; }
    setSaving(true);
    try {
      const content = await apiRequest<WhatWeDoContent>("/api/site-content/what-we-do", { method: "PUT", body: JSON.stringify(validation) });
      setSlides(content.slides); setSaved(content.slides);
      setSuccess("Homepage slides saved. Visitors will see the updated images and descriptions when they open or refresh the homepage.");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save homepage slides. Your changes have been kept."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Homepage" subtitle="Manage the What We Do carousel and Our Conventions videos." />
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{!loaded && <button onClick={() => { setError(""); setLoadAttempt(attempt => attempt + 1); }} className="ml-3 underline">Retry</button>}</div>}
      {success && <p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">{success}</p>}
      {!loaded ? <p className="text-sm text-neutral-800">Loading homepage slides…</p> : <>
        <div role="group" aria-label="Select a What We Do slide" className="flex flex-wrap gap-2">
          {slides.map((slide, index) => <button key={slide.id} type="button" aria-pressed={index === selected} onClick={() => setSelected(index)} className={`rounded-full border px-5 py-2.5 text-sm ${index === selected ? "border-green-800 bg-green-800 text-white" : "border-neutral-300 bg-white text-neutral-900"}`}>{slide.title}</button>)}
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <fieldset disabled={saving} className="min-w-0 space-y-5 rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6">
            <legend className="px-2 text-lg font-semibold text-neutral-950">{current.title} slide</legend>
            <ImageUploader value={current.imageUrl} onChange={imageUrl => edit({ imageUrl })} folder="gallery" label={`${current.title} image`} shape="wide" fit="fill" hint="Upload a JPEG, PNG, WebP or AVIF, up to 8 MB. Images stretch to fill the entire image area without cropping or repetition." />
            <FormField label="Image description *">
              <FormInput aria-label="Image description" value={current.imageAlt} maxLength={200} onChange={event => edit({ imageAlt: event.target.value })} />
              <p className="mt-1 text-xs text-neutral-600">Describe the image for visitors using screen readers.</p>
            </FormField>
            <FormField label="Slide description *">
              <FormTextarea aria-label="Slide description" rows={6} maxLength={600} value={current.description} onChange={event => edit({ description: event.target.value })} />
              <p className="mt-1 text-xs text-neutral-600">{current.description.length}/600 characters</p>
            </FormField>
          </fieldset>
          <section aria-label="Slide preview" className="min-w-0">
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Preview</h2>
            {current.imageUrl ? <div className="grid overflow-hidden rounded-3xl border border-neutral-300"><WhatWeDoCardFace item={current} preview /></div> : <p className="rounded-3xl border border-neutral-300 p-6 text-sm text-neutral-800">Choose an image to preview this slide.</p>}
          </section>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Btn variant="primary" onClick={() => void save()} disabled={saving || !dirty}>{saving ? "Saving…" : "Save changes"}</Btn>
          <Btn variant="secondary" onClick={() => { setSlides(saved); setSuccess(""); setError(""); }} disabled={saving || !dirty}>Discard changes</Btn>
          <span className="text-sm text-neutral-700">{dirty ? "You have unsaved changes." : "All changes saved."}</span>
        </div>
      </>}
      <ConventionsEditor />
    </div>
  );
}
