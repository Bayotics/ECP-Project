import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CommitteeMembershipPanel from "@/components/committees/CommitteeMembershipPanel";
import { getCollection } from "@/lib/server/collections";
import { publicCommittee, type PublicCommittee } from "@/lib/public-committees";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Our committees", description: "Join Eko Club Philadelphia committees as a member or volunteer." };
export default async function Page() {
  let committees: PublicCommittee[] = [], failed = false;
  try { committees = (await (await getCollection("committees")).find({ status: "active" }).sort({ name: 1 }).toArray()).map(publicCommittee); } catch { failed = true; }
  return <><Header /><main id="main-content" className="bg-[#f4f7f3] px-4 py-14 text-neutral-900 [color-scheme:light] sm:py-20"><div className="mx-auto max-w-6xl space-y-8"><p className="text-xs font-semibold uppercase tracking-widest text-green-800">Get involved</p><h1 className="text-4xl font-semibold sm:text-5xl">Our committees</h1><p className="max-w-3xl text-lg leading-relaxed text-neutral-700">Our committees bring the club’s work to life. Members and volunteers are welcome to help. You can be both.</p>{failed?<p role="alert" className="rounded-xl bg-red-50 p-5 text-red-800">Committee information could not be loaded. Please refresh this page or contact the club.</p>:<CommitteeMembershipPanel initialCommittees={committees} showHistory={false} />}</div></main><Footer /></>;
}
