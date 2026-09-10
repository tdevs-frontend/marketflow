import { Skeleton, SkeletonStats } from "@/components/ui/skeleton";

import {
  CustomersHeaderSkeleton,
  CustomersToolbarSkeleton,
} from "../loading";

/**
 * The board, not a table.
 *
 * The group's shared skeleton ends in ten table rows, which is the wrong shape
 * here — swapping a table skeleton for six kanban columns is a visible jump.
 * Six columns of three cards is what the page actually opens with.
 */
export default function LeadsLoading() {
  return (
    <>
      <CustomersHeaderSkeleton />

      <SkeletonStats count={4} />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <CustomersToolbarSkeleton />

        <div className="mt-5 overflow-hidden">
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, column) => (
              <div
                key={column}
                className="flex w-64 shrink-0 flex-col gap-2.5 rounded-card bg-surface-secondary p-2.5"
              >
                <div className="flex items-center justify-between px-1 pb-1">
                  <Skeleton className="h-3.5 w-20 rounded-full" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
                {Array.from({ length: 3 }).map((_, card) => (
                  <div
                    key={card}
                    className="space-y-2.5 rounded-panel border border-border bg-surface p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-24 rounded-full" />
                        <Skeleton className="h-2.5 w-16 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-3 w-32 rounded-full" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
