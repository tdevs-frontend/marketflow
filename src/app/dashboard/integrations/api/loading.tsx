import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiKeyTableSkeleton,
  ApiLogSkeleton,
  IntegrationHeaderSkeleton,
  IntegrationKpiSkeleton,
} from "@/components/integrations";

/** Header, KPI strip, the key register, then the log beside the usage rail. */
export default function ApiAccessLoading() {
  return (
    <>
      <IntegrationHeaderSkeleton actions={2} />
      <IntegrationKpiSkeleton />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-3 w-72 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-8 w-44 rounded-btn" />
        </div>
        <div className="mt-5">
          <ApiKeyTableSkeleton rows={4} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <Skeleton className="h-4 w-40 rounded-full" />
          <div className="mt-5">
            <ApiLogSkeleton rows={8} />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-card" />
          <Skeleton className="h-56 rounded-card" />
        </div>
      </div>
    </>
  );
}
