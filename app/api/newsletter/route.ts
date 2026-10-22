import { verifyRecaptcha } from "@/lib/server/recaptcha";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { ensureCoreIndexes, getCollection } from "@/lib/server/collections";
import { clubAdmin, clubError, privateHeaders } from "@/lib/server/club-api";
import { newsletterBody, newsletterOrigin } from "@/lib/server/newsletter-api";
import { NewsletterError, newsletterEmail, newsletterMetadata, newsletterSources, subscribeNewsletter, deliverNewsletterMessages, newsletterAdminRow } from "@/lib/server/newsletter";
import type { NewsletterSource, NewsletterSubscriber } from "@/lib/models/newsletter";
export async function GET(request: NextRequest) {
  try {
    await clubAdmin(request);
    const status=request.nextUrl.searchParams.get("status"),source=request.nextUrl.searchParams.get("source");
    if((status&&!["pending","active","unsubscribed"].includes(status))||(source&&!newsletterSources.includes(source as NewsletterSource)))throw new NewsletterError("Select valid newsletter filters.",400);
    await ensureCoreIndexes();
    const filter:Partial<NewsletterSubscriber>={...(status?{status:status as NewsletterSubscriber["status"]}:{}),...(source?{source:source as NewsletterSource}:{})};
    const people=await (await getCollection("newsletterSubscribers")).find(filter).sort({subscribedAt:-1}).toArray();
    const data=[];
    // Keep database concurrency bounded for the delivery-status lookups.
    for(let offset=0;offset<people.length;offset+=25)data.push(...await Promise.all(people.slice(offset,offset+25).map(newsletterAdminRow)));
    return NextResponse.json({ok:true,data},{headers:privateHeaders});
  } catch(error){return clubError(error);}
}
export async function POST(request: NextRequest) {
  try {
    newsletterOrigin(request);
    const body=newsletterBody(await request.json()),email=newsletterEmail(body.email);
    if(body.website)throw new NewsletterError("Please submit the newsletter form directly.",400);
    const user=await getSessionUser(request),admin=Boolean(user&&["admin","super-admin"].includes(user.role));
    if (!admin) {
      const captcha = await verifyRecaptcha(body.recaptchaToken);
      if (!captcha.ok) return NextResponse.json({ok:false,error:captcha.error},{status:captcha.status,headers:privateHeaders});
    }
    const source=admin?(body.source??"admin"):(body.source??"website");
    if(!newsletterSources.includes(source as NewsletterSource)||(!admin&&!["website","footer"].includes(source as string)))throw new NewsletterError("Choose a valid subscription source.",400);
    await ensureCoreIndexes();
    const {person,messageId}=await subscribeNewsletter(email,source as NewsletterSource,admin?newsletterMetadata(body):{tags:[]});
    try{await deliverNewsletterMessages([messageId]);}catch{/* Saved mail retries from the durable outbox. */}
    const row=await newsletterAdminRow(person),confirmationEmailSent=row.confirmationStatus==="sent";
    return NextResponse.json({ok:true,data:admin?row:{confirmationEmailSent,message:confirmationEmailSent?"Check your inbox and click the confirmation link to activate your newsletter subscription.":"Your subscription is pending. Your confirmation email is queued for delivery; click its link when it arrives to activate your subscription."}},{status:201,headers:privateHeaders});
  } catch(error){return clubError(error);}
}
