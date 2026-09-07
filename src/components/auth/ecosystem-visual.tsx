import {
  MessageCircle,
  ShoppingBag,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Geometry                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A square canvas in its own coordinate space. The chips are positioned as
 * percentages of it and the connectors are drawn in the same units, so the
 * whole composition scales as one piece instead of drifting apart.
 */
const CANVAS = 400;
const HUB = { x: 200, y: 200 };
const ORBIT = 150;

/** Pentagon vertices, first one straight up, going clockwise. */
function vertex(index: number) {
  const angle = (index * 2 * Math.PI) / 5;
  return {
    x: HUB.x + ORBIT * Math.sin(angle),
    y: HUB.y - ORBIT * Math.cos(angle),
  };
}

/**
 * A gently bowed line from the hub. The control point sits off the midpoint
 * along the perpendicular, which curves every spoke the same way round the
 * ring rather than each one guessing.
 */
function spoke(to: { x: number; y: number }, bow = 26) {
  const dx = to.x - HUB.x;
  const dy = to.y - HUB.y;
  const length = Math.hypot(dx, dy) || 1;

  const controlX = (HUB.x + to.x) / 2 + (-dy / length) * bow;
  const controlY = (HUB.y + to.y) / 2 + (dx / length) * bow;

  return `M${HUB.x},${HUB.y} Q${controlX},${controlY} ${to.x},${to.y}`;
}

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

interface Node {
  name: string;
  caption: string;
  icon: LucideIcon;
}

/**
 * Clockwise from the top, the ring traces the product flow itself — a lead is
 * captured, a conversation starts, automation carries it, a product is sold,
 * and growth is measured. The arrangement is the argument.
 */
const NODES: Node[] = [
  { name: "CRM", caption: "Manage leads", icon: Users },
  { name: "WhatsApp", caption: "Engage customers", icon: MessageCircle },
  { name: "Automation", caption: "Automate follow-ups", icon: Zap },
  { name: "Products", caption: "Sell products", icon: ShoppingBag },
  { name: "Analytics", caption: "Measure growth", icon: TrendingUp },
];

/* -------------------------------------------------------------------------- */
/* Visual                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One platform, five jobs.
 *
 * Decorative in full: the headline beside it already makes the claim in words,
 * so the tree is hidden from assistive tech rather than read out as a list of
 * disconnected nouns.
 */
export function EcosystemVisual({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("relative mx-auto aspect-square w-full max-w-100", className)}
    >
      {/* Connectors first, so the cards paint over where the lines meet them. */}
      <svg
        viewBox={`0 0 ${CANVAS} ${CANVAS}`}
        className="absolute inset-0 size-full"
        role="presentation"
      >
        {/* The orbit ties the five together without drawing a box round them. */}
        <circle
          cx={HUB.x}
          cy={HUB.y}
          r={ORBIT}
          fill="none"
          stroke="var(--color-primary)"
          strokeOpacity="0.14"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        {NODES.map((node, index) => (
          <path
            key={node.name}
            d={spoke(vertex(index))}
            fill="none"
            stroke="var(--color-primary)"
            strokeOpacity="0.24"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="absolute top-1/2 left-1/2 w-38 -translate-x-1/2 -translate-y-1/2 rounded-card border border-primary-border bg-surface px-4 py-3.5 text-center shadow-float">
        <p className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase">
          MarketFlow
        </p>
        <p className="mt-1 text-[11px] leading-tight text-text-secondary">
          Your growth workspace
        </p>
      </div>

      {NODES.map((node, index) => {
        const point = vertex(index);
        const NodeIcon = node.icon;

        return (
          <div
            key={node.name}
            className="absolute w-26 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${(point.x / CANVAS) * 100}%`,
              top: `${(point.y / CANVAS) * 100}%`,
            }}
          >
            <div className="flex flex-col items-center gap-1.5 rounded-panel border border-primary-border/60 bg-surface/85 px-2 py-2.5 text-center backdrop-blur-sm">
              <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-primary">
                <NodeIcon className="size-3.5" />
              </span>
              <span className="text-[11px] leading-none font-medium text-text-primary">
                {node.name}
              </span>
              <span className="text-[10px] leading-tight text-text-muted">
                {node.caption}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
