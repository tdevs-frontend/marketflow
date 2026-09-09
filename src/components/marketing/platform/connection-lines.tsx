import { cn } from "@/lib/utils";
import {
  INBOUND_FEATURES,
  OUTBOUND_FEATURES,
  RAIL_ROWS,
  TONES,
} from "./platform-features";

/**
 * The curves tying each feature card to the hub.
 *
 * Geometry, and why it lands on the cards without measuring them:
 *
 * The component is stretched over the hub column and pushed out by exactly the
 * grid's column gap (`-inset-x-10` against `lg:gap-10`), so its left edge sits
 * on the left rail's cards and its right edge on the right rail's. Its vertical
 * extent is the hub column, which the grid stretches to the rails' height. So
 * `RAIL_ROWS` — the row centres the rails lay their cards on — addresses the
 * same points here, and one constant keeps curves, dots and cards in step at
 * every width.
 *
 * The viewBox is percentage space with `preserveAspectRatio="none"`, which
 * anchors every endpoint however the box is shaped; `non-scaling-stroke` stops
 * the hairlines thickening with the stretch. Endpoint dots are HTML rather than
 * `<circle>` for the same reason — that stretch would turn a circle into an
 * ellipse.
 */

/**
 * Where a curve gives up, as a percentage of the box.
 *
 * The box is the hub column plus the two gaps, so its centre is the hub's
 * centre and 10% of it is roughly the brand mark's half-width. Ending at 40/60
 * carries the curves right up to the mark before the fade takes them, which is
 * what makes eight separate lines read as one convergence. The hub's white
 * vignette, painted after this, absorbs whatever is left.
 */
const LEFT_END = 40;
const RIGHT_END = 60;

/* Mirrors `--color-secondary` in `styles/variables.css`. Literal hex because a
   gradient stop is read by the renderer, not resolved as a cascaded value —
   the same reason `dashboard/charts/chart-theme.ts` keeps its own copies. */
const LINK = "#7c3aed";

function curve(fromX: number, y: number, toX: number) {
  const midX = (fromX + toX) / 2;
  return `M${fromX},${y} C${midX},${y} ${midX},50 ${toX},50`;
}

const PATHS = [
  ...RAIL_ROWS.map((y) => ({ d: curve(0, y, LEFT_END), fade: "mf-link-fade-left" })),
  ...RAIL_ROWS.map((y) => ({ d: curve(100, y, RIGHT_END), fade: "mf-link-fade-right" })),
];

/** The node where a curve meets its card: the card's own tone, cut out of the
 *  ground so the line appears to start behind it. */
function EndpointNode({
  y,
  side,
  tone,
}: {
  y: number;
  side: "left" | "right";
  tone: string;
}) {
  return (
    <span
      className={cn(
        "absolute -translate-y-1/2",
        side === "left" ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
      )}
      style={{ top: `${y}%` }}
    >
      <span className={cn("block size-2.5 rounded-full ring-4 ring-background", tone)} />
    </span>
  );
}

export function ConnectionLines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -inset-x-10 hidden lg:block"
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full">
        <defs>
          {/* Fades each curve out as it nears the hub, so the lines resolve into
              the ecosystem instead of stopping dead against its edge. */}
          <linearGradient id="mf-link-fade-left" gradientUnits="userSpaceOnUse" x1="0" x2={LEFT_END}>
            <stop offset="0%" stopColor={LINK} stopOpacity="0.5" />
            <stop offset="65%" stopColor={LINK} stopOpacity="0.32" />
            <stop offset="100%" stopColor={LINK} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="mf-link-fade-right" gradientUnits="userSpaceOnUse" x1="100" x2={RIGHT_END}>
            <stop offset="0%" stopColor={LINK} stopOpacity="0.5" />
            <stop offset="65%" stopColor={LINK} stopOpacity="0.32" />
            <stop offset="100%" stopColor={LINK} stopOpacity="0" />
          </linearGradient>
        </defs>

        {PATHS.map((path, index) => (
          <g key={index} fill="none">
            {/* The path itself, dotted and faint. */}
            <path
              d={path.d}
              stroke={`url(#${path.fade})`}
              strokeWidth="1.1"
              strokeDasharray="2 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {/* One dash travelling inward, so the direction of flow is legible.
                `.animate-flow` is already switched off under
                `prefers-reduced-motion` in `globals.css`. */}
            <path
              d={path.d}
              stroke={`url(#${path.fade})`}
              strokeWidth="1.6"
              strokeDasharray="3 34"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              className="animate-flow"
              style={{ animationDelay: `${index * 450}ms` }}
            />
          </g>
        ))}
      </svg>

      {INBOUND_FEATURES.map((feature, index) => (
        <EndpointNode
          key={feature.title}
          y={RAIL_ROWS[index]}
          side="left"
          tone={TONES[feature.tone].dot}
        />
      ))}
      {OUTBOUND_FEATURES.map((feature, index) => (
        <EndpointNode
          key={feature.title}
          y={RAIL_ROWS[index]}
          side="right"
          tone={TONES[feature.tone].dot}
        />
      ))}
    </div>
  );
}
