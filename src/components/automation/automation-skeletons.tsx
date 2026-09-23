import { Skeleton, SkeletonStats, SkeletonTable } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading states for the Automation module.
 *
 * Each one is sized to the component it stands in for - a workflow card's
 * mini-map is 104px of diagram, so the skeleton reserves 104px - because a
 * placeholder that does not match what replaces it produces a layout jump,
 * which is worse than no placeholder. None of these is a centred spinner.
 */

/** The page header: title, description, and the actions on the right. */
export function AutomationHeaderSkeleton({ actions = 3 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 rounded-full" />
        <Skeleton className="h-3.5 w-[28rem] max-w-full rounded-full" />
      </div>
      <div className="flex shrink-0 gap-2.5">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-28 rounded-btn" />
        ))}
      </div>
    </div>
  );
}

/** Four compact KPI tiles, at `KpiStrip`'s height. */
export function AutomationKpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        count >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4",
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-card border border-border bg-surface p-4 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="size-8 rounded-btn" />
          </div>
          <Skeleton className="mt-3 h-6 w-20 rounded-full" />
          <Skeleton className="mt-2.5 h-3 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function AutomationToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Skeleton className="h-10 min-w-0 flex-1 rounded-field sm:max-w-xs" />
      <Skeleton className="h-10 w-32 rounded-field max-lg:hidden" />
      <Skeleton className="h-10 w-32 rounded-field max-lg:hidden" />
      <Skeleton className="h-10 w-28 rounded-btn" />
      <Skeleton className="ml-auto h-10 w-24 rounded-btn" />
    </div>
  );
}

export function WorkflowCardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <Skeleton className="size-8 rounded-btn" />
      </div>

      <Skeleton className="mt-3 h-3 w-full rounded-full" />
      <Skeleton className="mt-1.5 h-3 w-3/4 rounded-full" />

      {/* The mini-map: four pills and their connectors. */}
      <Skeleton className="mt-3 h-26 w-full rounded-panel" />

      <div className="mt-3 flex items-center gap-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-2.5 w-14 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkflowCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <WorkflowCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function WorkflowTableSkeleton({ rows = 8 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={8} />;
}

export function TemplateCardSkeleton() {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-4 w-44 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-3 w-full rounded-full" />
      <Skeleton className="mt-1.5 h-3 w-2/3 rounded-full" />
      <Skeleton className="mt-3 h-26 w-full rounded-panel" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <Skeleton className="h-9 flex-1 rounded-btn" />
        <Skeleton className="h-9 flex-1 rounded-btn" />
      </div>
    </div>
  );
}

export function TemplateGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <TemplateCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ActivityTableSkeleton({ rows = 10 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={7} />;
}

export function TriggerTableSkeleton({ rows = 10 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={8} />;
}

/**
 * The builder, loading.
 *
 * Three panels at their real widths rather than one grey box: the builder's
 * whole shape is the three-panel split, and a full-width placeholder that
 * resolves into three columns is a visible jolt on the most important screen
 * in the module.
 */
export function BuilderLoadingState() {
  return (
    <div className="flex h-[calc(100dvh-17rem)] min-h-125 gap-4">
      <div className="hidden w-60 shrink-0 flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card lg:flex">
        <Skeleton className="h-10 w-full rounded-field" />
        {Array.from({ length: 5 }).map((_, group) => (
          <div key={group} className="space-y-2">
            <Skeleton className="h-2.5 w-20 rounded-full" />
            {Array.from({ length: 2 }).map((_, item) => (
              <Skeleton key={item} className="h-9 w-full rounded-btn" />
            ))}
          </div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <Skeleton className="size-8 rounded-btn" />
          <Skeleton className="size-8 rounded-btn" />
          <Skeleton className="ml-auto h-8 w-28 rounded-btn" />
        </div>
        <div className="flex flex-col items-center gap-4 p-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-60 rounded-panel" />
          ))}
        </div>
      </div>

      <div className="hidden w-80 shrink-0 flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card xl:flex">
        <Skeleton className="h-4 w-32 rounded-full" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="h-11 w-full rounded-field" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The detail page's compact header, above the tab strip. */
export function WorkflowDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-40 rounded-full" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-64 rounded-full" />
          <Skeleton className="h-4 w-48 rounded-full" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="h-10 w-24 rounded-btn" />
          <Skeleton className="h-10 w-24 rounded-btn" />
          <Skeleton className="h-10 w-28 rounded-btn" />
        </div>
      </div>

      <div className="flex gap-4 border-b border-border pb-2.5">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-20 rounded-full" />
        ))}
      </div>

      <BuilderLoadingState />
    </>
  );
}

export { SkeletonStats };
