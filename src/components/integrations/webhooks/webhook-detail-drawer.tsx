"use client";

import { useId, useState } from "react";
import { Pause, Play, RotateCcw, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Tabs, TabPanel, TabCount } from "@/components/ui/tabs";
import { formatCount, formatDate, formatPercent } from "@/lib/format";
import type { Webhook } from "@/types/integration";
import { ConnectionTestResult, useConnectionTest } from "../connection-test";
import { CopyButton, CredentialField } from "../credential-field";
import { WebhookStatusBadge } from "../integration-badges";
import { EventKeyList } from "./event-picker";
import { WebhookDeliveryLog } from "./webhook-delivery-log";

/**
 * One endpoint, in full.
 *
 * A drawer rather than a page: an endpoint is a configuration record, and the
 * job a merchant comes here to do - read the last failure, fire a test, check
 * which events are on - is done alongside the list, not instead of it.
 *
 * Two tabs, because the two audiences arrive for different things. Whoever set
 * the endpoint up wants the URL, the secret and the event list; whoever is
 * debugging it wants the delivery log and nothing else.
 */
export function WebhookDetailDrawer({
  webhook,
  open,
  onClose,
  onToggle,
  onDelete,
  onRegenerate,
}: {
  webhook: Webhook | null;
  open: boolean;
  onClose: () => void;
  onToggle: (webhook: Webhook) => void;
  onDelete: (webhook: Webhook) => void;
  onRegenerate: (webhook: Webhook) => void;
}) {
  const idBase = useId();
  const [tab, setTab] = useState<"overview" | "deliveries">("overview");
  const { state: test, run } = useConnectionTest();

  if (!webhook) return null;

  const paused = webhook.status === "paused";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={webhook.name}
      description={webhook.url}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <Button
            variant="ghost"
            size="compact"
            onClick={() => onDelete(webhook)}
            className="text-error hover:bg-error-soft hover:text-error"
          >
            <Trash2 aria-hidden />
            Delete
          </Button>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="compact" onClick={() => onToggle(webhook)}>
              {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
              {paused ? "Enable" : "Disable"}
            </Button>
            <Button
              size="compact"
              disabled={test.status === "testing"}
              onClick={() =>
                run(() =>
                  webhook.status === "failing"
                    ? {
                        ok: false,
                        message: "Test delivery failed.",
                        detail: `${webhook.url} did not respond within ${webhook.timeoutSeconds}s. Check that the endpoint is reachable from the public internet.`,
                      }
                    : {
                        ok: true,
                        message: "Test delivery accepted.",
                        detail: `${webhook.url} responded 200 in 186 ms.`,
                      },
                )
              }
            >
              <Send aria-hidden />
              Test Webhook
            </Button>
          </div>
        </div>
      }
    >
      <Tabs
        idBase={idBase}
        label="Webhook detail"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          {
            value: "deliveries",
            label: "Deliveries",
            badge: <TabCount value={webhook.recentDeliveries.length} />,
          },
        ]}
      />

      {tab === "overview" ? (
        <TabPanel idBase={idBase} value="overview" className="mt-5 space-y-5">
          <ConnectionTestResult state={test} />

          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-meta font-medium text-text-muted">Status</dt>
              <dd className="mt-1.5">
                <WebhookStatusBadge status={webhook.status} />
              </dd>
            </div>
            <div>
              <dt className="text-meta font-medium text-text-muted">Success rate</dt>
              <dd className="mt-1.5 text-sm font-semibold text-text-primary tabular-nums">
                {formatPercent(webhook.successRate)}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-medium text-text-muted">Deliveries today</dt>
              <dd className="mt-1.5 text-sm font-semibold text-text-primary tabular-nums">
                {formatCount(webhook.deliveries24h)}
              </dd>
            </div>
            <div>
              <dt className="text-meta font-medium text-text-muted">Failed today</dt>
              <dd className="mt-1.5 text-sm font-semibold text-text-primary tabular-nums">
                {formatCount(webhook.failures24h)}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-sm font-medium text-text-primary">Endpoint URL</p>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="min-w-0 flex-1 overflow-x-auto rounded-field border border-border bg-surface-secondary px-3.5 py-2.5 font-mono text-meta whitespace-nowrap text-text-secondary">
                {webhook.url}
              </p>
              <CopyButton value={webhook.url} label="Endpoint URL" />
            </div>
          </div>

          {/*
           * The one secret in the module that reveals. Verifying a MarketFlow
           * signature requires having it, so an owner who lost it needs to read
           * it back rather than rotate every consumer at once.
           */}
          <CredentialField
            credential={{
              key: "secret",
              label: "Signing Secret",
              kind: "secret",
              value: webhook.secret,
              preview: webhook.secretPreview,
              hint: "Sent as the X-MarketFlow-Signature header on every delivery.",
              updatedAt: webhook.createdAt,
            }}
            revealValue={webhook.secretReveal}
            actions={
              <Button variant="outline" size="sm" onClick={() => onRegenerate(webhook)}>
                <RotateCcw aria-hidden />
                Regenerate
              </Button>
            }
          />

          <div>
            <p className="text-sm font-medium text-text-primary">
              Subscribed events
              <span className="ml-1.5 font-normal text-text-muted tabular-nums">
                ({webhook.events.length})
              </span>
            </p>
            <EventKeyList events={webhook.events} className="mt-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-5">
            <div>
              <p className="text-meta font-medium text-text-muted">Timeout</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {webhook.timeoutSeconds} seconds
              </p>
            </div>
            <div>
              <p className="text-meta font-medium text-text-muted">Retry attempts</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {webhook.retryAttempts}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-meta font-medium text-text-muted">Created</p>
              <p className="mt-1 text-sm font-semibold text-text-primary">
                {formatDate(webhook.createdAt)}
              </p>
            </div>
          </div>
        </TabPanel>
      ) : (
        <TabPanel idBase={idBase} value="deliveries" className="mt-5">
          <WebhookDeliveryLog deliveries={webhook.recentDeliveries} />
        </TabPanel>
      )}
    </Drawer>
  );
}
