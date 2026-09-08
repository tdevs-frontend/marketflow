import type { ReactNode } from "react";

import { Breadcrumb, type Crumb } from "@/components/ui/breadcrumb";

/**
 * The top of every dashboard page: trail, title, one line of context, and the
 * page's actions.
 *
 * The primary action stays last in the DOM and last in reading order on
 * desktop, but the header stacks below `sm` so on a phone the title is read
 * before the button rather than around it. `secondaryActions` sit to the left
 * of `action` so the one green button on the page is always the rightmost
 * control — that consistency is what makes the CTA findable without looking.
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  action,
  secondaryActions,
}: {
  title: string;
  description?: string;
  breadcrumb?: Crumb[];
  /** The page's primary button. */
  action?: ReactNode;
  /** Outline or ghost buttons — Export, Import, Settings. */
  secondaryActions?: ReactNode;
}) {
  return (
    <div className="space-y-3">
      {breadcrumb?.length ? <Breadcrumb items={breadcrumb} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-sm text-text-secondary">{description}</p>
          ) : null}
        </div>

        {action || secondaryActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            {secondaryActions}
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
