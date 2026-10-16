import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "The Constitution",
  description: "Read the Constitution of Eko Club Philadelphia before applying for membership.",
};

export default function ConstitutionPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-8">
        <h1 className="text-2xl font-medium text-neutral-950">ECP Constitution</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-700">Please read the club constitution before accepting the declaration in your application.</p>
        <div className="my-5 flex flex-wrap gap-4 text-sm text-green-700 underline">
          <a href="/documents/ecp-constitution.pdf" target="_blank" rel="noopener noreferrer">Open the PDF</a>
          <a href="/documents/ecp-constitution.pdf" download>Download the constitution</a>
          <Link href="/membership/apply">Back to the application</Link>
        </div>
        <object data="/documents/ecp-constitution.pdf" type="application/pdf" className="h-[75vh] w-full rounded-lg border border-neutral-200" aria-label="ECP Constitution PDF">
          <p className="p-4 text-sm text-neutral-700">Use the links above to read or download the constitution.</p>
        </object>
      </div>
    </div>
  );
}
