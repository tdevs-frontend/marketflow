import { AlertTriangle, CheckCircle2, PlugZap, RefreshCw } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import type { ConnectionActivity } from "@/types/integration";

/**
 * The four timestamps that, between them, explain a failure.
 *
 * "Last connected" and "last successful request" are what separate a
 * credential that was never right from one that expired this morning, and
 * "last error" carries the provider's own wording rather than a paraphrase —
 * a merchant forwarding it to their provider's support needs the real string.
 *
 * Absolute time on the line, relative time under it. A merchant debugging at
 * 11pm wants "4 hours ago"; the same merchant filing a ticket tomorrow wants
 * the timestamp.
 */
export function ConnectionActivityPanel({
  activity,
  className,
}: {
  activity: ConnectionActivity;
  className?: string;
}) {
  const rows = [
    { icon: PlugZap, label: "Last connected", at: activity.connectedAt },
    { icon: CheckCircle2, label: "Last successful request", at: activity.lastSuccessAt },
    { icon: RefreshCw, label: "Last sync", at: activity.lastSyncAt },
    { icon: AlertTriangle, label: "Last error", at: activity.lastErrorAt },
  ];

  return (
    <Card className={className}>
      <CardHeader
        title="Connection Activity"
        description="The timeline to check first when something stops working."
      />
      <CardBody className="space-y-3.5">
        <dl className="space-y-3">
          {rows.map((row) => {
            const RowIcon = row.icon;

            return (
              <div key={row.label} className="flex items-start gap-3">
                <RowIcon
                  className="mt-0.5 size-4 shrink-0 text-text-muted"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <dt className="text-sm font-medium text-text-secondary">
                    {row.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-text-primary">
                    {row.at ? formatDateTime(row.at) : "Never"}
                    {row.at ? (
                      <span className="ml-2 text-meta font-medium text-text-muted">
                        {formatRelativeTime(row.at, INTEGRATIONS_NOW_MS)}
                      </span>
                    ) : null}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        {activity.lastError ? (
          <p className="rounded-panel border border-border bg-surface-secondary px-3 py-2.5 text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">Last error: </span>
            {activity.lastError}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
