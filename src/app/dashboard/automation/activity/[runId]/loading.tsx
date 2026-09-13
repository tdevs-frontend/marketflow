import { Skeleton } from "@/components/ui/skeleton";

/** A run: header, the six summary facts, then the timeline. */
export default function RunDetailLoading() {
  return (
    <>
      <Skeleton className="h-4 w-32 rounded-full" />

      <div className="space-y-2">
        <Skeleton className="h-6 w-56 rounded-full" />
        <Skeleton className="h-4 w-72 rounded-full" />
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-2.5 w-20 rounded-full" />
              <Skeleton className="h-4 w-28 rounded-full" />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="size-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-48 rounded-full" />
                <Skeleton className="h-3 w-64 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
