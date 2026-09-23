"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ApiLogEntry } from "@/types/integration";
import { HttpStatusBadge, MethodBadge } from "../integration-badges";

/**
 * Wall-clock time, pinned to UTC.
 *
 * The API's own logs are in UTC and so are the fixtures, so rendering in the
 * viewer's zone would put a timestamp here that does not match the one the
 * merchant reads back from the API - and it would differ between the server
 * render and the client, which is a hydration mismatch.
 */
const CLOCK = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/**
 * Recent requests.
 *
 * Time first, because this is read as a sequence - a 429 matters because of
 * what came immediately before it. The clock is rendered from the entry's own
 * timestamp in the workspace's locale rather than re-derived here, and the
 * endpoint keeps its query string: `/api/v1/contacts` and
 * `/api/v1/contacts?page=3` are different requests and a truncated path hides
 * the pagination loop that is burning the rate limit.
 */
export function ApiLogs({
  logs,
  action,
  className,
}: {
  logs: ApiLogEntry[];
  /** A filter or a "View all" link. */
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base">Recent Requests</h2>
          <p className="mt-1 text-sm text-text-secondary font-medium">
            The last {logs.length} calls across every key in this workspace.
          </p>
        </div>
        {action}
      </div>

      <div className="mt-5">
        {logs.length === 0 ? (
          <EmptyState
            compact
            title="No requests yet"
            description="Calls made with any key in this workspace appear here within a few seconds."
          />
        ) : (
          <Table minWidth="52rem">
            <THead>
              <TH>Time</TH>
              <TH>Method</TH>
              <TH>Endpoint</TH>
              <TH>Key</TH>
              <TH>Status</TH>
              <TH align="right">Duration</TH>
            </THead>

            <TBody>
              {logs.map((entry) => (
                <TR key={entry.id}>
                  <TD className="whitespace-nowrap text-text-secondary tabular-nums">
                    <time dateTime={entry.at}>{CLOCK.format(new Date(entry.at))}</time>
                  </TD>

                  <TD>
                    <MethodBadge method={entry.method} />
                  </TD>

                  <TD className="max-w-xs">
                    <span className="block truncate font-mono text-meta text-text-secondary">
                      {entry.endpoint}
                    </span>
                  </TD>

                  <TD className="font-normal text-text-muted">{entry.keyName}</TD>

                  <TD>
                    <HttpStatusBadge code={entry.status} />
                  </TD>

                  <TD align="right" className="tabular-nums text-text-secondary">
                    {entry.durationMs} ms
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
