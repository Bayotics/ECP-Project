"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useIsClient } from "@/components/gsap/useReveal";
import { cn } from "@/utils/cn";
import styles from "./AIChatWidget.module.css";
import { ASSISTANT_HISTORY_LIMIT, ASSISTANT_MESSAGE_LIMIT, type AssistantLink, type AssistantReply, type AssistantTurn } from "@/lib/assistant";

type Message = AssistantTurn & {id:string;links?:AssistantLink[]};
const welcome:Message={id:"welcome",role:"assistant",content:"Hello! I’m the ECP assistant. I can help with club information, public documents and finding your way around the website."};
const suggestions=["How do I become a member?","Download the constitution","What events are coming up?","How can I volunteer?"];
const button="cursor-pointer rounded-lg px-2 py-1 text-xs text-white hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
function ResourceLinks({links}:{links:AssistantLink[]}){
  const style="inline-block cursor-pointer break-words text-sm text-green-900 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800";
  return <ul className="mt-3 space-y-2">{links.map(link=><li key={link.url}>{link.kind==="document"?<a href={link.url} target="_blank" rel="noopener noreferrer" className={style}>↓ {link.title}</a>:<Link href={link.url} className={style}>→ {link.title}</Link>}</li>)}</ul>;
}
function history(messages:Message[]):AssistantTurn[]{
  const turns=messages.filter(message=>message.id!=="welcome").slice(-ASSISTANT_HISTORY_LIMIT).map(({role,content})=>({role,content:content.slice(0,ASSISTANT_MESSAGE_LIMIT)}));
  while(turns.reduce((size,turn)=>size+turn.content.length,0)>8000)turns.shift();
  return turns;
}
export default function AIChatWidget(){
  const hydrated=useIsClient();
  const [open,setOpen]=useState(false),[messages,setMessages]=useState<Message[]>([welcome]),[input,setInput]=useState("");
  const [loading,setLoading]=useState(false),[error,setError]=useState(""),[unread,setUnread]=useState(0);
  const [available,setAvailable]=useState<boolean|null>(null),[documents,setDocuments]=useState<AssistantLink[]>([]);
  // The root layout survives client navigation. Memory resets on a full refresh,
  // so dismissing this invitation never follows someone into their next visit.
  const [invitationDismissed,setInvitationDismissed]=useState(false),[invitationSeconds,setInvitationSeconds]=useState(60);
  const invitationDeadline=useRef<number|null>(null);
  const invitationExpired=invitationSeconds===0;
  const inputRef=useRef<HTMLInputElement>(null),toggleRef=useRef<HTMLButtonElement>(null),logRef=useRef<HTMLDivElement>(null);
  const active=useRef<AbortController|null>(null),openRef=useRef(false),busy=useRef(false);
  const close=useCallback(()=>{setOpen(false);openRef.current=false;toggleRef.current?.focus();},[]);
  useEffect(()=>{
    if(invitationDismissed||invitationExpired)return;
    invitationDeadline.current??=Date.now()+60000;
    const update=()=>setInvitationSeconds(Math.max(0,Math.ceil((invitationDeadline.current!-Date.now())/1000)));
    const interval=setInterval(update,1000);
    const timeout=setTimeout(update,Math.max(0,invitationDeadline.current-Date.now()));
    document.addEventListener("visibilitychange",update);
    return ()=>{clearInterval(interval);clearTimeout(timeout);document.removeEventListener("visibilitychange",update);};
  },[invitationDismissed,invitationExpired]);
  useEffect(()=>()=>active.current?.abort(),[]);
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController(),timer=setTimeout(()=>inputRef.current?.focus(),50);
    fetch("/api/assistant",{cache:"no-store",signal:controller.signal}).then(async response=>{
      const result=await response.json();if(!response.ok||!result.ok)throw Error();return result.data;
    }).then(data=>{setAvailable(data.available);setDocuments(data.documents);}).catch(()=>{if(!controller.signal.aborted)setAvailable(false);});
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape")close();};window.addEventListener("keydown",key);
    return ()=>{controller.abort();clearTimeout(timer);window.removeEventListener("keydown",key);};
  },[open,close]);
  useEffect(()=>{if(open)logRef.current?.scrollTo({top:logRef.current.scrollHeight,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});},[messages,loading,error,open]);
  function clear(){active.current?.abort();active.current=null;busy.current=false;setMessages([welcome]);setError("");setLoading(false);setInput("");inputRef.current?.focus();}
  async function send(text?:string,retry=false){
    const content=(text??input).trim();if(!content||busy.current||content.length>ASSISTANT_MESSAGE_LIMIT)return;
    const next=retry?messages:[...messages,{id:crypto.randomUUID(),role:"user" as const,content}];
    const controller=new AbortController();active.current=controller;busy.current=true;
    setMessages(next);setLoading(true);setError("");if(!retry)setInput("");
    try{
      const response=await fetch("/api/assistant",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:history(next)}),signal:controller.signal});
      const result=await response.json();
      if(!response.ok||!result.ok)throw new Error(result.error||"The assistant could not answer. Please retry or contact the club.");
      if(active.current!==controller)return;
      const reply=result.data as AssistantReply;
      setMessages(previous=>[...previous,{id:crypto.randomUUID(),role:"assistant",content:reply.answer,links:reply.links}]);
      if(!openRef.current)setUnread(value=>value+1);setAvailable(true);
    }catch(caught){if(!controller.signal.aborted&&active.current===controller)setError(caught instanceof Error?caught.message:"The assistant is unavailable. Please try again.");}
    finally{if(active.current===controller){active.current=null;busy.current=false;setLoading(false);}}
  }
  const showSuggestions=messages.length===1&&!loading;
  const showInvitation=!open&&!invitationDismissed&&invitationSeconds>0;
  function dismissInvitation(){setInvitationDismissed(true);toggleRef.current?.focus();}
  function toggle(){if(open)close();else{setInvitationDismissed(true);setOpen(true);openRef.current=true;setUnread(0);}}
  return <>
    <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
      {showInvitation&&<div role="region" aria-label="AI assistant invitation" className="pointer-events-auto relative w-56 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl rounded-br-sm border border-neutral-200 bg-white shadow-lg transition-shadow hover:shadow-xl [color-scheme:light]">
        <div role="progressbar" aria-label="Invitation time remaining" aria-valuemin={0} aria-valuemax={60} aria-valuenow={invitationSeconds} aria-valuetext={`Closes in ${invitationSeconds} seconds`} className="absolute inset-x-0 top-0 h-1.5 bg-green-100">
          <div className="h-full bg-green-700" style={{width:`${invitationSeconds/60*100}%`}}/>
        </div>
        <button type="button" disabled={!hydrated} onClick={dismissInvitation} aria-label="Dismiss AI assistant invitation" className="absolute top-3 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-xl leading-none text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-green-800"><span aria-hidden="true">×</span></button>
        <button type="button" disabled={!hydrated} onClick={toggle} aria-label="Ask the AI Assistant" aria-controls="ecp-assistant" aria-expanded={false} className="block w-full cursor-pointer px-4 pt-4 pb-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-green-800">
          <span className="block pr-7 text-sm font-medium text-green-900">AI Assistant</span>
          <span id="ecp-assistant-invitation" className="mt-1 block text-xs leading-relaxed text-neutral-700">{loading?"Finding your answer…":unread>0?"Your answer is ready. Open to continue.":available===false?"Open for public documents and club contact details.":"Ready to answer club questions and help you navigate."}</span>
        </button>
      </div>}
      <div className="relative h-14 w-14">
      {!open&&available!==false&&<span aria-hidden="true" className={cn("pointer-events-none absolute inset-0",styles.halo)}/>}
    <button ref={toggleRef} type="button" disabled={!hydrated} onClick={toggle} aria-label={open?"Close AI assistant":"Open AI assistant"} aria-describedby={showInvitation?"ecp-assistant-invitation":undefined} aria-expanded={open} aria-controls="ecp-assistant" className="pointer-events-auto relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-green-800 text-white shadow-xl transition-colors hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800">
      {open?<span aria-hidden="true" className="text-3xl">×</span>:<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.268 2 11.5c0 2.57 1.09 4.9 2.87 6.6L4 22l4.26-1.42A10.86 10.86 0 0 0 12 21c5.523 0 10-4.268 10-9.5S17.523 2 12 2Z"/></svg>}
      {unread>0&&!open&&<span className="absolute -top-1 -right-1 rounded-full bg-red-800 px-1.5 py-0.5 text-xs text-white">{unread}</span>}
    </button>
      </div>
    </div>
    {open&&<section id="ecp-assistant" role="dialog" aria-label="ECP AI Assistant" data-lenis-prevent className="fixed right-3 bottom-24 z-50 flex w-[390px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-neutral-300 bg-white text-neutral-900 shadow-2xl [color-scheme:light] sm:right-6" style={{height:"min(620px, calc(100dvh - 7rem))"}}>
      <header className="flex shrink-0 items-center gap-3 bg-green-800 px-4 py-3 text-white"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-xs text-white" aria-hidden="true">AI</div><div className="min-w-0 flex-1"><h2 className="text-sm font-medium text-white">ECP Assistant</h2><p className="text-xs text-white">Your club and website guide</p></div><button type="button" onClick={clear} className={button}>Clear chat</button><button type="button" aria-label="Close assistant panel" className={button} onClick={close}>×</button></header>
      <div ref={logRef} role="log" aria-label="Assistant conversation" aria-live="polite" aria-relevant="additions" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-neutral-50 p-4">
        {messages.map(message=><div key={message.id} className={cn("flex",message.role==="user"?"justify-end":"justify-start")}><article aria-label={message.role==="user"?"Your message":"Assistant answer"} className={cn("max-w-[92%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed shadow-sm",message.role==="user"?"rounded-br-sm bg-green-800 text-white":"rounded-bl-sm border border-neutral-200 bg-white text-neutral-900")}><p className="break-words whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>{message.links&&<ResourceLinks links={message.links}/>}</article></div>)}
        {loading&&<p role="status" className="text-sm text-neutral-700">Looking up club information…</p>}
        {error&&<div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900"><p>{error}</p><div className="flex flex-wrap gap-3"><button className="cursor-pointer underline" onClick={()=>{const last=messages.findLast(message=>message.role==="user");if(last)void send(last.content,true);}}>Retry last message</button><Link className="underline" href="/contact" onClick={close}>Contact the club</Link></div></div>}
        {available===false&&!loading&&!error&&<p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">The assistant is temporarily unavailable. You can use the public document links below or <Link className="underline" href="/contact" onClick={close}>contact the club</Link>.</p>}
        {showSuggestions&&documents.length>0&&<div><h3 className="text-sm font-medium text-neutral-900">Public documents</h3><ResourceLinks links={documents.slice(0,5)}/></div>}
      </div>
      {showSuggestions&&<div aria-label="Suggested questions" className="flex shrink-0 flex-wrap gap-2 border-t border-neutral-200 bg-white p-3">{suggestions.map(suggestion=><button type="button" key={suggestion} disabled={available===false} onClick={()=>void send(suggestion)} className="cursor-pointer rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-left text-xs text-green-900 disabled:cursor-not-allowed disabled:opacity-60">{suggestion}</button>)}</div>}
      <form onSubmit={event=>{event.preventDefault();void send();}} aria-label="Ask the club assistant" className="flex shrink-0 items-center gap-2 border-t border-neutral-200 bg-white p-3">
        <input ref={inputRef} type="text" aria-label="Your club question" value={input} onChange={event=>setInput(event.target.value)} maxLength={ASSISTANT_MESSAGE_LIMIT} disabled={loading||available===false} placeholder="Ask about the club…" className="min-w-0 flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-600 focus:outline-2 focus:outline-green-800 disabled:opacity-60"/>
        <button type="submit" aria-label="Send message" disabled={!input.trim()||loading||available===false} className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-green-800 text-white hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-50"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m22 2-7 20-4-9L2 9Z"/><path d="m22 2-11 11"/></svg></button>
      </form>
      <p className="shrink-0 border-t border-neutral-200 bg-white px-3 py-2 text-center text-[11px] text-neutral-700">AI uses public club sources. Please keep personal details private.</p>
    </section>}
  </>;
}
