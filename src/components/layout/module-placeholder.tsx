import type { ReactNode } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * A module the navigation reaches before the module exists.
 *
 * Three sidebar entries in the agreed structure — Forms, Landing Pages, Team —
 * have no pages behind them yet. The alternatives were both worse: leaving
 * them out would ship a navigation that does not match the product plan, and
 * pointing them at nothing would hand merchants a 404 from the sidebar, which
 * reads as a broken app rather than an unfinished one.
 *
 * So the route resolves and says plainly what is there. It states what the
 * module will do and where the nearest working thing is, and it is built from
 * `PageHeader` and `EmptyState` like every other empty view in the product —
 * no special "coming soon" styling to remove later.
 */
export function ModulePlaceholder({
  title,
  description,
  summary,
  action,
}: {
  title: string;
  description: string;
  /** What this module will do, in the merchant's terms. */
  summary: string;
  /** A link to whatever covers part of the job today. */
  action?: ReactNode;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />

      <EmptyState
        title={`${title} is not built yet`}
        description={summary}
        action={action}
      />
    </>
  );
}
