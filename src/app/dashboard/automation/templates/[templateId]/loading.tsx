import { AutomationHeaderSkeleton } from "@/components/automation/automation-skeletons";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";

/** The preview: header, three facts, the step strip, then the two columns. */
export default function TemplatePreviewLoading() {
  return (
    <>
      <Skeleton className="h-4 w-36 rounded-full" />
      <AutomationHeaderSkeleton actions={2} />

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-18 rounded-card" />
        ))}
      </div>

      <Skeleton className="h-44 rounded-card" />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 rounded-card border border-border bg-surface p-5 shadow-card xl:col-span-2">
          <SkeletonText lines={8} />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    </>
  );
}
