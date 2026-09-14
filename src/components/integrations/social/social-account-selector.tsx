"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { INTEGRATION_ROUTES, providerForPlatform } from "@/constants/integrations";
import { publishableAccounts } from "@/lib/social-fixtures";
import { cn } from "@/lib/utils";
import type { SocialAccount } from "@/types/social";
import { ProviderIcon } from "./provider-icon";

/**
 * Pick the accounts a post publishes to.
 *
 * This is the component that makes "one source of truth" real. It reads
 * `publishableAccounts()` — the same predicate the Planner's calendar and the
 * Integrations page use — so an account whose token expired this morning
 * disappears from the composer without the composer knowing anything about
 * tokens.
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

  if (accounts.length === 0) {
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
              "flex cursor-pointer items-center gap-3 rounded-panel border p-3 transition-all focus-within:shadow-focus",
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

      <p className="text-meta text-text-muted">
        Accounts come from{" "}
        <Link
          href={INTEGRATION_ROUTES.social}
          className="font-medium text-primary underline-offset-2 hover:underline"
        >
          Integrations → Social
        </Link>
        . An account with an expired token is hidden until it is reconnected.
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
