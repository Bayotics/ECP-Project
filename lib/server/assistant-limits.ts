import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/server/mongodb";
export class AssistantError extends Error { constructor(message:string,public status:number,public retryAfter?:number){super(message);} }
let indexes:Promise<string>|null=null;
function setting(name:string,fallback:number){const n=Number(process.env[name]);return Number.isSafeInteger(n)&&n>0?n:fallback;}
export async function limitAssistant(request:NextRequest,now=Date.now()){
  const collection=(await getDb()).collection<{_id:string;count:number;expiresAt:Date}>("assistantRateLimits");
  if(!indexes)indexes=collection.createIndex({expiresAt:1},{expireAfterSeconds:0}).catch(error=>{indexes=null;throw error;});
  await indexes;
  // The reverse proxy must replace this header. A global daily cap remains in force even if a client spoofs it.
  const ip=(process.env.VERCEL?request.headers.get("x-vercel-forwarded-for"):request.headers.get("x-forwarded-for"))?.split(",")[0]?.trim().slice(0,100)||"unknown";
  const identity=createHmac("sha256",process.env.AUTH_JWT_SECRET||process.env.OPENAI_API_KEY||"local-chat-limit").update(ip).digest("hex");
  const minute=Math.floor(now/60000),day=Math.floor(now/86400000);
  for(const [id,limit,end] of [[`minute:${identity}:${minute}`,setting("AI_CHAT_PER_MINUTE",6),(minute+1)*60000],[`day:${identity}:${day}`,setting("AI_CHAT_PER_DAY",40),(day+1)*86400000],[`global:${day}`,setting("AI_CHAT_GLOBAL_PER_DAY",500),(day+1)*86400000]] as const){
    try { await collection.findOneAndUpdate({_id:id,count:{$lt:limit}},{$inc:{count:1},$setOnInsert:{expiresAt:new Date(end+3600000)}},{upsert:true}); }
    catch(error){if(error&&typeof error==="object"&&"code" in error&&error.code===11000)throw new AssistantError("The assistant has reached its request limit. Please try again later or contact the club.",429,Math.max(1,Math.ceil((end-now)/1000)));throw error;}
  }
}
