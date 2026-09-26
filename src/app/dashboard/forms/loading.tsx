import { Skeleton, SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";

/**
 * The Forms list's loading state - and the Suspense boundary its URL-backed
 * filters need. Sized to the real header, KPI row and table.
 */
export default function FormsLoading() {
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32 rounded-full" />
          <Skeleton className="h-3.5 w-96 max-w-full rounded-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-btn" />
      </div>
      <SkeletonStats />
      <SkeletonTable />
    </>
  );
}
