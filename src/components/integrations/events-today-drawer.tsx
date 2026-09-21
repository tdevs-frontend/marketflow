"use client";

import { Drawer } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { formatCount } from "@/lib/format";
import { recentEvents } from "@/lib/integration-fixtures";
import type { Integration } from "@/types/integration";
import { IntegrationActivityFeed } from "./integration-activity-feed";

/**
 * What "Events Today" is actually counting.
 *
 * A KPI reading 15,554 with nothing behind it is a number a merchant learns to
 * stop reading. This is the click-through: the same total, split by the
 * connection that produced it, and then the last handful of events across all
 * of them so the figure has something concrete under it.
 *
 * Deliberately two short lists and no chart. Integrations monitors connections;
 * the moment this grows a time series it has started being the Analytics page,
 * and every module that owns these events already has one.
 */
export function EventsTodayDrawer({
  integrations,
  open,
  onClose,
}: {
  integrations: Integration[];
  open: boolean;
  onClose: () => void;
}) {
  /* Only the connections that did something. A row of zeroes is a list of
     integrations that are not connected, which the grid behind already says. */
  const contributors = integrations
    .filter((integration) => integration.eventsToday > 0)
    .sort((a, b) => b.eventsToday - a.eventsToday);

  const total = contributors.reduce(
    (sum, integration) => sum + integration.eventsToday,
    0,
  );

  /* Scales the bars. Guarded rather than assumed: a workspace whose every
     connection is still waiting on setup has no busiest contributor. */
  const peak = contributors[0]?.eventsToday ?? 0;

  const events = recentEvents(integrations, 12);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Events today"
      description="Events processed across connected integrations today."
    >
      <p className="text-3xl leading-none font-bold text-text-primary tabular-nums">
        {formatCount(total)}
      </p>

      {contributors.length === 0 ? (
        <p className="mt-2 text-sm text-text-secondary">
          Nothing has been processed today. Connect an integration to start
          seeing events here.
        </p>
      ) : (
        <section className="mt-5">
          <h3 className="text-sm font-semibold text-text-primary">By connection</h3>
          <ul className="mt-3 space-y-0.5">
          {contributors.map((integration) => (
            <li
              key={integration.id}
              className="flex items-center gap-3 rounded-panel px-2 py-2"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
                <Icon name={integration.icon} className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                {integration.name}
              </span>
              {/*
               * A bar rather than a percentage.
               *
               * The question is which connection is carrying the workspace, and
               * "60%" makes that arithmetic the reader's job. The bar is scaled
               * to the largest contributor, not to the total, so the smaller
               * ones stay visible instead of collapsing to a sliver.
               */}
              <span
                aria-hidden
                className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-secondary sm:block"
              >
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${(integration.eventsToday / peak) * 100}%` }}
                />
              </span>
              <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                {formatCount(integration.eventsToday)}
              </span>
            </li>
          ))}
          </ul>
        </section>
      )}

      <section className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-text-primary">Recent activity</h3>
        <IntegrationActivityFeed
          events={events}
          showSource
          emptyLabel="Nothing has happened across your connections today."
          className="mt-2 -mx-2"
        />
      </section>
    </Drawer>
  );
}
