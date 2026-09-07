import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

const STAGES = [
  { label: "Visitors", count: 48920 },
  { label: "New Leads", count: 12480 },
  { label: "Engaged Leads", count: 7820 },
  { label: "Qualified Leads", count: 4240 },
  { label: "Customers", count: 2845 },
] as const;

const TOP = STAGES[0].count;

/**
 * Bars are widths of the top stage, not of each other, so the taper is the
 * real drop-off. A 30% floor keeps the last stage wide enough to hold its
 * label — Customers is 5.8% of Visitors and would otherwise vanish.
 */
const MIN_WIDTH = 30;

function barWidth(count: number): string {
  return `${MIN_WIDTH + (count / TOP) * (100 - MIN_WIDTH)}%`;
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function LeadFunnel({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <h2 className="text-base">Lead Conversion Funnel</h2>
      <p className="mt-1 text-sm text-text-secondary">
        See how contacts move from first interaction to customer.
      </p>

      <ol className="mt-6 space-y-1">
        {STAGES.map((stage, index) => {
          const previous = index > 0 ? STAGES[index - 1] : null;
          const stepRate = previous ? (stage.count / previous.count) * 100 : null;
          /* One hue deepening toward `primary-dark`, not five colours: the
             stages are one funnel, and the taper already carries the reading. */
          const tint = 1 - index * 0.16;

          return (
            <li key={stage.label}>
              {stepRate !== null ? (
                <p className="flex items-center gap-1 py-1 pl-1 text-[11px] font-medium text-text-muted">
                  <ChevronDown className="size-3" aria-hidden />
                  {stepRate.toFixed(1)}% continue
                </p>
              ) : null}

              <div
                className="flex items-center justify-between gap-3 rounded-panel px-3.5 py-2.5 text-white transition-[width]"
                style={{
                  width: barWidth(stage.count),
                  backgroundColor: `color-mix(in oklab, var(--color-primary) ${tint * 100}%, var(--color-primary-dark))`,
                }}
              >
                <span className="truncate text-[13px] font-medium">{stage.label}</span>
                <span className="shrink-0 text-[13px] font-bold tabular-nums">
                  {formatNumber(stage.count)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-text-secondary">Visitor to customer</span>
        <span className="text-sm font-bold text-primary">
          {((STAGES[STAGES.length - 1].count / TOP) * 100).toFixed(1)}%
        </span>
      </div>
    </Card>
  );
}
