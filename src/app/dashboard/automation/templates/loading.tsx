import {
  AutomationHeaderSkeleton,
  AutomationToolbarSkeleton,
  TemplateGridSkeleton,
} from "@/components/automation/automation-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Templates opens on chips and a card grid, not on a KPI row. */
export default function TemplatesLoading() {
  return (
    <>
      <AutomationHeaderSkeleton actions={1} />

      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <AutomationToolbarSkeleton />
        <div className="mt-5">
          <TemplateGridSkeleton count={6} />
        </div>
      </div>
    </>
  );
}
