import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * Loading placeholder.
 *
 * Sized by the caller to the shape of the real content, not a generic grey
 * box — a skeleton that does not match what replaces it produces a layout
 * jump, which is worse than a spinner. `animate-pulse` respects
 * `prefers-reduced-motion` through Tailwind's own media query.
 */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  /** Escape hatch for an exact pixel height a utility cannot express. */
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn("animate-pulse rounded-panel bg-surface-secondary", className)}
    />
  );
}

/** Stacked lines of text. The last is short, the way a paragraph ends. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3 rounded-full", index === lines - 1 && "w-2/3")}
        />
      ))}
    </div>
  );
}

/** The stat row's loading state — one card per metric, at the card's height. */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        count >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
      )}
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="rounded-card border border-border bg-surface p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="size-8 rounded-btn" />
          </div>
          <Skeleton className="mt-3 h-7 w-20 rounded-full" />
          <Skeleton className="mt-3 h-3 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Header row plus body rows, at the table's real row height. */
export function SkeletonTable({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      <div
        className="grid gap-3 border-b border-border pb-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-2.5 rounded-full" />
        ))}
      </div>

      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="grid gap-3 py-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton
              key={column}
              className={cn("h-3.5 rounded-full", column === 0 && "w-4/5")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Chart placeholder at the chart's exact height, so the card never resizes. */
export function SkeletonChart({ height = 300 }: { height?: number }) {
  return <Skeleton className="w-full" style={{ height }} />;
}
