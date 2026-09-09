import { FeatureIcon } from "./feature-icon";
import { ORBIT_RADIUS, type PlatformFeature } from "./platform-features";

/**
 * One module sitting on the hub's orbit.
 *
 * Placed with percentage offsets rather than a rotate/counter-rotate transform
 * pair: the hub is a square, so a percentage of its width is the same length in
 * both axes, the icons stay upright with no second transform to undo, and
 * `translate` is left free for the hover lift.
 *
 * The lift restates the centring offset — Tailwind v4 writes both axes into one
 * `translate` declaration, so `hover:-translate-y-[calc(50%+3px)]` is the
 * `-translate-y-1/2` plus three pixels, not a second transform stacked on it.
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
    <FeatureIcon
      feature={feature}
      variant="node"
      title={feature.title}
      style={{
        left: `${50 + ORBIT_RADIUS * Math.cos(angle)}%`,
        top: `${50 + ORBIT_RADIUS * Math.sin(angle)}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2 transition-[translate,box-shadow,border-color] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-[calc(50%+3px)] hover:border-primary-border hover:shadow-card-hover motion-reduce:transition-none motion-reduce:hover:-translate-y-1/2"
    />
  );
}
