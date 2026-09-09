import { LogoMark } from "@/components/ui/logo";
import { siteConfig } from "@/config/site";
import { OrbitNode } from "./orbit-node";
import { ORBIT_FEATURES } from "./platform-features";

/**
 * The centre of the section: MarketFlow itself, ringed by the modules that
 * connect through it.
 *
 * Everything is sized off one square container, so the whole ecosystem scales
 * as a unit and the satellites never drift off their ring. The layers, back to
 * front, are the depth the hub reads as:
 *
 *   atmospheric glow → outer ring → dashed orbit → white vignette →
 *   brand halo → inner ring → satellites → core
 *
 * The vignette is the load-bearing one. `ConnectionLines` paints before this
 * component, so the eight dotted curves run *under* the hub; a white radial
 * that fades to nothing dissolves their inner ends into the ground instead of
 * letting them stop dead in mid-air.
 */

/** Clockwise from twelve o'clock, one step per satellite. */
const STEP = (2 * Math.PI) / ORBIT_FEATURES.length;

/** The brand mark's rendered size, in px. Fixed: it is the one element in the
 *  section that should not grow with the viewport — a compact mark is what
 *  makes the ring around it read as an orbit rather than a border. */
const MARK = 80;

function HubCore() {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div
        className="relative rounded-[20px] shadow-[0_18px_38px_-16px_rgba(79,70,229,0.65)]"
        style={{ width: MARK, height: MARK }}
      >
        <LogoMark size={MARK} className="rounded-[20px]" />

        {/* Inner highlight and the hairline that sells the tile as an object:
            a top-down white wash, plus a translucent inset edge. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[20px] bg-[linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0)_48%)] ring-1 ring-white/25 ring-inset"
        />
      </div>

      {/* `w-max` so the caption never wraps and never widens the core's box —
          it is centred on the mark and sits in the ring's empty lower gap. */}
      <div className="absolute top-[calc(100%+14px)] left-1/2 w-max -translate-x-1/2 text-center">
        <p className="text-[15px] leading-none font-bold tracking-tight text-text-primary">
          {siteConfig.name}
        </p>
        <p className="mt-1.5 text-[9px] leading-none text-text-muted sm:text-[10px]">
          Marketing Operating System
        </p>
      </div>
    </div>
  );
}

export function PlatformHub() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-72 sm:max-w-80 lg:max-w-96">
      {/* Atmospheric glow, well outside the rings so it has nowhere to end. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[10%] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.13),rgba(139,92,246,0.05)_58%,transparent)]"
      />
      {/* Outer ring. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full border border-primary-border/40"
      />
      {/* The orbit the satellites sit on. `inset-[7%]` is a circle of 86%
          diameter — 43% radius, matching `ORBIT_RADIUS`. */}
      <div
        aria-hidden
        className="animate-orbit pointer-events-none absolute inset-[7%] rounded-full border border-dashed border-primary-border/70"
      />
      {/* White vignette — see the note above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[16%] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.96),rgba(255,255,255,0.7)_62%,transparent)]"
      />
      {/* Brand halo behind the mark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[26%] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.20),transparent)] blur-xl"
      />
      {/* Inner ring, drawn over the halo so it stays a crisp hairline. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[28%] rounded-full border border-primary-border/35"
      />

      {ORBIT_FEATURES.map((feature, index) => (
        <OrbitNode
          key={feature.title}
          feature={feature}
          angle={index * STEP - Math.PI / 2}
        />
      ))}

      <HubCore />
    </div>
  );
}
