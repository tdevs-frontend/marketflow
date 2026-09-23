"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BookOpen, CheckCheck, Gauge, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useToast } from "@/components/ui/toast";
import { INTEGRATION_DOCS_URL, scopeSummary } from "@/constants/integrations";
import { addApiKey, revokeApiKey, useApiKeys } from "@/lib/api-key-store";
import { formatCount, formatPercent } from "@/lib/format";
import { API_LOGS, API_USAGE } from "@/lib/integration-fixtures";
import type { ApiKey } from "@/types/integration";
import { ApiKeyTable } from "./api-key-table";
import { ApiLogs } from "./api-logs";
import { ApiUsageCard } from "./api-usage-card";
import { CopyButton } from "../credential-field";
import { CreateApiKeyDialog } from "./create-key-dialog";

/**
 * Merchant developer access.
 *
 * Three questions in the order a developer asks them: which keys exist and what
 * can they do, how much of the quota is gone, and what has actually been called
 * in the last hour. Keys first because that is what the page is for; usage and
 * the log sit below because they are what you come back for.
 *
 * Nothing here ever shows a key in full. Creation is the one moment the secret
 * exists in the browser, and it exists inside a dialog that says so.
 *
 * The rows come from `lib/api-key-store` rather than from this component's own
 * state. Settings → API & Developer lists the same register, and a credential
 * is the last thing that may differ between two screens - revoking here has to
 * be revoked there, or a developer has two pages and no way to know which one
 * is telling the truth.
 */

type KeyFilter = "all" | "active" | "revoked";

const FILTERS: { value: KeyFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
];

export function ApiWorkspace() {
  const toast = useToast();

  const keys = useApiKeys();
  const [filter, setFilter] = useState<KeyFilter>("all");
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const active = keys.filter((key) => key.status === "active");

  const kpis: Kpi[] = [
    {
      label: "Requests Today",
      value: formatCount(API_USAGE.requests24h),
      icon: Activity,
      tone: "brand",
      hint: `Across ${active.length} active ${active.length === 1 ? "key" : "keys"}`,
    },
    {
      label: "Success Rate",
      value: formatPercent(API_USAGE.successRate),
      icon: CheckCheck,
      tone: "success",
      hint: "2xx and 3xx responses",
    },
    {
      label: "Failed Requests",
      value: formatCount(API_USAGE.failed24h),
      icon: AlertTriangle,
      hint: "Mostly 422 and 429",
    },
    {
      label: "Rate Limit Usage",
      value: formatPercent((API_USAGE.rateLimitUsed / API_USAGE.rateLimit) * 100, 0),
      icon: Gauge,
      hint: `${formatCount(API_USAGE.rateLimitUsed)} of ${formatCount(API_USAGE.rateLimit)} per hour`,
    },
  ];

  const filtered = useMemo(
    () => (filter === "all" ? keys : keys.filter((key) => key.status === filter)),
    [filter, keys],
  );

  function revoke() {
    if (!revoking) return;
    revokeApiKey(revoking.id);
    toast(`${revoking.name} revoked`, "info");
    setRevoking(null);
  }

  return (
    <>
      <PageHeader
        title="API Access"
        description="Connect your applications securely to MarketFlow."
        secondaryActions={
          <ButtonLink
            href={INTEGRATION_DOCS_URL}
            variant="outline"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen aria-hidden />
            API Reference
          </ButtonLink>
        }
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Create API Key
          </Button>
        }
      />

      <KpiStrip items={kpis} />

      {keys.length === 0 ? (
        <EmptyState
          title="No API keys"
          description="Create an API key to connect external applications."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus aria-hidden />
              Create API Key
            </Button>
          }
        />
      ) : (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base">API Keys</h2>
              <p className="mt-1 text-sm text-text-secondary font-medium">
                Each key carries its own scopes. Revoking one takes effect
                immediately.
              </p>
            </div>
            <SegmentedControl
              label="Filter keys by status"
              value={filter}
              onChange={setFilter}
              options={FILTERS}
            />
          </div>

          <div className="mt-5">
            {filtered.length === 0 ? (
              <EmptyState
                compact
                title={`No ${filter} keys`}
                description="Switch the filter to see the rest of the register."
              />
            ) : (
              <ApiKeyTable
                keys={filtered}
                onRevoke={setRevoking}
                /* The masked prefix is the only part of a key that survives
                   creation, and it is what a merchant matches against their
                   app's config - so copying it is worth having. */
                onCopyPrefix={(key) => {
                  navigator.clipboard.writeText(key.masked).then(
                    () => toast(`${key.masked} copied to clipboard`, "success"),
                    () => toast("Could not copy - clipboard access was blocked", "error"),
                  );
                }}
              />
            )}
          </div>
        </Card>
      )}

      {/* Usage beside the base URL rather than under it: both are reference
          material a developer checks and leaves, and stacking them pushes the
          request log below the fold on a laptop. */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ApiLogs logs={API_LOGS} />
        <div className="space-y-6">
          <ApiUsageCard usage={API_USAGE} />
          <BaseUrlCard />
        </div>
      </div>

      {/* Mounted only while open: the dialog holds the plaintext key for the
          one moment it exists, and remounting is what guarantees it is gone. */}
      {creating ? (
        <CreateApiKeyDialog
          open
          onClose={() => setCreating(false)}
          onCreate={addApiKey}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(revoking)}
        onClose={() => setRevoking(null)}
        onConfirm={revoke}
        title={revoking ? `Revoke ${revoking.name}?` : "Revoke key?"}
        description="Any application using this key starts receiving 401 immediately."
        confirmLabel="Revoke key"
      >
        <p className="text-sm text-text-secondary">
          {revoking ? (
            <>
              <span className="font-mono">{revoking.masked}</span> has{" "}
              {scopeSummary(revoking.scopes).toLowerCase()} access and made{" "}
              {formatCount(revoking.requests24h)} requests today. Revoking cannot
              be undone - issue a new key to restore access.
            </>
          ) : null}
        </p>
      </ConfirmDialog>
    </>
  );
}

/**
 * The base URL and the auth header.
 *
 * Two lines a developer copies once per project, and having them on the page
 * they get their key from removes the only reason to open the docs on day one.
 */
function BaseUrlCard() {
  const baseUrl = "https://api.marketflow.io/v1";
  const header = "Authorization: Bearer mf_live_…";

  return (
    <Card className="p-5">
      <h2 className="text-base">Base URL</h2>
      <p className="mt-1 text-sm text-text-secondary font-medium">
        Every endpoint is relative to this address.
      </p>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-field border border-border bg-surface-secondary px-3 py-2.5 font-mono text-meta whitespace-nowrap text-text-secondary">
            {baseUrl}
          </code>
          <CopyButton value={baseUrl} label="Base URL" />
        </div>

        <div>
          <p className="text-meta font-medium text-text-muted">Authentication</p>
          <code className="mt-1.5 block overflow-x-auto rounded-field border border-border bg-surface-secondary px-3 py-2.5 font-mono text-meta whitespace-nowrap text-text-secondary">
            {header}
          </code>
        </div>
      </div>
    </Card>
  );
}
