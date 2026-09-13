import {
  ActivityTableSkeleton,
  AutomationHeaderSkeleton,
  AutomationKpiSkeleton,
  AutomationToolbarSkeleton,
} from "@/components/automation/automation-skeletons";

/** The execution monitor: KPI row, six filters, then ten log rows. */
export default function ActivityLoading() {
  return (
    <>
      <AutomationHeaderSkeleton actions={1} />
      <AutomationKpiSkeleton />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <AutomationToolbarSkeleton />
        <div className="mt-5">
          <ActivityTableSkeleton rows={10} />
        </div>
      </div>
    </>
  );
}
