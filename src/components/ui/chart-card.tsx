import type { ReactNode } from "react";

import { Card } from "./card";
import { cn } from "@/lib/utils";

export interface ChartLegendItem {
  label: string;
  /** Background utility for the swatch — a channel accent, usually. */
  swatch: string;
  /** Optional figure shown after the label, e.g. the latest value. */
  value?: string;
}

/**
 * A titled chart panel.
 *
 * Exists because a chart on its own is unreadable: it needs a title saying
 * what is measured, a line saying over what period, and a legend naming the
 * series. Bundling them means every chart in the app carries all three, and
 * the `action` slot keeps the period switcher in the same corner every time.
 */
export function ChartCard({
  title,
  description,
  action,
  legend,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description?: string;
  /** Usually a `SegmentedControl` or a "View all" link. */
  action?: ReactNode;
  legend?: ChartLegendItem[];
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      {legend?.length ? (
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {legend.map((item) => (
            <li
              key={item.label}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted"
            >
              <span
                aria-hidden
                className={cn("h-0.5 w-4 shrink-0 rounded-full", item.swatch)}
              />
              {item.label}
              {item.value ? (
                <span className="font-medium text-text-secondary tabular-nums">
                  {item.value}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* The negative left margin pulls the y-axis labels back to the card's
          padding — Apex reserves more gutter than the axis text needs. */}
      <div className={cn("mt-2 -ml-2.5 flex-1", bodyClassName)}>{children}</div>

      {footer ? (
        <div className="mt-4 border-t border-border pt-4">{footer}</div>
      ) : null}
    </Card>
  );
}

/**
 * A panel for lists and tables rather than a chart: same header, no axis
 * gutter compensation and no legend.
 */
export function PanelCard({
  title,
  description,
  action,
  footer,
  className,
  bodyClassName,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className={cn("mt-4 flex-1", bodyClassName)}>{children}</div>

      {footer ? (
        <div className="mt-4 border-t border-border pt-4">{footer}</div>
      ) : null}
    </Card>
  );
}
