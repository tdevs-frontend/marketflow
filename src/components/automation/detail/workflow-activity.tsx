"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { EXECUTION_STATUSES, NODE_META } from "@/constants/automation";
import { CHANNEL_ORDER, CHANNEL_THEME } from "@/constants/channels";
import { useDebounce } from "@/hooks/useDebounce";
import { ACTIVITY_ROWS, AUTOMATION_NOW_MS, runById } from "@/lib/workflow-fixtures";
import type { MarketingChannel } from "@/types/marketing";
import type { ExecutionStatus, Workflow, WorkflowRun } from "@/types/workflow";
import { ActivityTable } from "../activity/activity-table";
import { ExecutionDetailDrawer } from "../activity/execution-detail";

/**
 * One workflow's execution history.
 *
 * The same table as the module-wide Activity page, minus the workflow column
 * and with its own local filter state rather than the URL's — the tab already
 * owns a query parameter, and stacking six more onto it makes the workflow's
 * address unreadable for a filter nobody links to.
 */

const DATE_WINDOWS = [
  { value: "24h", label: "Last 24 hours", hours: 24 },
  { value: "7d", label: "Last 7 days", hours: 24 * 7 },
  { value: "30d", label: "Last 30 days", hours: 24 * 30 },
  { value: "all", label: "All time", hours: Infinity },
];

const PAGE_SIZE = 15;

export function WorkflowActivity({ workflow }: { workflow: Workflow }) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);

  const [status, setStatus] = useState("all");
  const [action, setAction] = useState("all");
  const [channel, setChannel] = useState("all");
  const [date, setDate] = useState("all");
  const [page, setPage] = useState(1);
  const [openRun, setOpenRun] = useState<WorkflowRun | null>(null);

  const all = useMemo(
    () => ACTIVITY_ROWS.filter((row) => row.workflowId === workflow.id),
    [workflow.id],
  );

  const actions = useMemo(
    () =>
      [...new Set(all.map((row) => row.kind))].map((kind) => ({
        value: kind,
        label: NODE_META[kind]?.label ?? kind,
      })),
    [all],
  );

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    const window = DATE_WINDOWS.find((item) => item.value === date);
    const cutoff =
      window && Number.isFinite(window.hours)
        ? AUTOMATION_NOW_MS - window.hours * 3_600_000
        : null;

    return all.filter((row) => {
      if (status !== "all" && row.status !== (status as ExecutionStatus)) return false;
      if (action !== "all" && row.kind !== action) return false;
      if (channel !== "all" && row.channel !== (channel as MarketingChannel)) return false;
      if (cutoff && new Date(row.at).getTime() < cutoff) return false;
      if (term) {
        const haystack = [row.contactName, row.title, row.event, row.runId]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [action, all, channel, date, debounced, status]);

  const activeCount = [status, action, channel, date].filter(
    (value) => value !== "all",
  ).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  function reset() {
    setSearch("");
    setStatus("all");
    setAction("all");
    setChannel("all");
    setDate("all");
    setPage(1);
  }

  return (
    <>
      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search contact, step or run ID…"
          activeCount={activeCount}
          onReset={reset}
        >
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
            options={[{ value: "all", label: "All statuses" }, ...EXECUTION_STATUSES]}
            className="lg:w-36"
          />
          <Select
            label="Filter by action"
            size="sm"
            value={action}
            onChange={(next) => {
              setAction(next);
              setPage(1);
            }}
            options={[{ value: "all", label: "All actions" }, ...actions]}
            className="lg:w-40"
          />
          <Select
            label="Filter by channel"
            size="sm"
            value={channel}
            onChange={(next) => {
              setChannel(next);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All channels" },
              ...CHANNEL_ORDER.filter((item) => item !== "social").map((item) => ({
                value: item,
                label: CHANNEL_THEME[item].label,
              })),
            ]}
            className="lg:w-36"
          />
          <Select
            label="Filter by date"
            size="sm"
            value={date}
            onChange={(next) => {
              setDate(next);
              setPage(1);
            }}
            options={DATE_WINDOWS.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
            className="lg:w-40"
          />
        </FilterBar>

        <div className="mt-4">
          {rows.length === 0 ? (
            all.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Every step a contact takes through this workflow will appear here, newest first."
              />
            ) : (
              <EmptyState
                title="No runs match these filters"
                description="Try a wider date range or a different status."
                action={
                  <Button size="sm" variant="outline" onClick={reset}>
                    Clear filters
                  </Button>
                }
              />
            )
          ) : (
            <>
              <ActivityTable
                rows={rows}
                showWorkflow={false}
                onOpen={(runId) => setOpenRun(runById(runId) ?? null)}
              />

              <div className="mt-4">
                <Pagination
                  page={current}
                  totalPages={totalPages}
                  total={filtered.length}
                  perPage={PAGE_SIZE}
                  onChange={setPage}
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
