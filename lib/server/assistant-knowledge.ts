import { stat } from "node:fs/promises";
import path from "node:path";
import type { AssistantSource, AssistantTurn } from "@/lib/assistant";
import { EXCO_MEMBERS, PATRONS } from "@/lib/content/leadership";
import { PROGRAMS } from "@/lib/content/programs";
import { MONTHLY_DUES_CENTS, ANNUAL_DUES_CENTS, SEMIANNUAL_DUES_CENTS } from "@/lib/dues";
import { APPLICATION_FEE_USD, MEMBERSHIP_CONTACT_EMAIL } from "@/lib/models/membership";
import { safeDocumentURL } from "@/lib/server/document-access";
import { getCollection } from "@/lib/server/collections";

// Curated navigation follows the actual routes and controls in this repository.
// Policy amounts come from the same constants as the membership and dues flows.
function pages(): AssistantSource[] {
  const page = (id:string,title:string,url:string,text:string):AssistantSource=>({id,title,url,text,kind:"page"});
  return [
    page("club","About Eko Club Philadelphia","/about","Eko Club Philadelphia is a chapter of Eko Club International, serving Philadelphia, Pennsylvania and the surrounding area. Mission: unite Lagosians, preserve cultural heritage, promote fellowship, and serve members and communities through charitable, educational, cultural and humanitarian initiatives. Vision: celebrate Lagosian heritage, strengthen community, empower future generations and create lasting positive impact. Core values: professionalism, discipline and integrity. The About page introduces the Executive Council and patrons. No club founding date is provided in this source."),
    page("leadership","Club leadership and patrons","/about",`The public About page lists the following office holders and patrons. Do not invent terms of office or private contacts: ${JSON.stringify([...EXCO_MEMBERS,...PATRONS].map(({name,role})=>({name,role})))}`),
    page("contact","Contact the club","/contact","General contact: info@ekoclubphiladelphia.org; phone +1 (609) 638 3297. The Contact page has a contact form with subject, name, email, optional phone and message. The Contact page says one or two business days for replies; the assistant cannot guarantee a response time."),
    page("apply","Become a Member","/membership/apply",`Use Become a Member in the header to open the application. Steps: Applicant, Address, Lagos roots, About you, Referrals, Review. Read the constitution before accepting the declaration. Submit the form, complete CAPTCHA, then pay the non-refundable $${APPLICATION_FEE_USD} application fee by PayPal or Zelle on the payment page. One referral is required; a second is optional. Two written references are sent separately to ${MEMBERSHIP_CONTACT_EMAIL}. This application fee is separate from recurring dues. Administrators review applications; there is no confirmed review timeframe. After approval the club emails member access instructions.`),
    page("application-status","Track a membership application","/membership/status","Use Membership Status to track an application using the email and application reference requested by the page. Do not send the assistant an application reference or personal details. The assistant cannot look up individual applications or make approval decisions."),
    page("constitution-page","Read the club constitution","/membership/constitution","The Constitution page links to and displays the public ECP Constitution PDF. Use Open the PDF or Download the constitution. This source describes where to access it; it does not contain its clauses. Do not invent eligibility requirements or quote clauses from the PDF."),
    page("login","Members Login","/auth/login","Members Login in the desktop header opens the login form. On mobile it is inside the hamburger menu. Sign in with your member email and password. The assistant cannot authenticate anyone or change account access."),
    page("password","Reset a forgotten password","/auth/forgot-password","On the login page choose Forgot Password, enter your email and follow the password reset email. Never share a password, reset token or private access link with the assistant."),
    page("dues","Member dues and payment history","/member/dues",`After signing in, choose Member dues in the member portal. Dues are $${MONTHLY_DUES_CENTS/100} per month, $${SEMIANNUAL_DUES_CENTS/100} twice yearly (six months), or $${ANNUAL_DUES_CENTS/100} yearly. PayPal payments update after successful capture. Zelle transfers require administrator confirmation before the record updates and the member is notified. The page shows coverage, outstanding months, standing and the next payment due, and provides a payment-history PDF download. Three completed unpaid months trigger monthly warnings about possible suspension. The assistant cannot inspect balances, confirm payments, or reinstate an account; the signed-in dues page and administrators handle that.`),
    page("events","Events calendar","/events","Open Get Involved > Events to browse the calendar and event cards. Open an event to see its date, location and registration method. Only events explicitly configured for the club's registration form show that form; others can use an external registration link or require no registration. Follow the method shown for that event. Specific event dates come from the current event records, not the general program calendar."),
    page("propose","Propose an event","/event/propose","Choose Propose an event on the Events page. Provide name, email, event title, description, proposed date and location; budget and notes are optional. Complete CAPTCHA and submit. The club acknowledges the proposal by email and reviews it; submission does not automatically create an event."),
    page("volunteer","Volunteer with the club","/volunteer","Get Involved > Volunteer opens the general volunteer form. First name, last name and email are required; phone, city/ZIP, interests, availability and how you heard about the club are optional. Email consent is optional and CAPTCHA is required. On an event page choose Volunteer for this event to preselect the event. A full event offers Join waitlist; the earliest waiting volunteer is promoted when a place becomes available. The form sends confirmation email. A person may be both a member and volunteer."),
    page("committees","Explore and join committees","/committees","Get Involved > Committees lists active committees. Members sign in to join or leave with one click from this page or their profile. Volunteers without a login verify by email link the first time; their verified browser can then join or leave with one click. People may join multiple committees. Changes email the person and the committee lead. Do not request or reveal committee member lists."),
    page("preferences","Manage volunteering preferences","/volunteer/preferences","Use Manage my volunteering in a volunteer email to open the secure personal preference page without a login. It allows contact details and interests changes, email preference changes, pausing opportunities with an optional resume date, unsubscribing, resubscribing or requesting data deletion. A bare link to this page does not replace the private email link; never share or invent its token."),
    page("news","Club news","/news","The News page lists published club announcements and articles. Open an article for details."),
    page("gallery","Club photo gallery","/gallery","The Gallery loads published photos and videos from the club database, newest additions first. Use Albums, Category, Album and Media filters, open a card for the full-screen viewer and choose Load more where available."),
    page("donate","Support the club","/donate","Use Donate in the header to open the donation page, choose the available donation option and follow checkout. Do not invent bank or Zelle recipient details, tax deductibility, donor benefits, or an unsupported recurring payment option."),
    page("store","Club store","/store","Open Store in the main navigation to browse club merchandise. Open a product, add it to your cart and follow checkout. The assistant cannot place or track individual orders and cannot verify live stock or prices from this source."),
    page("newsletter","Subscribe to club news","/","Use the newsletter email input in the website footer to subscribe. A successful new subscription sends a confirmation with an unsubscribe link. Existing subscriptions are checked to prevent duplicates. Use the private unsubscribe link in the email to unsubscribe; the assistant cannot change a subscription."),
    page("profile","Member profile","/member/profile","After login open Profile in the member portal to edit the fields shown there and manage committee membership. Access to the member portal requires an active account. Suspended or revoked accounts must be reinstated by an administrator."),
    page("programs","Programs calendar","/programs","The Programs page describes recurring club service, education, cultural and health programs. Its schedule is a general program calendar, not a confirmed event date. For specific events use the Events page."),
    page("projects","Club projects","/projects","The Projects page documents club programs in practice, including community service, scholarships and health education."),
    ...PROGRAMS.map(program=>page(`program-${program.id}`,program.name,"/programs",`${program.blurb} General program schedule: ${program.when}. Committee area: ${program.committee}. A month or recurring program is not a confirmed event date; consult Events for actual occurrences.`)),
  ];
}
export function plainText(value:unknown,max=1600) {
  return typeof value==="string"?value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
}
export async function publicDocumentSources():Promise<AssistantSource[]> {
  const sources:AssistantSource[]=[];
  try { if((await stat(path.join(process.cwd(),"public/documents/ecp-constitution.pdf"))).isFile()) sources.push({id:"constitution-pdf",title:"Download the ECP Constitution (PDF)",url:"/documents/ecp-constitution.pdf",kind:"document",text:"The public ECP Constitution PDF is available to read or download without signing in. The document's full text is not included here; provide its download link rather than guessing its clauses."}); } catch { /* An absent file must not become a broken download link. */ }
  const documents=await (await getCollection("documents")).find({access:"public",url:{$type:"string",$ne:""}}).project({id:1,label:1,name:1,category:1,description:1,fileType:1,url:1}).sort({uploadedAt:-1,id:1}).limit(200).toArray();
  for(const doc of documents.filter(doc=>safeDocumentURL(doc.url)))sources.push({id:`document-${doc.id}`,title:plainText(doc.label||doc.name,150),url:`/api/documents/${encodeURIComponent(doc.id)}/download`,kind:"document",text:`Public ${doc.fileType} download, category ${doc.category}. ${plainText(doc.description,800)} Only this metadata is available; do not claim to have read the full file.`});
  return sources;
}
export async function assistantKnowledge(turns:AssistantTurn[],now=new Date()):Promise<AssistantSource[]> {
  // Explicit public predicates and projections: private documents, accounts and signups are never read.
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const visibility={status:"published" as const,isPublic:true,membersOnly:{$ne:true}};
  const eventProjection={id:1,title:1,slug:1,shortDescription:1,description:1,date:1,endDate:1,time:1,location:1,venue:1,isOnline:1,dayIsProvisional:1,registrationRequired:1,registrationMode:1,registrationUrl:1};
  const [documents,upcomingEvents,pastEvents,news,committees]=await Promise.all([
    publicDocumentSources(),
    (await getCollection("events")).find({...visibility,$or:[{date:{$gte:today}},{endDate:{$gte:today}}]}).project(eventProjection).sort({date:1}).limit(60).toArray(),
    (await getCollection("events")).find({...visibility,date:{$lt:today}}).project(eventProjection).sort({date:-1}).limit(30).toArray(),
    (await getCollection("news")).find({status:"published"}).project({id:1,title:1,slug:1,excerpt:1,content:1,publishedAt:1}).sort({publishedAt:-1}).limit(30).toArray(),
    (await getCollection("committees")).find({status:"active"}).project({id:1,name:1,description:1,mandate:1}).limit(100).toArray(),
  ]);
  const events=Array.from(new Map([...upcomingEvents,...pastEvents].filter(event=>typeof event.slug==="string"&&event.slug&&typeof event.date==="string").map(event=>[event.id,event])).values());
  const eventSources:AssistantSource[]=events.map(event=>({id:`event-${event.id}`,title:plainText(event.title,150),url:`/events/${encodeURIComponent(event.slug)}`,kind:"event",text:JSON.stringify({description:plainText(event.shortDescription||event.description),date:event.date,endDate:event.endDate,time:event.time,location:event.location,venue:event.venue,isOnline:event.isOnline,dayIsProvisional:event.dayIsProvisional,registration:event.registrationRequired?(event.registrationMode==="form"?"club registration form":event.registrationMode==="link"&&event.registrationUrl?"external registration link on event page":"not specified; check event page"):"no registration required"})}));
  const dynamic:AssistantSource[]=[...eventSources,...news.map(post=>({id:`news-${post.id}`,title:plainText(post.title,150),url:`/news/${encodeURIComponent(post.slug)}`,kind:"news" as const,text:`Published: ${post.publishedAt??"unspecified"}. ${plainText(post.excerpt||post.content)}`})),...committees.map(committee=>({id:`committee-${committee.id}`,title:plainText(committee.name,150),url:"/committees",kind:"committee" as const,text:`Active committee. ${plainText(committee.description)} ${plainText(committee.mandate,700)}`}))];
  const tokens=Array.from(new Set(turns.filter(turn=>turn.role==="user").slice(-3).flatMap(turn=>turn.content.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu)??[]))).slice(-80);
  const score=(source:AssistantSource)=>tokens.reduce((sum,token)=>sum+(source.title.toLowerCase().includes(token)?6:0)+(source.text.toLowerCase().includes(token)?1:0),0);
  const core=pages();
  const upcoming=eventSources.filter(source=>{const event=events.find(event=>`event-${event.id}`===source.id)!;return (event.endDate||event.date).slice(0,10)>=today;}).slice(0,10);
  const ranked=[...documents,...dynamic].sort((a,b)=>score(b)-score(a));
  const selected=[...core,...documents.filter(source=>source.id==="constitution-pdf"),...upcoming,...ranked.slice(0,30)];
  const seen=new Set<string>();let size=0;
  return selected.filter(source=>{if(seen.has(source.id)||size+source.text.length>36000)return false;seen.add(source.id);size+=source.text.length;return true;});
}
