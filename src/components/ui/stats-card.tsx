"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "./card";
import { KPI_TILE, KPI_TONES, type KpiTone } from "@/components/ui/kpi-tones";
import { cn } from "@/lib/utils";

export interface StatItem {
  label: string;
  /** Pre-formatted — the caller owns whether this is 24,580, 98.2% or $184k. */
  value: string;
  /** Signed. Positive is the accent colour, negative is red. Nothing else. */
  changePercent: number;
  icon: LucideIcon;
  /** The comparison the change is against, e.g. "vs last 30 days". */
  hint: string;
  /**
   * Flips the colouring where a fall is the good outcome — bounce rate,
   * unsubscribes, failures, opt-outs.
   */
  invertTrend?: boolean;
  /**
   * This stat's own icon tile, overriding the grid's accent.
   *
   * For a row where the metrics are different *kinds* of thing rather than five
   * readings of one: messages, delivery, replies and automations are four
   * subsystems, and five identical green tiles make the eye scan the labels to
   * tell them apart. It colours the tile only — the trend below stays on the
   * grid's accent, so a row still reads as one module.
   */
  accent?: { soft: string; text: string };
  /**
   * This stat's tile as a named tone from the shared map, border included.
   *
   * The successor to `accent` above, and what a new call site should reach for:
   * `accent` is a bare `{ soft, text }` pair, so every caller that wanted a
   * bordered tile had to name the border itself and they drifted. Set on the
   * item rather than the grid, because a row that needs tones needs a
   * different one per card.
   */
  tone?: KpiTone;
}

export interface StatsGridProps {
  items: StatItem[];
  /**
   * Channel accent applied to the icon tile and a positive trend, so a stat
   * row is the first thing that tells you which module you are in. Defaults to
   * the neutral treatment used on cross-channel pages.
   */
  accent?: { soft: string; text: string };
  /**
   * Column count at `xl`. Derived from `items.length` when omitted — five KPIs
   * across four columns leaves one card stranded on its own row.
   */
  columns?: 3 | 4 | 5 | 6;
  className?: string;
}

const COLUMNS: Record<3 | 4 | 5 | 6, string> = {
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
  5: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
  6: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6",
};

function autoColumns(count: number): 3 | 4 | 5 | 6 {
  if (count >= 6) return 6;
  if (count === 5) return 5;
  if (count === 3) return 3;
  return 4;
}

/**
 * The KPI row every dashboard page opens with.
 *
 * One shape, one type scale, one trend treatment across all four channel
 * modules — the accent is the only thing that changes. Values arrive
 * pre-formatted because "482,450", "98.4%" and "$184,250" have no common
 * formatter, and pushing that decision into the card would mean a `format`
 * union that grows every time a new metric appears.
 */
export function StatsGrid({ items, accent, columns, className }: StatsGridProps) {
  const cols = columns ?? autoColumns(items.length);

  return (
    <div className={cn("grid gap-4", COLUMNS[cols], className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const rising = item.changePercent >= 0;
        const good = item.invertTrend ? !rising : rising;
        const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;
        const tile = item.accent ?? accent;

        return (
          <Card
            key={item.label}
            className="flex h-full flex-col p-5 hover:border-border-strong hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-text-secondary">
                {item.label}
              </p>
              <span
                className={cn(
                  KPI_TILE,
                  /* `tone` wins over `accent`: the named tone carries its own
                     border, the `{ soft, text }` pair predates the map and has
                     none, so that path keeps the tile's box and hides its edge
                     rather than drawing a grey hairline around a tinted fill. */
                  item.tone
                    ? KPI_TONES[item.tone]
                    : tile
                      ? cn("border-transparent", tile.soft, tile.text)
                      : KPI_TONES.neutral,
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
            </div>

            <p className="mt-2 text-3xl leading-none font-bold text-text-primary">
              {item.value}
            </p>

            {/* `mt-auto` is what makes a row of these read as one band: the
                labels wrap to two lines on some cards and one on others, and
                without it every trend line sits at a different height. */}
            <p className="mt-auto flex flex-wrap items-center gap-x-1.5 pt-3 text-sm">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  good ? (accent?.text ?? "text-primary") : "text-error",
                )}
              >
                <TrendIcon className="size-3.5" aria-hidden />
                {Math.abs(item.changePercent).toFixed(1)}%
              </span>
              <span className="text-text-muted">{item.hint}</span>
            </p>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * A metric with no trend — a total, a count, a rate that has no prior period
 * to compare against. Used inside cards, in rows of three or four.
 *
 * `tone` follows `Avatar`'s: a ground-and-edge class pair, for the rows where
 * the tiles mean different things — a queue state, a health band — and the
 * neutral outline everywhere else, which is the default. It replaces the edge
 * rather than joining it, since `cn` concatenates and two border colours on one
 * box is a coin toss over which one the stylesheet happens to order last.
 */
export function MiniStat({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Class pair for ground and edge. Defaults to the neutral outlined tile. */
  tone?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-panel border px-3.5 py-3 text-center",
        tone ?? "border-border",
        className,
      )}
    >
      {/* Secondary, not muted: this is the tile's only label, and a metric
          whose name is the faintest thing in the box is a metric nobody reads
          twice. The hint below it stays muted — that one is tertiary. */}
      <p className="text-sm font-medium text-text-secondary">
        {label}
      </p>
      <p className="mt-1 text-lg leading-none font-bold text-text-primary tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-text-muted">{hint}</p> : null}
    </div>
  );
}
