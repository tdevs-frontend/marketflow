"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCheck, Plus, Radio } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { WEBHOOK_STATUS_LABEL } from "@/constants/integrations";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCount, formatPercent } from "@/lib/format";
import { WEBHOOKS, webhookTotals } from "@/lib/integration-fixtures";
import type { Webhook, WebhookStatus } from "@/types/integration";
import { WebhookDetailDrawer } from "./webhook-detail-drawer";
import {
  CreateWebhookDialog,
  DeleteWebhookDialog,
  RegenerateSecretDialog,
} from "./webhook-dialogs";
import { WebhookTable } from "./webhook-table";

/**
 * Outbound event delivery.
 *
 * The page a developer opens when something downstream stopped receiving data,
 * so it is built around the failure rather than around the list: the KPI row
 * leads with the fleet's success rate and failed count, the failing endpoint is
 * the only coloured number in the table, and one click reaches the delivery log
 * with the error strings in it.
 *
 * Creating an endpoint is the primary action because it is the one thing here a
 * merchant does more than once.
 */

const ALL = "all";

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...(Object.keys(WEBHOOK_STATUS_LABEL) as WebhookStatus[]).map((status) => ({
    value: status,
    label: WEBHOOK_STATUS_LABEL[status],
  })),
];

export function WebhooksWorkspace() {
  const toast = useToast();

  const [webhooks, setWebhooks] = useState<Webhook[]>(WEBHOOKS);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [status, setStatus] = useState<string>(ALL);

  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Webhook | null>(null);
  const [deleting, setDeleting] = useState<Webhook | null>(null);
  const [regenerating, setRegenerating] = useState<Webhook | null>(null);

  const totals = useMemo(() => webhookTotals(webhooks), [webhooks]);

  const kpis: Kpi[] = [
    {
      label: "Active Endpoints",
      value: formatCount(totals.active),
      icon: Radio,
      tone: "brand",
      hint: `${webhooks.length} configured`,
    },
    {
      label: "Events Today",
      value: formatCount(totals.eventsToday),
      icon: Activity,
      hint: "Deliveries attempted",
    },
    {
      label: "Success Rate",
      value: formatPercent(totals.successRate),
      icon: CheckCheck,
      tone: totals.successRate >= 99 ? "success" : "warning",
      hint: "Weighted by volume",
    },
    {
      label: "Failed Deliveries",
      value: formatCount(totals.failures),
      icon: AlertTriangle,
      tone: totals.failures > 0 ? "danger" : "neutral",
      hint: totals.failures > 0 ? "Retried automatically" : "Nothing failing",
    },
  ];

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();

    return webhooks.filter((webhook) => {
      if (status !== ALL && webhook.status !== status) return false;
      if (term) {
        const haystack = [webhook.name, webhook.url, ...webhook.events]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [debounced, status, webhooks]);

  /* One updater, so the drawer and the table can never hold two versions of
     the same endpoint. `selected` is re-pointed at the new object too. */
  function update(id: string, patch: Partial<Webhook>) {
    setWebhooks((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setSelected((current) =>
      current && current.id === id ? { ...current, ...patch } : current,
    );
  }

  function toggle(webhook: Webhook) {
    const paused = webhook.status === "paused";
    /* A previously failing endpoint comes back as failing, not as healthy —
       enabling it does not repair whatever was timing out. */
    const next: WebhookStatus = paused
      ? webhook.failures24h > 0
        ? "failing"
        : "active"
      : "paused";

    update(webhook.id, { status: next });
    toast(`${webhook.name} ${paused ? "enabled" : "disabled"}`, paused ? "success" : "info");
  }

  function remove() {
    if (!deleting) return;
    setWebhooks((current) => current.filter((item) => item.id !== deleting.id));
    if (selected?.id === deleting.id) setSelected(null);
    toast(`${deleting.name} deleted`, "info");
    setDeleting(null);
  }

  /**
   * The quick test from the row menu.
   *
   * Reports through toasts rather than opening the drawer: from the list the
   * question is "is this one alive", and the answer should not cost a context
   * switch. The drawer's own Test Webhook gives the full result panel.
   */
  function testEndpoint(webhook: Webhook) {
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

  function regenerate() {
    if (!regenerating) return;
    toast(`Signing secret regenerated for ${regenerating.name}`, "success");
    setRegenerating(null);
  }

  return (
    <>
      <PageHeader
        title="Webhooks"
        description="Send MarketFlow events to external applications in real time."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Add Webhook
          </Button>
        }
      />

      <KpiStrip items={kpis} />

      {webhooks.length === 0 ? (
        <EmptyState
          title="No webhooks"
          description="Create a webhook to send MarketFlow events to external systems."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Add Webhook
            </Button>
          }
        />
      ) : (
        <Card className="p-5">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search endpoints and events…"
            activeCount={status === ALL ? 0 : 1}
            onReset={() => {
              setSearch("");
              setStatus(ALL);
            }}
          >
            <Select
              label="Status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              size="sm"
              className="w-44"
            />
          </FilterBar>

          <div className="mt-5">
            {filtered.length === 0 ? (
              <EmptyState
                compact
                title="No endpoints match"
                description="Nothing here fits that search and filter."
              />
            ) : (
              <WebhookTable
                webhooks={filtered}
                onOpen={setSelected}
                onToggle={toggle}
                onTest={testEndpoint}
                onDelete={setDeleting}
              />
            )}
          </div>
        </Card>
      )}

      {/* Mounted only while open: the dialog holds a one-time signing secret,
          and remounting is what guarantees it is gone once it is dismissed. */}
      {creating ? (
        <CreateWebhookDialog
          open
          onClose={() => setCreating(false)}
          onCreate={(webhook) => setWebhooks((current) => [webhook, ...current])}
        />
      ) : null}

      <WebhookDetailDrawer
        webhook={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        onToggle={toggle}
        onDelete={setDeleting}
        onRegenerate={setRegenerating}
      />

      <DeleteWebhookDialog
        webhook={deleting}
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
      />

      <RegenerateSecretDialog
        webhook={regenerating}
        open={Boolean(regenerating)}
        onClose={() => setRegenerating(null)}
        onConfirm={regenerate}
      />
    </>
  );
}
