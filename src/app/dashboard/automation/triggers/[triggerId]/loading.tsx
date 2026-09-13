import { AutomationHeaderSkeleton } from "@/components/automation/automation-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Trigger detail: header, three facts, then the two panels and the log. */
export default function TriggerDetailLoading() {
  return (
    <>
      <Skeleton className="h-4 w-32 rounded-full" />
      <AutomationHeaderSkeleton actions={2} />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-18 rounded-card" />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>

      <Skeleton className="h-56 rounded-card" />
    </>
  );
}
