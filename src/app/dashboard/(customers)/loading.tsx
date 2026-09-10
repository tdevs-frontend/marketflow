import {
  Skeleton,
  SkeletonStats,
  SkeletonTable,
} from "@/components/ui/skeleton";

/**
 * The loading state for every page under Customers.
 *
 * One file at the group root rather than five at the leaves, matching how
 * Marketing does it: these pages all open with the same three bands — header,
 * KPI row, toolbar — and only the body below differs. Leads and Customer
 * Journey each override this with their own, because a kanban and a timeline
 * are not table-shaped and a table skeleton there would jump on swap.
 *
 * Sized to the real components (a 40px toolbar, ten rows) so the swap to
 * content moves nothing.
 */
export function CustomersHeaderSkeleton({
  actions = 2,
}: {
  actions?: number;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44 rounded-full" />
        <Skeleton className="h-3.5 w-96 max-w-full rounded-full" />
      </div>
      <div className="flex shrink-0 gap-2.5">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-32 rounded-btn" />
        ))}
      </div>
    </div>
  );
}

/** The search-and-filters row, as it sits inside a workspace card. */
export function CustomersToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Skeleton className="h-10 min-w-0 flex-1 rounded-field sm:max-w-xs" />
      <Skeleton className="h-10 w-36 rounded-field max-lg:hidden" />
      <Skeleton className="h-10 w-36 rounded-field max-lg:hidden" />
      <Skeleton className="h-10 w-28 rounded-btn" />
      <Skeleton className="ml-auto h-10 w-24 rounded-btn" />
    </div>
  );
}

export default function CustomersLoading() {
  return (
    <>
      <CustomersHeaderSkeleton />

      <SkeletonStats count={4} />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <CustomersToolbarSkeleton />
        <div className="mt-5">
          <SkeletonTable rows={10} columns={7} />
        </div>
      </div>
    </>
  );
}
