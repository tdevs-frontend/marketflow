"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { INTEGRATION_ROUTES, providerForPlatform } from "@/constants/integrations";
import { SOCIAL_ACCOUNTS, publishableAccounts } from "@/lib/social-fixtures";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/types/social";
import { ProviderIcon } from "./provider-icon";

/**
 * Why an account cannot be published to, in the words the fix is filed under.
 *
 * Only ever shown on a row that is already disabled, so it has to name the
 * cause rather than repeat "unavailable".
 */
function blockedReason(account: SocialAccount): string {
  if (account.status === "expired") return "Token expired";
  if (account.status === "disconnected") return "Disconnected";
  if (!account.publishing.enabled) return "Publishing off";
  if (!account.publishing.availableToPlanner) return "Not shared with Planner";
  return "Missing publish permission";
}

/**
 * Pick the accounts a post publishes to.
 *
 * This is the component that makes "one source of truth" real. It reads
 * `publishableAccounts()` — the same predicate the Planner's calendar and the
 * Integrations page use — so an account whose token expired this morning stops
 * being selectable without the composer knowing anything about tokens. It is
 * still listed, greyed out and labelled, because the predicate can say *that*
 * an account is unusable and only the account record can say why.
 *
 * It selects *accounts*, not platforms. A merchant with two Facebook Pages has
 * to be able to say which one, and a platform-level toggle cannot express that.
 *
 * It lives in the Integrations module rather than in Social Planner on purpose:
 * connected accounts are owned here, and the Planner consuming this component
 * is what stops a second account list from growing over there.
 */
export function SocialAccountSelector({
  selected,
  onChange,
  className,
}: {
  /** Account ids. */
  selected: string[];
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  const accounts = publishableAccounts();
  const chosen = new Set(selected);

  /*
   * The accounts that exist but cannot take a post.
   *
   * They used to be filtered out silently, which left the composer unable to
   * explain itself: an X post simply could not be written and nothing on
   * screen said why. A row that is present, disabled and labelled "Token
   * expired" answers the question at the point it gets asked — and it is the
   * same rule the rest of the module follows, that a connection problem is
   * shown rather than hidden.
   */
  const blocked = SOCIAL_ACCOUNTS.filter(
    (account) => !accounts.some((item) => item.id === account.id),
  );

  if (accounts.length === 0 && blocked.length === 0) {
    return <NoConnectedAccounts className={className} />;
  }

  function toggle(account: SocialAccount, on: boolean) {
    const next = new Set(chosen);
    if (on) next.add(account.id);
    else next.delete(account.id);
    onChange([...next]);
  }

  return (
    <div className={cn("space-y-2.5", className)}>
      {accounts.map((account) => {
        const provider = providerForPlatform(account.platform);
        const on = chosen.has(account.id);

        return (
          <label
            key={account.id}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-panel border p-3 transition-all",
              on
                ? "border-primary bg-primary-soft"
                : "border-border bg-surface hover:border-border-strong hover:bg-surface-secondary",
            )}
          >
            <Checkbox
              checked={on}
              onCheckedChange={(next) => toggle(account, next)}
              label={`Publish to ${provider.label} — ${account.name}`}
            />
            <ProviderIcon provider={provider} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-text-primary">
                {provider.label} — {account.name}
              </span>
              <span className="block truncate text-meta text-text-muted">
                {account.username}
              </span>
            </span>
          </label>
        );
      })}

      {blocked.map((account) => {
        const provider = providerForPlatform(account.platform);

        return (
          <div
            key={account.id}
            className="flex items-center gap-3 rounded-panel border border-dashed border-border bg-surface-secondary/60 p-3"
          >
            {/* A disabled checkbox rather than none, so the row lines up with
                the selectable ones above it and reads as "this one, but not
                right now". */}
            <Checkbox
              checked={false}
              disabled
              onCheckedChange={() => {}}
              label={`${provider.label} — ${account.name} is unavailable`}
            />
            <ProviderIcon provider={provider} size="sm" className="opacity-60" />

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-text-secondary">
                {provider.label} — {account.name}
              </span>
              <span className="block truncate text-meta text-text-muted">
                {account.username}
              </span>
            </span>

            <span className="shrink-0 text-meta font-medium text-warning-text">
              {blockedReason(account)}
            </span>

            <Link
              href={INTEGRATION_ROUTES.social}
              className="shrink-0 text-meta font-medium text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
            >
              Reconnect
            </Link>
          </div>
        );
      })}

      <p className="text-meta font-medium text-text-muted">
        Accounts come from{" "}
        <Link
          href={INTEGRATION_ROUTES.social}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Integrations → Social
        </Link>
        . An account that cannot publish is shown greyed out rather than
        dropped, so a missing platform is never a mystery.
      </p>
    </div>
  );
}

/**
 * The Planner's empty state when nothing is connected.
 *
 * It links out rather than offering to connect here — there is one connection
 * flow and it lives in Integrations. A second "Connect Facebook" button in the
 * composer is exactly the duplicate system this architecture exists to avoid.
 */
export function NoConnectedAccounts({
  className,
  compact = true,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <EmptyState
      compact={compact}
      className={className}
      title="No social account connected"
      description="Connect Facebook, Instagram, LinkedIn or another supported platform to start publishing."
      action={
        <ButtonLink href={INTEGRATION_ROUTES.social} size="sm">
          <Plus aria-hidden />
          Connect Social Account
        </ButtonLink>
      }
    />
  );
}
