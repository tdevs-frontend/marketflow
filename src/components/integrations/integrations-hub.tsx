"use client";

import { useMemo, useState } from "react";
import { Activity, AlertTriangle, BookOpen, CircleDashed, PlugZap } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Select } from "@/components/ui/select";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_DOCS_URL,
  INTEGRATION_STATUS_LABEL,
} from "@/constants/integrations";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCount } from "@/lib/format";
import { INTEGRATIONS, integrationTotals } from "@/lib/integration-fixtures";
import type {
  Integration,
  IntegrationProvider,
  IntegrationStatus,
} from "@/types/integration";
import { ConnectDrawer } from "./connect-drawer";
import { IntegrationCard } from "./integration-card";

/**
 * The Integration Hub.
 *
 * Its whole job is the first two seconds: how many connections are live, how
 * many are waiting on someone, and is anything broken. The KPI strip answers
 * that before a merchant reads a single card, and the Issues tile is the one
 * they are meant to click — filtering to it is one tap.
 *
 * The grid below is a catalogue, not a dashboard. Each card carries the four
 * things that distinguish one connection from another and nothing else; the
 * depth lives on the detail pages, which is why five of these link somewhere
 * and three do not.
 */

const ALL = "all";

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...(Object.keys(INTEGRATION_STATUS_LABEL) as IntegrationStatus[]).map((status) => ({
    value: status,
    label: INTEGRATION_STATUS_LABEL[status],
  })),
];

const CATEGORY_OPTIONS = [
  { value: ALL, label: "All categories" },
  ...INTEGRATION_CATEGORIES.map((category) => ({
    value: category.value,
    label: category.label,
  })),
];

export function IntegrationsHub() {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [status, setStatus] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [connecting, setConnecting] = useState<Integration | null>(null);
  /* Connections made in this session, so the hub reflects a connect without a
     round-trip. A real build reads this back from the API instead. */
  const [connected, setConnected] = useState<Record<string, IntegrationProvider>>({});

  const integrations = useMemo(
    () =>
      INTEGRATIONS.map((integration) => {
        const provider = connected[integration.id];
        if (!provider) return integration;
        return {
          ...integration,
          status: "connected" as IntegrationStatus,
          provider,
          account: integration.account ?? provider.name,
        };
      }),
    [connected],
  );

  const totals = useMemo(() => integrationTotals(integrations), [integrations]);

  const kpis: Kpi[] = [
    {
      label: "Connected",
      value: formatCount(totals.connected),
      icon: PlugZap,
      tone: "success",
      hint: "Live and sending",
    },
    {
      label: "Needs Setup",
      value: formatCount(totals.needsSetup),
      icon: CircleDashed,
      hint: "Available, not configured",
    },
    {
      label: "Issues",
      value: formatCount(totals.issues),
      icon: AlertTriangle,
      tone: totals.issues > 0 ? "danger" : "neutral",
      hint: totals.issues > 0 ? "Needs attention now" : "Nothing failing",
    },
    {
      label: "Events Today",
      value: formatCount(totals.eventsToday),
      icon: Activity,
      tone: "brand",
      hint: "Across every connection",
    },
  ];

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();

    return integrations.filter((integration) => {
      if (status !== ALL && integration.status !== status) return false;
      if (category !== ALL && integration.category !== category) return false;
      if (term) {
        const haystack = [
          integration.name,
          integration.description,
          integration.provider?.name ?? "",
          integration.account ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [category, debounced, integrations, status]);

  const activeCount = [status, category].filter((value) => value !== ALL).length;

  function reset() {
    setSearch("");
    setStatus(ALL);
    setCategory(ALL);
  }

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Connect the tools and channels that power your MarketFlow workspace."
        secondaryActions={
          <ButtonLink
            href={INTEGRATION_DOCS_URL}
            variant="outline"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen aria-hidden />
            View Documentation
          </ButtonLink>
        }
      />

      <KpiStrip items={kpis} />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search integrations…"
        activeCount={activeCount}
        onReset={reset}
      >
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          size="sm"
          className="w-44"
        />
        <Select
          label="Category"
          value={category}
          onChange={setCategory}
          options={CATEGORY_OPTIONS}
          size="sm"
          className="w-44"
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="No integrations match"
          description="Nothing here fits that search and filter. Clear them to see the full catalogue."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        /* Three across on a desktop, two on a tablet, one on a phone — the card
           needs about 20rem before its detail rows start wrapping. */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              onConnect={setConnecting}
            />
          ))}
        </div>
      )}

      {connecting ? (
        <ConnectDrawer
          integration={connecting}
          open={Boolean(connecting)}
          onClose={() => setConnecting(null)}
          onConnected={(provider) =>
            setConnected((current) => ({ ...current, [connecting.id]: provider }))
          }
        />
      ) : null}
    </>
  );
}
