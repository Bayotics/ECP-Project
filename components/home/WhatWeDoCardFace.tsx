import Image from "next/image";
import Link from "next/link";
import type { WhatWeDoSlide } from "@/lib/content/what-we-do";

export default function WhatWeDoCardFace({ item, preview = false }: { item: WhatWeDoSlide; preview?: boolean }) {
  return (
    <div className="flex h-full flex-col bg-neutral-950">
      <div className="relative aspect-[16/11] shrink-0">
        <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-fill" sizes="(max-width: 1024px) 100vw, 600px" />
      </div>
      <div className="flex-1 bg-neutral-950 px-5 py-5 sm:px-7 sm:py-6">
        <h3 className="mb-2 text-xl font-semibold text-white sm:text-2xl">{item.title}</h3>
        <p className="mb-4 max-w-md whitespace-pre-line text-sm leading-relaxed text-white sm:text-base">{item.description}</p>
        {preview ? <span className="text-sm font-semibold text-white">{item.label} →</span> : <Link href={item.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-green-300">{item.label} →</Link>}
      </div>
    </div>
  );
}
