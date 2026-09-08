import {
  Skeleton,
  SkeletonChart,
  SkeletonStats,
  SkeletonTable,
  SkeletonText,
} from "@/components/ui/skeleton";

/**
 * The loading state for every page under Marketing.
 *
 * One file at the segment root rather than twelve at the leaves: these pages
 * all open with the same three bands — header, KPI row, then a chart or a
 * table — so a shared skeleton matches all of them closely enough to avoid a
 * layout jump, and there is only one thing to keep in step when the shape
 * changes.
 *
 * Sized to the real components (an 8px stat label, a 300px chart, ten table
 * rows) so the swap to content moves nothing.
 */
export default function MarketingLoading() {
  return (
    <>
      <div className="space-y-3">
        <Skeleton className="h-2.5 w-48 rounded-full" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-56 rounded-full" />
            <Skeleton className="h-3.5 w-80 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-10 w-40 shrink-0 rounded-btn" />
        </div>
      </div>

      <SkeletonStats count={5} />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          {/* Two lines, matching a ChartCard's title and description. */}
          <SkeletonText lines={2} className="w-64 max-w-full" />
          <Skeleton className="h-8 w-36 shrink-0 rounded-btn" />
        </div>
        <div className="mt-5">
          <SkeletonChart />
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-10 min-w-0 flex-1 rounded-field sm:max-w-xs" />
          <Skeleton className="h-10 w-36 rounded-field max-lg:hidden" />
          <Skeleton className="h-10 w-36 rounded-field max-lg:hidden" />
          <Skeleton className="h-10 w-28 rounded-btn" />
        </div>
        <div className="mt-5">
          <SkeletonTable rows={8} columns={6} />
        </div>
      </div>
    </>
  );
}
