import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCollection, serializeDocument } from "@/lib/server/collections";
import { MEMBERSHIP_CONTACT_EMAIL } from "@/lib/models/membership";

/* The club's Constitution, for anyone about to agree to it.
 *
 * The application form asks an applicant to accept the Constitution, House
 * Rules and By-laws, so it has to be readable before they tick the box.
 * This page resolves to whatever the club has published: upload the file
 * under Documents with the category "constitution" and public access, and
 * this redirects straight to it. Until then it says plainly that the copy
 * has to be asked for, which is better than a link that 404s or a page
 * that invents what the Constitution says.
 */

export const metadata: Metadata = {
  title: "The Constitution",
  description:
    "The Constitution, House Rules and By-laws of Eko Club Philadelphia, for members and applicants.",
};

/* Read on each request: the moment an administrator uploads the document,
   the link starts working without a rebuild. */
export const dynamic = "force-dynamic";

async function publishedConstitution() {
  try {
    const collection = await getCollection("documents");
    /* Public only. A members-only copy would send an applicant, who has no
       account, to a download that refuses them. */
    const found = await collection
      .find({ category: "constitution", access: "public", url: { $exists: true, $ne: "" } })
      .sort({ updatedAt: -1 })
      .limit(1)
      .toArray();
    return serializeDocument(found[0] ?? null);
  } catch {
    /* A database hiccup should show the fallback, not an error page. */
    return null;
  }
}

export default async function ConstitutionPage() {
  const document = await publishedConstitution();
  if (document) redirect(`/api/documents/${document.id}/download`);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-normal uppercase tracking-[0.22em] text-neutral-700">
          Eko Club Philadelphia
        </p>
        <h1 className="mt-2 text-2xl font-medium tracking-[-0.02em] text-neutral-950">
          The Constitution, House Rules and By-laws
        </h1>
        <p className="mt-3 text-sm leading-7 text-neutral-700">
          The full text is not published on this website yet. The membership committee keeps the
          current copy and will send it to anyone who asks, member or applicant.
        </p>

        <a
          href={`mailto:${MEMBERSHIP_CONTACT_EMAIL}?subject=${encodeURIComponent("Request for a copy of the ECP Constitution")}`}
          className="mt-6 inline-block rounded-full bg-green-600 px-6 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90"
        >
          Ask for a copy
        </a>

        <div className="mt-8 border-t border-neutral-200 pt-6">
          <h2 className="text-[11px] font-normal uppercase tracking-[0.16em] text-neutral-900">
            What you are agreeing to
          </h2>
          {/* Verbatim from the head of the club's approved application form,
              which is the one piece of it the club has already published. */}
          <p className="mt-3 rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-7 text-neutral-800">
            I hereby apply for membership in Eko Club Philadelphia. If I should be accepted, I agree
            to comply with and observe the Constitution, House Rules and Regulations; and further
            agree that my membership will be subject to all By-laws, House Rules and Regulations now
            in force and those which may be legally adopted and for infraction thereof the Executive
            may terminate such membership.
          </p>
          <p className="mt-3 text-sm leading-7 text-neutral-700">
            That is the declaration on the application form. The Constitution it refers to sets out
            how the club is governed: the Executive Committee and its offices, the standing
            committees, meetings, dues and discipline.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-neutral-200 pt-6">
          <Link
            href="/membership/apply"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
          >
            Back to the application
          </Link>
          <Link
            href="/about"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
          >
            About the club
          </Link>
        </div>
      </div>
    </div>
  );
}
