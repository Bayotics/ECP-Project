"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  PLACES,
  PLACE_CATEGORIES,
  CATEGORY_ACCENT,
  directionsUrl,
  fullAddress,
  mapEmbedUrl,
  type Place,
  type PlaceCategory,
} from "@/lib/content/places";
import { PageHeader, Panel, SearchInput, Chip, EmptyPanel } from "@/components/portal/ui";
import { useIsClient } from "@/components/gsap/useReveal";

/* ── Cover art ──────────────────────────────────────────────────
   No stock photography and no hotlinked images: each place gets a
   drawn cover in its category colour with a glyph and its initials.
   A real photograph takes over the moment the club supplies one. */

function initialsOf(name: string): string {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function CategoryGlyph({ category, className }: { category: PlaceCategory; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.3,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
  };
  switch (category) {
    case "Consular and immigration":
      return (
        <svg {...common}>
          <path d="M12 3v18M5 7h14M7 7v10a5 5 0 0 0 10 0V7" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "Travel":
      return (
        <svg {...common}>
          <path d="M2 14l20-7-7 20-3-8-8-3z" />
        </svg>
      );
    case "Civic":
      return (
        <svg {...common}>
          <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />
        </svg>
      );
    case "Health":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.4-7 10-7 10z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="2.5" />
          <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" />
        </svg>
      );
  }
}

function Cover({ place, className }: { place: Place; className?: string }) {
  const accent = CATEGORY_ACCENT[place.category];

  if (place.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={place.photo.src} alt={place.photo.alt} className={className} />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ background: `linear-gradient(140deg, ${accent} 0%, ${accent}cc 55%, #0a0a0a 190%)` }}
      aria-hidden
    >
      <CategoryGlyph category={place.category} className="absolute -right-4 -bottom-5 h-28 w-28 text-white/20" />
      <span className="relative text-2xl font-normal tracking-[0.08em] text-white/90">{initialsOf(place.name)}</span>
    </div>
  );
}

/* ── Map modal ──────────────────────────────────────────────────
   Portalled to the body, because a fixed overlay inside a
   transformed ancestor resolves against that ancestor rather than
   the viewport. `data-lenis-prevent` keeps the page behind it
   still while the panel scrolls. */

function MapModal({ place, onClose }: { place: Place; onClose: () => void }) {
  const isClient = useIsClient();

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!isClient) return null;

  const accent = CATEGORY_ACCENT[place.category];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={place.name}
      data-lenis-prevent
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-neutral-950/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        data-lenis-prevent
        className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-5">
          <div className="min-w-0">
            <p
              className="text-[11px] font-normal uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {place.category}
            </p>
            <h2 className="mt-1 text-xl font-normal tracking-[-0.02em] text-neutral-950">{place.name}</h2>
            <p className="mt-1 text-sm text-neutral-700">{fullAddress(place)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
          >
            Close
          </button>
        </div>

        <iframe
          title={`Map of ${place.name}`}
          src={mapEmbedUrl(place)}
          /* Eager, not lazy: the frame only mounts when the modal opens, so
             it is always in view and lazy just leaves it blank on first paint. */
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-80 w-full border-0"
        />

        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-6 text-neutral-800">{place.what}</p>

          {place.travelNote && (
            <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-6 text-neutral-800">
              {place.travelNote}
            </p>
          )}
          {place.tip && (
            <p className="rounded-xl border-l-2 px-4 py-3 text-sm leading-6 text-neutral-800" style={{ borderColor: accent, background: `${accent}0d` }}>
              {place.tip}
            </p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={directionsUrl(place)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-5 py-2.5 text-sm font-normal text-white transition-opacity hover:opacity-90"
              style={{ background: accent }}
            >
              Get directions
            </a>
            {place.officialUrl && (
              <a
                href={place.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
              >
                Official website
              </a>
            )}
            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/[^\d+]/g, "")}`}
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-normal text-neutral-900 transition-colors hover:border-neutral-400"
              >
                {place.phone}
              </a>
            )}
          </div>

          <p className="pt-1 text-xs leading-5 text-neutral-700">
            Opening hours and addresses change. Check the official website before you travel.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export default function PlacesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<PlaceCategory | "all">("all");
  const [open, setOpen] = useState<Place | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PLACES.filter((p) => category === "all" || p.category === category).filter(
      (p) =>
        !q ||
        [p.name, p.what, p.street ?? "", p.city, p.tip ?? ""].join(" ").toLowerCase().includes(q),
    );
  }, [search, category]);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: PLACES.length };
    for (const c of PLACE_CATEGORIES) out[c] = PLACES.filter((p) => p.category === c).length;
    return out;
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="Member resources"
        title="Around Philadelphia"
        lede="Places members need: the consulate that covers Pennsylvania, immigration help, city offices and the way out of town. Tap any card for a map and directions."
      />

      {/* The single most common misunderstanding, answered before it is asked. */}
      {/* <Panel
        className="border-l-2"
        style={{ borderLeftColor: CATEGORY_ACCENT["Consular and immigration"] } as React.CSSProperties}
      >
        <p className="text-sm leading-6 text-neutral-800">
          Nigeria has no embassy or consulate in Philadelphia. For a passport or NIN your post is the{" "}
          <span className="text-neutral-950">Consulate General in New York</span>, about two hours away.
          The Embassy in Washington DC handles official business. Book an appointment before travelling
          to either.
        </p>
      </Panel> */}

      <div className="space-y-3">
        <SearchInput
          id="places-search"
          label="Search places"
          value={search}
          onChange={setSearch}
          placeholder="Search places, addresses or what you need…"
        />
        <div className="flex flex-wrap gap-2">
          <Chip active={category === "all"} onClick={() => setCategory("all")} count={counts.all}>
            All places
          </Chip>
          {PLACE_CATEGORIES.map((c) => (
            <Chip
              key={c}
              active={category === c}
              color={CATEGORY_ACCENT[c]}
              onClick={() => setCategory(c)}
              count={counts[c]}
            >
              {c}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyPanel title="Nothing matches that" body="Try a different word, or clear the category filter." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((place) => {
            const accent = CATEGORY_ACCENT[place.category];
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => setOpen(place)}
                className="group flex overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left transition-colors hover:border-neutral-300"
              >
                <Cover place={place} className="h-auto w-24 shrink-0" />
                <div className="min-w-0 flex-1 p-4">
                  <p className="text-[11px] font-normal uppercase tracking-[0.16em]" style={{ color: accent }}>
                    {place.category}
                  </p>
                  <h3 className="mt-1 text-base font-normal leading-snug text-neutral-950">{place.name}</h3>
                  <p className="mt-1 truncate text-xs text-neutral-700">{fullAddress(place)}</p>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-800">{place.what}</p>
                  {place.travelNote && (
                    <p className="mt-2 inline-block rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-normal text-neutral-800">
                      Outside Philadelphia
                    </p>
                  )}
                  <p className="mt-2 text-xs font-normal text-neutral-700 transition-colors group-hover:text-neutral-950">
                    View map and directions →
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && <MapModal place={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
