"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Plus, RefreshCw, Send, Share2, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { useToast } from "@/components/ui/toast";
import { SOCIAL_PROVIDERS, providerForPlatform } from "@/constants/integrations";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { requireIntegration } from "@/lib/integration-fixtures";
import {
  SOCIAL_ACCOUNTS,
  SOCIAL_ACTIVITY,
  socialConnectionTotals,
} from "@/lib/social-fixtures";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/types/social";
import { ConnectionActivityPanel } from "../connection-activity";
import { ConnectionHealth } from "../connection-health";
import { DisconnectSocialAccountDialog } from "./disconnect-social-dialog";
import { HealthDot } from "../integration-badges";
import { IntegrationUsageList } from "../integration-usage-list";
import { ConnectedAccountCard } from "./connected-account-card";
import { OAuthConnectionDialog } from "./oauth-connection-dialog";
import { ProviderIcon } from "./provider-icon";
import { SocialAccountDrawer } from "./social-account-drawer";

/**
 * Integrations → Social.
 *
 * This page is about *connections*, not content. It answers what is connected,
 * whether the authorisation still works, what each account is allowed to do,
 * and where those accounts are used — the same five questions the WhatsApp,
 * Email and SMS pages answer, asked of a set of accounts rather than one
 * provider connection.
 *
 * What it deliberately does not do is show a calendar, a composer, or reach
 * and engagement figures. Those are Social Planner's job, and duplicating them
 * here is what would turn Integrations into a second marketing workspace. The
 * seam between the two is the "Used by" rail and the accounts themselves:
 * `SOCIAL_ACCOUNTS` is one array, read by both modules.
 *
 * The layout is the module's established one — main column, then a rail
 * carrying health, dependants and the activity timeline — so a merchant
 * arriving from the WhatsApp page already knows where to look.
 */
export function SocialWorkspace() {
  const integration = requireIntegration("social");
  const toast = useToast();

  /* Session-local overrides on top of the shared fixture. A real build writes
     these through to the API; the shape is the same either way. */
  const [overrides, setOverrides] = useState<Record<string, Partial<SocialAccount>>>(
    {},
  );
  const [connecting, setConnecting] = useState(false);
  const [selected, setSelected] = useState<SocialAccount | null>(null);
  const [disconnecting, setDisconnecting] = useState<SocialAccount | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const accounts = useMemo(
    () =>
      SOCIAL_ACCOUNTS.map((account) =>
        overrides[account.id] ? { ...account, ...overrides[account.id] } : account,
      ),
    [overrides],
  );

  const totals = useMemo(() => socialConnectionTotals(accounts), [accounts]);
  const broken = accounts.filter((account) => account.status !== "connected");

  const kpis: Kpi[] = [
    {
      label: "Connected Accounts",
      value: formatCount(totals.accounts),
      icon: Users,
      tone: "brand",
      hint: `Across ${new Set(accounts.map((a) => a.platform)).size} platforms`,
    },
    {
      label: "Active Platforms",
      value: formatCount(totals.activePlatforms),
      icon: Share2,
      tone: "success",
      hint: "Able to publish right now",
    },
    {
      label: "Posts Published Today",
      value: formatCount(totals.postsToday),
      icon: Send,
      hint: "Through connected accounts",
    },
    {
      label: "Connection Issues",
      value: formatCount(totals.issues),
      icon: AlertTriangle,
      tone: totals.issues > 0 ? "danger" : "neutral",
      hint: totals.issues > 0 ? "Needs re-authorising" : "Everything authorised",
    },
  ];

  /* Providers with nothing connected yet, plus the ones not built — the row
     that tells a merchant what else is possible without pretending. */
  const unconnected = SOCIAL_PROVIDERS.filter(
    (provider) =>
      provider.platform === null ||
      !accounts.some((account) => account.platform === provider.platform),
  );

  function patch(id: string, next: Partial<SocialAccount>) {
    setOverrides((current) => ({ ...current, [id]: { ...current[id], ...next } }));
    setSelected((current) =>
      current && current.id === id ? { ...current, ...next } : current,
    );
  }

  function refreshAll() {
    setRefreshing(true);
    toast("Refreshing every social connection…", "info");
    window.setTimeout(() => {
      setRefreshing(false);
      toast(
        broken.length > 0
          ? `${accounts.length - broken.length} of ${accounts.length} accounts refreshed — ${broken.length} still needs re-authorising`
          : "All connections refreshed",
        broken.length > 0 ? "error" : "success",
      );
    }, 1400);
  }

  function reconnect(account: SocialAccount) {
    toast(`Re-authorising ${account.name} on ${providerForPlatform(account.platform).label}…`, "info");
    window.setTimeout(() => {
      patch(account.id, {
        status: "connected",
        lastSyncedAt: new Date(WORKSPACE_NOW_MS).toISOString(),
        auth: { ...account.auth, status: "healthy", expiresAt: null },
        capabilities: account.capabilities.map((capability) =>
          capability.state === "needs_reauth"
            ? { ...capability, state: "granted" as const, detail: undefined }
            : capability,
        ),
      });
      toast(`${account.name} reconnected`, "success");
    }, 1400);
  }

  function disconnect() {
    if (!disconnecting) return;
    patch(disconnecting.id, {
      status: "disconnected",
      publishing: { ...disconnecting.publishing, availableToPlanner: false },
      auth: { ...disconnecting.auth, status: "disconnected" },
    });
    toast(`${disconnecting.name} disconnected`, "info");
    setDisconnecting(null);
    setSelected(null);
  }

  return (
    <>
      <PageHeader
        title="Social Media Integration"
        description="Connect and manage the social accounts MarketFlow uses for publishing, scheduling and analytics."
        secondaryActions={
          <Button variant="outline" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw
              className={cn(refreshing && "animate-spin motion-reduce:animate-none")}
              aria-hidden
            />
            Refresh Connections
          </Button>
        }
        action={
          <Button onClick={() => setConnecting(true)}>
            <Plus aria-hidden />
            Connect Account
          </Button>
        }
      />

      <KpiStrip items={kpis} />

      {/* An alert bar rather than a fifth card: an expired token is silently
          failing to publish, and burying it among equal tiles hides it. */}
      {broken.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning/30 bg-warning-soft px-4 py-3.5">
          <AlertTriangle className="size-4 shrink-0 text-warning-text" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-warning-text">
            <span className="font-bold">
              {broken.length} account{broken.length === 1 ? "" : "s"} need
              {broken.length === 1 ? "s" : ""} re-authorising.
            </span>{" "}
            Scheduled posts to{" "}
            {broken.map((a) => providerForPlatform(a.platform).label).join(" and ")}{" "}
            will fail until the connection is restored.
          </p>
          <Button variant="outline" size="sm" onClick={() => reconnect(broken[0])}>
            <RefreshCw aria-hidden />
            Reconnect
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {accounts.length === 0 ? (
            <EmptyState
              title="Connect your first social account"
              description="Connect Facebook, Instagram, LinkedIn or X to publish and schedule from MarketFlow."
              action={
                <Button size="sm" onClick={() => setConnecting(true)}>
                  <Plus aria-hidden />
                  Connect Account
                </Button>
              }
            />
          ) : (
            <section>
              <h2 className="text-base">Connected accounts</h2>
              <p className="mt-1 text-sm text-text-secondary font-medium">
                Each account is authorised separately and can be managed on its own.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {accounts.map((account) => (
                  <ConnectedAccountCard
                    key={account.id}
                    account={account}
                    onManage={setSelected}
                    onRefresh={(item) =>
                      toast(`Syncing ${item.name}…`, "info")
                    }
                    onReconnect={reconnect}
                    onDisconnect={setDisconnecting}
                  />
                ))}
              </div>
            </section>
          )}

          {unconnected.length > 0 ? (
            <section>
              <h2 className="text-base">Available platforms</h2>
              <p className="mt-1 text-sm text-text-secondary font-medium">
                What else MarketFlow can publish to.
              </p>

              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {unconnected.map((provider) => {
                  const soon = provider.availability === "coming_soon";

                  return (
                    <li
                      key={provider.id}
                      className={cn(
                        "flex items-center gap-3 rounded-panel border border-border px-3.5 py-3",
                        soon && "bg-surface-secondary/60",
                      )}
                    >
                      <ProviderIcon provider={provider} size="md" />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-semibold",
                            soon ? "text-text-muted" : "text-text-primary",
                          )}
                        >
                          {provider.label}
                        </p>
                        <p className="truncate text-meta text-text-muted">
                          {soon ? "Available soon" : `Connect a ${provider.resourceNoun.toLowerCase()}`}
                        </p>
                      </div>
                      {soon ? null : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConnecting(true)}
                        >
                          Connect
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-6">
          <ConnectionHealth
            checks={integration.health}
            onFix={() => (broken[0] ? reconnect(broken[0]) : setConnecting(true))}
          />

          <IntegrationUsageList
            usage={integration.usage}
            description="Where these accounts are used. Check before disconnecting one."
          />

          <Card>
            <CardHeader
              title="Connection Activity"
              description="Syncs, token refreshes and publishing failures."
            />
            <CardBody className="p-2">
              <ul className="space-y-1">
                {SOCIAL_ACTIVITY.slice(0, 6).map((event) => (
                  <li
                    key={event.id}
                    className="flex items-start gap-2.5 rounded-panel px-3 py-2"
                  >
                    <HealthDot
                      status={
                        event.status === "success"
                          ? "healthy"
                          : event.status === "warning"
                            ? "warning"
                            : "error"
                      }
                      className="mt-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text-primary">{event.message}</p>
                      <p className="mt-0.5 text-meta text-text-muted">
                        {providerForPlatform(event.platform).label} ·{" "}
                        {formatRelativeTime(event.at, WORKSPACE_NOW_MS)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <ConnectionActivityPanel activity={integration.activity} />
        </aside>
      </div>

      {/* Mounted only while open, so each connection starts from step one. */}
      {connecting ? (
        <OAuthConnectionDialog
          open
          onClose={() => setConnecting(false)}
          onConnected={() => {
            /* A real build appends the account the API returns. The fixture is
               already at capacity for the platforms it supports, so this is
               where that write would land. */
          }}
        />
      ) : null}

      <SocialAccountDrawer
        account={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onReconnect={reconnect}
        onDisconnect={setDisconnecting}
        onTogglePlanner={(account, next) => {
          patch(account.id, {
            publishing: { ...account.publishing, availableToPlanner: next },
          });
          toast(
            next
              ? `${account.name} is available to Social Planner`
              : `${account.name} hidden from Social Planner`,
            next ? "success" : "info",
          );
        }}
      />

      <DisconnectSocialAccountDialog
        account={disconnecting}
        open={Boolean(disconnecting)}
        onClose={() => setDisconnecting(null)}
        onConfirm={disconnect}
      />
    </>
  );
}
