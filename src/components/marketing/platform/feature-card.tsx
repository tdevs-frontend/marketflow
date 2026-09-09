import { cn } from "@/lib/utils";
import { TONES, type PlatformFeature } from "./platform-features";

/**
 * One module in a side rail: tinted icon tile, title, one-line description and
 * a status pill.
 *
 * Carries the same hover lift as `ui/card`'s interactive variant so it feels
 * like the rest of the product, plus one extra beat of its own — the icon tile
 * picks up a halo in the module's tone, which is the same colour as the node on
 * its connector and the icon on its satellite. `h-full` so four of them fill a
 * rail's equal rows, which is what lets `ConnectionLines` trust `RAIL_ROWS`.
 */
export function FeatureCard({ feature }: { feature: PlatformFeature }) {
  const tone = TONES[feature.tone];

  return (
    <article
      className={cn(
        "group h-full rounded-card border border-border bg-surface p-4 shadow-card sm:p-[18px]",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-1 hover:border-primary-border hover:shadow-card-hover",
        "motion-reduce:transition-none motion-reduce:hover:translate-y-0",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-[12px] transition-shadow duration-200",
            tone.chip,
            tone.glow,
          )}
        >
          <feature.icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-tight text-text-primary">
            {feature.title}
          </h3>

          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            {feature.body}
          </p>

          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
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
  className,
}: {
  features: PlatformFeature[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 3xsm:grid-cols-2 lg:h-full lg:grid-cols-1 lg:grid-rows-4 lg:gap-0",
        className,
      )}
    >
      {features.map((feature) => (
        <div key={feature.title} className="lg:py-2.5">
          <FeatureCard feature={feature} />
        </div>
      ))}
    </div>
  );
}
