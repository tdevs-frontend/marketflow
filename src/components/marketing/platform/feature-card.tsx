import { cn } from "@/lib/utils";
import { FeatureIcon } from "./feature-icon";
import { TONES, type PlatformFeature } from "./platform-features";

/** Where a rail sits, which is the direction its cards lean on hover. */
export type RailSide = "left" | "right";

/**
 * The section's one hover curve — a fast start easing to a long settle, so the
 * lift reads as weight rather than as a slide. Shared by the cards and the
 * orbit nodes; nothing else in the section moves on hover.
 */
const HOVER = "transition-[translate,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

/** Lean toward the hub, two pixels, on top of the three-pixel lift. */
const LEAN: Record<RailSide, string> = {
  left: "hover:translate-x-0.5 motion-reduce:hover:translate-x-0",
  right: "hover:-translate-x-0.5 motion-reduce:hover:translate-x-0",
};

/**
 * Every card is 360px wide, which is exactly its rail track from `xl` up;
 * `max-w-full` is what lets it fall back to the track on the narrower layouts
 * below that. Each rail keeps its cards pinned to the outer edge, never
 * stretched toward the hub, so space freed up in the middle stays there.
 */
const ALIGN: Record<RailSide, string> = {
  left: "mx-auto lg:mr-auto lg:ml-0",
  right: "mx-auto lg:ml-auto lg:mr-0",
};

/**
 * One module in a side rail: tinted icon tile, title, one-line description and
 * a status pill.
 *
 * Deliberately dense — around 100px tall, so four of them read as a stack of
 * modules rather than four large empty panels. The hover is the whole card
 * lifting three pixels and leaning toward the hub, while the icon tile picks up
 * a halo in the module's tone — the same tone as the node on its connector and
 * the glyph on its satellite.
 *
 * `h-full` so four of them fill a rail's equal rows, which is what lets
 * `ConnectionLines` trust `RAIL_ROWS`.
 */
export function FeatureCard({
  feature,
  side = "left",
}: {
  feature: PlatformFeature;
  side?: RailSide;
}) {
  return (
    <article
      className={cn(
        "group h-full w-[360px] max-w-full rounded-card border border-border bg-surface p-4 shadow-card sm:px-[18px]",
        ALIGN[side],
        HOVER,
        LEAN[side],
        "hover:-translate-y-[3px] hover:border-primary-border hover:shadow-card-hover",
        "motion-reduce:hover:translate-y-0",
      )}
    >
      <div className="flex items-start gap-3">
        <FeatureIcon feature={feature} />

        <div className="min-w-0 flex-1">
          <h3 className="text-sm leading-snug font-bold tracking-tight text-text-primary">
            {feature.title}
          </h3>

          <p className="mt-0.5 text-sm leading-[1.5] text-text-secondary">
            {feature.body}
          </p>

          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2 py-0.5 text-xs leading-[1.45] font-medium text-text-secondary">
            <span
              aria-hidden
              className={cn("size-1.5 rounded-full", TONES[feature.tone].dot)}
            />
            {feature.status}
          </p>
        </div>
      </div>
    </article>
  );
}

/**
 * A rail of four cards.
 *
 * From `lg` it is a four-row grid with **no** gap, each card padded instead, so
 * the rows stay exactly equal and the card centres land on `RAIL_ROWS`. Below
 * `lg` the connectors are gone and the rail is just a responsive card grid.
 */
export function FeatureRail({
  features,
  side,
  className,
}: {
  features: PlatformFeature[];
  side: RailSide;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-5 3xsm:grid-cols-2 lg:h-full lg:grid-cols-1 lg:grid-rows-4 lg:gap-0",
        className,
      )}
    >
      {features.map((feature) => (
        <div key={feature.title} className="lg:py-3">
          <FeatureCard feature={feature} side={side} />
        </div>
      ))}
    </div>
  );
}
