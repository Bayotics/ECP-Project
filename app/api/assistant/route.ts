import { NextRequest, NextResponse } from "next/server";
import { assistantConfigured, answerClubQuestion, validateAssistantInput } from "@/lib/server/assistant";
import { assistantKnowledge, publicDocumentSources } from "@/lib/server/assistant-knowledge";
import { AssistantError, limitAssistant } from "@/lib/server/assistant-limits";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"};
function failure(error:unknown){
  if(error instanceof AssistantError)return NextResponse.json({ok:false,error:error.message},{status:error.status,headers:{...headers,...(error.retryAfter?{"Retry-After":String(error.retryAfter)}:{})}});
  if(error instanceof SyntaxError)return NextResponse.json({ok:false,error:"Send valid JSON."},{status:400,headers});
  console.error("[assistant] Request failed",{type:error instanceof Error?error.name:"unknown"});
  return NextResponse.json({ok:false,error:"The assistant is temporarily unavailable. Please retry or use the Contact page."},{status:503,headers});
}
export async function GET(){
  try {const documents=await publicDocumentSources();return NextResponse.json({ok:true,data:{available:assistantConfigured(),documents:documents.map(({title,url,kind})=>({title,url,kind}))}},{headers});}catch(error){return failure(error);}
}
export async function POST(request:NextRequest){
  try{
    const origin=request.headers.get("origin");
    if((origin&&origin!==request.nextUrl.origin)||request.headers.get("sec-fetch-site")==="cross-site")throw new AssistantError("Use the club website to ask the assistant.",403);
    if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))throw new AssistantError("Send the question as JSON.",400);
    const reader=request.body?.getReader();if(!reader)throw new AssistantError("Enter a club question.",400);
    const chunks:Uint8Array[]=[];let size=0;
    try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>20000){await reader.cancel();throw new AssistantError("This conversation is too long. Start a new chat.",413);}chunks.push(value);}}finally{reader.releaseLock();}
    const turns=validateAssistantInput(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if(!assistantConfigured())throw new AssistantError("The assistant is temporarily unavailable. Please use the Contact page for help.",503);
    await limitAssistant(request);
    const sources=await assistantKnowledge(turns);
    const reply=await answerClubQuestion(turns,sources,request.signal);
    return NextResponse.json({ok:true,data:reply},{headers});
  }catch(error){return failure(error);}
}
