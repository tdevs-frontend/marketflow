"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader,
  PlayCircle,
  XCircle,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import {
  ActiveFilterChips,
  type FilterChip,
} from "@/components/customers/customer-toolbar";
import { EXECUTION_STATUSES, NODE_TYPES } from "@/constants/automation";
import { CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import { formatCount } from "@/lib/format";
import {
  ACTIVITY_ROWS,
  AUTOMATION_NOW_MS,
  LIVE_WORKFLOWS,
  WORKFLOW_RUNS,
  activityTotals,
  runById,
} from "@/lib/workflow-fixtures";
import type { MarketingChannel } from "@/types/marketing";
import type { ActivityRow, ExecutionStatus, WorkflowRun } from "@/types/workflow";
import { ActivityTable } from "./activity-table";
import { ExecutionDetailDrawer } from "./execution-detail";

/**
 * The automation execution monitor.
 *
 * Deliberately not the workspace's general activity feed: this page answers
 * "did my automations do what I asked, and where did they stop", which is a
 * debugging question, so it is ordered newest-first, filtered by failure, and
 * every row opens the run it came from. Nothing on it is about who edited
 * what.
 */

const FILTERS = [
  "workflow",
  "status",
  "action",
  "channel",
  "date",
  "contact",
  "errors",
] as const;
type FilterKey = (typeof FILTERS)[number];

const DATE_WINDOWS = [
  { value: "1h", label: "Last hour", hours: 1 },
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "7d", label: "Last 7 days", hours: 24 * 7 },
  { value: "30d", label: "Last 30 days", hours: 24 * 30 },
];

/** Node kinds that actually appear in the log, so the filter never empties. */
const ACTION_OPTIONS = NODE_TYPES.filter((type) =>
  ACTIVITY_ROWS.some((row) => row.kind === type.kind),
).map((type) => ({ value: type.kind, label: type.label }));

const CONTACT_OPTIONS = [
  ...new Map(
    WORKFLOW_RUNS.map((run) => [run.contactId, run.contactName] as const),
  ),
].map(([value, label]) => ({ value, label }));

function kpis(): Kpi[] {
  const totals = activityTotals();

  return [
    {
      label: "Runs today",
      value: formatCount(totals.runsToday),
      icon: PlayCircle,
      tone: "brand",
    },
    {
      label: "In progress",
      value: formatCount(totals.inProgress),
      icon: Loader,
      hint: "Running or waiting on a delay",
    },
    {
      label: "Completed",
      value: formatCount(totals.completed),
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Failed",
      value: formatCount(totals.failed),
      icon: XCircle,
      tone: totals.failed > 0 ? "danger" : "neutral",
      hint: totals.failed > 0 ? "Needs attention" : "Nothing to fix",
    },
  ];
}

export function ActivityWorkspace({
  /** Pre-selects a run, for the `/activity/[runId]` route's drawer. */
  initialRun,
}: {
  initialRun?: WorkflowRun;
}) {
  const table = useTableState<FilterKey>(FILTERS);

  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 300);
  const [lastPushed, setLastPushed] = useState(table.search);
  if (debounced !== lastPushed) {
    setLastPushed(debounced);
    table.setSearch(debounced);
  }

  const [openRun, setOpenRun] = useState<WorkflowRun | null>(initialRun ?? null);

  const { filters } = table;
  const errorsOnly = filters.errors === "only";

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    const window = DATE_WINDOWS.find((item) => item.value === filters.date);
    const cutoff = window ? AUTOMATION_NOW_MS - window.hours * 3_600_000 : null;

    return ACTIVITY_ROWS.filter((row: ActivityRow) => {
      if (errorsOnly && row.status !== "failed") return false;
      if (filters.workflow !== "all" && row.workflowId !== filters.workflow) return false;
      if (filters.status !== "all" && row.status !== (filters.status as ExecutionStatus)) {
        return false;
      }
      if (filters.action !== "all" && row.kind !== filters.action) return false;
      if (filters.channel !== "all" && row.channel !== (filters.channel as MarketingChannel)) {
        return false;
      }
      if (filters.contact !== "all" && row.contactId !== filters.contact) return false;
      if (cutoff && new Date(row.at).getTime() < cutoff) return false;

      if (term) {
        const haystack = [row.contactName, row.workflowName, row.title, row.event, row.runId]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [debounced, errorsOnly, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const current = Math.min(table.page, totalPages);
  const rows = filtered.slice((current - 1) * table.pageSize, current * table.pageSize);

  const label = (list: readonly { value: string; label: string }[], value: string) =>
    list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.workflow !== "all"
      ? {
          key: "workflow",
          label: "Workflow",
          value:
            LIVE_WORKFLOWS.find((item) => item.id === filters.workflow)?.name ??
            filters.workflow,
        }
      : null,
    filters.status !== "all"
      ? { key: "status", label: "Status", value: label(EXECUTION_STATUSES, filters.status) }
      : null,
    filters.action !== "all"
      ? { key: "action", label: "Action", value: label(ACTION_OPTIONS, filters.action) }
      : null,
    filters.channel !== "all"
      ? {
          key: "channel",
          label: "Channel",
          value: CHANNEL_THEME[filters.channel as MarketingChannel]?.label ?? filters.channel,
        }
      : null,
    filters.contact !== "all"
      ? { key: "contact", label: "Contact", value: label(CONTACT_OPTIONS, filters.contact) }
      : null,
    filters.date !== "all"
      ? { key: "date", label: "Date", value: label(DATE_WINDOWS, filters.date) }
      : null,
    errorsOnly ? { key: "errors", label: "Showing", value: "Errors only" } : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  const filtersOn = chips.length > 0 || debounced.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Automation Activity"
        description="Monitor workflow executions, scheduled actions, failures and customer journeys."
        action={
          <Button
            variant={errorsOnly ? "primary" : "outline"}
            onClick={() => table.setFilter("errors", errorsOnly ? "all" : "only")}
          >
            <XCircle aria-hidden />
            {errorsOnly ? "Showing errors" : "Errors only"}
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <Card className="p-5">
        <FilterBar
          search={searchDraft}
          onSearchChange={setSearchDraft}
          placeholder="Search contact, workflow or run ID…"
          activeCount={chips.length}
          onReset={clearEverything}
          trailing={
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary max-sm:hidden">
              <Checkbox
                checked={errorsOnly}
                onCheckedChange={(checked) =>
                  table.setFilter("errors", checked ? "only" : "all")
                }
                label="Show failed steps only"
              />
              Errors only
            </label>
          }
        >
          <Select
            label="Filter by workflow"
            size="sm"
            value={filters.workflow}
            onChange={(next) => table.setFilter("workflow", next)}
            options={[
              { value: "all", label: "All workflows" },
              ...LIVE_WORKFLOWS.map((item) => ({ value: item.id, label: item.name })),
            ]}
            className="lg:w-44"
          />
          <Select
            label="Filter by status"
            size="sm"
            value={filters.status}
            onChange={(next) => table.setFilter("status", next)}
            options={[{ value: "all", label: "All statuses" }, ...EXECUTION_STATUSES]}
            className="lg:w-36"
          />
          <Select
            label="Filter by action"
            size="sm"
            value={filters.action}
            onChange={(next) => table.setFilter("action", next)}
            options={[{ value: "all", label: "All actions" }, ...ACTION_OPTIONS]}
            className="lg:w-40"
          />
          <Select
            label="Filter by channel"
            size="sm"
            value={filters.channel}
            onChange={(next) => table.setFilter("channel", next)}
            options={[
              { value: "all", label: "All channels" },
              ...CHANNEL_ORDER.filter((channel) => channel !== "social").map((channel) => ({
                value: channel,
                label: CHANNEL_THEME[channel].label,
              })),
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by contact"
            size="sm"
            value={filters.contact}
            onChange={(next) => table.setFilter("contact", next)}
            options={[{ value: "all", label: "All contacts" }, ...CONTACT_OPTIONS]}
            className="lg:w-40"
          />
          <Select
            label="Filter by date"
            size="sm"
            value={filters.date}
            onChange={(next) => table.setFilter("date", next)}
            options={[{ value: "all", label: "Any time" }, ...DATE_WINDOWS]}
            className="lg:w-40"
          />
        </FilterBar>

        <ActiveFilterChips
          chips={chips}
          onRemove={(key) => table.clearFilter(key as FilterKey)}
          onClearAll={clearEverything}
          className="mt-3"
        />

        <div className="mt-4">
          {rows.length === 0 ? (
            errorsOnly && !filtersOn ? (
              <EmptyState
                title="No failed runs"
                description="Every automation step in this period completed without an error."
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => table.setFilter("errors", "all")}
                  >
                    Show all activity
                  </Button>
                }
              />
            ) : filtersOn ? (
              <EmptyState
                title="No activity matches these filters"
                description="Try a wider date range, or clear the filters to see every execution."
                action={
                  <Button size="sm" variant="outline" onClick={clearEverything}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title="No activity yet"
                description="Once a workflow is published and a contact enters it, every step they take is logged here."
              />
            )
          ) : (
            <>
              <ActivityTable
                rows={rows}
                onOpen={(runId) => setOpenRun(runById(runId) ?? null)}
              />

              <div className="mt-4">
                <Pagination
                  page={current}
                  totalPages={totalPages}
                  total={filtered.length}
                  perPage={table.pageSize}
                  onChange={table.setPage}
                  noun="steps"
                />
              </div>
            </>
          )}
        </div>
      </Card>

      <ExecutionDetailDrawer run={openRun} onClose={() => setOpenRun(null)} />
    </>
  );
}
