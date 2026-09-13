import type { ReactNode } from "react";

import {
  Skeleton,
  SkeletonChart,
  SkeletonStats,
  SkeletonTable,
} from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The merchant overview's loading state.
 *
 * Nine shapes rather than one spinner, each sized to the widget it stands in
 * for and carrying the same grid span, so the page that arrives lands exactly
 * where the placeholder was. A single centred spinner would give the merchant
 * nothing to read and then move every card on the page when it cleared.
 */

/** The card shell every widget skeleton sits in — one border treatment. */
function CardSkeleton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-card",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Title, one line of description, and the action or control beside them. */
function CardHeadSkeleton({ action = "w-24" }: { action?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-40 max-w-full rounded-full" />
        <Skeleton className="h-3 w-56 max-w-full rounded-full" />
      </div>
      <Skeleton className={cn("h-8 shrink-0 rounded-btn", action)} />
    </div>
  );
}

/** The three-up tile row the campaign and inbox cards both open with. */
function TileRowSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="rounded-panel bg-surface-secondary px-3.5 py-2.5">
          <Skeleton className="h-2.5 w-14 rounded-full" />
          <Skeleton className="mt-2 h-4 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <>
      {/* Header: greeting and the page CTA. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 max-w-full rounded-full" />
          <Skeleton className="h-3.5 w-80 max-w-full rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 shrink-0 rounded-btn" />
      </div>

      <SkeletonStats count={4} />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Growth Overview — header, metric chips, headline, plot. */}
        <CardSkeleton className="order-2 lg:col-span-8 lg:col-start-1 lg:row-start-1">
          <CardHeadSkeleton action="w-64" />
          <div className="mt-5 flex items-center justify-between gap-3">
            <Skeleton className="h-8 w-56 rounded-btn" />
            <Skeleton className="h-3 w-40 rounded-full max-sm:hidden" />
          </div>
          <Skeleton className="mt-4 h-7 w-48 rounded-full" />
          <div className="mt-4">
            <SkeletonChart />
          </div>
        </CardSkeleton>

        {/* Business Pulse — three signal rows over two queue tiles. */}
        <CardSkeleton className="order-1 flex flex-col lg:col-span-4 lg:col-start-9 lg:row-start-1">
          <CardHeadSkeleton action="w-28" />

          <div className="mt-4 divide-y divide-border border-t border-border">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3 py-3.5">
                <Skeleton className="h-3 w-32 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className="rounded-panel bg-surface-secondary px-3.5 py-3">
                <Skeleton className="h-2.5 w-20 rounded-full" />
                <Skeleton className="mt-2.5 h-5 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </CardSkeleton>

        {/* Campaign Performance — tabs, totals, four ranked bars. */}
        <CardSkeleton className="order-4 lg:col-span-7 lg:col-start-1 lg:row-start-2">
          <CardHeadSkeleton />
          <Skeleton className="mt-5 h-8 w-64 rounded-btn" />
          <TileRowSkeleton />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-32 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
                <Skeleton className="mt-2 h-2.5 w-48 max-w-full rounded-full" />
              </div>
            ))}
          </div>
        </CardSkeleton>

        {/* WhatsApp Inbox — queue counts, then four conversations. */}
        <CardSkeleton className="order-3 lg:col-span-5 lg:col-start-8 lg:row-start-2">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-8 w-24 shrink-0 rounded-btn" />
          </div>
          <TileRowSkeleton />
          <div className="mt-4 divide-y divide-border border-t border-border">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center gap-3 py-3">
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-3 w-28 rounded-full" />
                  <Skeleton className="h-2.5 w-44 max-w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardSkeleton>

        {/* Product Performance — four ranked rows. */}
        <CardSkeleton className="order-7 lg:col-span-6 lg:col-start-1 lg:row-start-3">
          <CardHeadSkeleton action="w-28" />
          <div className="mt-3 divide-y divide-border">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-start gap-3 py-3">
                <Skeleton className="size-8 shrink-0 rounded-panel" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-36 rounded-full" />
                    <Skeleton className="h-3 w-16 rounded-full" />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <Skeleton className="h-2.5 w-20 rounded-full" />
                    <Skeleton className="h-2.5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="mt-2 h-1 w-full rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </CardSkeleton>

        {/* Recent Orders — a six-column table under its header action. */}
        <CardSkeleton className="order-5 lg:col-span-6 lg:col-start-7 lg:row-start-3">
          <CardHeadSkeleton action="w-32" />
          <div className="mt-3">
            <SkeletonTable rows={5} columns={6} />
          </div>
        </CardSkeleton>

        {/* Automation Activity — eight timeline events, each with a run status. */}
        <CardSkeleton className="order-6 lg:col-span-7 lg:col-start-1 lg:row-start-4">
          <CardHeadSkeleton action="w-32" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="flex items-center gap-3.5">
                <Skeleton className="size-8.5 shrink-0 rounded-full" />
                <Skeleton className="h-3 w-44 shrink-0 rounded-full max-sm:hidden" />
                <Skeleton className="h-3 min-w-0 flex-1 rounded-full" />
                <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
                <Skeleton className="h-2.5 w-16 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
        </CardSkeleton>

        {/* Sales Funnel — five tapering stages and the end-to-end rate. */}
        <CardSkeleton className="order-8 flex flex-col lg:col-span-5 lg:col-start-8 lg:row-start-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-32 rounded-full" />
            <Skeleton className="h-3 w-60 max-w-full rounded-full" />
          </div>
          <div className="mt-5 flex-1">
            {[100, 82, 68, 50, 42].map((width, index) => (
              <div key={width}>
                {index === 0 ? null : (
                  <Skeleton className="my-1.5 ml-1 h-2.5 w-40 rounded-full" />
                )}
                <Skeleton
                  className="h-10 rounded-panel"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
            <Skeleton className="h-3 w-36 rounded-full" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
        </CardSkeleton>
      </div>
    </>
  );
}
