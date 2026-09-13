import { ChevronDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatCount, formatNumber } from "@/lib/format";
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

/**
 * The lifecycle as one shape.
 *
 * The step between two bars carries both readings a funnel is read for: the
 * share that continued, and the count that did not. The second used to be left
 * for the reader to subtract, which is the arithmetic that makes people stop
 * looking at funnels.
 */
export function SalesFunnel({ className }: { className?: string }) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="min-w-0">
        <h2 className="text-base">Sales Funnel</h2>
        <p className="mt-1 text-sm text-text-secondary">
          How prospects move from first interaction to purchase.
        </p>
      </div>

      <ol className="mt-5 flex-1">
        {STAGES.map((stage, index) => {
          const previous = index > 0 ? STAGES[index - 1] : null;
          const stepRate = previous ? (stage.count / previous.count) * 100 : null;
          const dropped = previous ? previous.count - stage.count : 0;
          /* One hue deepening toward `primary-dark`, not five colours: the
             stages are one funnel, and the taper already carries the reading. */
          const tint = 1 - index * 0.16;

          return (
            <li key={stage.label}>
              {stepRate !== null ? (
                <p className="flex flex-wrap items-center gap-x-1.5 py-1 pl-1 text-sm">
                  <ChevronDown className="size-3 shrink-0 text-text-muted" aria-hidden />
                  <span className="font-medium text-text-secondary tabular-nums">
                    {stepRate.toFixed(1)}%
                  </span>
                  <span className="text-text-secondary">continue</span>
                  <span aria-hidden className="text-text-muted">
                    ·
                  </span>
                  <span className="text-text-secondary tabular-nums">
                    {formatCount(dropped)} dropped off
                  </span>
                </p>
              ) : null}

              <div
                className="flex items-center justify-between gap-3 rounded-panel px-3.5 py-2.5 text-white"
                style={{
                  width: barWidth(stage.count),
                  backgroundColor: `color-mix(in oklab, var(--color-primary) ${tint * 100}%, var(--color-primary-dark))`,
                }}
              >
                <span className="truncate text-sm font-medium">{stage.label}</span>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {formatNumber(stage.count)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm text-text-secondary">Visitor → Customer</span>
        <span className="text-xl leading-none font-bold text-primary tabular-nums">
          {((LAST.count / TOP) * 100).toFixed(1)}%
        </span>
      </div>
    </Card>
  );
}
