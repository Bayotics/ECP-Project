"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdminPageHeader, AdminModal, Badge, FormField, FormInput, FormSelect, FormTextarea } from "@/components/admin/AdminUI";
import GalleryThumbnail from "@/components/gallery/GalleryThumbnail";
import type { GalleryAlbum, GalleryMedia } from "@/lib/models/gallery";
import { GALLERY_BATCH_LIMIT, galleryFileError } from "@/lib/gallery-input";

type Album = GalleryAlbum & {count:number};
type EventOption = {id:string;title:string;date:string};
type Upload = {id:number;file:File;status:"ready"|"uploading"|"done"|"error";progress:number;message:string;invalid:boolean};
const button = "inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 disabled:opacity-50";
const primary = `${button} border-green-800! bg-green-800! text-white!`;
const message = (error:unknown) => error instanceof Error ? error.message : "The request failed. Please try again.";
async function api<T>(url:string, options?:RequestInit):Promise<T> {
  const response = await fetch(url,{cache:"no-store",...options,headers:{...(options?.body?{"Content-Type":"application/json"}:{}),...options?.headers}});
  const result = await response.json();
  if(!response.ok||!result.ok) throw new Error(result.error||"The request failed. Please try again.");
  return result.data;
}

export default function AdminGallery() {
  const [albums,setAlbums]=useState<Album[]>([]),[events,setEvents]=useState<EventOption[]>([]),[albumId,setAlbumId]=useState("");
  const [photos,setPhotos]=useState<GalleryMedia[]>([]),[total,setTotal]=useState(0),[page,setPage]=useState(0);
  const [loading,setLoading]=useState(true),[photoLoading,setPhotoLoading]=useState(false),[error,setError]=useState("");
  const [editor,setEditor]=useState<Album|"new"|null>(null),[photoEditor,setPhotoEditor]=useState<GalleryMedia|null>(null);
  const [queue,setQueue]=useState<Upload[]>([]),[uploading,setUploading]=useState(false),[notice,setNotice]=useState("");
  const [version,setVersion]=useState(0),[search,setSearch]=useState("");
  const lock=useRef(false),mounted=useRef(true),requests=useRef(new Set<XMLHttpRequest>()),nextUpload=useRef(0);
  useEffect(()=>{ mounted.current=true; const pending=requests.current; return ()=>{mounted.current=false;for(const request of pending)request.abort();}; },[]);
  const refresh=useCallback(()=>setVersion(v=>v+1),[]);
  useEffect(()=>{
    const controller=new AbortController();
    api<{albums:Album[];events:EventOption[]}>("/api/admin/gallery/albums",{signal:controller.signal}).then(data=>{
      setAlbums(data.albums);setEvents(data.events);setAlbumId(id=>id||data.albums[0]?.id||"");setLoading(false);
    }).catch(caught=>{if(!controller.signal.aborted){setError(message(caught));setLoading(false);}});
    return ()=>controller.abort();
  },[version]);
  useEffect(()=>{
    if(!albumId)return;
    const controller=new AbortController();
    const frame=requestAnimationFrame(()=>{setPhotoLoading(true);
    api<{items:GalleryMedia[];total:number}>(`/api/admin/gallery/photos?albumId=${encodeURIComponent(albumId)}&page=${page}`,{signal:controller.signal}).then(data=>{
      setPhotos(data.items);setTotal(data.total);setPhotoLoading(false);
    }).catch(caught=>{if(!controller.signal.aborted){setPhotos([]);setError(message(caught));setPhotoLoading(false);}});
    });
    return ()=>{cancelAnimationFrame(frame);controller.abort();};
  },[albumId,page,version]);
  useEffect(()=>{
    if(!uploading)return;
    const prevent=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",prevent);return ()=>window.removeEventListener("beforeunload",prevent);
  },[uploading]);
  const selected=albums.find(album=>album.id===albumId);
  function selectFiles(files:FileList|null){
    if(!files)return;
    if(files.length>GALLERY_BATCH_LIMIT){setError(`Choose up to ${GALLERY_BATCH_LIMIT} photos at a time.`);return;}
    setError("");setNotice("");
    setQueue(Array.from(files).map(file=>{const problem=galleryFileError(file);return {id:nextUpload.current++,file,status:problem?"error":"ready",progress:0,message:problem??"Ready",invalid:Boolean(problem)};}));
  }
  async function upload(retry=false){
    if(lock.current||!albumId)return;
    const jobs=queue.filter(item=>!item.invalid&&(retry?item.status==="error":item.status==="ready"));
    if(!jobs.length)return;
    lock.current=true;setUploading(true);setError("");setNotice("");
    let next=0;
    const patch=(id:number,values:Partial<Upload>)=>{if(mounted.current)setQueue(rows=>rows.map(row=>row.id===id?{...row,...values}:row));};
    async function worker(){
      while(mounted.current&&next<jobs.length){
        const job=jobs[next++];patch(job.id,{status:"uploading",progress:0,message:"Uploading…"});
        try{
          const result=await new Promise<{duplicate:boolean}>((resolve,reject)=>{
            const request=new XMLHttpRequest();requests.current.add(request);
            request.open("POST","/api/admin/gallery/photos");request.timeout=120000;
            request.upload.onprogress=event=>{if(event.lengthComputable)patch(job.id,{progress:Math.round(event.loaded/event.total*100),message:event.loaded===event.total?"Processing…":"Uploading…"});};
            const finish=()=>requests.current.delete(request);
            request.onload=()=>{finish();try{const body=JSON.parse(request.responseText);if(request.status>=200&&request.status<300&&body.ok)resolve(body.data);else reject(new Error(body.error||`Upload failed (${request.status}).`));}catch{reject(new Error("The upload could not be confirmed. Retry this photo."));}};
            request.onerror=()=>{finish();reject(new Error("Connection lost. Retry this photo."));};
            request.ontimeout=()=>{finish();reject(new Error("The upload timed out. Retry this photo."));};
            request.onabort=()=>{finish();reject(new Error("Upload stopped."));};
            const form=new FormData();form.append("file",job.file);form.append("albumId",albumId);request.send(form);
          });
          patch(job.id,{status:"done",progress:100,message:result.duplicate?"Already in this album":"Uploaded"});
        }catch(caught){patch(job.id,{status:"error",message:message(caught)});}
      }
    }
    await Promise.all(Array.from({length:Math.min(3,jobs.length)},()=>worker()));
    lock.current=false;
    if(mounted.current){setUploading(false);setNotice("Upload batch finished. Check each file below; failed photos can be retried.");setPage(0);refresh();}
  }
  return <div className="space-y-6 text-neutral-900 [color-scheme:light]">
    <AdminPageHeader title="Gallery" subtitle="Upload photos and organize the club’s gallery into event albums." ><div className="flex flex-wrap gap-2"><Link href="/gallery" className={button}>View gallery</Link><button className={primary} disabled={uploading} onClick={()=>setEditor("new")}>Create album</button></div></AdminPageHeader>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error} <button className="underline" onClick={()=>{setError("");refresh();}}>Refresh</button></p>}
    {notice&&<p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">{notice}</p>}
    <section aria-label="Album library" className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1"><FormField label="Find an album"><FormInput aria-label="Find an album" value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search album or event title" /></FormField></div>
        <div className="min-w-0 flex-1"><FormField label="Selected album"><FormSelect aria-label="Selected album" disabled={uploading} value={albumId} onChange={event=>{setAlbumId(event.target.value);setPage(0);setQueue([]);setNotice("");}}><option value="">Choose an album</option>{albums.filter(album=>album.id===albumId||`${album.title} ${events.find(event=>event.id===album.eventId)?.title??""}`.toLowerCase().includes(search.toLowerCase())).map(album=><option key={album.id} value={album.id}>{album.title} ({album.count}) — {album.status}</option>)}</FormSelect></FormField></div>
        {selected&&<button className={button} disabled={uploading} onClick={()=>setEditor(selected)}>Edit album</button>}
      </div>
      {loading?<p className="mt-4">Loading albums…</p>:!albums.length?<p className="mt-4 text-neutral-700">Create your first album to begin uploading.</p>:selected&&<div className="mt-4 space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl text-neutral-950">{selected.title}</h2><Badge value={selected.status}/><span className="text-sm text-neutral-700">{selected.count} items · {selected.category}</span></div>{selected.eventId&&<p className="text-sm text-neutral-700">Event: {events.find(event=>event.id===selected.eventId)?.title??"Event unavailable"}</p>}<p className="text-sm text-neutral-700">{selected.status==="draft"?"This album is a draft. Publish it in Edit album when the photos are ready.":"Published photos in this album are visible on the gallery page."}</p></div>}
    </section>
    {selected&&<>
      <section aria-label="Bulk photo upload" className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="text-lg text-neutral-950">Bulk upload photos</h2>
        <p className="text-sm text-neutral-700">Choose up to 50 JPEG, PNG, WebP or AVIF photos, up to 4 MB each. New photos appear first. Duplicate files in this album are skipped.</p>
        <label htmlFor="gallery-files" className="block text-sm text-neutral-900">Photos for {selected.title}</label>
        <input id="gallery-files" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} onChange={event=>{selectFiles(event.target.files);event.target.value="";}} className="block w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:p-2 file:text-neutral-900" />
        {queue.length>0&&<><div className="flex flex-wrap items-center gap-3"><button className={primary} disabled={uploading||!queue.some(item=>item.status==="ready")} onClick={()=>void upload()}>Upload photos</button><button className={button} disabled={uploading||!queue.some(item=>item.status==="error"&&!item.invalid)} onClick={()=>void upload(true)}>Retry failed uploads</button><span aria-live="polite" className="text-sm text-neutral-700">{queue.filter(item=>item.status==="done").length} of {queue.length} completed</span></div><ul className="max-h-80 divide-y divide-neutral-200 overflow-y-auto">{queue.map(item=><li key={item.id} className="py-3"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="break-all text-neutral-900">{item.file.name}</span><span className={item.status==="error"?"text-red-800":"text-neutral-700"}>{item.message}</span></div>{item.status==="uploading"&&<progress aria-label={`Uploading ${item.file.name}`} value={item.progress} max={100} className="mt-2 w-full accent-green-800" />}</li>)}</ul></>}
      </section>
      <section aria-label="Album photos" className="space-y-4">
        <div className="flex flex-wrap justify-between gap-3"><h2 className="text-xl text-neutral-950">Album media · {total}</h2><p className="text-sm text-neutral-700">Newest added first</p></div>
        {photoLoading?<p>Loading photos…</p>:photos.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{photos.map(photo=><button key={photo.id} disabled={uploading} onClick={()=>setPhotoEditor(photo)} aria-label={`Edit ${photo.media.kind==="youtube"?photo.media.title:photo.media.alt}`} className="cursor-pointer disabled:cursor-not-allowed overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"><div className="relative aspect-[4/3] bg-neutral-100"><GalleryThumbnail media={photo.media}/></div><div className="space-y-2 p-4"><Badge value={photo.status}/><p className="truncate text-sm text-neutral-900">{photo.media.caption||(photo.media.kind==="youtube"?photo.media.title:photo.media.alt)}</p><p className="text-xs text-neutral-700">Added {new Date(photo.addedAt).toLocaleDateString()}</p></div></button>)}</div>:<p className="rounded-xl bg-white p-5 text-neutral-700">No media in this album. Add photos above.</p>}
        <div className="flex items-center justify-between"><button className={button} disabled={page===0||photoLoading||uploading} onClick={()=>setPage(p=>p-1)}>Previous</button><span className="text-sm">{total?`Page ${page+1} of ${Math.ceil(total/36)}`:"0 photos"}</span><button className={button} disabled={(page+1)*36>=total||photoLoading||uploading} onClick={()=>setPage(p=>p+1)}>Next</button></div>
      </section>
    </>}
    {editor&&<AlbumEditor key={editor==="new"?"new":editor.id} album={editor==="new"?null:editor} events={events} onClose={()=>setEditor(null)} onSave={album=>{setAlbumId(album.id);setPage(0);setEditor(null);setError("");setNotice("Album saved.");refresh();}}/>}
    {photoEditor&&<PhotoEditor photo={photoEditor} albums={albums} onClose={()=>setPhotoEditor(null)} onSave={()=>{setPhotoEditor(null);setNotice("Photo updated.");refresh();}}/>}
  </div>;
}

function AlbumEditor({album,events,onClose,onSave}:{album:Album|null;events:EventOption[];onClose:()=>void;onSave:(album:GalleryAlbum)=>void}){
  const [form,setForm]=useState({title:album?.title??"",description:album?.description??"",category:album?.category??"Club life",eventId:album?.eventId??"",status:album?.status??"draft"});
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function save(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError("");try{onSave(await api<GalleryAlbum>(`/api/admin/gallery/albums${album?`/${encodeURIComponent(album.id)}`:""}`,{method:album?"PATCH":"POST",body:JSON.stringify(form)}));}catch(caught){setError(message(caught));setBusy(false);}}
  return <AdminModal open title={album?"Edit album":"Create album"} onClose={()=>{if(!busy)onClose();}}><form onSubmit={save} className="space-y-4">
    {error&&<p role="alert" className="text-red-800">{error}</p>}
    <FormField label="Album title"><FormInput aria-label="Album title" required maxLength={150} value={form.title} onChange={event=>setForm({...form,title:event.target.value})}/></FormField>
    <FormField label="Description"><FormTextarea aria-label="Description" maxLength={2000} value={form.description} onChange={event=>setForm({...form,description:event.target.value})}/></FormField>
    <FormField label="Category"><FormInput aria-label="Category" required maxLength={80} value={form.category} onChange={event=>setForm({...form,category:event.target.value})}/></FormField>
    <FormField label="Event (optional)"><FormSelect aria-label="Event (optional)" value={form.eventId} onChange={event=>setForm({...form,eventId:event.target.value})}><option value="">No event</option>{album?.eventId&&!events.some(event=>event.id===album.eventId)&&<option value={album.eventId}>Previous event unavailable</option>}{events.map(event=><option key={event.id} value={event.id}>{event.title}{event.date?` — ${event.date.slice(0,10)}`:""}</option>)}</FormSelect></FormField>
    <FormField label="Visibility"><FormSelect aria-label="Visibility" value={form.status} onChange={event=>setForm({...form,status:event.target.value as GalleryAlbum["status"]})}><option value="draft">Draft — hidden from public gallery</option><option value="published">Published — visible in public gallery</option></FormSelect></FormField>
    <div className="flex gap-3"><button type="submit" disabled={busy} className={primary}>{busy?"Saving…":"Save album"}</button><button type="button" disabled={busy} className={button} onClick={onClose}>Cancel</button></div>
  </form></AdminModal>;
}

function PhotoEditor({photo,albums,onClose,onSave}:{photo:GalleryMedia;albums:Album[];onClose:()=>void;onSave:()=>void}){
  const [form,setForm]=useState({caption:photo.media.caption??"",alt:photo.media.kind==="youtube"?photo.media.title:photo.media.alt,albumId:photo.albumId,status:photo.status});
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function save(event:React.FormEvent){event.preventDefault();if(busy)return;setBusy(true);setError("");try{await api(`/api/admin/gallery/photos/${encodeURIComponent(photo.id)}`,{method:"PATCH",body:JSON.stringify(form)});onSave();}catch(caught){setError(message(caught));setBusy(false);}}
  return <AdminModal open title="Edit gallery media" onClose={()=>{if(!busy)onClose();}}><form onSubmit={save} className="space-y-4">
    <div className="relative aspect-video rounded-xl bg-neutral-100"><GalleryThumbnail media={photo.media}/></div>
    {error&&<p role="alert" className="text-red-800">{error}</p>}
    <FormField label="Photo description / video title"><FormInput aria-label="Photo description / video title" required maxLength={300} value={form.alt} onChange={event=>setForm({...form,alt:event.target.value})}/></FormField>
    <FormField label="Caption"><FormTextarea aria-label="Caption" maxLength={500} value={form.caption} onChange={event=>setForm({...form,caption:event.target.value})}/></FormField>
    <FormField label="Album"><FormSelect aria-label="Album" value={form.albumId} onChange={event=>setForm({...form,albumId:event.target.value})}>{albums.map(album=><option key={album.id} value={album.id}>{album.title}</option>)}</FormSelect></FormField>
    <FormField label="Photo visibility"><FormSelect aria-label="Photo visibility" value={form.status} onChange={event=>setForm({...form,status:event.target.value as GalleryMedia["status"]})}><option value="published">Published (when album is published)</option><option value="hidden">Hidden</option></FormSelect></FormField>
    <div className="flex gap-3"><button type="submit" disabled={busy} className={primary}>{busy?"Saving…":"Save photo"}</button><button type="button" disabled={busy} className={button} onClick={onClose}>Cancel</button></div>
  </form></AdminModal>;
}
