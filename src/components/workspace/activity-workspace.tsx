"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, Download, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarLabel } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { Pagination } from "@/components/ui/pagination";
import {
  DateRangePicker,
  DEFAULT_RANGE,
  type DateRangeValue,
} from "@/components/ui/date-range";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast";
import {
  AUDIT_MODULE_LABEL,
  AUDIT_STATUS_LABEL,
} from "@/constants/workspace";
import { useTableState } from "@/hooks/useTableState";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { WORKSPACE_NOW_MS } from "@/lib/workspace-clock";
import { WORKSPACE_MEMBERS, auditTotals } from "@/lib/workspace-fixtures";
import type {
  AuditModule,
  AuditStatus,
  WorkspaceAuditEvent,
} from "@/types/workspace";
import { AuditDetailDrawer } from "./audit-detail-drawer";
import { useWorkspaceAudit } from "./workspace-audit-store";
import {
  permissionHint,
  useWorkspacePermissions,
} from "./use-workspace-permissions";
import { AuditStatusBadge, SeverityBadge } from "./workspace-badges";

/**
 * Workspace Activity — the audit trail.
 *
 * Who changed what in this workspace, and nothing else. It is deliberately not
 * a notification feed: there are no "campaign finished sending" rows, because
 * nobody did that. It is also not Automation Activity, which records what
 * happened *inside* a workflow run, nor a customer timeline, which records what
 * happened *to* a contact. Three logs, three questions, kept apart.
 *
 * The scope test for a row: a person or the system made a deliberate change to
 * the workspace, and someone might later need to know who. Page views and
 * filter changes fail it.
 */

const ALL = "all";
const FILTERS = ["member", "module", "status", "scope"] as const;
type FilterKey = (typeof FILTERS)[number];

const MEMBER_OPTIONS = [
  { value: ALL, label: "All members" },
  { value: "system", label: "System" },
  ...WORKSPACE_MEMBERS.map((member) => ({
    value: member.id,
    label: member.name,
  })),
];

const MODULE_OPTIONS = [
  { value: ALL, label: "All modules" },
  ...(Object.keys(AUDIT_MODULE_LABEL) as AuditModule[]).map((module) => ({
    value: module,
    label: AUDIT_MODULE_LABEL[module],
  })),
];

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...(Object.keys(AUDIT_STATUS_LABEL) as AuditStatus[]).map((status) => ({
    value: status,
    label: AUDIT_STATUS_LABEL[status],
  })),
];

/**
 * The two lenses an auditor actually uses.
 *
 * A segmented control rather than two more dropdowns: these are the questions
 * someone opens this page to ask — "show me anything security-related" and
 * "show me what actually mattered" — and burying them among five selects makes
 * them as hard to reach as a date range.
 */
const SCOPE_OPTIONS = [
  { value: ALL, label: "All events" },
  { value: "security", label: "Security" },
  { value: "high", label: "High impact" },
];

export function ActivityWorkspace() {
  const toast = useToast();
  const permissions = useWorkspacePermissions();
  const table = useTableState<FilterKey>(FILTERS, { defaultPageSize: 20 });

  const [selected, setSelected] = useState<WorkspaceAuditEvent | null>(null);
  const [range, setRange] = useState<DateRangeValue>(DEFAULT_RANGE);

  /* The fixture plus anything recorded in this session — a role edit made on
     the Roles page is in the trail before you navigate here. */
  const events = useWorkspaceAudit();

  const totals = useMemo(() => auditTotals(events), [events]);

  const kpis: Kpi[] = [
    {
      label: "Actions Today",
      value: formatCount(totals.today),
      icon: Activity,
      tone: "brand",
      hint: "Recorded in the last 24 hours",
    },
    {
      label: "Active Members",
      value: formatCount(totals.activeMembers),
      icon: Users,
      hint: "People who changed something today",
    },
    {
      label: "Changes This Week",
      value: formatCount(totals.thisWeek),
      icon: TrendingUp,
      hint: "Across every module",
    },
    {
      label: "Security Events",
      value: formatCount(totals.security),
      icon: ShieldCheck,
      tone: totals.security > 0 ? "warning" : "neutral",
      hint: "Permission, access and key changes",
    },
  ];

  const filtered = useMemo(() => {
    const term = table.search.trim().toLowerCase();

    const cutoff = rangeCutoff(range);

    return events.filter((event) => {
      const { member, module, status, scope } = table.filters;

      if (cutoff !== null && new Date(event.createdAt).getTime() < cutoff) {
        return false;
      }

      if (member !== ALL) {
        if (member === "system" ? event.actorId !== null : event.actorId !== member) {
          return false;
        }
      }
      if (module !== ALL && event.module !== module) return false;
      if (status !== ALL && event.status !== status) return false;
      if (scope === "security" && event.severity !== "security") return false;
      if (scope === "high" && event.severity !== "high") return false;

      if (term) {
        const haystack = [
          event.actorName,
          event.actionLabel,
          event.resourceName,
          event.resourceType,
          AUDIT_MODULE_LABEL[event.module],
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [events, range, table.filters, table.search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / table.pageSize));
  const page = Math.min(table.page, totalPages);
  const paged = filtered.slice((page - 1) * table.pageSize, page * table.pageSize);

  /**
   * Export honours the filters.
   *
   * Exporting the whole log when the screen shows eleven filtered rows is the
   * kind of surprise that ends in a spreadsheet nobody trusts. Secrets are
   * never in these records to begin with — `metadata` carries a key's prefix
   * and scopes, never the key — so nothing has to be stripped on the way out.
   */
  function exportCsv() {
    toast(
      `Exporting ${filtered.length} ${filtered.length === 1 ? "event" : "events"} with your current filters…`,
      "success",
    );
  }

  return (
    <>
      <PageHeader
        title="Workspace Activity"
        description="Track important actions made by your team across the workspace."
        action={
          permissions.canExportActivity ? (
            <Button variant="outline" onClick={exportCsv}>
              <Download aria-hidden />
              Export Activity
            </Button>
          ) : (
            <Tooltip content={permissionHint("Export activity", permissions.roleName)}>
              <Button variant="outline" disabled>
                <Download aria-hidden />
                Export Activity
              </Button>
            </Tooltip>
          )
        }
      />

      <KpiStrip items={kpis} />

      <Card className="p-5">
        <FilterBar
          search={table.search}
          onSearchChange={table.setSearch}
          placeholder="Search activity…"
          activeCount={table.activeFilters.length}
          onReset={table.clearAll}
          trailing={
            <SegmentedControl
              label="Event scope"
              value={table.filters.scope}
              onChange={(value) => table.setFilter("scope", value)}
              options={SCOPE_OPTIONS}
            />
          }
        >
          <Select
            label="Member"
            value={table.filters.member}
            onChange={(value) => table.setFilter("member", value)}
            options={MEMBER_OPTIONS}
            size="sm"
            className="w-44"
          />
          <Select
            label="Module"
            value={table.filters.module}
            onChange={(value) => table.setFilter("module", value)}
            options={MODULE_OPTIONS}
            size="sm"
            className="w-40"
          />
          <Select
            label="Status"
            value={table.filters.status}
            onChange={(value) => table.setFilter("status", value)}
            options={STATUS_OPTIONS}
            size="sm"
            className="w-36"
          />
          <DateRangePicker value={range} onChange={setRange} />
        </FilterBar>

        <div className="mt-5">
          {events.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Workspace actions will appear here as your team works."
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              title="No activity matches"
              description="Nothing here fits that search and filter."
            />
          ) : (
            <>
              <Table minWidth="66rem">
                <THead>
                  <TH>Time</TH>
                  <TH>Member</TH>
                  <TH>Action</TH>
                  <TH>Module</TH>
                  <TH>Target</TH>
                  <TH align="right">Status</TH>
                </THead>

                <TBody>
                  {paged.map((event) => (
                    <TR
                      key={event.id}
                      onClick={() => setSelected(event)}
                      className="cursor-pointer"
                    >
                      <TD className="whitespace-nowrap text-text-secondary">
                        {formatRelativeTime(event.createdAt, WORKSPACE_NOW_MS)}
                      </TD>

                      <TD className="max-w-52">
                        <AvatarLabel
                          name={event.actorName}
                          size="sm"
                          tone={
                            event.actorId
                              ? undefined
                              : "bg-surface-secondary text-text-muted"
                          }
                        />
                      </TD>

                      <TD className="max-w-56">
                        <span className="block truncate text-text-primary">
                          {event.actionLabel}
                        </span>
                      </TD>

                      <TD className="text-text-secondary">
                        {AUDIT_MODULE_LABEL[event.module]}
                      </TD>

                      <TD className="max-w-64">
                        {event.resourceHref ? (
                          <Link
                            href={event.resourceHref}
                            onClick={(clickEvent) => clickEvent.stopPropagation()}
                            className="block truncate font-normal text-primary underline-offset-2 hover:underline focus-visible:shadow-focus focus-visible:outline-none"
                          >
                            {event.resourceName}
                          </Link>
                        ) : (
                          <span className="block truncate font-normal text-text-secondary">
                            {event.resourceName}
                          </span>
                        )}
                      </TD>

                      <TD align="right">
                        <span className="inline-flex items-center justify-end gap-1.5">
                          <SeverityBadge severity={event.severity} />
                          <AuditStatusBadge status={event.status} />
                        </span>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>

              <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                perPage={table.pageSize}
                onChange={table.setPage}
                noun="events"
              />
            </>
          )}
        </div>
      </Card>

      <AuditDetailDrawer
        event={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

/**
 * The earliest timestamp a range admits, or `null` for "everything".
 *
 * Measured against the workspace's frozen clock rather than `Date.now()`, for
 * the same reason every relative timestamp in this module is: the fixtures are
 * pinned to one instant, and filtering them against the real clock would empty
 * the table the day after it was written.
 */
function rangeCutoff(range: DateRangeValue): number | null {
  const DAY = 86_400_000;

  switch (range.preset) {
    case "today":
      return WORKSPACE_NOW_MS - DAY;
    case "7d":
      return WORKSPACE_NOW_MS - 7 * DAY;
    case "30d":
      return WORKSPACE_NOW_MS - 30 * DAY;
    case "90d":
      return WORKSPACE_NOW_MS - 90 * DAY;
    case "ytd":
      return new Date(new Date(WORKSPACE_NOW_MS).getUTCFullYear(), 0, 1).getTime();
    case "custom":
      return range.from ? new Date(range.from).getTime() : null;
    default:
      return null;
  }
}
