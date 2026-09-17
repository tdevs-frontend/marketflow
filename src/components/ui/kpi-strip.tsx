import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { KPI_TILE, KPI_TONES, type KpiTone } from "@/components/ui/kpi-tones";
import { cn } from "@/lib/utils";

export type { KpiTone };

export interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tints the icon tile. Defaults to neutral. */
  tone?: KpiTone;
  hint?: string;
}

/**
 * The KPI strip a workspace page opens with. Four or five tiles, one line
 * each — the reader should take in the state of the page before scrolling.
 *
 * This lives in `ui/` rather than in a feature folder because Commerce and
 * Customers both open on it, and a second copy is how two modules end up with
 * tiles that are almost the same height. `commerce/commerce-kpis` re-exports
 * it under its original names, the way `commerce/filter-bar` already does.
 *
 * Hover moves the border and deepens the existing card shadow, and deliberately
 * does *not* lift: `Card`'s `interactive` treatment raises the surface to say
 * "this goes somewhere", and a KPI tile does not.
 */
export function KpiStrip({
  items,
  className,
}: {
  items: Kpi[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        items.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.label}
            className="p-4 hover:border-border-strong hover:shadow-card-hover"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-text-secondary">
                {item.label}
              </p>
              <span
                className={cn(
                  KPI_TILE,
                  KPI_TONES[item.tone ?? "neutral"],
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
            </div>

            <p className="mt-2.5 text-2xl leading-none font-bold text-text-primary">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-2 text-sm font-medium text-text-secondary">
                {item.hint}
              </p>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
