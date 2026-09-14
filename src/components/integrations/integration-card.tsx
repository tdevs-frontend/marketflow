"use client";

import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { categoryLabel } from "@/constants/integrations";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS, worstHealth } from "@/lib/integration-fixtures";
import type { Integration } from "@/types/integration";
import { HealthDot, IntegrationStatusBadge } from "./integration-badges";

/**
 * One integration on the hub.
 *
 * Deliberately plain: a soft icon tile, a name, a line of description, a status
 * badge and one action. No provider logo at 64px, no coloured card ground, no
 * gradient. A grid of eight of these is something a merchant scans in a couple
 * of seconds, and it only stays scannable while every card looks the same
 * except for the two things that actually differ — the badge and the button.
 *
 * The card lifts and links where there is somewhere to go; a hub-only
 * integration does not pretend to.
 */
export function IntegrationCard({
  integration,
  onConnect,
}: {
  integration: Integration;
  /** Opens the guided connect flow for an integration with no page of its own. */
  onConnect: (integration: Integration) => void;
}) {
  const connected =
    integration.status === "connected" || integration.status === "issue";
  const health = worstHealth(integration.health);

  /* The one line under the badge: what this connection *is*, in the merchant's
     terms. A phone number, a sender address, an endpoint count — whichever the
     integration recognises itself by. */
  const account = integration.account;

  const timestamp =
    integration.activity.lastSyncAt ?? integration.activity.lastSuccessAt;

  /* Connected connections are managed, a paused one is resumed, and one that
     was never set up is connected. Three words, because they are three
     different actions and a single "Configure" hides which. */
  const actionLabel = connected
    ? "Manage"
    : integration.status === "disabled"
      ? "Enable"
      : "Connect";

  return (
    <Card
      interactive={Boolean(integration.href)}
      className="relative flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-secondary">
          <Icon name={integration.icon} className="size-5" />
        </span>
        <IntegrationStatusBadge status={integration.status} size="sm" />
      </div>

      <h3 className="mt-3.5 text-sm font-semibold text-text-primary">
        {integration.href ? (
          /* Stretched link: the whole card is the target, while the action
             button below stays a separate, clickable control. */
          <Link href={integration.href} className="after:absolute after:inset-0 focus-visible:outline-none">
            {integration.name}
          </Link>
        ) : (
          integration.name
        )}
      </h3>
      <p className="mt-1 text-sm text-text-secondary font-medium">{integration.description}</p>

      <dl className="mt-3.5 space-y-1.5 border-t border-border pt-3.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-text-muted">
            {integration.provider ? "Provider" : "Category"}
          </dt>
          <dd className="min-w-0 truncate font-medium text-text-primary">
            {integration.provider?.name ?? categoryLabel(integration.category)}
          </dd>
        </div>

        {account ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-text-muted">Account</dt>
            <dd className="min-w-0 truncate font-medium text-text-primary">{account}</dd>
          </div>
        ) : null}

        {connected && timestamp ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="shrink-0 text-text-muted">Last activity</dt>
            <dd className="flex min-w-0 items-center gap-1.5 truncate font-medium text-text-primary">
              <HealthDot status={health} />
              {formatRelativeTime(timestamp, INTEGRATIONS_NOW_MS)}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* `mt-auto` so the buttons line up across a row whose cards have
          different numbers of detail rows. `relative` lifts it above the
          stretched link so it stays independently clickable. */}
      <div className="relative mt-auto pt-4">
        {integration.href ? (
          <ButtonLink
            href={integration.href}
            variant={connected ? "outline" : "primary"}
            size="sm"
            className="w-full"
          >
            {actionLabel}
          </ButtonLink>
        ) : (
          <Button
            variant={connected ? "outline" : "primary"}
            size="sm"
            className="w-full"
            onClick={() => onConnect(integration)}
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}
