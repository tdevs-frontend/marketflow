"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { ApiKeyTable } from "@/components/integrations/api/api-key-table";
import { CreateApiKeyDialog } from "@/components/integrations/api/create-key-dialog";
import { WebhookDetailDrawer } from "@/components/integrations/webhooks/webhook-detail-drawer";
import {
  CreateWebhookDialog,
  DeleteWebhookDialog,
} from "@/components/integrations/webhooks/webhook-dialogs";
import { WebhookTable } from "@/components/integrations/webhooks/webhook-table";
import { APP_ROUTES } from "@/constants/app";
import { DEVELOPER_RESOURCES } from "@/constants/settings";
import { addApiKey, revokeApiKey, useApiKeys } from "@/lib/api-key-store";
import {
  addWebhook,
  removeWebhook,
  updateWebhook,
  useWebhooks,
} from "@/lib/webhook-store";
import {
  permissionHint,
  useWorkspacePermissions,
} from "@/components/workspace/use-workspace-permissions";
import type { ApiKey, Webhook, WebhookStatus } from "@/types/integration";

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
 * deep surfaces: the key register with usage and a request log, and the webhook
 * screen with per-endpoint delivery history. Rebuilding those here would give
 * the workspace two key tables that disagree the moment somebody revokes on one
 * of them.
 *
 * So every table, dialog and drawer on this page is imported from those modules
 * and rendered over the same stores — `ApiKeyTable` and `CreateApiKeyDialog`
 * over `lib/api-key-store`, `WebhookTable`, `WebhookDetailDrawer` and the
 * webhook dialogs over `lib/webhook-store`. Revoke a key or pause an endpoint
 * here and it is revoked or paused there, because there is one register of
 * each. The links across are for the depth this page deliberately omits: the
 * request log and the per-endpoint delivery history.
 *
 * Three sections, in the order a developer needs them: what can reach my data,
 * where am I sending events, and where do I read how any of it works.
 *
 * No secret is ever displayed. `createApiKey` hands back the plaintext exactly
 * once, inside the dialog that says so; from then on only the masked prefix
 * exists, which is also what makes the prefix column worth having — it is the
 * only way to match a key in this table to the one in a config file.
 */

export function DeveloperSettings() {
  const toast = useToast();
  const permissions = useWorkspacePermissions();

  const keys = useApiKeys();
  const webhooks = useWebhooks();

  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
  const [deletingWebhook, setDeletingWebhook] = useState<Webhook | null>(null);

  const canView = permissions.can("api_keys", "view");
  const canCreate = permissions.can("api_keys", "create");
  const canManage = permissions.can("api_keys", "manage");
  const canEditWebhooks = permissions.can("webhooks", "edit");

  /* One updater, so the drawer and the table can never hold two versions of
     the same endpoint. The list lives in the store; `selectedWebhook` is a
     local pointer into it and is re-pointed at the new object too. */
  function patchWebhook(id: string, patch: Partial<Webhook>) {
    updateWebhook(id, patch);
    setSelectedWebhook((current) =>
      current && current.id === id ? { ...current, ...patch } : current,
    );
  }

  function toggleWebhook(webhook: Webhook) {
    if (!canEditWebhooks) {
      toast(permissionHint("editing webhooks", permissions.roleName), "error");
      return;
    }

    const paused = webhook.status === "paused";
    /* A previously failing endpoint comes back as failing, not as healthy —
       enabling it does not repair whatever was timing out. */
    const next: WebhookStatus = paused
      ? webhook.failures24h > 0
        ? "failing"
        : "active"
      : "paused";

    patchWebhook(webhook.id, { status: next });
    toast(
      `${webhook.name} ${paused ? "enabled" : "disabled"}`,
      paused ? "success" : "info",
    );
  }

  /**
   * The quick test from the row menu.
   *
   * Reports through toasts rather than opening the drawer: from a list the
   * question is "is this one alive", and the answer should not cost a context
   * switch. The drawer's own Test Webhook gives the full result panel.
   */
  function testWebhook(webhook: Webhook) {
    toast(`Sending test event to ${webhook.name}…`, "info");

    window.setTimeout(() => {
      if (webhook.status === "failing") {
        toast(
          `${webhook.name} did not respond within ${webhook.timeoutSeconds}s`,
          "error",
        );
        return;
      }
      toast(`${webhook.name} responded 200 in 186 ms`, "success");
    }, 1200);
  }

  function deleteWebhook() {
    if (!deletingWebhook) return;

    removeWebhook(deletingWebhook.id);
    if (selectedWebhook?.id === deletingWebhook.id) setSelectedWebhook(null);
    toast(`${deletingWebhook.name} deleted`, "info");
    setDeletingWebhook(null);
  }

  if (!canView) {
    return (
      <>
        <PageHeader
          title="API & Developer"
          description="Manage API access, webhooks and developer integrations."
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
        description="Manage API access, webhooks and developer integrations."
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
            <div className="flex flex-wrap items-center gap-2">
              {canEditWebhooks ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatingWebhook(true)}
                >
                  <Plus aria-hidden />
                  Add webhook
                </Button>
              ) : null}
              <Link
                href={APP_ROUTES.integrationsWebhooks}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Delivery history
                <ArrowUpRight aria-hidden />
              </Link>
            </div>
          }
          bodyClassName={webhooks.length > 0 ? "p-0" : undefined}
        >
          {webhooks.length === 0 ? (
            <EmptyState
              compact
              title="No webhook endpoints"
              description="Add an endpoint to receive events as they happen instead of polling for them."
              action={
                canEditWebhooks ? (
                  <Button
                    variant="outline"
                    size="compact"
                    onClick={() => setCreatingWebhook(true)}
                  >
                    Add webhook
                  </Button>
                ) : undefined
              }
            />
          ) : (
            /*
             * The same `WebhookTable` the Integrations screen renders, over the
             * same `lib/webhook-store`. Edit, Test, Disable and Delete are the
             * real actions from that module, so pausing an endpoint here pauses
             * it there — a webhook is live routing configuration, and two
             * screens with their own copies would disagree about whether it is
             * delivering with no way to tell which is right.
             */
            <div className="overflow-x-auto">
              <WebhookTable
                webhooks={webhooks}
                onOpen={setSelectedWebhook}
                onToggle={toggleWebhook}
                onTest={testWebhook}
                onDelete={setDeletingWebhook}
              />
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

      {/* Mounted only while open: the dialog holds a one-time signing secret,
          and remounting is what guarantees it is gone once it is dismissed. */}
      {creatingWebhook ? (
        <CreateWebhookDialog
          open
          onClose={() => setCreatingWebhook(false)}
          onCreate={(webhook) => {
            addWebhook(webhook);
            toast(`${webhook.name} added`, "success");
          }}
        />
      ) : null}

      <WebhookDetailDrawer
        webhook={selectedWebhook}
        open={Boolean(selectedWebhook)}
        onClose={() => setSelectedWebhook(null)}
        onToggle={toggleWebhook}
        onDelete={setDeletingWebhook}
        onRegenerate={(webhook) =>
          toast(`Signing secret regenerated for ${webhook.name}`, "success")
        }
      />

      <DeleteWebhookDialog
        webhook={deletingWebhook}
        open={Boolean(deletingWebhook)}
        onClose={() => setDeletingWebhook(null)}
        onConfirm={deleteWebhook}
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
