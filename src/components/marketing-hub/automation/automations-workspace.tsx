"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Copy,
  Eye,
  LayoutGrid,
  List,
  Pause,
  Pencil,
  Play,
  Plus,
  Trash2,
  Users,
  Workflow,
  X,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Icon } from "@/components/ui/icon";
import { Menu } from "@/components/ui/menu";
import { ProgressBar } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StatsGrid, type StatItem } from "@/components/ui/stats-card";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { CHANNEL_THEME, type Channel } from "@/constants/channels";
import { AUTOMATION_STATUSES, countSteps, flowsForChannel } from "@/lib/automation-fixtures";
import { formatCount, formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AutomationFlow, AutomationStatus } from "@/types/automation";
import type { MarketingChannel } from "@/types/marketing";
import { FlowBranch } from "./automation-node";
import { FlowBuilder } from "./flow-builder";

/**
 * The automations list for one channel.
 *
 * Two views on purpose: cards show the flow's shape, which is what you want
 * when deciding *which* automation to open, and the table shows the numbers
 * side by side, which is what you want when deciding which one is
 * underperforming. Same data, two genuinely different questions.
 */

const ALL = "all";

const STATUS_TONES: Record<AutomationStatus, BadgeTone> = {
  active: "success",
  paused: "warning",
  draft: "neutral",
  archived: "neutral",
};

type View = "cards" | "table";

function statsFor(flows: AutomationFlow[], accentLabel: string): StatItem[] {
  const active = flows.filter((flow) => flow.status === "active");
  const processed = flows.reduce((sum, flow) => sum + flow.contactsProcessed, 0);
  /* Weighted by volume — averaging the percentages would let a draft with a
     0% rate drag the headline down as hard as a flow with 12,000 entrants. */
  const weighted = flows.reduce(
    (sum, flow) => sum + flow.successRate * flow.contactsProcessed,
    0,
  );

  return [
    {
      label: "Active Automations",
      value: formatCount(active.length),
      changePercent: 12.5,
      icon: Workflow,
      hint: `of ${flows.length} on ${accentLabel}`,
    },
    {
      label: "Contacts Processed",
      value: formatCount(processed),
      changePercent: 18.4,
      icon: Users,
      hint: "in the last 30 days",
    },
    {
      label: "Success Rate",
      value: formatPercent(processed === 0 ? 0 : weighted / processed),
      changePercent: 4.2,
      icon: CheckCircle2,
      hint: "reached a goal",
    },
    {
      label: "Currently In Flow",
      value: formatCount(Math.round(processed * 0.064)),
      changePercent: 6.8,
      icon: Activity,
      hint: "waiting on a delay",
    },
  ];
}

export function AutomationsWorkspace({ channel }: { channel: MarketingChannel }) {
  const toast = useToast();
  const theme = CHANNEL_THEME[channel as Channel];
  const flows = useMemo(() => flowsForChannel(channel), [channel]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AutomationStatus | typeof ALL>(ALL);
  const [sort, setSort] = useState<"activity" | "processed" | "success" | "name">(
    "activity",
  );
  const [view, setView] = useState<View>("cards");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AutomationFlow | null>(null);
  /* Editing takes over the page rather than opening a dialog: a flow canvas
     inside a 512px modal is unusable, and editing an automation is a task. */
  const [editing, setEditing] = useState<AutomationFlow | null>(null);

  const activeFilters = status === ALL ? 0 : 1;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return flows
      .filter((flow) => {
        if (term && !flow.name.toLowerCase().includes(term)) return false;
        if (status !== ALL && flow.status !== status) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "processed") return b.contactsProcessed - a.contactsProcessed;
        if (sort === "success") return b.successRate - a.successRate;
        return (
          new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
        );
      });
  }, [flows, search, sort, status]);

  const menuFor = (flow: AutomationFlow) => [
    {
      label: expanded === flow.id ? "Hide flow" : "Preview flow",
      icon: <Eye className="size-4" />,
      onSelect: () => setExpanded(expanded === flow.id ? null : flow.id),
    },
    {
      label: "Edit",
      icon: <Pencil className="size-4" />,
      onSelect: () => setEditing(flow),
    },
    {
      label: flow.status === "active" ? "Pause" : "Activate",
      icon:
        flow.status === "active" ? (
          <Pause className="size-4" />
        ) : (
          <Play className="size-4" />
        ),
      onSelect: () =>
        toast(
          flow.status === "active" ? `${flow.name} paused` : `${flow.name} activated`,
        ),
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => toast(`${flow.name} duplicated`),
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => setPendingDelete(flow),
      destructive: true,
    },
  ];

  /* Editing takes over the page, the same way the email template builder does.
     The heading stays so the way back is always visible. */
  if (editing) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-text-muted">Editing automation</p>
            <h2 className="truncate text-lg">{editing.name}</h2>
          </div>
          <Button variant="outline" size="compact" onClick={() => setEditing(null)}>
            <X aria-hidden />
            Close builder
          </Button>
        </div>

        <FlowBuilder flow={editing} />
      </>
    );
  }

  return (
    <>
      <StatsGrid
        items={statsFor(flows, theme.label)}
        accent={{ soft: theme.soft, text: theme.text }}
      />

      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search automations…"
          activeCount={activeFilters}
          onReset={() => setStatus(ALL)}
          trailing={
            <SegmentedControl
              label="Layout"
              value={view}
              onChange={setView}
              options={[
                { value: "cards", label: "Cards" },
                { value: "table", label: "Table" },
              ]}
            />
          }
        >
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => setStatus(next as AutomationStatus | typeof ALL)}
            options={[{ value: ALL, label: "All statuses" }, ...AUTOMATION_STATUSES]}
            className="lg:w-38"
          />
          <Select
            label="Sort automations"
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "activity", label: "Recent activity" },
              { value: "processed", label: "Most processed" },
              { value: "success", label: "Best success rate" },
              { value: "name", label: "Name A–Z" },
            ]}
            className="lg:w-44"
          />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title={
              search || activeFilters
                ? "No automations match those filters"
                : `No ${theme.label} automations yet`
            }
            description={
              search || activeFilters
                ? "Try a different search term, or clear the filters."
                : "Automations send follow-ups on their own, so a lead never waits on someone remembering to reply."
            }
            action={
              search || activeFilters ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStatus(ALL);
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button size="sm">
                  <Plus aria-hidden />
                  Create Automation
                </Button>
              )
            }
          />
        ) : view === "cards" ? (
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {rows.map((flow) => {
              const steps = countSteps(flow.steps);
              const open = expanded === flow.id;

              return (
                <li key={flow.id}>
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-btn",
                            theme.soft,
                            theme.text,
                          )}
                        >
                          <Workflow className="size-4" aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-semibold text-text-primary">
                            {flow.name}
                          </h3>
                          <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                            {flow.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <Badge tone={STATUS_TONES[flow.status]}>{flow.status}</Badge>
                        <Menu label={`Actions for ${flow.name}`} items={menuFor(flow)} />
                      </div>
                    </div>

                    {/* Trigger gets its own line: it is the question "when does
                        this run", and it is the first thing anyone asks. */}
                    <div className="mt-4 flex items-center gap-2 rounded-panel bg-surface-secondary px-3 py-2">
                      <Icon
                        name={flow.triggerIcon}
                        className="size-3.5 shrink-0 text-text-muted"
                      />
                      <p className="min-w-0 truncate text-xs text-text-secondary">
                        <span className="font-medium text-text-primary">Trigger:</span>{" "}
                        {flow.triggerLabel}
                      </p>
                    </div>

                    <dl className="mt-4 grid grid-cols-3 gap-3">
                      {[
                        { label: "Steps", value: formatNumber(steps) },
                        {
                          label: "Processed",
                          value: formatCount(flow.contactsProcessed),
                        },
                        { label: "Success", value: formatPercent(flow.successRate) },
                      ].map((cell) => (
                        <div key={cell.label}>
                          <dt className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
                            {cell.label}
                          </dt>
                          <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
                            {cell.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <ProgressBar
                      value={flow.successRate}
                      label={`${flow.name} success rate`}
                      tone={theme.accent}
                      className="mt-3"
                    />

                    {open ? (
                      <div className="mt-4 max-h-96 overflow-y-auto rounded-panel border border-border bg-background p-3">
                        <FlowBranch steps={flow.steps} />
                      </div>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3.5">
                      <p className="text-[11px] text-text-muted">
                        Active {formatRelativeTime(flow.lastActivityAt)}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpanded(open ? null : flow.id)}
                        >
                          {open ? <List aria-hidden /> : <LayoutGrid aria-hidden />}
                          {open ? "Hide" : "Flow"}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditing(flow)}
                        >
                          <Pencil aria-hidden />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-4">
            <Table minWidth="64rem">
              <THead>
                <TH>Automation</TH>
                <TH>Trigger</TH>
                <TH align="right">Steps</TH>
                <TH align="right">Processed</TH>
                <TH>Success rate</TH>
                <TH>Status</TH>
                <TH>Last activity</TH>
                <TH align="right">Actions</TH>
              </THead>

              <TBody>
                {rows.map((flow) => (
                  <TR key={flow.id}>
                    <TD>
                      <p className="max-w-56 truncate font-medium text-text-primary">
                        {flow.name}
                      </p>
                      <p className="max-w-56 truncate text-[11px] text-text-muted">
                        {flow.description}
                      </p>
                    </TD>

                    <TD>
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                        <Icon name={flow.triggerIcon} className="size-3.5 shrink-0" />
                        {flow.triggerLabel}
                      </span>
                    </TD>

                    <TD align="right" className="text-text-secondary tabular-nums">
                      {countSteps(flow.steps)}
                    </TD>

                    <TD align="right" className="font-medium text-text-primary tabular-nums">
                      {formatNumber(flow.contactsProcessed)}
                    </TD>

                    <TD className="w-40">
                      <p className="text-xs font-medium text-text-primary tabular-nums">
                        {formatPercent(flow.successRate)}
                      </p>
                      <ProgressBar
                        value={flow.successRate}
                        label={`${flow.name} success rate`}
                        tone={theme.accent}
                        size="sm"
                        className="mt-1.5"
                      />
                    </TD>

                    <TD>
                      <Badge tone={STATUS_TONES[flow.status]}>{flow.status}</Badge>
                    </TD>

                    <TD className="text-xs whitespace-nowrap text-text-muted">
                      {formatRelativeTime(flow.lastActivityAt)}
                    </TD>

                    <TD align="right">
                      <Menu label={`Actions for ${flow.name}`} items={menuFor(flow)} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => toast(`${pendingDelete?.name} deleted`)}
        title={`Delete ${pendingDelete?.name}?`}
        description="Contacts currently waiting in this flow are released immediately."
        confirmLabel="Delete automation"
      >
        <p className="text-sm text-text-secondary">
          Messages already sent are not recalled, and the flow&apos;s reporting
          history is removed with it. This cannot be undone.
        </p>
      </ConfirmDialog>
    </>
  );
}
