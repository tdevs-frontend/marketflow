import { Skeleton } from "@/components/ui/skeleton";

import { CustomersHeaderSkeleton } from "../loading";

/**
 * The picker, then a list.
 *
 * Customer Journey opens on the customer picker rather than on a KPI row and a
 * table, so it gets its own skeleton: a search field, a two-column grid of
 * candidates, and the recent-journeys list below.
 */
export default function CustomerJourneyLoading() {
  return (
    <>
      <CustomersHeaderSkeleton actions={0} />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36 rounded-full" />
          <Skeleton className="h-3.5 w-80 max-w-full rounded-full" />
        </div>

        <Skeleton className="mt-4 h-11 w-full rounded-field" />

        <Skeleton className="mt-4 h-2.5 w-24 rounded-full" />

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-panel border border-border p-3"
            >
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-2.5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-3.5 w-72 max-w-full rounded-full" />
        </div>

        <div className="mt-4 space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-40 rounded-full" />
              <Skeleton className="ml-auto h-3 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
