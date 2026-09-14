"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { RefreshCw, Unlink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabPanel } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  SOCIAL_CAPABILITY_DETAIL,
  SOCIAL_CAPABILITY_LABEL,
  SOCIAL_CAPABILITY_SCOPES,
  providerForPlatform,
} from "@/constants/integrations";
import { APP_ROUTES } from "@/constants/app";
import { formatDateTime, formatRelativeTime } from "@/lib/format";
import { activityForAccount } from "@/lib/social-fixtures";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/types/social";
import {
  AuthStatusBadge,
  CapabilityBadge,
  CodeText,
  HealthBadge,
  HealthDot,
} from "../integration-badges";
import { ProviderIcon } from "./provider-icon";

/**
 * One connected account, in full.
 *
 * The same five-section anatomy the WhatsApp page established — what it is,
 * what it may do, how it behaves, whether it works, and what it has been
 * doing — as tabs rather than a scroll, because this is a drawer beside a grid
 * rather than a page of its own.
 *
 * Nothing here renders a token. `SocialAuth` does not carry one, which is the
 * structural version of that rule: a value that is not in the model cannot be
 * put on screen by a later edit.
 */

type Tab = "overview" | "permissions" | "publishing" | "health" | "activity";

export function SocialAccountDrawer({
  account,
  open,
  onClose,
  onReconnect,
  onDisconnect,
  onTogglePlanner,
}: {
  account: SocialAccount | null;
  open: boolean;
  onClose: () => void;
  onReconnect: (account: SocialAccount) => void;
  onDisconnect: (account: SocialAccount) => void;
  onTogglePlanner: (account: SocialAccount, next: boolean) => void;
}) {
  const idBase = useId();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("overview");

  if (!account) return null;

  const provider = providerForPlatform(account.platform);
  const events = activityForAccount(account.id);
  const scopes = SOCIAL_CAPABILITY_SCOPES[provider.id] ?? {};
  const broken = account.status !== "connected";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={account.name}
      description={`${account.accountType} · ${account.username}`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <Button
            variant="ghost"
            size="compact"
            onClick={() => onDisconnect(account)}
            className="text-error hover:bg-error-soft hover:text-error"
          >
            <Unlink aria-hidden />
            Disconnect
          </Button>
          <Button size="compact" onClick={() => onReconnect(account)}>
            <RefreshCw aria-hidden />
            {broken ? "Reconnect" : "Refresh connection"}
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-3">
        <ProviderIcon provider={provider} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text-primary">
            {provider.label}
          </p>
          <p className="truncate text-sm text-text-muted">{account.username}</p>
        </div>
        <AuthStatusBadge status={account.auth.status} />
      </div>

      <Tabs
        idBase={idBase}
        label="Account detail"
        value={tab}
        onChange={setTab}
        className="mt-4"
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "permissions", label: "Permissions" },
          { value: "publishing", label: "Publishing" },
          { value: "health", label: "Health" },
          { value: "activity", label: "Activity" },
        ]}
      />

      {tab === "overview" ? (
        <TabPanel idBase={idBase} value="overview" className="mt-5">
          <dl className="space-y-3">
            {[
              { label: "Platform", value: provider.label },
              { label: "Account name", value: account.name },
              { label: "Account type", value: account.accountType },
              {
                label: "External account ID",
                value: <CodeText>{account.externalId}</CodeText>,
              },
              { label: "Connected by", value: account.auth.connectedBy },
              {
                label: "Connected at",
                value: formatDateTime(account.auth.connectedAt),
              },
              {
                label: "Last sync",
                value: formatRelativeTime(account.lastSyncedAt, WORKSPACE_NOW_MS),
              },
              {
                label: "Token expiry",
                value: account.auth.expiresAt
                  ? formatDateTime(account.auth.expiresAt)
                  : "Does not expire",
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <dt className="shrink-0 text-sm text-text-muted">{row.label}</dt>
                <dd className="min-w-0 truncate text-sm font-medium text-text-primary">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </TabPanel>
      ) : null}

      {tab === "permissions" ? (
        <TabPanel idBase={idBase} value="permissions" className="mt-5 space-y-2.5">
          <p className="text-sm text-text-secondary">
            Granted on {provider.label} when the account was authorised.
            Changing them means reconnecting.
          </p>

          {/* Every capability the provider offers, not only the granted ones —
              a merchant wondering why comment sync is off needs to see the row
              that says it was never available. */}
          {provider.capabilities.map((key) => {
            const capability = account.capabilities.find((item) => item.key === key);
            const state = capability?.state ?? "missing";

            return (
              <div
                key={key}
                className="rounded-panel border border-border px-3.5 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-text-primary">
                    {SOCIAL_CAPABILITY_LABEL[key]}
                  </p>
                  <CapabilityBadge state={state} />
                </div>
                <p className="mt-1 text-sm text-text-secondary font-medium">
                  {capability?.detail ?? SOCIAL_CAPABILITY_DETAIL[key]}
                </p>
                {scopes[key] ? (
                  <p className="mt-1.5">
                    <CodeText>{scopes[key]}</CodeText>
                  </p>
                ) : null}
              </div>
            );
          })}
        </TabPanel>
      ) : null}

      {tab === "publishing" ? (
        <TabPanel idBase={idBase} value="publishing" className="mt-5 space-y-4">
          <p className="text-sm text-text-secondary">
            How this connection behaves. What to post and when belongs to{" "}
            <Link
              href={APP_ROUTES.socialCalendar}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Social Planner
            </Link>
            .
          </p>

          <ToggleRow
            label="Publishing enabled"
            hint="Turn off to keep the connection but stop all outbound posts."
            checked={account.publishing.enabled}
            onChange={(next) =>
              toast(
                next
                  ? `Publishing enabled for ${account.name}`
                  : `Publishing paused for ${account.name}`,
                next ? "success" : "info",
              )
            }
          />

          <ToggleRow
            label="Available to Social Planner"
            hint="Offer this account as a publish target in the post composer."
            checked={account.publishing.availableToPlanner}
            onChange={(next) => onTogglePlanner(account, next)}
          />

          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">
                Publishing timezone
              </p>
              <p className="mt-0.5 text-meta text-text-muted">
                Scheduled times are resolved against this zone.
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-text-primary">
              {account.publishing.timezone}
            </p>
          </div>

          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary">Posts today</p>
              <p className="mt-0.5 text-meta text-text-muted">
                Published through this connection since midnight.
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-text-primary tabular-nums">
              {account.postsToday}
            </p>
          </div>
        </TabPanel>
      ) : null}

      {tab === "health" ? (
        <TabPanel idBase={idBase} value="health" className="mt-5 space-y-1">
          {accountHealth(account).map((check) => (
            <div
              key={check.label}
              className={cn(
                "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-panel px-3 py-2.5",
                check.status !== "healthy" && "bg-surface-secondary",
              )}
            >
              <HealthDot status={check.status} className="mt-1.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {check.label}
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">{check.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {check.status === "error" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReconnect(account)}
                  >
                    Reconnect
                  </Button>
                ) : null}
                <HealthBadge status={check.status} size="sm" />
              </div>
            </div>
          ))}
        </TabPanel>
      ) : null}

      {tab === "activity" ? (
        <TabPanel idBase={idBase} value="activity" className="mt-5">
          {events.length === 0 ? (
            <p className="text-sm text-text-muted">
              Nothing recorded for this account yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event.id} className="flex items-start gap-3 py-3 first:pt-0">
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
                      {formatRelativeTime(event.at, WORKSPACE_NOW_MS)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabPanel>
      ) : null}
    </Drawer>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="cursor-pointer text-sm font-medium text-text-primary"
        >
          {label}
        </label>
        <p className="mt-0.5 text-meta text-text-muted">{hint}</p>
      </div>
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} label={label} />
    </div>
  );
}

/**
 * Per-account health, derived from the connection rather than stored.
 *
 * The same four checks the other integration pages run, asked of one account:
 * can we reach it, is the authorisation valid, may we publish, may we read
 * analytics. Derived so a token that lapses cannot leave a stale "Healthy"
 * behind it.
 */
function accountHealth(account: SocialAccount) {
  const publish = account.capabilities.find((c) => c.key === "publish");
  const analytics = account.capabilities.find((c) => c.key === "analytics");
  const expiry = account.auth.expiresAt;

  const capabilityCheck = (
    label: string,
    capability: { state: string; detail?: string } | undefined,
    grantedDetail: string,
  ) =>
    ({
      label,
      status:
        capability?.state === "granted"
          ? ("healthy" as const)
          : capability?.state === "needs_reauth"
            ? ("error" as const)
            : ("warning" as const),
      detail:
        capability?.state === "granted"
          ? grantedDetail
          : (capability?.detail ?? "Not granted on this account."),
    }) as const;

  return [
    {
      label: "API Connection",
      status: account.status === "disconnected" ? ("error" as const) : ("healthy" as const),
      detail:
        account.status === "disconnected"
          ? "The account is no longer reachable."
          : `Last response ${formatRelativeTime(account.lastSyncedAt, WORKSPACE_NOW_MS)}.`,
    },
    {
      label: "Authentication",
      status:
        account.auth.status === "expired"
          ? ("error" as const)
          : account.auth.status === "healthy"
            ? ("healthy" as const)
            : ("warning" as const),
      detail:
        account.auth.status === "expired"
          ? "The access token has expired. Reconnect to restore publishing."
          : expiry
            ? `Token valid until ${formatDateTime(expiry)}.`
            : "Token does not expire.",
    },
    capabilityCheck(
      "Publishing Permission",
      publish,
      "MarketFlow can create and schedule posts.",
    ),
    capabilityCheck(
      "Analytics Permission",
      analytics,
      "MarketFlow can read reach and engagement.",
    ),
  ];
}
