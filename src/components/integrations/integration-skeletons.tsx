import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading states for the Integrations module.
 *
 * Each one is sized to the component it stands in for — an integration card is
 * an icon tile, a badge, two lines of text, three detail rows and a full-width
 * button, so the skeleton reserves exactly that. A placeholder that does not
 * match what replaces it produces a layout jump, which is worse than no
 * placeholder. None of these is a centred spinner.
 */

/** Page header: title, description, and the actions on the right. */
export function IntegrationHeaderSkeleton({ actions = 1 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52 rounded-full" />
        <Skeleton className="h-3.5 w-120 max-w-full rounded-full" />
      </div>
      <div className="flex shrink-0 gap-2.5">
        {Array.from({ length: actions }).map((_, index) => (
          <Skeleton key={index} className="h-11 w-36 rounded-btn" />
        ))}
      </div>
    </div>
  );
}

/** The KPI strip, at `KpiStrip`'s height rather than a generic band. */
export function IntegrationKpiSkeleton({ count = 4 }: { count?: number }) {
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

export function IntegrationToolbarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Skeleton className="h-10 min-w-0 flex-1 rounded-field sm:max-w-xs" />
      <Skeleton className="h-10 w-36 rounded-field max-lg:hidden" />
      <Skeleton className="h-10 w-36 rounded-field max-lg:hidden" />
      <Skeleton className="h-10 w-28 rounded-btn lg:hidden" />
    </div>
  );
}

export function IntegrationCardSkeleton() {
  return (
    <div className="flex flex-col rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="size-10 rounded-btn" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>

      <Skeleton className="mt-3.5 h-4 w-40 rounded-full" />
      <Skeleton className="mt-2 h-3 w-full rounded-full" />

      <div className="mt-3.5 space-y-2 border-t border-border pt-3.5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        ))}
      </div>

      <Skeleton className="mt-4 h-9 w-full rounded-btn" />
    </div>
  );
}

export function IntegrationCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <IntegrationCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * A provider detail page: summary card, KPI row, then the settings column and
 * the health rail beside it. The two-column split is reserved at `xl` so the
 * page does not reflow when the real content lands.
 */
export function IntegrationDetailSkeleton() {
  return (
    <>
      <IntegrationHeaderSkeleton actions={3} />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-btn" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-44 rounded-full" />
            <Skeleton className="h-3 w-56 rounded-full" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-2.5 w-20 rounded-full" />
              <Skeleton className="h-3.5 w-28 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <IntegrationKpiSkeleton />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="h-64 rounded-card" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
          <Skeleton className="h-52 rounded-card" />
        </div>
      </div>
    </>
  );
}

/** Six columns — endpoint, events, status, success rate, last delivery, actions. */
export function WebhookTableSkeleton({ rows = 5 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={6} />;
}

/** Seven columns — name, prefix, created, last used, permissions, status, actions. */
export function ApiKeyTableSkeleton({ rows = 4 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={7} />;
}

/** Five columns — time, method, endpoint, status, duration. */
export function ApiLogSkeleton({ rows = 8 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={5} />;
}
