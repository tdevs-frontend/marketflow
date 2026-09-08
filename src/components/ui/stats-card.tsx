"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card } from "./card";
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

        return (
          <Card key={item.label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13px] font-medium text-text-secondary">
                {item.label}
              </p>
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-btn",
                  accent
                    ? cn(accent.soft, accent.text)
                    : "bg-surface-secondary text-text-muted",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
            </div>

            <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
              {item.value}
            </p>

            <p className="mt-3 flex flex-wrap items-center gap-x-1.5 text-xs">
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
 */
export function MiniStat({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-panel border border-border px-3.5 py-3 text-center",
        className,
      )}
    >
      <p className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg leading-none font-bold text-text-primary tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-text-muted">{hint}</p> : null}
    </div>
  );
}
