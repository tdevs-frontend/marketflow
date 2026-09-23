import { AlertTriangle, CheckCircle2, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { IntegrationEvent } from "@/types/integration";

/**
 * What a connection has been doing, as a compact list.
 *
 * The counterpart to `ConnectionActivityPanel`: that answers *when* the
 * connection last worked, this answers *what it did*. "Connected · Healthy,
 * last activity 2 minutes ago" is reassuring and uninformative - a heartbeat
 * and a campaign of 840 messages produce the same line - and this is where the
 * difference becomes readable.
 *
 * Deliberately not a table and not paginated. It is the last four or five
 * things that happened, which is the amount a merchant checks before deciding
 * whether to open the real log; anything longer belongs in the module that owns
 * the events, not on an integration panel. Integrations monitors connections,
 * it does not become the analytics page for what flows through them.
 */

const OUTCOME: Record<
  IntegrationEvent["outcome"],
  { icon: LucideIcon; tint: string; label: string }
> = {
  success: { icon: CheckCircle2, tint: "text-success", label: "Succeeded" },
  warning: { icon: TriangleAlert, tint: "text-warning", label: "Warning" },
  failure: { icon: AlertTriangle, tint: "text-error", label: "Failed" },
};

/** An event plus the connection it came from, for the merged workspace feed. */
export interface FeedEvent extends IntegrationEvent {
  integrationName?: string;
  icon?: string;
}

export function IntegrationActivityFeed({
  events,
  /**
   * Names the integration on each row.
   *
   * On by default only where the feed is merged across connections - inside one
   * integration's own drawer every row would repeat the same name, which is
   * noise standing where the detail line should be.
   */
  showSource = false,
  emptyLabel = "No activity yet.",
  className,
}: {
  events: FeedEvent[];
  showSource?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  if (events.length === 0) {
    return (
      <p className={cn("text-sm text-text-secondary", className)}>{emptyLabel}</p>
    );
  }

  return (
    <ul className={cn("space-y-0.5", className)}>
      {events.map((event) => {
        const { icon: OutcomeIcon, tint, label: outcomeLabel } = OUTCOME[event.outcome];

        return (
          <li
            key={event.id}
            className="flex items-start gap-2.5 rounded-panel px-2 py-2 transition-colors hover:bg-surface-secondary"
          >
            {/* The source glyph where the feed is merged, the outcome glyph
                otherwise - one 16px slot, never both, so the rows keep a single
                left edge to scan down. */}
            {showSource && event.icon ? (
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
                <Icon name={event.icon} className="size-3" />
              </span>
            ) : (
              <OutcomeIcon
                className={cn("mt-0.5 size-4 shrink-0", tint)}
                aria-hidden
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="text-sm font-medium text-text-primary">
                  {showSource && event.integrationName ? (
                    <span className="text-text-muted">
                      {event.integrationName}
                      {" · "}
                    </span>
                  ) : null}
                  {event.label}
                </p>
                <time
                  className="shrink-0 text-meta text-text-muted"
                  dateTime={event.at}
                >
                  {formatRelativeTime(event.at, INTEGRATIONS_NOW_MS)}
                </time>
              </div>
              {event.detail ? (
                <p className="mt-0.5 text-meta text-text-secondary">{event.detail}</p>
              ) : null}
            </div>

            {/* On the merged feed the source took the glyph slot, so a failure
                would otherwise read the same as a success. The outcome comes
                back on the right, and only where it is not "it worked". */}
            {showSource && event.outcome !== "success" ? (
              <OutcomeIcon
                className={cn("mt-0.5 size-4 shrink-0", tint)}
                aria-label={outcomeLabel}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
