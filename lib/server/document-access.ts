import type { OrgDocument } from "@/lib/models/document";
import type { RequestSession } from "@/lib/server/guards";
import { VolunteerError } from "@/lib/server/volunteer-error";
export const documentAdmin=(session:RequestSession|null)=>Boolean(session&&["admin","super-admin"].includes(session.role));
export function documentVisible(document:OrgDocument,session:RequestSession|null){
  return document.access==="public"||documentAdmin(session)||(document.access==="members-only"&&session?.role==="member");
}
export function documentMetadata(document:OrgDocument,session:RequestSession|null){
  if(documentAdmin(session))return document;
  return {id:document.id,name:document.name,label:document.label,category:document.category,access:document.access,fileType:document.fileType,simulatedSize:document.simulatedSize,sizeBytes:document.sizeBytes,description:document.description,period:document.period,uploadedAt:document.uploadedAt,updatedAt:document.updatedAt,...(document.url?{url:`/api/documents/${encodeURIComponent(document.id)}/download`}:{})};
}
export function safeDocumentURL(value:unknown):value is string{
  if(typeof value!=="string")return false;
  try{const url=new URL(value);return url.protocol==="https:"&&url.hostname==="res.cloudinary.com"&&!url.username&&!url.password&&!url.port;}catch{return false;}
}
export function documentPayload(value:unknown,creating=false):Partial<OrgDocument>{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new VolunteerError("Send valid document details.",400);
  const body=value as Record<string,unknown>,patch:Partial<OrgDocument>={};
  for(const field of ["label","name","description","period","simulatedSize","publicId"] as const){
    const input=body[field];if(input===undefined){if(creating&&["label","name"].includes(field))throw new VolunteerError("Document label and filename are required.",400);continue;}
    if(typeof input!=="string"||input.length>2000||(["label","name"].includes(field)&&!input.trim()))throw new VolunteerError(`Enter a valid document ${field}.`,400);
    patch[field]=input.trim();
  }
  const choices={category:["constitution","minutes","report","handbook","newsletter","budget","policy","form","other"],access:["public","members-only","admin-only"],fileType:["pdf","docx","doc","xlsx","img","other"]};
  for(const field of ["category","access","fileType"] as const){const input=body[field];if(input===undefined&&!creating)continue;if(typeof input!=="string"||!choices[field].includes(input))throw new VolunteerError(`Choose a valid document ${field}.`,400);Object.assign(patch,{[field]:input});}
  if(body.url!==undefined){if(!safeDocumentURL(body.url))throw new VolunteerError("Attach a file uploaded to the club’s document host.",400);patch.url=body.url;}
  if(body.sizeBytes!==undefined){if(typeof body.sizeBytes!=="number"||!Number.isSafeInteger(body.sizeBytes)||body.sizeBytes<=0)throw new VolunteerError("Enter a valid file size.",400);patch.sizeBytes=body.sizeBytes;}
  return patch;
}
