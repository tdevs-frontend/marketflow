"use client";

import { RefreshCw, Settings2, Unlink, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu } from "@/components/ui/menu";
import { providerForPlatform, SOCIAL_CAPABILITY_LABEL } from "@/constants/integrations";
import { formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/types/social";
import {
  AuthStatusBadge,
  IntegrationStatusBadge,
} from "../integration-badges";
import { ProviderIcon } from "./provider-icon";

/**
 * One connected social account.
 *
 * The card answers the five questions the Integrations module exists for, in
 * the order a merchant asks them: which platform and which account, is it
 * working, what is it allowed to do, when did it last work, and how do I fix
 * it. Audience figures are deliberately absent — followers and engagement rate
 * are a Social Planner question, and putting them here is what would turn this
 * page into a second analytics dashboard.
 *
 * One visible button and a kebab, not five buttons. Manage is the action
 * merchants take; Refresh, Reconnect and Disconnect are the ones they take
 * once and should have to aim at.
 */
export function ConnectedAccountCard({
  account,
  onManage,
  onRefresh,
  onReconnect,
  onDisconnect,
}: {
  account: SocialAccount;
  onManage: (account: SocialAccount) => void;
  onRefresh: (account: SocialAccount) => void;
  onReconnect: (account: SocialAccount) => void;
  onDisconnect: (account: SocialAccount) => void;
}) {
  const provider = providerForPlatform(account.platform);
  const broken = account.status !== "connected";

  /* Granted capabilities only. A row of four chips where two say "not
     available" reads as a broken account rather than a normal one — the
     exceptions belong on the detail panel, where there is room to say why. */
  const granted = account.capabilities.filter(
    (capability) => capability.state === "granted",
  );

  return (
    <Card
      className={cn(
        "flex h-full flex-col p-5",
        /* The one tinted card in the module, and it is earned: an expired
           token is silently failing to publish right now. */
        broken && "border-warning/40 bg-warning-soft/25",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ProviderIcon provider={provider} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-text-primary">
              {account.name}
            </h3>
            <p className="truncate text-sm text-text-muted">{account.username}</p>
            <p className="mt-0.5 truncate text-meta text-text-muted">
              {account.accountType}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <IntegrationStatusBadge
            status={broken ? "issue" : "connected"}
            size="sm"
          />
          <Menu
            label={`Actions for ${account.name}`}
            items={[
              {
                label: "View details",
                icon: <Eye className="size-4" aria-hidden />,
                onSelect: () => onManage(account),
              },
              {
                label: "Refresh connection",
                icon: <RefreshCw className="size-4" aria-hidden />,
                onSelect: () => onRefresh(account),
              },
              {
                label: "Reconnect",
                icon: <Settings2 className="size-4" aria-hidden />,
                onSelect: () => onReconnect(account),
              },
              {
                label: "Disconnect account",
                icon: <Unlink className="size-4" aria-hidden />,
                destructive: true,
                onSelect: () => onDisconnect(account),
              },
            ]}
          />
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-border pt-3.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-text-muted">Capabilities</dt>
          <dd className="min-w-0 truncate font-medium text-text-primary">
            {granted.length === 0
              ? "None granted"
              : granted
                  .map((capability) => SOCIAL_CAPABILITY_LABEL[capability.key])
                  .join(" · ")}
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-text-muted">Token</dt>
          <dd className="min-w-0">
            <AuthStatusBadge status={account.auth.status} />
          </dd>
        </div>

        <div className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-text-muted">Last sync</dt>
          <dd className="min-w-0 truncate font-medium text-text-primary">
            {formatRelativeTime(account.lastSyncedAt, WORKSPACE_NOW_MS)}
          </dd>
        </div>
      </dl>

      {/* `mt-auto` so buttons line up across a row whose cards differ in
          height — an account with a long page name wraps, its neighbour does not. */}
      <div className="mt-auto pt-4">
        {broken ? (
          <Button size="sm" className="w-full" onClick={() => onReconnect(account)}>
            <RefreshCw aria-hidden />
            Reconnect
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onManage(account)}
          >
            Manage
          </Button>
        )}
      </div>
    </Card>
  );
}
