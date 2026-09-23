import {
  AutomationHeaderSkeleton,
  AutomationKpiSkeleton,
  AutomationToolbarSkeleton,
  WorkflowCardGridSkeleton,
} from "@/components/automation/automation-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The Workflows list, loading.
 *
 * Sized to the real page - header, four KPI tiles, the toolbar, then a grid of
 * cards at the card's own height - so the swap to content moves nothing. The
 * nested routes each override this with a shape of their own, because a card
 * grid resolving into a three-panel builder is a visible jolt.
 */
export default function AutomationLoading() {
  return (
    <>
      <AutomationHeaderSkeleton actions={3} />
      <AutomationKpiSkeleton />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <AutomationToolbarSkeleton />
        <div className="mt-5">
          <WorkflowCardGridSkeleton count={6} />
        </div>
        <Skeleton className="mt-5 h-8 w-full rounded-full" />
      </div>
    </>
  );
}
