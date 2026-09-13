import {
  AutomationHeaderSkeleton,
  AutomationKpiSkeleton,
  AutomationToolbarSkeleton,
  TriggerTableSkeleton,
} from "@/components/automation/automation-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** The registry: KPI row, category chips, then the grouped table. */
export default function TriggersLoading() {
  return (
    <>
      <AutomationHeaderSkeleton actions={1} />
      <AutomationKpiSkeleton />

      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <AutomationToolbarSkeleton />
        <div className="mt-5">
          <TriggerTableSkeleton rows={10} />
        </div>
      </div>
    </>
  );
}
