"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import type { WebhookDelivery } from "@/types/integration";
import { CodeText, HttpStatusBadge } from "../integration-badges";

/**
 * Recent deliveries for one endpoint.
 *
 * A list rather than a table: this sits in a 30rem drawer, where five columns
 * would either scroll sideways or crush the one column that matters - the error
 * string. So time, event and duration ride on one line as metadata, the status
 * anchors the right, and a failure gets a full-width line of its own carrying
 * what the endpoint actually said.
 *
 * The retry count is only rendered when a delivery was retried. "Attempt 1" on
 * every successful row is a column of ones.
 */
export function WebhookDeliveryLog({
  deliveries,
}: {
  deliveries: WebhookDelivery[];
}) {
  if (deliveries.length === 0) {
    return (
      <EmptyState
        compact
        title="No deliveries yet"
        description="Send a test event, or wait for one of the subscribed events to fire."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {deliveries.map((delivery) => (
        <li key={delivery.id} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CodeText>{delivery.event}</CodeText>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta text-text-muted">
                <time dateTime={delivery.sentAt}>{formatDateTime(delivery.sentAt)}</time>
                <span aria-hidden>·</span>
                <span>{formatRelativeTime(delivery.sentAt, INTEGRATIONS_NOW_MS)}</span>
                <span aria-hidden>·</span>
                <span className="tabular-nums">{delivery.durationMs} ms</span>
                {delivery.attempt > 1 ? (
                  <>
                    <span aria-hidden>·</span>
                    <span>attempt {delivery.attempt}</span>
                  </>
                ) : null}
              </p>
            </div>

            <HttpStatusBadge code={delivery.httpCode} />
          </div>

          {delivery.error ? (
            <p className="mt-2 rounded-panel bg-error-soft px-3 py-2 text-meta text-error-text">
              {delivery.error}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
