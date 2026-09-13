"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  LayoutTemplate,
  Plus,
  Upload,
  Users,
  Workflow as WorkflowIcon,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Menu } from "@/components/ui/menu";
import { Pagination } from "@/components/ui/pagination";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { SortableTH, TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import {
  ActiveFilterChips,
  RowsPerPage,
  type FilterChip,
} from "@/components/customers/customer-toolbar";
import { AUTOMATION_ROUTES, WORKFLOW_STATUSES } from "@/constants/automation";
import { CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { useDebounce } from "@/hooks/useDebounce";
import { useTableState } from "@/hooks/useTableState";
import { OWNERS, ownerName } from "@/lib/customer-fixtures";
import { formatCount, formatPercent, formatRelativeTime } from "@/lib/format";
import {
  AUTOMATION_TRIGGERS,
  AUTOMATION_NOW_MS,
  WORKFLOWS,
  conversionRate,
  localId,
  workflowTotals,
} from "@/lib/workflow-fixtures";
import type { MarketingChannel } from "@/types/marketing";
import type { Workflow, WorkflowStatus } from "@/types/workflow";
import { ChannelChips, WorkflowStatusBadge } from "./automation-badges";
import { WorkflowCard, completionRate, workflowMenuItems } from "./workflow-card";
import { ImportWorkflowDialog, NewWorkflowDialog, RenameWorkflowDialog } from "./workflow-dialogs";

/**
 * The Automation command centre.
 *
 * Two views on the same list, because they answer different questions: cards
 * show each journey's *shape*, which is what you want when deciding which
 * automation to open, and the table lines the numbers up, which is what you
 * want when deciding which one is underperforming. Cards are the default —
 * most visits here are "find the one I mean", not "audit all of them".
 *
 * Filter, sort, page and search all live in the URL through `useTableState`,
 * so a filtered view is linkable and Back from a workflow returns to it.
 * Status changes, renames, archives and deletes are held in local state: with
 * no API behind them, the honest thing is to make the interaction real for the
 * session rather than to fake a success toast over a list that never moves.
 */

const FILTERS = ["status", "trigger", "channel", "owner", "updated"] as const;
type FilterKey = (typeof FILTERS)[number];

type Column = "trigger" | "channels" | "entered" | "completed" | "conversion" | "owner" | "updated";
type SortField = "name" | "entered" | "conversion" | "updated";
type View = "cards" | "list";

const UPDATED_WINDOWS = [
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "7d", label: "Last 7 days", hours: 24 * 7 },
  { value: "30d", label: "Last 30 days", hours: 24 * 30 },
  { value: "90d", label: "Last 90 days", hours: 24 * 90 },
];

const SORTS: { value: SortField; label: string }[] = [
  { value: "updated", label: "Last updated" },
  { value: "name", label: "Name" },
  { value: "entered", label: "Contacts entered" },
  { value: "conversion", label: "Conversion rate" },
];

/** Triggers actually wired to a workflow — the rest would filter to nothing. */
const USED_TRIGGERS = AUTOMATION_TRIGGERS.filter((trigger) =>
  WORKFLOWS.some((workflow) => workflow.triggerKey === trigger.eventKey),
);

function kpis(): Kpi[] {
  const totals = workflowTotals();

  return [
    {
      label: "Active workflows",
      value: formatCount(totals.active),
      icon: WorkflowIcon,
      tone: "brand",
      hint: `${WORKFLOWS.length} in total`,
    },
    {
      label: "Contacts running",
      value: formatCount(totals.running),
      icon: Users,
      hint: "Inside a journey right now",
    },
    {
      label: "Completed this month",
      value: formatCount(totals.completedThisMonth),
      icon: CheckCircle2,
      tone: "success",
      hint: "Journeys finished end to end",
    },
    {
      label: "Success rate",
      value: formatPercent(totals.successRate),
      icon: Activity,
      tone: totals.successRate >= 95 ? "success" : "warning",
      hint: "Steps completed without error",
    },
  ];
}

export function WorkflowsWorkspace() {
  const router = useRouter();
  const toast = useToast();
  const table = useTableState<FilterKey, Column>(FILTERS);

  const [view, setView] = useState<View>("cards");

  /* Local mirror so the input stays responsive; the URL follows behind it. */
  const [searchDraft, setSearchDraft] = useState(table.search);
  const debounced = useDebounce(searchDraft, 300);
  const [lastPushed, setLastPushed] = useState(table.search);
  if (debounced !== lastPushed) {
    setLastPushed(debounced);
    table.setSearch(debounced);
  }

  /* Session-local edits layered over the fixture list. */
  const [created, setCreated] = useState<Workflow[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, WorkflowStatus>>({});
  const [names, setNames] = useState<Record<string, string>>({});
  const [deleted, setDeleted] = useState<string[]>([]);

  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [renaming, setRenaming] = useState<Workflow | null>(null);
  const [confirmPause, setConfirmPause] = useState<Workflow | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Workflow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Workflow | null>(null);

  const all = useMemo(
    () =>
      [...created, ...WORKFLOWS]
        .filter((workflow) => !deleted.includes(workflow.id))
        .map((workflow) => ({
          ...workflow,
          status: statusOverrides[workflow.id] ?? workflow.status,
          name: names[workflow.id] ?? workflow.name,
        })),
    [created, deleted, names, statusOverrides],
  );

  const { filters } = table;

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    const window = UPDATED_WINDOWS.find((item) => item.value === filters.updated);
    const cutoff = window ? AUTOMATION_NOW_MS - window.hours * 3_600_000 : null;

    const rows = all.filter((workflow) => {
      /* Archived workflows are out of the way unless asked for by name: they
         are kept for their reporting, and a list that opens on them is a list
         about the past. */
      if (filters.status === "all" && workflow.status === "archived") return false;
      if (filters.status !== "all" && workflow.status !== filters.status) return false;
      if (filters.trigger !== "all" && workflow.triggerKey !== filters.trigger) return false;
      if (
        filters.channel !== "all" &&
        !workflow.channels.includes(filters.channel as MarketingChannel)
      ) {
        return false;
      }
      if (filters.owner !== "all" && workflow.ownerId !== filters.owner) return false;
      if (cutoff && new Date(workflow.updatedAt).getTime() < cutoff) return false;

      if (term) {
        const haystack = [workflow.name, workflow.description, workflow.triggerLabel]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    const field = (table.sortField ?? "updated") as SortField;
    const factor = table.sortDirection === "asc" ? 1 : -1;

    return [...rows].sort((a, b) => {
      switch (field) {
        case "name":
          return a.name.localeCompare(b.name) * factor;
        case "entered":
          return (a.stats.entered - b.stats.entered) * factor;
        case "conversion":
          return (conversionRate(a) - conversionRate(b)) * factor;
        default:
          return (
            (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * factor
          );
      }
    });
  }, [all, debounced, filters, table.sortField, table.sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const current = Math.min(table.page, totalPages);
  const rows = filtered.slice((current - 1) * table.pageSize, current * table.pageSize);

  const label = (list: readonly { value: string; label: string }[], value: string) =>
    list.find((item) => item.value === value)?.label ?? value;

  const chips: FilterChip[] = [
    filters.status !== "all"
      ? { key: "status", label: "Status", value: label(WORKFLOW_STATUSES, filters.status) }
      : null,
    filters.trigger !== "all"
      ? {
          key: "trigger",
          label: "Trigger",
          value:
            USED_TRIGGERS.find((trigger) => trigger.eventKey === filters.trigger)?.name ??
            filters.trigger,
        }
      : null,
    filters.channel !== "all"
      ? {
          key: "channel",
          label: "Channel",
          value: CHANNEL_THEME[filters.channel as MarketingChannel]?.label ?? filters.channel,
        }
      : null,
    filters.owner !== "all"
      ? { key: "owner", label: "Owner", value: ownerName(filters.owner) }
      : null,
    filters.updated !== "all"
      ? { key: "updated", label: "Updated", value: label(UPDATED_WINDOWS, filters.updated) }
      : null,
  ].filter((chip): chip is FilterChip => chip !== null);

  function clearEverything() {
    setSearchDraft("");
    table.clearAll();
  }

  const actions = {
    onDuplicate: (workflow: Workflow) => {
      const copy: Workflow = {
        ...workflow,
        id: localId(workflow.id),
        name: `${workflow.name} (copy)`,
        status: "draft" as const,
        stats: { entered: 0, completed: 0, converted: 0, running: 0, failed: 0 },
        updatedAt: new Date().toISOString(),
      };
      setCreated((list) => [copy, ...list]);
      toast(`${workflow.name} duplicated as a draft`, "success");
    },
    onToggleStatus: (workflow: Workflow) => {
      if (workflow.status === "active") {
        setConfirmPause(workflow);
        return;
      }
      setStatusOverrides((map) => ({ ...map, [workflow.id]: "active" }));
      toast(`${workflow.name} is now active`, "success");
    },
    onRename: (workflow: Workflow) => setRenaming(workflow),
    onArchive: (workflow: Workflow) => setConfirmArchive(workflow),
    onDelete: (workflow: Workflow) => setConfirmDelete(workflow),
  };

  /*
   * An empty list has two different causes and two different answers: a
   * workspace with no workflows wants the "create your first" pitch, and a
   * filter that matched nothing wants a way back out. Getting this wrong is
   * how a filtered table ends up telling an established team they have never
   * built an automation.
   */
  const nothingAtAll =
    all.filter((workflow) => workflow.status !== "archived").length === 0;

  return (
    <>
      <PageHeader
        title="Automation Workflows"
        description="Build, manage and monitor automated customer journeys across WhatsApp, Email, SMS and CRM."
        secondaryActions={
          <>
            <Button variant="outline" onClick={() => setImporting(true)}>
              <Upload aria-hidden />
              Import
            </Button>
            <ButtonLink
              href={AUTOMATION_ROUTES.templates}
              variant="outline"
              className="max-sm:hidden"
            >
              <LayoutTemplate aria-hidden />
              Use Template
            </ButtonLink>
          </>
        }
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            New Workflow
          </Button>
        }
      />

      <KpiStrip items={kpis()} />

      <Card className="p-5">
        <FilterBar
          search={searchDraft}
          onSearchChange={setSearchDraft}
          placeholder="Search workflows…"
          activeCount={chips.length}
          onReset={clearEverything}
          trailing={
            <>
              <Select
                label="Sort workflows by"
                size="sm"
                value={(table.sortField ?? "updated") as SortField}
                onChange={(next) => table.toggleSort(next)}
                options={SORTS}
                className="w-44 max-sm:hidden"
              />
              <SegmentedControl<View>
                label="Workflow view"
                value={view}
                onChange={setView}
                options={[
                  { value: "cards", label: "Cards" },
                  { value: "list", label: "List" },
                ]}
              />
            </>
          }
        >
          <Select
            label="Filter by status"
            size="sm"
            value={filters.status}
            onChange={(next) => table.setFilter("status", next)}
            options={[{ value: "all", label: "All statuses" }, ...WORKFLOW_STATUSES]}
            className="lg:w-36"
          />
          <Select
            label="Filter by trigger"
            size="sm"
            value={filters.trigger}
            onChange={(next) => table.setFilter("trigger", next)}
            options={[
              { value: "all", label: "All triggers" },
              ...USED_TRIGGERS.map((trigger) => ({
                value: trigger.eventKey,
                label: trigger.name,
                hint: trigger.eventKey,
              })),
            ]}
            className="lg:w-44"
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
            label="Filter by owner"
            size="sm"
            value={filters.owner}
            onChange={(next) => table.setFilter("owner", next)}
            options={[
              { value: "all", label: "All owners" },
              ...OWNERS.map((owner) => ({ value: owner.id, label: owner.name })),
            ]}
            className="lg:w-40"
          />
          <Select
            label="Filter by last updated"
            size="sm"
            value={filters.updated}
            onChange={(next) => table.setFilter("updated", next)}
            options={[{ value: "all", label: "Any time" }, ...UPDATED_WINDOWS]}
            className="lg:w-40"
          />
        </FilterBar>

        <ActiveFilterChips
          chips={chips}
          onRemove={(key) => table.clearFilter(key as FilterKey)}
          onClearAll={clearEverything}
          className="mt-3"
        />

        {rows.length === 0 ? (
          <div className="mt-4">
            {nothingAtAll ? (
              <EmptyState
                title="Create your first automation"
                description="Automate customer journeys using triggers, conditions, delays and multi-channel actions."
                action={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" onClick={() => setCreating(true)}>
                      <Plus aria-hidden />
                      Create Workflow
                    </Button>
                    <ButtonLink
                      href={AUTOMATION_ROUTES.templates}
                      size="sm"
                      variant="outline"
                    >
                      <LayoutTemplate aria-hidden />
                      Browse Templates
                    </ButtonLink>
                  </div>
                }
              />
            ) : (
              <EmptyState
                title="No workflows match these filters"
                description="Try a different status, trigger or channel — or clear the filters to see everything."
                action={
                  <Button size="sm" variant="outline" onClick={clearEverything}>
                    Clear filters
                  </Button>
                }
              />
            )}
          </div>
        ) : view === "cards" ? (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((workflow) => (
              <li key={workflow.id}>
                <WorkflowCard workflow={workflow} actions={actions} />
              </li>
            ))}
          </ul>
        ) : (
          <>
            <Table minWidth="72rem" className="mt-4 max-lg:hidden">
              <THead>
                <SortableTH
                  field="name"
                  activeField={table.sortField as SortField | null}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Workflow
                </SortableTH>
                <TH>Status</TH>
                <TH>Trigger</TH>
                <TH>Channels</TH>
                <SortableTH
                  field="entered"
                  activeField={table.sortField as SortField | null}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                  align="right"
                >
                  Entered
                </SortableTH>
                <TH align="right">Completed</TH>
                <SortableTH
                  field="conversion"
                  activeField={table.sortField as SortField | null}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                  align="right"
                >
                  Conversion
                </SortableTH>
                <TH>Owner</TH>
                <SortableTH
                  field="updated"
                  activeField={table.sortField as SortField | null}
                  direction={table.sortDirection}
                  onSort={table.toggleSort}
                >
                  Updated
                </SortableTH>
                <TH align="right" />
              </THead>

              <TBody>
                {rows.map((workflow) => (
                  <TR key={workflow.id}>
                    <TD>
                      <Link
                        href={AUTOMATION_ROUTES.workflow(workflow.id)}
                        className="block max-w-64 rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        <span className="block truncate text-sm font-medium text-text-primary transition-colors hover:text-primary">
                          {workflow.name}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {workflow.nodes.length} steps
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <WorkflowStatusBadge status={workflow.status} />
                    </TD>
                    <TD className="text-xs whitespace-nowrap text-text-secondary">
                      {workflow.triggerLabel}
                    </TD>
                    <TD>
                      <ChannelChips channels={workflow.channels} size="sm" />
                    </TD>
                    <TD align="right" className="text-xs font-medium text-text-primary tabular-nums">
                      {formatCount(workflow.stats.entered)}
                    </TD>
                    <TD align="right" className="text-xs text-text-secondary tabular-nums">
                      {formatCount(workflow.stats.completed)}
                      <span className="ml-1 text-text-muted">
                        ({formatPercent(completionRate(workflow), 0)})
                      </span>
                    </TD>
                    <TD align="right" className="text-xs font-medium text-primary tabular-nums">
                      {formatPercent(conversionRate(workflow))}
                    </TD>
                    <TD>
                      <Tooltip content={ownerName(workflow.ownerId)}>
                        <span
                          tabIndex={0}
                          className="rounded-full focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          <Avatar name={ownerName(workflow.ownerId)} size="xs" />
                        </span>
                      </Tooltip>
                    </TD>
                    <TD className="text-xs whitespace-nowrap text-text-muted">
                      {formatRelativeTime(workflow.updatedAt)}
                    </TD>
                    <TD align="right">
                      <Menu
                        items={workflowMenuItems(workflow, actions, () =>
                          router.push(AUTOMATION_ROUTES.workflow(workflow.id)),
                        )}
                        label={`Actions for ${workflow.name}`}
                      />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            {/* Below `lg` the table becomes the card list — the same content,
                without a nine-column row nobody can read on a phone. */}
            <ul className="mt-4 grid gap-4 lg:hidden">
              {rows.map((workflow) => (
                <li key={workflow.id}>
                  <WorkflowCard workflow={workflow} actions={actions} />
                </li>
              ))}
            </ul>
          </>
        )}

        {rows.length > 0 ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <RowsPerPage value={table.pageSize} onChange={table.setPageSize} />
            <div className="min-w-0 flex-1">
              <Pagination
                page={current}
                totalPages={totalPages}
                total={filtered.length}
                perPage={table.pageSize}
                onChange={table.setPage}
                noun="workflows"
              />
            </div>
          </div>
        ) : null}
      </Card>

      <NewWorkflowDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreate={(workflow) => {
          setCreating(false);
          setCreated((list) => [workflow, ...list]);
          toast(`${workflow.name} created as a draft`, "success");
          router.push(AUTOMATION_ROUTES.workflow(workflow.id));
        }}
      />

      <ImportWorkflowDialog open={importing} onClose={() => setImporting(false)} />

      <RenameWorkflowDialog
        workflow={renaming}
        onClose={() => setRenaming(null)}
        onRename={(workflow, name) => {
          setRenaming(null);
          setNames((map) => ({ ...map, [workflow.id]: name }));
          toast(`Renamed to ${name}`, "success");
        }}
      />

      <ConfirmDialog
        open={Boolean(confirmPause)}
        onClose={() => setConfirmPause(null)}
        onConfirm={() => {
          if (!confirmPause) return;
          setStatusOverrides((map) => ({ ...map, [confirmPause.id]: "paused" }));
          toast(`${confirmPause.name} paused`, "success");
          setConfirmPause(null);
        }}
        title="Pause this workflow?"
        description={
          confirmPause
            ? `${formatCount(confirmPause.stats.running)} contacts are inside ${confirmPause.name} right now.`
            : undefined
        }
        confirmLabel="Pause workflow"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          Contacts already in the journey stay where they are and their scheduled
          actions are held. Nobody new enters until you activate it again.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(confirmArchive)}
        onClose={() => setConfirmArchive(null)}
        onConfirm={() => {
          if (!confirmArchive) return;
          setStatusOverrides((map) => ({ ...map, [confirmArchive.id]: "archived" }));
          toast(`${confirmArchive.name} archived`, "success");
          setConfirmArchive(null);
        }}
        title="Archive this workflow?"
        description="It stops running and leaves the list, but keeps its reporting."
        confirmLabel="Archive"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          Archived workflows stay visible under the Archived status filter, and
          their runs remain in Activity. You can restore one at any time.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          setDeleted((list) => [...list, confirmDelete.id]);
          toast(`${confirmDelete.name} deleted`, "success");
          setConfirmDelete(null);
        }}
        title="Delete this workflow?"
        description="Its steps, settings and execution history are removed with it."
        confirmLabel="Delete"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          Contacts currently inside the journey are stopped immediately and no
          scheduled action will fire. This cannot be undone — archive it instead
          if you only want it out of the way.
        </p>
      </ConfirmDialog>
    </>
  );
}
