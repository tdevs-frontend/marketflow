import { ChevronDown } from "lucide-react";

import { FUNNEL_RAMP } from "@/components/dashboard/charts/chart-theme";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FunnelStage } from "@/lib/overview-fixtures";

/**
 * The conversion funnel, drawn rather than charted.
 *
 * A bar chart would show the five counts, but the number people actually want
 * is the *drop* between two steps — so each bar is scaled against the top of
 * the funnel, and the step-to-step rate sits in the gap between bars where the
 * loss happens. Built in CSS because a charting library cannot put a label
 * between two bars.
 *
 * The ramp is one hue lightening downward: a funnel in five different colours
 * implies five unrelated measures rather than one population thinning.
 */
export function ConversionFunnel({
  stages,
  className,
}: {
  stages: FunnelStage[];
  className?: string;
}) {
  const top = stages[0]?.count ?? 0;

  return (
    <ol className={cn("space-y-0", className)}>
      {stages.map((stage, index) => {
        /* Width is share of the funnel's mouth, floored so a 1.7% final stage
           is still a readable bar rather than a sliver. */
        const share = top === 0 ? 0 : (stage.count / top) * 100;
        const width = Math.max(share, 8);

        const previous = stages[index - 1];
        const stepRate = previous ? (stage.count / previous.count) * 100 : 100;
        const lost = previous ? previous.count - stage.count : 0;

        return (
          <li key={stage.label}>
            {previous ? (
              /* The gap carries the drop — the interesting number. */
              <div className="flex items-center gap-2 py-1.5 pl-1">
                <ChevronDown className="size-3.5 shrink-0 text-border-strong" aria-hidden />
                <p className="text-[11px] text-text-muted">
                  <span className="font-medium text-text-secondary">
                    {formatPercent(stepRate)}
                  </span>{" "}
                  continued · {formatNumber(lost)} lost
                </p>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <div
                style={{
                  width: `${width}%`,
                  backgroundColor: FUNNEL_RAMP[index] ?? FUNNEL_RAMP.at(-1),
                }}
                className="flex h-11 min-w-0 items-center rounded-panel px-3.5"
              >
                <span
                  className={cn(
                    "truncate text-[13px] font-bold",
                    /* The ramp's last steps are light enough that white ink
                       would fail contrast, so the ink flips with the ground. */
                    index >= 3 ? "text-primary-dark" : "text-white",
                  )}
                >
                  {stage.label}
                </span>
              </div>

              <div className="min-w-0 shrink-0">
                <p className="text-sm font-bold text-text-primary tabular-nums">
                  {formatNumber(stage.count)}
                </p>
                <p className="text-[11px] text-text-muted">
                  {index === 0 ? stage.hint : formatPercent(share)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The same data as a compact horizontal strip, for channel pages where the
 * funnel is one panel among many rather than the point of the card.
 */
export function FunnelStrip({
  stages,
  tone = "bg-primary",
  className,
}: {
  stages: { label: string; count: number }[];
  tone?: string;
  className?: string;
}) {
  const top = stages[0]?.count ?? 0;

  return (
    <ol className={cn("grid gap-2", className)} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
      {stages.map((stage, index) => {
        const share = top === 0 ? 0 : (stage.count / top) * 100;

        return (
          <li key={stage.label} className="min-w-0">
            <p className="truncate text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
              {stage.label}
            </p>
            <p className="mt-1 text-base leading-none font-bold text-text-primary tabular-nums">
              {formatNumber(stage.count)}
            </p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-secondary">
              <div
                className={cn("h-full rounded-full", tone)}
                style={{ width: `${Math.max(share, 3)}%`, opacity: 1 - index * 0.16 }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-text-muted tabular-nums">
              {formatPercent(share)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
