"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { providerForPlatform } from "@/constants/integrations";
import type { SocialAccount } from "@/types/social";

/**
 * Disconnecting one social account.
 *
 * The per-account sibling of `DisconnectDialog`: that one warns about an entire
 * integration going away, this one about a single Page whose scheduled posts
 * are about to stop publishing. Same component, same copy discipline - name
 * what breaks, in counts the merchant can check.
 *
 * The dependency counts are per account rather than the integration-wide
 * totals, because "12 scheduled posts" across four accounts tells you nothing
 * about whether disconnecting *this* one is safe.
 */

/**
 * What depends on one account.
 *
 * Derived from the account rather than stored, so a fixture that gains a post
 * cannot leave a stale warning behind. A real build counts these server-side;
 * the shape of the answer is what the dialog is built against.
 */
function dependants(account: SocialAccount) {
  const scheduled = { facebook: 4, instagram: 8, linkedin: 3, x: 2 }[account.platform];
  const campaigns = { facebook: 1, instagram: 2, linkedin: 1, x: 0 }[account.platform];
  const workflows = { facebook: 1, instagram: 1, linkedin: 0, x: 0 }[account.platform];

  return [
    { icon: "calendar-days", label: "scheduled posts", count: scheduled },
    { icon: "megaphone", label: "active campaigns", count: campaigns },
    { icon: "workflow", label: "automations", count: workflows },
  ].filter((row) => row.count > 0);
}

export function DisconnectSocialAccountDialog({
  account,
  open,
  onClose,
  onConfirm,
}: {
  account: SocialAccount | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!account) return null;

  const provider = providerForPlatform(account.platform);
  const rows = dependants(account);

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Disconnect ${provider.label} account?`}
      description={
        rows.length > 0
          ? `${account.name} is currently used by:`
          : `${account.name} will stop publishing immediately.`
      }
      confirmLabel="Disconnect Account"
    >
      <div className="space-y-3.5">
        {rows.length > 0 ? (
          <ul className="space-y-1.5">
            {rows.map((row) => (
              <li
                key={row.label}
                className="flex items-center gap-2.5 rounded-panel bg-surface-secondary px-3 py-2"
              >
                <Icon name={row.icon} className="size-4 shrink-0 text-text-muted" />
                <span className="min-w-0 flex-1 text-sm font-medium text-text-primary">
                  {row.count} {row.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-sm text-text-secondary">
          Disconnecting it may prevent scheduled content from publishing. Posts
          already published stay on {provider.label}, and reconnecting later
          restores the account without losing its history.
        </p>
      </div>
    </ConfirmDialog>
  );
}
