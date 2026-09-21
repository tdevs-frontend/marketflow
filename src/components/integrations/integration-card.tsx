"use client";

import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { categoryLabel, integrationTint } from "@/constants/integrations";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS, worstHealth } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { Integration, IntegrationStatus } from "@/types/integration";
import { HealthDot, IntegrationStatusBadge } from "./integration-badges";

/**
 * One integration on the hub.
 *
 * Deliberately plain: a soft icon tile, a name, a line of description, a status
 * badge, three metadata rows and one action. No provider logo at 64px, no
 * coloured card ground, no gradient, and no card nested inside it. A grid of
 * nine of these is something a merchant scans in a couple of seconds, and it
 * only stays scannable while every card is the same shape — which means the
 * broken one too. An Issue card that grows an error panel is a card that breaks
 * the row it is in, and the explanation it carries is one the merchant cannot
 * act on from here anyway; it lives on the detail view, where the fix is.
 *
 * The one thing that is allowed to differ before the label is read is the icon
 * tile, which wears the service's own colour — see `integrationTint`. Same
 * size, same radius, same border weight on every card; only the hue changes,
 * and it says which integration this is, never how it is doing.
 *
 * The three rows are the card's whole argument: who is carrying this
 * connection, what account it runs as, and when it last did anything. Health
 * rides on that last row as a coloured dot rather than taking a row of its own
 * — on a card this size the dot is read at the same glance as the timestamp,
 * and a fourth row would push the button out of line with its neighbours.
 *
 * The card lifts and links where there is somewhere to go; a hub-only
 * integration does not pretend to, and opens its drawer from the button.
 */

/**
 * The action, per state.
 *
 * Four labels rather than one "Configure", because they are four different
 * actions and a single word hides which one is on offer. "Fix connection" is
 * the one that has to be distinct: a merchant scanning for the broken thing is
 * looking for the button that admits it.
 *
 * `primary` is spent only where something is genuinely waiting on the merchant.
 * A healthy connection's Manage and a paused integration's Enable are both
 * outline — nothing is wrong in either case, and nine primary buttons in a grid
 * is no emphasis at all.
 */
const ACTION: Record<
  IntegrationStatus,
  { label: string; variant: "primary" | "outline" }
> = {
  connected: { label: "Manage", variant: "outline" },
  issue: { label: "Fix connection", variant: "primary" },
  needs_setup: { label: "Connect", variant: "primary" },
  disabled: { label: "Enable", variant: "outline" },
};

export function IntegrationCard({
  integration,
  onConnect,
  onManage,
}: {
  integration: Integration;
  /** Opens the guided connect flow for an integration that has no connection. */
  onConnect: (integration: Integration) => void;
  /**
   * Opens the manage drawer, for an integration with no page of its own. The
   * six routed ones link to their own page instead and never call this.
   */
  onManage: (integration: Integration) => void;
}) {
  const live =
    integration.status === "connected" || integration.status === "issue";
  const health = worstHealth(integration.health);
  const action = ACTION[integration.status];

  /* The one line that says what this connection *is*, in the merchant's terms:
     a phone number, a sender address, an account count, an endpoint count. */
  const account = integration.account;

  const timestamp =
    integration.activity.lastSyncAt ?? integration.activity.lastSuccessAt;

  return (
    <Card
      interactive={Boolean(integration.href)}
      className="relative flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Identity, not state. Geometry is fixed here so a tint can only
            ever change the colour — the border is the tile's own ink at 15%,
            which is what stops a 50-step bed reading as a smudge. */}
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-btn border",
            integrationTint(integration.id),
          )}
        >
          <Icon name={integration.icon} className="size-5" />
        </span>
        <IntegrationStatusBadge status={integration.status} size="sm" />
      </div>

      <h3 className="mt-3.5 text-sm font-semibold text-text-primary">
        {integration.href ? (
          /* Stretched link: the whole card is the target, while the action
             button below stays a separate, clickable control. */
          <Link
            href={integration.href}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {integration.name}
          </Link>
        ) : (
          integration.name
        )}
      </h3>
      <p className="mt-1 text-sm font-medium text-text-secondary">
        {integration.description}
      </p>

      <dl className="mt-3.5 space-y-1.5 border-t border-border pt-3.5 text-sm">
        {/* Provider where one is configured, category where none is. Both
            answer "what is behind this", which is what the row is for — and
            the grid is one continuous list, so the category is not a heading
            the card can lean on. */}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 font-medium text-text-muted">
            {integration.provider ? "Provider" : "Category"}
          </dt>
          <dd className="min-w-0 truncate font-medium text-text-primary">
            {integration.provider?.name ?? categoryLabel(integration.category)}
          </dd>
        </div>

        {account ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 font-medium text-text-muted">Account</dt>
            <dd className="min-w-0 truncate font-medium text-text-primary">
              {account}
            </dd>
          </div>
        ) : null}

        {/* Always present, including its absence: "No activity yet" answers the
            same question, and a row that disappears makes two cards in a row
            line up differently for no reason the reader can see. The dot is
            health, and only where there is a connection to have health. */}
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 font-medium text-text-muted">Last activity</dt>
          <dd className="flex min-w-0 items-center gap-1.5 truncate font-medium text-text-primary">
            {live ? <HealthDot status={health} /> : null}
            {timestamp ? (
              formatRelativeTime(timestamp, INTEGRATIONS_NOW_MS)
            ) : (
              <span className="text-text-muted">No activity yet</span>
            )}
          </dd>
        </div>
      </dl>

      {/* `mt-auto` so the buttons line up across a row whose cards have
          different numbers of detail rows. `relative` lifts it above the
          stretched link so it stays independently clickable. */}
      <div className="relative mt-auto pt-4">
        {integration.href ? (
          <ButtonLink
            href={integration.href}
            variant={action.variant}
            size="sm"
            className="w-full"
          >
            {action.label}
          </ButtonLink>
        ) : (
          <Button
            variant={action.variant}
            size="sm"
            className="w-full"
            onClick={() =>
              integration.status === "needs_setup"
                ? onConnect(integration)
                : onManage(integration)
            }
          >
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
}
