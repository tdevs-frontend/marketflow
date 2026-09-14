import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types/integration";
import { IntegrationStatusBadge } from "./integration-badges";

export interface SummaryFact {
  label: string;
  value: ReactNode;
  /** A second line under the value — what it is measured over, or a caveat. */
  hint?: string;
}

/**
 * The card a detail page opens on: who this connection is, and the handful of
 * facts that identify it.
 *
 * Identity only — the numbers live in the KPI row below, because "Business
 * Account ID" and "Messages Today" answer different questions and a merchant
 * checking one is not reading the other. Mixing them produced a nine-cell grid
 * where nothing stood out.
 *
 * The same component serves WhatsApp, Email and SMS. What differs between them
 * is the `facts` array, which is exactly the amount of difference there is.
 */
export function ConnectionSummary({
  integration,
  facts,
  actions,
  className,
}: {
  integration: Integration;
  facts: SummaryFact[];
  /** Test / Reconnect / Disconnect. Wraps under the identity row on a phone. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
            <Icon name={integration.icon} className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{integration.name}</h2>
              <IntegrationStatusBadge status={integration.status} size="sm" />
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              {integration.provider
                ? `Connected through ${integration.provider.name}`
                : integration.description}
            </p>
          </div>
        </div>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div>
        ) : null}
      </div>

      <dl className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-meta font-medium text-text-muted">{fact.label}</dt>
            <dd className="mt-1 truncate text-sm font-semibold text-text-primary">
              {fact.value}
            </dd>
            {fact.hint ? (
              <dd className="mt-0.5 text-meta text-text-muted">{fact.hint}</dd>
            ) : null}
          </div>
        ))}
      </dl>
    </Card>
  );
}
