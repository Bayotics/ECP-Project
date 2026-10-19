"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { HEADER_OFFSET } from "@/components/layout/Header";
import MediaViewer from "@/components/media/MediaViewer";
import GalleryThumbnail from "@/components/gallery/GalleryThumbnail";
import type { GalleryResponse } from "@/lib/models/gallery";

const control="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800";
export default function Gallery(){
  const [data,setData]=useState<GalleryResponse|null>(null),[loading,setLoading]=useState(true),[more,setMore]=useState(false),[error,setError]=useState("");
  const [albumId,setAlbumId]=useState(""),[category,setCategory]=useState(""),[kind,setKind]=useState("all"),[view,setView]=useState<"recent"|"albums">("recent");
  const [viewer,setViewer]=useState<number|null>(null),[version,setVersion]=useState(0);
  const generation=useRef(0),moreLock=useRef(false);
  const closeViewer=useCallback(()=>setViewer(null),[]);
  const query=useCallback(()=>new URLSearchParams({albumId,category,kind}),[albumId,category,kind]);
  useEffect(()=>{
    const controller=new AbortController();generation.current++;moreLock.current=false;
    const frame=requestAnimationFrame(()=>{setLoading(true);setMore(false);setError("");setViewer(null);
    fetch(`/api/gallery?${query()}`,{cache:"no-store",signal:controller.signal}).then(async response=>{
      const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.error||"The gallery could not be loaded.");return result.data as GalleryResponse;
    }).then(result=>{setData(result);setLoading(false);}).catch(caught=>{if(!controller.signal.aborted){setError(caught instanceof Error?caught.message:"The gallery could not be loaded.");setData(null);setLoading(false);}});
    });
    return ()=>{cancelAnimationFrame(frame);controller.abort();};
  },[query,version]);
  async function loadMore(){
    if(!data?.nextCursor||moreLock.current)return;
    const current=generation.current;moreLock.current=true;setMore(true);setError("");
    const params=query();params.set("cursor",data.nextCursor);
    try{
      const response=await fetch(`/api/gallery?${params}`,{cache:"no-store"}),result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"More photos could not be loaded.");
      if(current===generation.current)setData(previous=>previous?{...result.data,items:[...previous.items,...(result.data as GalleryResponse).items.filter(item=>!previous.items.some(existing=>existing.id===item.id))]}:result.data);
    }catch(caught){if(current===generation.current)setError(caught instanceof Error?caught.message:"More photos could not be loaded.");}
    finally{if(current===generation.current){moreLock.current=false;setMore(false);}}
  }
  const albums=data?.albums??[],selected=albums.find(album=>album.id===albumId);
  const visibleAlbums=albums.filter(album=>!category||album.category===category);
  const hero=albums.find(album=>album.cover?.kind==="image")?.cover;
  function chooseAlbum(id:string){setAlbumId(id);setView("recent");setViewer(null);}
  return <div className="bg-white text-neutral-950 [color-scheme:light]">
    <section className={`relative isolate overflow-hidden bg-neutral-950 ${HEADER_OFFSET.padding}`}>
      {hero?.kind==="image"&&<div className="absolute inset-0 -z-10"><Image src={hero.src} alt="" fill priority sizes="100vw" className="object-cover"/><div className="absolute inset-0 bg-black/80"/></div>}
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.4fr_1fr] lg:px-12 lg:py-28">
        <div><p className="mb-5 text-xs tracking-[0.24em] text-white/80 uppercase">Eko Club Philadelphia · Gallery</p><h1 className="max-w-3xl text-5xl leading-[1.08] font-medium tracking-tight text-white sm:text-7xl">Our community,<br/>in the frame.</h1><p className="mt-7 max-w-xl text-base leading-relaxed text-white/85">The people, projects and celebrations that bring us together. Explore photographs and films from our club’s life.</p><a href="#gallery-library" className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm text-neutral-950">Explore the gallery ↓</a></div>
        <div className="self-end rounded-3xl border border-white/25 bg-white/5 p-7 text-white"><p className="text-xs tracking-[0.2em] text-white/80 uppercase">The club’s collection</p>{data?<dl className="mt-7 grid grid-cols-2 gap-8">{[["Albums",data.counts.albums],["Photographs",data.counts.photos],["Video clips",data.counts.videos],["Films",data.counts.films]].map(([label,count])=><div key={label}><dt className="text-sm text-white/85">{label}</dt><dd className="mt-1 text-4xl tracking-tight text-white">{count}</dd></div>)}</dl>:<p className="mt-5 text-white/85">{error?"The collection is temporarily unavailable.":"Loading the collection…"}</p>}</div>
      </div>
      <div className="flex h-1.5" aria-hidden="true">{["#009b72","#e03638","#2376b7","#edb522"].map(color=><span key={color} className="flex-1" style={{background:color}}/>)}</div>
    </section>
    <section id="gallery-library" className="mx-auto max-w-7xl scroll-mt-28 px-6 py-16 lg:px-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="mb-3 text-xs tracking-[0.2em] text-green-800 uppercase">Photographs & films</p><h2 className="text-3xl font-medium tracking-tight sm:text-4xl">{selected?selected.title:view==="albums"?"Explore our albums":"The latest additions"}</h2><p className="mt-3 text-sm text-neutral-700">{selected?.description||"Newest added first. Open any photograph to see the full image."}</p>{selected?.event&&<Link className="mt-3 inline-block text-sm text-green-800 underline" href={selected.event.url}>View event: {selected.event.title} →</Link>}{selected?.storyUrl&&!selected.event&&<Link className="mt-3 inline-block text-sm text-green-800 underline" href={selected.storyUrl}>Read the story →</Link>}</div>
        <div role="group" aria-label="Gallery view" className="flex flex-wrap gap-2"><button className={`${control} ${view==="recent"?"border-green-800! bg-green-800! text-white!":""}`} aria-pressed={view==="recent"} onClick={()=>setView("recent")}>Recent photos & films</button><button className={`${control} ${view==="albums"?"border-green-800! bg-green-800! text-white!":""}`} aria-pressed={view==="albums"} onClick={()=>{setView("albums");setAlbumId("");}}>Albums</button></div>
      </div>
      <div className="mb-8 flex flex-wrap gap-4">
        <label className="flex min-w-0 flex-col gap-2 text-sm text-neutral-900">Category<select aria-label="Gallery category" className={control} value={category} onChange={event=>{setCategory(event.target.value);setAlbumId("");}}><option value="">All categories</option>{Array.from(new Set(albums.map(album=>album.category))).sort().map(value=><option key={value}>{value}</option>)}</select></label>
        {view==="recent"&&<><label className="flex min-w-0 max-w-full flex-col gap-2 text-sm text-neutral-900">Album<select aria-label="Gallery album" className={`${control} max-w-full`} value={albumId} onChange={event=>chooseAlbum(event.target.value)}><option value="">All albums</option>{visibleAlbums.map(album=><option key={album.id} value={album.id}>{album.title}</option>)}</select></label><label className="flex flex-col gap-2 text-sm text-neutral-900">Media<select aria-label="Gallery media" className={control} value={kind} onChange={event=>setKind(event.target.value)}><option value="all">Everything</option><option value="photo">Photographs</option><option value="video">Video & films</option></select></label></>}
      </div>
      {error&&<div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">{error} <button className="ml-2 underline" onClick={()=>setVersion(v=>v+1)}>Try again</button></div>}
      {loading?<p role="status" className="py-12 text-neutral-700">Loading gallery…</p>:!error||data?<>
        {view==="albums"?<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{visibleAlbums.map(album=><button key={album.id} onClick={()=>chooseAlbum(album.id)} className="cursor-pointer overflow-hidden rounded-3xl border border-neutral-200 bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"><div className="relative aspect-[4/3] bg-neutral-100">{album.cover&&<GalleryThumbnail media={album.cover}/>}</div><div className="p-6"><p className="mb-2 text-xs text-green-800 uppercase">{album.category}</p><h3 className="text-xl text-neutral-950">{album.title}</h3><p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700">{album.description}</p><p className="mt-4 text-sm text-green-800">{album.count} items · Open album →</p></div></button>)}</div>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data?.items.map((item,index)=><button key={item.id} onClick={()=>setViewer(index)} aria-label={`Open ${item.media.kind==="youtube"?item.media.title:item.media.alt}`} className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"><div className="relative aspect-[4/3] bg-neutral-100"><GalleryThumbnail media={item.media}/></div><div className="p-4"><p className="text-xs text-green-800">{item.albumTitle}</p><p className="mt-2 line-clamp-2 text-sm text-neutral-900">{item.media.caption||(item.media.kind==="youtube"?item.media.title:item.media.alt)}</p></div></button>)}</div>}
        {(view==="albums"?!visibleAlbums.length:!data?.items.length)&&<p className="rounded-2xl bg-neutral-100 p-8 text-neutral-700">No published media match this selection.</p>}
        {view==="recent"&&data?.nextCursor&&<div className="mt-10 text-center"><button className={`${control} border-green-800! bg-green-800! px-7! py-3! text-white!`} disabled={more} onClick={()=>void loadMore()}>{more?"Loading…":"Load more"}</button></div>}
      </>:null}
    </section>
    <section className="border-t border-neutral-200 bg-neutral-50 px-6 py-14 text-center"><h2 className="text-2xl text-neutral-950">Be part of the next chapter.</h2><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/events" className={control}>Upcoming events →</Link><Link href="/volunteer" className={`${control} border-green-800! bg-green-800! text-white!`}>Volunteer with us →</Link></div></section>
    <MediaViewer items={data?.items.map(item=>item.media)??[]} index={viewer} onClose={closeViewer} onIndex={setViewer}/>
  </div>;
}
