import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

/* Customers sit under Orders because repeat buyers place more than one. */
const STAGES = [
  { label: "Visitors", count: 48920 },
  { label: "Leads", count: 12480 },
  { label: "Interested", count: 7820 },
  { label: "Orders", count: 2845 },
  { label: "Customers", count: 2430 },
] as const;

const TOP = STAGES[0].count;
const LAST = STAGES[STAGES.length - 1];

/* Widths are a share of the top stage, so the taper is the real drop-off. The
   floor keeps the last stage wide enough for its label. */
const MIN_WIDTH = 34;

function barWidth(count: number): string {
  return `${MIN_WIDTH + (count / TOP) * (100 - MIN_WIDTH)}%`;
}

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

export function SalesFunnel({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <h2 className="text-base">Sales Funnel</h2>
      <p className="mt-1 text-sm text-text-secondary">
        See how prospects move from first interaction to purchase.
      </p>

      <ol className="mt-5">
        {STAGES.map((stage, index) => {
          const previous = index > 0 ? STAGES[index - 1] : null;
          const stepRate = previous ? (stage.count / previous.count) * 100 : null;
          /* One hue deepening toward `primary-dark`, not five colours: the
             stages are one funnel, and the taper already carries the reading. */
          const tint = 1 - index * 0.16;

          return (
            <li key={stage.label}>
              {stepRate !== null ? (
                <p className="flex items-center gap-1 py-0.5 pl-1 text-[11px] font-medium text-text-muted">
                  <ChevronDown className="size-3" aria-hidden />
                  {stepRate.toFixed(1)}%
                </p>
              ) : null}

              <div
                className="flex items-center justify-between gap-3 rounded-panel px-3.5 py-2.5 text-white"
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

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-text-secondary">Visitor to customer</span>
        <span className="text-sm font-bold text-primary">
          {((LAST.count / TOP) * 100).toFixed(1)}%
        </span>
      </div>
    </Card>
  );
}
