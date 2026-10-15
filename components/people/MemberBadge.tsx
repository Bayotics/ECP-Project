import Image from "next/image";

/**
 * The club's member badge, rebuilt in the browser.
 *
 * The club's designer supplies these as finished artwork: the member cut out
 * of their background and placed over four concentric rings, head rising
 * clear of the ring's top edge, with the club medallion resting on the lower
 * edge. The artwork also has the name and "Member" burned into it, which at
 * card size is an illegible smudge, so the pages used to zoom deep into each
 * file to crop the caption away. Zooming that far cut the rings off too,
 * which is why cards showed coloured arcs sailing past people's heads.
 *
 * This draws the badge live instead. Given a cut-out (a PNG with a
 * transparent background) the head breaks out above the ring exactly as the
 * printed badge has it; given only a plain photograph it falls back to a
 * portrait sitting inside the ring. The caption stays real text under the
 * card, where it can be read, selected and spoken by a screen reader.
 *
 * Geometry and colour are measured from the club's own artwork
 * (`/gallery/members/olabisi-dabiri-okoya.jpg`, a 1100px square):
 *
 *   ring thickness : outer radius   56 : 345
 *   band : gap                      13 : 2
 *   bands outward-in                green #188d1a, yellow #f9f756,
 *                                   blue #0b1f8c, red #cb3e31
 *   head rises above the ring top   ≈19% of the canvas
 *   medallion                       ≈0.29 of ring diameter, sitting
 *                                   0.78 of the radius below centre
 *
 * Everything below is in a 0–100 space so it scales with the card.
 */

/** Outward-in, sampled from the club's artwork. */
const BANDS = ["#188d1a", "#f9f756", "#0b1f8c", "#cb3e31"] as const;

/* The ring sits low and a little small inside the box, which is what leaves
   the headroom the portrait breaks into. */
const RING_CX = 50;
const RING_CY = 59;
const RING_R = 37;

const BAND_W = (13 / 345) * RING_R;
const GAP = (2 / 345) * RING_R;

/** Stroke centre of each band, working inward from the outer edge. */
const RADII = BANDS.map((_, i) => RING_R - BAND_W / 2 - i * (BAND_W + GAP));
/** Inner edge of the innermost band: where the portrait is clipped. */
const PORTRAIT_R = RADII[RADII.length - 1] - BAND_W / 2;

/* The window the head rises through: an arch, not a rectangle.
   A cut-out lifted off a photograph nearly always keeps a scrap of wall,
   signage or furniture beside the head, and those scraps collect in the
   corners a rectangular window would expose. An ellipse follows the shape
   of a head and gele instead, so the headwear comes through and the
   corners never do. */
const HEAD_CX = 50;
const HEAD_CY = 30;
const HEAD_RX = 26;
const HEAD_RY = 32;

const MEDALLION_PCT = 21.5;
/* Centred ON the ring's lower arc, not resting above it: the medallion's
   centre sits on the mid-line of the four bands, so the arc runs straight
   through it and the coloured rings show equally above and below. */
const RING_THICKNESS = BANDS.length * BAND_W + (BANDS.length - 1) * GAP;
const MEDALLION_CY = RING_CY + RING_R - RING_THICKNESS / 2;

export type BadgePerson = {
  name: string;
  role: string;
  /** A plain photograph. Used when there is no cut-out. */
  photo: string;
  /**
   * The same person with the background removed. When present the head
   * breaks out above the ring, as on the club's printed badge.
   */
  cutout?: string;
  /** Where in `photo` the circle centres. Ignored when `cutout` is set. */
  focusX?: number;
  focusY?: number;
};

export default function MemberBadge({
  person,
  sizes = "400px",
  className,
}: {
  person: BadgePerson;
  sizes?: string;
  className?: string;
}) {
  /* Derived from the image path rather than useId so this stays a server
     component; two badges for the same person on one page would share a
     clip path, which is harmless because the shape is identical. */
  const clipId = `badge-clip-${(person.cutout ?? person.photo).replace(/[^a-z0-9]+/gi, "-")}`;

  return (
    <div className={`relative aspect-square w-full ${className ?? ""}`}>
      {/* The four rings. Drawn first so the cut-out can rise over them. */}
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {BANDS.map((colour, i) => (
          <circle
            key={colour}
            cx={RING_CX}
            cy={RING_CY}
            r={RADII[i]}
            fill="none"
            stroke={colour}
            strokeWidth={BAND_W}
          />
        ))}
      </svg>

      {person.cutout ? (
        <>
          {/* The shape that lets the head out: an arch over the head, unioned
              with the ring's circle. Above, the headwear comes through;
              below, the body is held inside the coloured bands. A clipPath
              unions its children, which is exactly the shape wanted. */}
          <svg className="absolute h-0 w-0" aria-hidden="true">
            <defs>
              <clipPath id={clipId} clipPathUnits="objectBoundingBox">
                <ellipse
                  cx={HEAD_CX / 100}
                  cy={HEAD_CY / 100}
                  rx={HEAD_RX / 100}
                  ry={HEAD_RY / 100}
                />
                <circle cx={RING_CX / 100} cy={RING_CY / 100} r={PORTRAIT_R / 100} />
              </clipPath>
            </defs>
          </svg>

          <div className="absolute inset-0" style={{ clipPath: `url(#${clipId})` }}>
            <Image
              src={person.cutout}
              alt={`${person.name}, ${person.role}`}
              fill
              sizes={sizes}
              quality={100}
              className="object-contain object-top"
            />
          </div>
        </>
      ) : (
        /* No cut-out: the portrait sits inside the ring instead. */
        <div
          className="absolute overflow-hidden rounded-full"
          style={{
            left: `${RING_CX - PORTRAIT_R}%`,
            top: `${RING_CY - PORTRAIT_R}%`,
            width: `${PORTRAIT_R * 2}%`,
            height: `${PORTRAIT_R * 2}%`,
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        >
          <Image
            src={person.photo}
            alt={`${person.name}, ${person.role}`}
            fill
            sizes={sizes}
            quality={100}
            className="object-cover"
            style={{ objectPosition: `${person.focusX ?? 50}% ${person.focusY ?? 50}%` }}
          />
        </div>
      )}

      {/* The club medallion, resting on the ring's lower edge. Last, so it
          sits over both the ring and the portrait. */}
      <div
        className="absolute"
        style={{
          width: `${MEDALLION_PCT}%`,
          height: `${MEDALLION_PCT}%`,
          left: `${RING_CX}%`,
          top: `${MEDALLION_CY}%`,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Image
          src="/new-logo.png"
          alt=""
          aria-hidden="true"
          fill
          sizes="140px"
          className="object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.20)]"
        />
      </div>
    </div>
  );
}
