"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CircleDashed,
  PlugZap,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_DOCS_URL,
  INTEGRATION_STATUS_LABEL,
  categoryLabel,
} from "@/constants/integrations";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCount } from "@/lib/format";
import {
  INTEGRATIONS,
  connectedRecord,
  disconnectedRecord,
  enabledRecord,
  integrationTotals,
} from "@/lib/integration-fixtures";
import type { Integration, IntegrationStatus } from "@/types/integration";
import { ConnectDrawer } from "./connect-drawer";
import { DisconnectDialog } from "./disconnect-dialog";
import { EventsTodayDrawer } from "./events-today-drawer";
import { IntegrationCard } from "./integration-card";
import { IntegrationManageDrawer } from "./integration-manage-drawer";

/**
 * The Integration Hub.
 *
 * Its whole job is the first two seconds, and there are exactly four questions:
 * what is connected, what is waiting on someone, what is broken, and how do I
 * deal with each. The KPI strip answers the first three before a merchant reads
 * a single card - and the Issues tile is the one they are meant to press, which
 * is why it filters rather than merely counting.
 *
 * The grid below is a catalogue, not a dashboard: one continuous run of cards
 * in one shape, which is what makes nine of them scannable. Category is a way
 * to narrow that run - it lives in the filter row beside status and search -
 * and not a set of headings that cut the grid into five short rows, most of
 * them holding one card with two thirds of the row left empty.
 *
 * Depth lives elsewhere. Six of these link to a page of their own, the other
 * three open a manage drawer, and nothing on this page duplicates the module
 * behind it: Webhooks shows an endpoint count and a button, not a webhook
 * table.
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
  const toast = useToast();

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [status, setStatus] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);

  const [connecting, setConnecting] = useState<Integration | null>(null);
  const [managing, setManaging] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<Integration | null>(null);
  const [showEvents, setShowEvents] = useState(false);

  /*
   * Connections made, enabled or ended in this session, so the hub reflects an
   * action without a round-trip.
   *
   * A whole record per change rather than a patch of the fields that "matter":
   * connecting also resolves the health checks, clears the last error and adds
   * an event, and a map that carried only `status` is what leaves a card
   * reading Connected above a health row that still says Disconnected. The
   * transition functions in the fixtures own that shape, and a real build
   * replaces them with the API response and keeps this map as a cache.
   */
  const [overrides, setOverrides] = useState<Record<string, Integration>>({});

  function apply(next: Integration) {
    setOverrides((current) => ({ ...current, [next.id]: next }));
  }

  const integrations = useMemo(
    () => INTEGRATIONS.map((integration) => overrides[integration.id] ?? integration),
    [overrides],
  );

  const totals = useMemo(() => integrationTotals(integrations), [integrations]);

  /** The record the open drawer is looking at, kept live as overrides land. */
  const managed = managing
    ? (integrations.find((item) => item.id === managing) ?? null)
    : null;

  /*
   * The summary reports; the chips below filter.
   *
   * The first three tiles are deliberately inert. They restate the same four
   * states the chip row is made of, and a count that is *also* a filter gives
   * the page two controls for one question - press "Issues" the tile and
   * "Issues" the chip and only one of them looks pressed afterwards. Events
   * Today is the exception because it has no chip: pressing it opens the
   * activity behind the figure, which is a drill-down, not a filter.
   */
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
      info: "Messages, deliveries and API requests processed across connected integrations today.",
      onSelect: () => setShowEvents(true),
      selectLabel: "See what today's events were",
    },
  ];

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();

    return integrations.filter((integration) => {
      if (status !== ALL && integration.status !== status) return false;
      if (category !== ALL && integration.category !== category) return false;
      if (term) {
        /*
         * Name, provider, category and status.
         *
         * The last two are what make the box worth typing into: "analytics"
         * and "issue" are how a merchant describes what they are looking for
         * long before they remember it is called Meta Pixel. The description
         * stays in too - it is where "orders" finds Shopify.
         */
        const haystack = [
          integration.name,
          integration.description,
          integration.provider?.name ?? "",
          integration.account ?? "",
          categoryLabel(integration.category),
          INTEGRATION_STATUS_LABEL[integration.status],
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

      {/*
       * Search, then the two axes that narrow it.
       *
       * Both are selects in the same row rather than one of them being a strip
       * of chips. Status and category are the same kind of question asked about
       * the same list, and giving one of them a row to itself says it is the
       * more important one - which it is not, once the grid is a single run of
       * cards whose states a merchant can already see. Two matched controls
       * also collapse into `FilterBar`'s sheet together on a phone, where a
       * chip strip has to scroll sideways on its own.
       */}
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
          title="No integrations found"
          description="Try another search or filter."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      ) : (
        /*
         * `@container` on the wrapper; the grid inside measures against it.
         *
         * The columns used to be chosen from the *viewport* - `sm:` and `xl:`
         * - which is the wrong ruler on a dashboard page. The sidebar takes
         * 16.5rem and the page padding another 3.5rem, so a 1280px window
         * leaves 960px of content: every breakpoint fired 320px later than the
         * cards actually needed, and the grid sat a column short of what it had
         * room for, with the difference banked as empty space on the right.
         *
         * Measured against the content box the thresholds are what they look
         * like - 620px fits two cards, 940px fits three - and they stay true
         * whatever happens to the sidebar.
         */
        <div className="@container">
          <div className="grid gap-4 @min-[620px]:grid-cols-2 @min-[940px]:grid-cols-3">
            {filtered.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onConnect={setConnecting}
                onManage={(item) => setManaging(item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Each overlay is mounted only while it is open, so every visit starts
          clean rather than remembering the last attempt. */}
      {managed ? (
        <IntegrationManageDrawer
          integration={managed}
          open
          onClose={() => setManaging(null)}
          /* Closed before either dialog opens: a `<dialog>` raised from inside
             another leaves the first sitting behind it in the top layer. */
          onReconnect={() => {
            setManaging(null);
            setConnecting(managed);
          }}
          onDisconnect={() => {
            setManaging(null);
            setDisconnecting(managed);
          }}
          onEnabled={() => {
            apply(enabledRecord(managed));
            toast(`${managed.name} enabled`, "success");
          }}
        />
      ) : null}

      {connecting ? (
        <ConnectDrawer
          integration={connecting}
          open
          onClose={() => setConnecting(null)}
          onConnected={(provider, credentials) =>
            apply(connectedRecord(connecting, provider, credentials))
          }
        />
      ) : null}

      {disconnecting ? (
        <DisconnectDialog
          integration={disconnecting}
          open
          onClose={() => setDisconnecting(null)}
          onConfirm={() => {
            apply(disconnectedRecord(disconnecting));
            toast(`${disconnecting.name} disconnected`, "info");
            setDisconnecting(null);
          }}
        />
      ) : null}

      <EventsTodayDrawer
        integrations={integrations}
        open={showEvents}
        onClose={() => setShowEvents(false)}
      />
    </>
  );
}
