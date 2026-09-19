import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  Settings2,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MiniStat } from "@/components/ui/stats-card";
import { NoConnectedAccounts } from "@/components/integrations/social/social-account-selector";
import {
  INTEGRATION_ROUTES,
  SOCIAL_CAPABILITY_LABEL,
} from "@/constants/integrations";
import { PLATFORM_THEME } from "@/constants/channels";
import { SOCIAL_ACCOUNTS } from "@/lib/social-fixtures";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import {
  formatCount,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountStatus } from "@/types/social";
import { PlatformMark } from "../shared/channel-badge";

/**
 * Connected social accounts, as Social Planner sees them.
 *
 * This page reads the connection; it does not own it. Connecting, reconnecting
 * and disconnecting all live in Integrations → Social, and every action here
 * links there rather than opening a dialog of its own — one connection flow,
 * one place a token is managed, one answer to "is this account live".
 *
 * What the Planner keeps is the half it is actually for: audience size, posting
 * volume and engagement per account, which is context a content team needs
 * while planning and which has no place on an integrations page. The split is
 * the same one that runs through the rest of the product — Integrations answers
 * *does it work*, the channel module answers *how is it doing*.
 *
 * Accounts come from `SOCIAL_ACCOUNTS`, the single shared source the composer
 * and the Integrations page also read.
 */

const STATUS_TONES: Record<AccountStatus, BadgeTone> = {
  connected: "success",
  expired: "warning",
  disconnected: "neutral",
};

const STATUS_LABELS: Record<AccountStatus, string> = {
  connected: "Connected",
  expired: "Token expired",
  disconnected: "Disconnected",
};

export function SocialAccounts() {
  const needsAttention = SOCIAL_ACCOUNTS.filter(
    (account) => account.status !== "connected",
  );
  const totalFollowers = SOCIAL_ACCOUNTS.reduce(
    (sum, account) => sum + account.followers,
    0,
  );

  if (SOCIAL_ACCOUNTS.length === 0) {
    return <NoConnectedAccounts compact={false} />;
  }

  return (
    <>
      {/* An alert bar, not a card in the grid: an expired token is a problem
          with the page, and burying it among four equal cards hides it. */}
      {needsAttention.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning/30 bg-warning-soft px-4 py-3.5">
          <AlertTriangle className="size-4 shrink-0 text-warning-text" aria-hidden />
          <p className="min-w-0 flex-1 text-sm text-warning-text">
            <span className="font-bold">
              {needsAttention.length} account
              {needsAttention.length === 1 ? "" : "s"} need
              {needsAttention.length === 1 ? "s" : ""} reconnecting.
            </span>{" "}
            Scheduled posts to{" "}
            {needsAttention.map((a) => PLATFORM_THEME[a.platform].label).join(" and ")}{" "}
            will fail until the token is renewed.
          </p>
          <ButtonLink href={INTEGRATION_ROUTES.social} variant="outline" size="sm">
            <RefreshCw aria-hidden />
            Fix now
          </ButtonLink>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-text-secondary">
            Total Followers
          </p>
          <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
            {formatCount(totalFollowers)}
          </p>
          <p className="mt-3 text-sm text-text-muted">
            across {SOCIAL_ACCOUNTS.length} connected accounts
          </p>
        </Card>

        {SOCIAL_ACCOUNTS.slice(0, 3).map((account) => {
          const rising = account.followerChange >= 0;
          const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

          return (
            <Card key={`stat-${account.id}`} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-text-secondary">
                  {PLATFORM_THEME[account.platform].label}
                </p>
                <PlatformMark platform={account.platform} size="sm" />
              </div>
              <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
                {formatCount(account.followers)}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm">
                <span
                  className={cn(
                    "inline-flex items-center gap-0.5 font-medium",
                    rising ? "text-primary" : "text-error",
                  )}
                >
                  <TrendIcon className="size-3.5" aria-hidden />
                  {Math.abs(account.followerChange).toFixed(1)}%
                </span>
                <span className="text-text-muted">vs last 30 days</span>
              </p>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SOCIAL_ACCOUNTS.map((account) => {
          const rising = account.followerChange >= 0;
          const broken = account.status !== "connected";

          /* Granted only. A capability that was never available on this account
             is a connection detail, and the page that owns it says why. */
          const granted = account.capabilities.filter(
            (capability) => capability.state === "granted",
          );

          return (
            <Card
              key={account.id}
              className={cn(
                "flex flex-col p-5",
                broken && "border-warning/40 bg-warning-soft/25",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <PlatformMark platform={account.platform} size="lg" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-text-primary">
                      {account.name}
                    </h3>
                    <p className="truncate text-sm text-text-muted">
                      {account.username}
                    </p>
                    <p className="mt-0.5 text-sm text-text-muted">
                      {account.accountType}
                    </p>
                  </div>
                </div>

                <Badge tone={STATUS_TONES[account.status]}>
                  {STATUS_LABELS[account.status]}
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <MiniStat
                  label="Followers"
                  value={formatNumber(account.followers)}
                  hint={`${rising ? "+" : ""}${account.followerChange.toFixed(1)}%`}
                />
                <MiniStat label="Posts" value={formatNumber(account.posts)} />
                <MiniStat
                  label="Engagement"
                  value={formatPercent(account.engagementRate)}
                />
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium  text-text-muted capitalize">
                  Capabilities
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {granted.map((capability) => (
                    <li
                      key={capability.key}
                      className="rounded-btn bg-surface-secondary px-2 py-0.5 text-sm font-medium text-text-secondary"
                    >
                      {SOCIAL_CAPABILITY_LABEL[capability.key]}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
                <p className="flex items-center gap-1.5 text-sm text-text-muted">
                  <RefreshCw className="size-3" aria-hidden />
                  Synced {formatRelativeTime(account.lastSyncedAt, WORKSPACE_NOW_MS)}
                </p>

                {/*
                 * One link, to the page that owns the connection.
                 *
                 * This used to be Manage / Reconnect / Disconnect wired to local
                 * dialogs, which meant two places could disconnect an account
                 * and only one of them knew what depended on it.
                 */}
                <ButtonLink
                  href={INTEGRATION_ROUTES.social}
                  variant={broken ? "primary" : "outline"}
                  size="sm"
                >
                  {broken ? <RefreshCw aria-hidden /> : <Settings2 aria-hidden />}
                  {broken ? "Reconnect" : "Manage connection"}
                </ButtonLink>
              </div>
            </Card>
          );
        })}

        {/* Add-account tile, sized to match a real card so the grid stays even. */}
        <Card className="flex flex-col items-center justify-center border-dashed p-5 text-center">
          <span className="grid size-10 place-items-center rounded-panel bg-surface-secondary text-text-muted">
            <Plus className="size-5" aria-hidden />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-text-primary">
            Connect another account
          </h3>
          <p className="mt-1 max-w-xs text-sm text-text-muted">
            Accounts are connected once in Integrations and become available to
            every part of Social Planner.
          </p>
          <ButtonLink
            href={INTEGRATION_ROUTES.social}
            size="sm"
            className="mt-3"
          >
            <ExternalLink aria-hidden />
            Go to Social Integrations
          </ButtonLink>
        </Card>
      </div>
    </>
  );
}
