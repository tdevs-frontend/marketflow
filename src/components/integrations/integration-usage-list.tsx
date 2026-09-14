import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import type { IntegrationUsage } from "@/types/integration";

/**
 * Where this connection is actually used.
 *
 * The panel exists to answer the question a merchant should ask before they
 * press Disconnect and usually does not: what stops working? Each row links
 * into the feature, so "12 workflows" is checkable rather than a number to be
 * taken on trust.
 *
 * The same list is rendered inside the disconnect confirmation — see
 * `DisconnectDialog` — which is the only way the warning there can stay true as
 * the workspace changes.
 */
export function IntegrationUsageList({
  usage,
  title = "Used by",
  description,
  className,
}: {
  usage: IntegrationUsage[];
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader
        title={title}
        description={
          description ?? "MarketFlow features that depend on this connection."
        }
      />
      <CardBody className="p-2">
        {usage.length === 0 ? (
          <EmptyState
            compact
            title="Not in use yet"
            description="Nothing in the workspace depends on this connection."
          />
        ) : (
          <ul className="space-y-1">
            {usage.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-panel px-3 py-2.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
                    <Icon name={item.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                    {item.label}
                  </span>
                  {item.count === undefined ? null : (
                    <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight className="size-4 shrink-0 text-text-muted" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
