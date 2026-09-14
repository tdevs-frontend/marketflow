import { Skeleton, SkeletonTable } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Loading states for the Workspace module.
 *
 * Each is sized to the component it replaces — the roles page reserves its
 * 19rem list column and the matrix beside it, because a placeholder that does
 * not match what lands produces a layout jump, which is worse than none. No
 * centred spinners here.
 */

export function WorkspaceHeaderSkeleton({ actions = 1 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 rounded-full" />
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

export function WorkspaceKpiSkeleton({ count = 4 }: { count?: number }) {
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
          <Skeleton className="mt-3 h-6 w-16 rounded-full" />
          <Skeleton className="mt-2.5 h-3 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ToolbarSkeleton({ filters = 2 }: { filters?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Skeleton className="h-10 min-w-0 flex-1 rounded-field sm:max-w-xs" />
      {Array.from({ length: filters }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-40 rounded-field max-lg:hidden" />
      ))}
      <Skeleton className="h-10 w-28 rounded-btn lg:hidden" />
    </div>
  );
}

/** Six columns — member, role, status, last active, joined, actions. */
export function TeamTableSkeleton({ rows = 8 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={6} />;
}

export function TeamPageSkeleton() {
  return (
    <>
      <WorkspaceHeaderSkeleton />
      <WorkspaceKpiSkeleton />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <ToolbarSkeleton />
        <div className="mt-5">
          <TeamTableSkeleton />
        </div>
      </div>
    </>
  );
}

/** The role list column on its own — used inside `RolesSkeleton`. */
export function RoleListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <Skeleton className="h-4 w-20 rounded-full" />
      <div className="mt-4 space-y-3.5">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-1.5">
            <Skeleton className="h-3.5 w-36 rounded-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-2.5 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The permission editor: search row, tier toggle, then the module accordions.
 *
 * Only the first group is drawn open, matching the real component — a skeleton
 * showing eight expanded groups would collapse to one and jump the page.
 */
export function PermissionMatrixSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Skeleton className="h-10 min-w-0 flex-1 rounded-field" />
        <Skeleton className="h-8 w-72 max-w-full rounded-btn" />
      </div>

      <Skeleton className="h-4 w-56 rounded-full" />

      <div className="space-y-2.5">
        <div className="rounded-panel border border-border">
          <div className="flex items-center gap-3 px-3.5 py-3">
            <Skeleton className="size-4 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-28 rounded-full" />
              <Skeleton className="h-2.5 w-56 max-w-full rounded-full" />
            </div>
            <Skeleton className="h-3 w-12 rounded-full" />
          </div>
          <div className="space-y-2.5 border-t border-border px-3.5 py-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-3.5 w-32 rounded-full" />
                <div className="ml-auto flex gap-3">
                  {Array.from({ length: 5 }).map((_, cell) => (
                    <Skeleton key={cell} className="size-4.5 rounded-sm" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-16 rounded-panel" />
        ))}
      </div>
    </div>
  );
}

/** The members tab inside a role, and the team drawer's member list. */
export function MemberListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28 rounded-full" />
        <Skeleton className="h-2.5 w-72 max-w-full rounded-full" />
      </div>
      <ul className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, index) => (
          <li key={index} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-36 rounded-full" />
              <Skeleton className="h-2.5 w-48 rounded-full" />
            </div>
            <Skeleton className="h-2.5 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The roles page: the list column and the detail beside it.
 *
 * The two-column split is reserved at `xl` so the page does not reflow when the
 * matrix arrives.
 */
export function RolesSkeleton() {
  return (
    <>
      <WorkspaceHeaderSkeleton />

      <div className="grid gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <RoleListSkeleton />

        <div className="space-y-6">
          {/* Header card: identity, four summary tiles, then access preview. */}
          <Skeleton className="h-72 rounded-card" />

          <div className="flex gap-1 border-b border-border">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="mb-2 h-6 w-24 rounded-full" />
            ))}
          </div>

          <PermissionMatrixSkeleton />
        </div>
      </div>
    </>
  );
}

/** Six columns — time, member, action, module, target, status. */
export function ActivityTableSkeleton({ rows = 10 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={6} />;
}

export function ActivityPageSkeleton() {
  return (
    <>
      <WorkspaceHeaderSkeleton />
      <WorkspaceKpiSkeleton />

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <ToolbarSkeleton filters={3} />
        <div className="mt-5">
          <ActivityTableSkeleton />
        </div>
      </div>
    </>
  );
}

/** Header, the tab strip, then one section's worth of fields. */
export function WorkspaceSettingsSkeleton() {
  return (
    <>
      <WorkspaceHeaderSkeleton actions={0} />

      <div className="flex gap-1 border-b border-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="mb-2 h-6 w-28 rounded-full" />
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface shadow-card">
        <div className="space-y-2 border-b border-border px-5 py-4">
          <Skeleton className="h-3.5 w-24 rounded-full" />
          <Skeleton className="h-3 w-80 max-w-full rounded-full" />
        </div>
        <div className="grid max-w-3xl gap-4 p-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-3 w-28 rounded-full" />
              <Skeleton className="h-11 w-full rounded-field" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * The audit table, under the name the rest of the module calls it.
 *
 * Same six columns as `ActivityTableSkeleton` — this is an alias rather than a
 * second definition, because two skeletons for one table is how they drift.
 */
export const AuditTableSkeleton = ActivityTableSkeleton;
