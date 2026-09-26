import { Skeleton, SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";

/**
 * The loading state for every dashboard page without its own.
 *
 * Header, KPI row, table - the shape most dashboard pages open with - so the
 * swap to content moves as little as possible. Modules whose pages are shaped
 * differently (the pipeline board, the journey, the builders) keep their own.
 */
export default function DashboardLoading() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44 rounded-full" />
          <Skeleton className="h-3.5 w-96 max-w-full rounded-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-btn" />
      </div>
      <SkeletonStats />
      <SkeletonTable />
    </>
  );
}
