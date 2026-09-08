"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Link2,
  Plus,
  RefreshCw,
  Settings2,
  Unlink,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { MiniStat } from "@/components/ui/stats-card";
import { useToast } from "@/components/ui/toast";
import { PLATFORM_ORDER, PLATFORM_THEME } from "@/constants/channels";
import { SOCIAL_ACCOUNTS } from "@/lib/social-fixtures";
import {
  formatCount,
  formatNumber,
  formatPercent,
  formatRelativeTime,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccountStatus, SocialAccount, SocialPlatform } from "@/types/social";
import { PlatformMark } from "../shared/channel-badge";

/**
 * Connected social accounts.
 *
 * Cards rather than a table, because each account is a thing you act on rather
 * than a row you compare — and because the state that matters here is binary
 * and urgent: a page whose token has expired is silently failing to publish,
 * which is the one thing this page exists to surface. So an expired account
 * gets a tinted card and a Reconnect button, not just an amber word.
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

/** Platforms with no account yet — what "Connect Account" can still add. */
const connectable = (accounts: SocialAccount[]): SocialPlatform[] =>
  PLATFORM_ORDER.filter(
    (platform) => !accounts.some((account) => account.platform === platform),
  );

export function SocialAccounts() {
  const toast = useToast();

  const [managing, setManaging] = useState<SocialAccount | null>(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [pendingDisconnect, setPendingDisconnect] = useState<SocialAccount | null>(
    null,
  );

  const needsAttention = SOCIAL_ACCOUNTS.filter(
    (account) => account.status !== "connected",
  );
  const totalFollowers = SOCIAL_ACCOUNTS.reduce(
    (sum, account) => sum + account.followers,
    0,
  );
  const available = connectable(SOCIAL_ACCOUNTS);

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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setManaging(needsAttention[0])}
          >
            <RefreshCw aria-hidden />
            Fix now
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-[13px] font-medium text-text-secondary">
            Total Followers
          </p>
          <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
            {formatCount(totalFollowers)}
          </p>
          <p className="mt-3 text-xs text-text-muted">
            across {SOCIAL_ACCOUNTS.length} connected accounts
          </p>
        </Card>

        {SOCIAL_ACCOUNTS.slice(0, 3).map((account) => {
          const rising = account.followerChange >= 0;
          const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

          return (
            <Card key={`stat-${account.id}`} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-medium text-text-secondary">
                  {PLATFORM_THEME[account.platform].label}
                </p>
                <PlatformMark platform={account.platform} size="sm" />
              </div>
              <p className="mt-3 text-[1.75rem] leading-none font-bold text-text-primary">
                {formatCount(account.followers)}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-xs">
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
          const theme = PLATFORM_THEME[account.platform];
          const rising = account.followerChange >= 0;
          const broken = account.status !== "connected";

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
                    <p className="truncate text-xs text-text-muted">
                      {account.username}
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">
                      {theme.label}
                      {account.platform === "instagram" ? " Business" : ""}
                      {account.platform === "facebook" ? " Page" : ""}
                      {account.platform === "linkedin" ? " Page" : ""}
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
                <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                  Permissions
                </p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {account.permissions.map((permission) => (
                    <li
                      key={permission}
                      className="rounded-btn bg-surface-secondary px-2 py-0.5 text-[11px] font-medium text-text-secondary"
                    >
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
                <p className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <RefreshCw className="size-3" aria-hidden />
                  Synced {formatRelativeTime(account.lastSyncedAt)}
                </p>

                <div className="flex gap-2">
                  {broken ? (
                    <Button
                      size="sm"
                      onClick={() => toast(`Reconnecting ${theme.label}…`)}
                    >
                      <RefreshCw aria-hidden />
                      Reconnect
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setManaging(account)}
                    >
                      <Settings2 aria-hidden />
                      Manage
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPendingDisconnect(account)}
                  >
                    <Unlink aria-hidden />
                    Disconnect
                  </Button>
                </div>
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
          <p className="mt-1 max-w-xs text-xs text-text-muted">
            {available.length > 0
              ? `${available.map((p) => PLATFORM_THEME[p].label).join(", ")} ${available.length === 1 ? "is" : "are"} still available, plus a second profile on any platform.`
              : "Every platform is connected. You can add a second profile on any of them."}
          </p>
          <Button size="sm" className="mt-3" onClick={() => setConnectOpen(true)}>
            <Plus aria-hidden />
            Connect Account
          </Button>
        </Card>
      </div>

      {/* -------------------------------------------------------- Manage */}
      <Dialog
        open={Boolean(managing)}
        onClose={() => setManaging(null)}
        title={managing ? `Manage ${managing.name}` : "Manage account"}
        description={managing?.username}
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setManaging(null)}>
              Close
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setManaging(null);
                toast("Account settings saved");
              }}
            >
              Save changes
            </Button>
          </>
        }
      >
        {managing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <PlatformMark platform={managing.platform} size="lg" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {managing.name}
                </p>
                <p className="text-xs text-text-muted">{managing.username}</p>
              </div>
              <Badge tone={STATUS_TONES[managing.status]} className="ml-auto">
                {STATUS_LABELS[managing.status]}
              </Badge>
            </div>

            {managing.status === "expired" ? (
              <div className="rounded-panel border border-warning/30 bg-warning-soft px-3.5 py-3">
                <p className="text-xs font-medium text-warning-text">
                  This token has expired
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Reconnecting takes you to {PLATFORM_THEME[managing.platform].label}{" "}
                  to re-authorise. Your scheduled posts and history are kept.
                </p>
                <Button
                  size="sm"
                  className="mt-2.5"
                  onClick={() => {
                    setManaging(null);
                    toast(
                      `Reconnecting ${PLATFORM_THEME[managing.platform].label}…`,
                    );
                  }}
                >
                  <RefreshCw aria-hidden />
                  Reconnect now
                </Button>
              </div>
            ) : null}

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Followers", value: formatNumber(managing.followers) },
                { label: "Posts published", value: formatNumber(managing.posts) },
                {
                  label: "Engagement rate",
                  value: formatPercent(managing.engagementRate),
                },
                {
                  label: "Last synced",
                  value: formatRelativeTime(managing.lastSyncedAt),
                },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-text-muted">{row.label}</dt>
                  <dd className="font-medium text-text-primary">{row.value}</dd>
                </div>
              ))}
            </dl>

            <section>
              <h3 className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Granted permissions
              </h3>
              <ul className="mt-2 space-y-1.5">
                {managing.permissions.map((permission) => (
                  <li
                    key={permission}
                    className="flex items-center gap-2 rounded-panel border border-border px-3 py-2 text-[13px] text-text-secondary"
                  >
                    <Link2 className="size-3.5 shrink-0 text-primary" aria-hidden />
                    {permission}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-text-muted">
                Permissions are granted on {PLATFORM_THEME[managing.platform].label}{" "}
                and can only be changed there.
              </p>
            </section>

            <Button
              variant="outline"
              size="compact"
              className="w-full"
              onClick={() => {
                toast("Sync started");
              }}
            >
              <RefreshCw aria-hidden />
              Sync now
            </Button>
          </div>
        ) : null}
      </Dialog>

      {/* ------------------------------------------------------- Connect */}
      <Dialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        title="Connect an account"
        description="You are taken to the platform to authorise, then back here."
        footer={
          <Button variant="outline" size="compact" onClick={() => setConnectOpen(false)}>
            Cancel
          </Button>
        }
      >
        <ul className="space-y-2">
          {PLATFORM_ORDER.map((platform) => {
            const theme = PLATFORM_THEME[platform];
            const existing = SOCIAL_ACCOUNTS.find(
              (account) => account.platform === platform,
            );

            return (
              <li key={platform}>
                <button
                  type="button"
                  onClick={() => {
                    setConnectOpen(false);
                    toast(`Opening ${theme.label} to authorise…`);
                  }}
                  className="flex w-full items-center gap-3 rounded-panel border border-border px-3.5 py-3 text-left transition-all hover:border-border-strong hover:shadow-card focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <PlatformMark platform={platform} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-text-primary">
                      {theme.label}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {existing
                        ? `${existing.username} already connected — this adds a second profile`
                        : "Not connected yet"}
                    </span>
                  </span>
                  <Link2 className="size-4 shrink-0 text-text-muted" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDisconnect)}
        onClose={() => setPendingDisconnect(null)}
        onConfirm={() =>
          toast(
            `${pendingDisconnect ? PLATFORM_THEME[pendingDisconnect.platform].label : "Account"} disconnected`,
          )
        }
        title={`Disconnect ${pendingDisconnect?.name}?`}
        description="Scheduled posts to this account are cancelled."
        confirmLabel="Disconnect account"
      >
        <p className="text-sm text-text-secondary">
          Posts already published stay on the platform, and your analytics history
          is kept. Anything scheduled to{" "}
          {pendingDisconnect
            ? PLATFORM_THEME[pendingDisconnect.platform].label
            : "this account"}{" "}
          will be cancelled rather than fail silently. You can reconnect at any
          time.
        </p>
      </ConfirmDialog>
    </>
  );
}
