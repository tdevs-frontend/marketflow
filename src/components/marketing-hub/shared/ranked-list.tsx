import type { ReactNode } from "react";

import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface RankedItem {
  id: string;
  label: string;
  /** Second line — volume, size, whatever gives the metric context. */
  secondary?: string;
  /** The figure this list is ranked by, already formatted. */
  display: string;
  /** 0–100, for the bar. Pass the value relative to the list's best. */
  share: number;
}

/**
 * "Top N by one metric" — the shape that repeats across every analytics page
 * for campaigns, audiences, templates and platforms.
 *
 * Bars are scaled against the list's own leader rather than 100, because these
 * lists rank things whose absolute ceiling varies: a 6.2% engagement rate is
 * the best row in its list, and drawing it as 6% of a bar hides that.
 */
export function RankedList({
  items,
  tone = "bg-primary",
  /** Leading glyph, e.g. a platform or channel mark. */
  renderMark,
  numbered = true,
  className,
}: {
  items: RankedItem[];
  tone?: string;
  renderMark?: (item: RankedItem, index: number) => ReactNode;
  numbered?: boolean;
  className?: string;
}) {
  const best = Math.max(...items.map((item) => item.share), 1);

  return (
    <ol className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li key={item.id} className="flex items-center gap-3">
          {numbered ? (
            <span className="w-4 shrink-0 text-xs font-bold text-text-muted tabular-nums">
              {index + 1}
            </span>
          ) : null}

          {renderMark?.(item, index)}

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-[13px] font-medium text-text-primary">
                {item.label}
              </p>
              <p className="shrink-0 text-[13px] font-bold text-text-primary tabular-nums">
                {item.display}
              </p>
            </div>

            <ProgressBar
              value={(item.share / best) * 100}
              label={item.label}
              tone={tone}
              size="sm"
              className="mt-1.5"
            />

            {item.secondary ? (
              <p className="mt-1 text-[11px] text-text-muted">{item.secondary}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
