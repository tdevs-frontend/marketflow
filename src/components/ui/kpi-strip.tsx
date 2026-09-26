import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { KPI_TILE, KPI_TONES, type KpiTone } from "@/components/ui/kpi-tones";
import { InfoHint } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type { KpiTone };

export interface Kpi {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Tints the icon tile. Defaults to neutral. */
  tone?: KpiTone;
  hint?: string;
  /**
   * What the figure is measured over, behind a `?`.
   *
   * For the KPIs whose label is not self-evident - "Events Today" counts what,
   * exactly. `hint` is the line that always shows; this is the sentence that
   * does not earn permanent room in the tile.
   */
  info?: ReactNode;
  /**
   * Makes the whole tile a button.
   *
   * For a figure with somewhere to go - an Events Today that opens the events
   * behind it. Not for filtering a list the page already has a filter row for:
   * two controls for one question is how a tile and a chip end up disagreeing
   * about which is pressed. Omit it and the tile stays inert, which is the
   * right default.
   */
  onSelect?: () => void;
  /** What pressing it does, for assistive tech. Required with `onSelect`. */
  selectLabel?: string;
}

/**
 * The KPI strip a workspace page opens with. Four or five tiles, one line
 * each - the reader should take in the state of the page before scrolling.
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
        /* Six is two even rows of three rather than five and a straggler, and
           one row only where the screen is wide enough to hold it. */
        items.length >= 6
          ? "xl:grid-cols-3 2xl:grid-cols-6"
          : items.length >= 5
            ? "xl:grid-cols-5"
            : "xl:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Card
            key={item.label}
            className="relative p-4 hover:border-border-strong hover:shadow-card-hover"
          >
            {/*
             * The press target, as a stretched sibling rather than a wrapper.
             *
             * Wrapping the tile would put the `?` tooltip's own button inside
             * this one, which is invalid and makes the hint unreachable. The
             * overlay sits under the hint instead - see the `z-1` on it below.
             */}
            {item.onSelect ? (
              <button
                type="button"
                onClick={item.onSelect}
                className="absolute inset-0 rounded-card focus-visible:shadow-focus focus-visible:outline-none"
              >
                <span className="sr-only">{item.selectLabel ?? item.label}</span>
              </button>
            ) : null}

            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
                {item.label}
                {item.info ? (
                  <span className="relative z-10">
                    <InfoHint content={item.info} />
                  </span>
                ) : null}
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
