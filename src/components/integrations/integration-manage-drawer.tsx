"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PlugZap, RefreshCw, Unplug, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS, worstHealth } from "@/lib/integration-fixtures";
import { cn } from "@/lib/utils";
import type { Integration } from "@/types/integration";
import {
  ConnectionTestResult,
  defaultConnectionTest,
  useConnectionTest,
  type TestOutcome,
} from "./connection-test";
import { CredentialList } from "./credential-field";
import {
  HealthBadge,
  HealthDot,
  IntegrationStatusBadge,
} from "./integration-badges";
import { IntegrationActivityFeed } from "./integration-activity-feed";

/**
 * Manage, for an integration with no page of its own.
 *
 * Google Analytics, Shopify and Meta Pixel are connected and watched from the
 * hub: there is no inbox to read, no template library to sync and no delivery
 * log to page through, so a route of their own would be a page with a summary
 * card on it. A drawer is the right size for what they actually have -
 * connection, configuration, health, recent activity - and it keeps the
 * merchant on the grid they were scanning.
 *
 * The same four sections as the routed detail pages, in the same order, because
 * a merchant who learns the shape on WhatsApp should not have to learn it again
 * here. What is missing is the settings column, which is the whole difference
 * between the two and the reason this is not a page.
 *
 * Every action that leaves the drawer - reconnect, disconnect - is delegated
 * upward rather than handled here. Both open a dialog of their own, and a
 * `<dialog>` opened from inside another leaves the first one sitting behind it
 * in the top layer; the hub closes this before opening those.
 */
export function IntegrationManageDrawer({
  integration,
  open,
  onClose,
  onReconnect,
  onDisconnect,
  onEnabled,
}: {
  integration: Integration;
  open: boolean;
  onClose: () => void;
  /** Re-authorise without discarding what is saved. */
  onReconnect: () => void;
  /** Opens the confirmation. Never disconnects on its own. */
  onDisconnect: () => void;
  /** Fired once the saved credentials have been verified, not on the click. */
  onEnabled: () => void;
}) {
  const { state: test, run } = useConnectionTest();

  const live =
    integration.status === "connected" || integration.status === "issue";
  const health = worstHealth(integration.health);
  const configured = integration.credentials.length > 0;

  /**
   * What "Enable" checks before it flips anything.
   *
   * A paused integration keeps its credentials, so enabling is a question about
   * whether they still work rather than a switch - and the status must not read
   * Connected until the answer comes back. An integration with nothing saved
   * cannot be enabled at all; it is told to connect instead of being sent round
   * a check that has nothing to check.
   */
  function enableCheck(): TestOutcome {
    if (!configured) {
      return {
        ok: false,
        message: "No saved configuration.",
        detail: `${integration.name} has nothing to re-enable. Connect it first.`,
      };
    }

    return {
      ok: true,
      message: "Connection successful.",
      detail: `${integration.provider?.name ?? integration.name} accepted the saved credentials.`,
    };
  }

  const busy = test.status === "testing";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={integration.name}
      description={integration.description}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Disconnect sits apart from the two safe actions, and only where
              there is a connection to end. */}
          {live ? (
            <Button variant="danger" size="compact" onClick={onDisconnect}>
              <Unplug aria-hidden />
              Disconnect
            </Button>
          ) : (
            <span />
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {live ? (
              <>
                <Button
                  variant="outline"
                  size="compact"
                  disabled={busy}
                  onClick={() => run(() => defaultConnectionTest(integration))}
                >
                  <Zap aria-hidden />
                  Test connection
                </Button>
                <Button
                  variant={integration.status === "issue" ? "primary" : "outline"}
                  size="compact"
                  onClick={onReconnect}
                >
                  <RefreshCw aria-hidden />
                  Reconnect
                </Button>
              </>
            ) : configured ? (
              <Button
                size="compact"
                disabled={busy}
                onClick={() =>
                  run(enableCheck, (outcome) => {
                    if (outcome.ok) onEnabled();
                  })
                }
              >
                <PlugZap aria-hidden />
                {busy ? "Enabling…" : `Enable ${integration.name}`}
              </Button>
            ) : (
              <Button size="compact" onClick={onReconnect}>
                <PlugZap aria-hidden />
                Connect {integration.name}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
          <Icon name={integration.icon} className="size-5" />
        </span>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <IntegrationStatusBadge status={integration.status} size="sm" />
          {live ? <HealthBadge status={health} size="sm" /> : null}
        </div>
      </div>

      <ConnectionTestResult state={test} className="mt-4" />

      <div className="mt-5 space-y-5">
        <Section title="Connection">
          <dl className="space-y-2">
            <Fact
              label="Provider"
              value={integration.provider?.name ?? "Not selected"}
            />
            <Fact label="Account" value={integration.account ?? "-"} />
            <Fact
              label="Connected since"
              value={
                integration.activity.connectedAt
                  ? formatRelativeTime(
                      integration.activity.connectedAt,
                      INTEGRATIONS_NOW_MS,
                    )
                  : "Never connected"
              }
            />
            <Fact
              label="Last activity"
              value={
                integration.activity.lastSuccessAt
                  ? formatRelativeTime(
                      integration.activity.lastSuccessAt,
                      INTEGRATIONS_NOW_MS,
                    )
                  : "No activity yet"
              }
            />
          </dl>

          {integration.activity.lastError ? (
            <p className="mt-3 rounded-panel bg-error-soft px-3 py-2 text-meta font-medium text-error-text">
              <span className="font-semibold">Last error: </span>
              {integration.activity.lastError}
            </p>
          ) : null}
        </Section>

        <Section
          title="Configuration"
          description="Secrets are stored encrypted and only ever shown masked."
        >
          {configured ? (
            <CredentialList credentials={integration.credentials} />
          ) : (
            <p className="text-sm text-text-secondary">
              Nothing saved yet. Connecting {integration.name} stores its
              credentials here.
            </p>
          )}
        </Section>

        <Section title="Health">
          <ul className="space-y-2">
            {integration.health.map((check) => (
              <li key={check.id} className="flex items-start gap-2.5">
                <HealthDot status={check.status} className="mt-1.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-medium text-text-primary">
                      {check.label}
                    </p>
                    <time
                      className="shrink-0 text-meta text-text-muted"
                      dateTime={check.checkedAt}
                    >
                      {formatRelativeTime(check.checkedAt, INTEGRATIONS_NOW_MS)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-meta text-text-secondary">
                    {check.detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/*
         * Where this connection sits in the workspace.
         *
         * Titled by state: a live integration is "Used by" something, and one
         * that has never been connected only "Connects to" it. The second
         * wording is what keeps a Shopify card that nothing depends on yet from
         * claiming three dependants it does not have.
         */}
        {integration.usage.length > 0 ? (
          <Section title={live ? "Used by" : "Connects to"}>
            <ul className="flex flex-wrap gap-1.5">
              {integration.usage.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 rounded-btn border border-border bg-surface-secondary px-2.5 py-1.5 text-meta font-medium text-text-primary transition-colors hover:border-border-strong hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <Icon name={item.icon} className="size-3.5 text-text-muted" />
                    {item.label}
                    {item.count === undefined ? null : (
                      <span className="tabular-nums text-text-muted">
                        {item.count}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Recent activity">
          <IntegrationActivityFeed
            events={integration.events}
            emptyLabel={`${integration.name} has not done anything yet.`}
            className="-mx-2"
          />
        </Section>
      </div>
    </Drawer>
  );
}

/**
 * One section of the drawer.
 *
 * A heading and a rule, not a `Card`. The drawer is already a surface, and a
 * card inside it is the second border in 20px that the brief's "no card inside
 * a card" rule is about - the rule does the same separating job for nothing.
 */
function Section({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("border-t border-border pt-4 first:border-0 first:pt-0", className)}>
      <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
      {description ? (
        <p className="mt-0.5 text-meta text-text-muted">{description}</p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-sm text-text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}
