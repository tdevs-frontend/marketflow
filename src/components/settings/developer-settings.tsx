"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { ApiKeyTable } from "@/components/integrations/api/api-key-table";
import { CreateApiKeyDialog } from "@/components/integrations/api/create-key-dialog";
import { APP_ROUTES } from "@/constants/app";
import { DEVELOPER_RESOURCES } from "@/constants/settings";
import { addApiKey, revokeApiKey, useApiKeys } from "@/lib/api-key-store";
import { formatCount, formatPercent, formatRelativeTime } from "@/lib/format";
import { INTEGRATIONS_NOW_MS, WEBHOOKS } from "@/lib/integration-fixtures";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";
import type { ApiKey, WebhookStatus } from "@/types/integration";

import { SettingsSection } from "./settings-section";

/**
 * API & Developer — how external systems connect to this workspace.
 *
 * This route is new. The sidebar has pointed at `/dashboard/settings/api` for
 * as long as the Settings group has existed, the permission model has a
 * `developer` resource whose `href` is this exact path, and `next build` never
 * emitted a page for it — so the row 404'd for anyone who clicked it.
 *
 * What it is *not* is a second developer module. Integrations already owns the
 * full surfaces: the key register with usage and a request log, and the webhook
 * screen with per-endpoint delivery history. Rebuilding those here would give
 * the workspace two key tables that disagree the moment somebody revokes on one
 * of them. So this page renders the *same components* over the *same store* —
 * `ApiKeyTable` and `CreateApiKeyDialog` from `components/integrations/api`,
 * reading `lib/api-key-store` — and links across for the depth. Revoke a key
 * here and it is revoked there, because there is one register.
 *
 * Three sections, in the order a developer needs them: what can reach my data,
 * where am I sending events, and where do I read how any of it works.
 *
 * No secret is ever displayed. `createApiKey` hands back the plaintext exactly
 * once, inside the dialog that says so; from then on only the masked prefix
 * exists, which is also what makes the prefix column worth having — it is the
 * only way to match a key in this table to the one in a config file.
 */

const WEBHOOK_TONE: Record<WebhookStatus, BadgeTone> = {
  active: "success",
  paused: "neutral",
  failing: "danger",
};

const WEBHOOK_LABEL: Record<WebhookStatus, string> = {
  active: "Active",
  paused: "Paused",
  failing: "Failing",
};

export function DeveloperSettings() {
  const toast = useToast();
  const permissions = useWorkspacePermissions();

  const keys = useApiKeys();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const canView = permissions.can("api_keys", "view");
  const canCreate = permissions.can("api_keys", "create");
  const canManage = permissions.can("api_keys", "manage");

  if (!canView) {
    return (
      <>
        <PageHeader
          title="API & Developer"
          description="How external systems connect to this workspace."
        />
        <Card>
          <EmptyState
            title="Developer access is not visible to your role"
            description={permissionHint("API access", permissions.roleName)}
          />
        </Card>
      </>
    );
  }

  const active = keys.filter((key) => key.status === "active").length;

  return (
    <>
      <PageHeader
        title="API & Developer"
        description="Keys, webhooks and reference for building against MarketFlow."
        action={
          canCreate ? (
            <Button onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Create API key
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-6">
        {/* -- Keys ---------------------------------------------------------- */}
        <SettingsSection
          title="API keys"
          description="Credentials that can read and write this workspace from outside the dashboard."
          action={
            <Link
              href={APP_ROUTES.integrationsApi}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Usage and logs
              <ArrowUpRight aria-hidden />
            </Link>
          }
          bodyClassName={keys.length > 0 ? "p-0" : undefined}
        >
          {keys.length === 0 ? (
            <EmptyState
              compact
              title="No API keys"
              description="Create one to let an external system read or write this workspace."
              action={
                canCreate ? (
                  <Button
                    variant="outline"
                    size="compact"
                    onClick={() => setCreating(true)}
                  >
                    Create API key
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <ApiKeyTable
                  keys={keys}
                  /* A role that cannot revoke gets told so, rather than a menu
                     item that quietly does nothing. `ApiKeyTable` renders the
                     action unconditionally — it is shared with the Integrations
                     screen — so the refusal belongs here, with the reason. */
                  onRevoke={(key) => {
                    if (!canManage) {
                      toast(
                        permissionHint("revoking API keys", permissions.roleName),
                        "error",
                      );
                      return;
                    }
                    setRevoking(key);
                  }}
                  onCopyPrefix={(key) => {
                    void navigator.clipboard
                      .writeText(key.masked)
                      .then(() => toast(`${key.name} prefix copied`, "success"))
                      .catch(() =>
                        toast("Could not copy — your browser blocked it", "error"),
                      );
                  }}
                />
              </div>

              <p className="border-t border-border px-5 py-3 text-sm text-text-muted">
                {active} active {active === 1 ? "key" : "keys"}. A key is shown
                in full once, when it is created — after that only its prefix
                exists.
              </p>
            </>
          )}
        </SettingsSection>

        {/* -- Webhooks ------------------------------------------------------ */}
        <SettingsSection
          title="Webhooks"
          description="Endpoints this workspace posts events to as they happen."
          action={
            <Link
              href={APP_ROUTES.integrationsWebhooks}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Manage webhooks
              <ArrowUpRight aria-hidden />
            </Link>
          }
          bodyClassName={WEBHOOKS.length > 0 ? "p-0" : undefined}
        >
          {WEBHOOKS.length === 0 ? (
            <EmptyState
              compact
              title="No webhook endpoints"
              description="Add an endpoint to receive events as they happen instead of polling for them."
            />
          ) : (
            /*
             * A summary, not the full webhook screen. Four columns answering
             * "is it working" — everything that changes an endpoint lives one
             * link away, where the delivery history is, because a retry you
             * cannot inspect the log for is a retry taken on faith.
             */
            <div className="overflow-x-auto">
              <Table minWidth="48rem">
                <THead>
                  <TH>Endpoint</TH>
                  <TH>Events</TH>
                  <TH>Status</TH>
                  <TH align="right">Last delivery</TH>
                </THead>
                <TBody>
                  {WEBHOOKS.map((webhook) => (
                    <TR key={webhook.id}>
                      <TD>
                        <span className="block font-semibold text-text-primary">
                          {webhook.name}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-meta font-normal text-text-muted">
                          {webhook.url}
                        </span>
                      </TD>

                      <TD className="font-normal text-text-secondary">
                        {webhook.events.length} subscribed
                      </TD>

                      <TD>
                        <Badge tone={WEBHOOK_TONE[webhook.status]}>
                          {WEBHOOK_LABEL[webhook.status]}
                        </Badge>
                      </TD>

                      <TD align="right" className="font-normal text-text-secondary">
                        {webhook.lastDeliveryAt ? (
                          <>
                            {formatRelativeTime(
                              webhook.lastDeliveryAt,
                              INTEGRATIONS_NOW_MS,
                            )}
                            <span className="mt-0.5 block text-meta text-text-muted tabular-nums">
                              {formatCount(webhook.deliveries24h)} in 24h ·{" "}
                              {formatPercent(webhook.successRate)} ok
                            </span>
                          </>
                        ) : (
                          "Never"
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </SettingsSection>

        {/* -- Resources ----------------------------------------------------- */}
        <SettingsSection
          title="Developer resources"
          description="Reference for building against MarketFlow."
          bodyClassName="grid gap-3 sm:grid-cols-3"
        >
          {DEVELOPER_RESOURCES.map((resource) => (
            <a
              key={resource.href}
              href={resource.href}
              target={resource.external ? "_blank" : undefined}
              rel={resource.external ? "noreferrer" : undefined}
              className="group rounded-panel border border-border bg-surface-secondary px-4 py-3.5 transition-colors hover:border-border-strong focus-visible:shadow-focus focus-visible:outline-none"
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                {resource.title}
                <ExternalLink
                  className="size-3.5 text-text-muted transition-colors group-hover:text-primary"
                  aria-hidden
                />
                {resource.external ? (
                  <span className="sr-only">(opens in a new tab)</span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm text-text-secondary">
                {resource.description}
              </span>
            </a>
          ))}
        </SettingsSection>
      </div>

      <CreateApiKeyDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(key) => {
          addApiKey(key);
          toast(`${key.name} created`, "success");
        }}
      />

      {/*
        Revoking is immediate and irreversible for anything holding the key, so
        it is confirmed by name. The row stays in the table afterwards — "which
        key did we revoke, and when" is an incident question, and a row that
        vanishes answers it with nothing.
      */}
      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={() => {
          if (!revoking) return;
          revokeApiKey(revoking.id);
          toast(`${revoking.name} revoked`, "info");
        }}
        title={revoking ? `Revoke ${revoking.name}?` : "Revoke key"}
        confirmLabel="Revoke key"
      >
        <p className="text-sm text-text-secondary">
          Anything using this key stops working immediately, and it cannot be
          restored. The key stays listed as revoked so the change is auditable.
        </p>
      </ConfirmDialog>
    </>
  );
}
