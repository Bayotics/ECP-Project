"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import { cn } from "@/utils/cn";

/* ─── Types ──────────────────────────────────────────── */
export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  /** Optional override — auto-generated from pathname if omitted */
  crumbs?: Crumb[];
  /** Custom separator node, defaults to "/" */
  separator?: React.ReactNode;
  className?: string;
}

function prettify(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Breadcrumbs ────────────────────────────────────── */
export default function Breadcrumbs({ crumbs: override, separator, className }: BreadcrumbsProps) {
  const pathname = usePathname();

  const crumbs: Crumb[] = override ?? (() => {
    const parts = pathname.split("/").filter(Boolean);
    const home: Crumb = { label: "Home", href: "/" };
    const rest: Crumb[] = parts.map((segment, i) => ({
      label: prettify(segment),
      href: "/" + parts.slice(0, i + 1).join("/"),
    }));
    // Last crumb has no href (current page)
    if (rest.length > 0) rest[rest.length - 1] = { label: rest[rest.length - 1].label };
    return [home, ...rest];
  })();

  const sep = separator ?? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-(--color-neutral-400)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );

  /* JSON-LD BreadcrumbList schema */
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: c.href } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 flex-wrap text-sm", className)}>
        <ol className="flex items-center gap-1.5 flex-wrap list-none p-0 m-0">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <Fragment key={i}>
                <li>
                  {isLast || !crumb.href ? (
                    <span
                      className={cn("font-medium", isLast ? "text-(--foreground)" : "text-(--color-neutral-500)")}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-(--color-neutral-500) hover:text-(--color-green-600) transition-colors focus-visible:outline-none focus-visible:underline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
                {!isLast && <li aria-hidden="true" className="flex items-center">{sep}</li>}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
