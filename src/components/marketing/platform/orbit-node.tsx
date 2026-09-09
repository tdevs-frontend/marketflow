import { cn } from "@/lib/utils";
import { ORBIT_RADIUS, TONES, type PlatformFeature } from "./platform-features";

/**
 * One module sitting on the hub's orbit.
 *
 * Placed with percentage offsets rather than a rotate/counter-rotate transform
 * pair: the hub is a square, so a percentage of its width is the same length in
 * both axes, the icons stay upright with no second transform to undo, and
 * `translate` is left free for the hover lift.
 *
 * A rounded square, not a circle — it echoes the brand mark at the centre and
 * the icon tiles on the cards, so the three read as one family.
 */
export function OrbitNode({
  feature,
  angle,
}: {
  feature: PlatformFeature;
  /** Radians, measured clockwise from twelve o'clock. */
  angle: number;
}) {
  return (
    <span
      /* The card beside it already names the feature; announcing all eight
         again would just be the rails read twice. */
      aria-hidden
      title={feature.title}
      style={{
        left: `${50 + ORBIT_RADIUS * Math.cos(angle)}%`,
        top: `${50 + ORBIT_RADIUS * Math.sin(angle)}%`,
      }}
      className={cn(
        "absolute grid size-10 -translate-x-1/2 -translate-y-1/2 place-items-center",
        "rounded-[12px] border border-border bg-surface shadow-card",
        "sm:size-11 sm:rounded-[13px]",
        "transition-[translate,box-shadow,border-color] duration-200",
        "hover:-translate-y-[calc(50%+3px)] hover:border-primary-border hover:shadow-card-hover",
        "motion-reduce:transition-none motion-reduce:hover:-translate-y-1/2",
      )}
    >
      <feature.icon
        className={cn("size-[18px]", TONES[feature.tone].ink)}
        strokeWidth={1.75}
      />
    </span>
  );
}
