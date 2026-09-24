"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  CheckCircle2,
  LogOut,
  Target,
  Timer,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import { BarsChart, TrendChart } from "@/components/dashboard/charts";
import { BRAND_SERIES, CHART_COLORS } from "@/components/dashboard/charts/chart-theme";
import { Badge } from "@/components/ui/badge";
import { ChartCard, PanelCard } from "@/components/ui/chart-card";
import { KpiStrip, type Kpi } from "@/components/ui/kpi-strip";
import { ProgressBar } from "@/components/ui/progress";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { CHANNEL_THEME } from "@/constants/channels";
import { goalLabel } from "@/constants/automation";
import { formatCount, formatPercent, rate } from "@/lib/format";
import {
  TREND_DAYS,
  channelPerformance,
  conversionRate,
  workflowSeries,
} from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowNode } from "@/types/workflow";
import { NodeIcon } from "../node-icon";

/**
 * What the workflow actually did.
 *
 * The four cards and three charts are the summary; the node-level figures
 * underneath are the point. A conversion rate tells you the journey is
 * underperforming - the step where the count falls off a cliff tells you
 * where, and that is the only reading that leads to an edit.
 */

type Period = "7" | "14";

/** Milliseconds as the coarse figure a completion time wants. */
function formatSpan(ms: number): string {
  if (ms <= 0) return "-";
  const hours = ms / 3_600_000;
  if (hours < 1) return `${Math.round(ms / 60_000)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

function kpis(workflow: Workflow): Kpi[] {
  const { entered, completed, converted } = workflow.stats;
  const goal = workflow.settings.goal;

  return [
    { label: "Entered", value: formatCount(entered), icon: Users, tone: "brand" },
    {
      label: "Completed",
      value: formatCount(completed),
      icon: CheckCircle2,
      tone: "success",
      hint: `${formatPercent(rate(completed, entered), 1)} of everyone who entered`,
    },
    {
      label: "Converted",
      value: formatCount(converted),
      icon: Target,
      hint: goal.enabled ? `Goal: ${goalLabel(goal.type)}` : "No goal set",
    },
    {
      label: goal.enabled ? "Goal conversion" : "Conversion rate",
      value: formatPercent(conversionRate(workflow)),
      icon: TrendingUp,
      tone: conversionRate(workflow) >= 15 ? "success" : "neutral",
      hint: goal.enabled
        ? `Within ${goal.windowDays} days of entry`
        : "Reached the last step",
    },
  ];
}

/**
 * The second row: the figures you need when the first row looks wrong.
 *
 * Separated rather than crammed into one strip of eight, because these are
 * diagnostic - how many are still inside, how many left early, how many
 * failed, how long it takes. Nobody opens Analytics to read them first, and
 * everybody needs them the moment conversion drops.
 */
function secondaryKpis(workflow: Workflow): Kpi[] {
  const { running, exitedEarly, failed, averageCompletionMs, entered } = workflow.stats;

  return [
    {
      label: "Currently active",
      value: formatCount(running),
      icon: Activity,
      hint: "Inside the journey right now",
    },
    {
      label: "Exited early",
      value: formatCount(exitedEarly),
      icon: LogOut,
      hint: `${formatPercent(rate(exitedEarly, entered), 1)} - goal met, unsubscribed or stopped`,
    },
    {
      label: "Failed runs",
      value: formatCount(failed),
      icon: XCircle,
      tone: failed > 0 ? "warning" : "neutral",
      hint: failed > 0 ? "Open Activity to see why" : "Nothing failing",
    },
    {
      label: "Average completion",
      value: formatSpan(averageCompletionMs),
      icon: Timer,
      hint: "From entry to the last step",
    },
  ];
}

/**
 * The trunk of the workflow, with the count at every step.
 *
 * Walks the graph rather than listing `nodes` in array order: the order a node
 * was authored in is not the order contacts meet it, and a drop-off chart in
 * the wrong order is worse than none.
 */
function walkTrunk(workflow: Workflow): { node: WorkflowNode; depth: number }[] {
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const out: { node: WorkflowNode; depth: number }[] = [];
  const seen = new Set<string>();

  const visit = (id: string, depth: number) => {
    if (seen.has(id) || depth > 24) return;
    seen.add(id);
    const node = byId.get(id);
    if (!node) return;
    out.push({ node, depth });

    for (const edge of workflow.edges.filter((item) => item.from === id)) {
      visit(edge.to, depth + 1);
    }
  };

  const start = workflow.nodes.find((node) => node.kind === "trigger") ?? workflow.nodes[0];
  if (start) visit(start.id, 0);
  return out;
}

function NodeAnalyticsRow({
  node,
  depth,
  top,
  previous,
}: {
  node: WorkflowNode;
  depth: number;
  top: number;
  previous?: number;
}) {
  const entered = node.entered ?? 0;
  const share = top ? (entered / top) * 100 : 0;
  const drop = previous && previous > entered ? previous - entered : 0;

  return (
    <li style={{ paddingLeft: Math.min(depth, 3) * 16 }}>
      <div className="flex items-center gap-3 rounded-panel border border-border bg-surface px-3 py-2.5">
        <NodeIcon kind={node.kind} size="sm" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {node.title}
          </p>
          <p className="truncate text-sm text-text-muted">{node.summary}</p>
        </div>

        <div className="w-28 shrink-0 max-sm:hidden">
          <ProgressBar
            value={share}
            label={`${node.title} reach`}
            size="sm"
            tone={share >= 90 ? "bg-success" : share >= 60 ? "bg-primary" : "bg-warning"}
          />
        </div>

        <div className="w-20 shrink-0 text-right">
          <p className="text-sm font-bold text-text-primary tabular-nums">
            {formatCount(entered)}
          </p>
          <p className="text-sm text-text-muted tabular-nums">
            {formatPercent(share, 1)}
          </p>
        </div>

        <div className="w-16 shrink-0 text-right max-sm:hidden">
          {drop > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-sm font-medium text-error tabular-nums">
              <ArrowDownRight className="size-3" aria-hidden />
              {formatCount(drop)}
            </span>
          ) : (
            <span className="text-sm text-text-muted">-</span>
          )}
        </div>
      </div>

      {node.branches?.length ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5 pl-9">
          {node.branches.map((branch) => (
            <Badge
              as="li"
              key={branch.id}
              variant="dashed"
              weight="inherit"
              casing="none"
              className="gap-1.5"
            >
              {branch.label}
              <span className="font-medium text-text-primary tabular-nums">
                {node.branchShare?.[branch.id] ?? 0}%
              </span>
            </Badge>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function WorkflowAnalytics({ workflow }: { workflow: Workflow }) {
  const [period, setPeriod] = useState<Period>("14");

  const series = useMemo(() => workflowSeries(workflow), [workflow]);
  const days = Number(period);
  const categories = TREND_DAYS.slice(-days);
  const slice = (values: number[]) => values.slice(-days);

  const trunk = useMemo(() => walkTrunk(workflow), [workflow]);
  const top = trunk[0]?.node.entered ?? workflow.stats.entered;
  const channels = useMemo(() => channelPerformance(workflow), [workflow]);

  const periodControl = (
    <SegmentedControl<Period>
      label="Period"
      value={period}
      onChange={setPeriod}
      options={[
        { value: "7", label: "7 days" },
        { value: "14", label: "14 days" },
      ]}
    />
  );

  if (workflow.stats.entered === 0) {
    return (
      <div className="rounded-card border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
        <h2 className="text-sm font-semibold">No analytics yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
          This workflow has not run. Publish it and the first contacts to enter
          will show up here within a few minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <KpiStrip items={kpis(workflow)} />
      <KpiStrip items={secondaryKpis(workflow)} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Runs over time"
          description="Contacts entering and completing the journey each day."
          action={periodControl}
          legend={[
            { label: "Entered", swatch: "bg-primary" },
            { label: "Completed", swatch: "bg-accent" },
          ]}
        >
          <TrendChart
            categories={categories}
            series={[
              { name: "Entered", data: slice(series.entered) },
              { name: "Completed", data: slice(series.completed) },
            ]}
            colors={BRAND_SERIES}
            unit="contacts"
            height={280}
          />
        </ChartCard>

        <ChartCard
          title="Conversion trend"
          description="Share of each day's entrants that reached the goal."
          legend={[{ label: "Conversion rate", swatch: "bg-primary" }]}
        >
          <TrendChart
            categories={categories}
            series={[{ name: "Conversion", data: slice(series.conversion) }]}
            colors={[CHART_COLORS.primary]}
            variant="line"
            format="percent"
            height={280}
          />
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard
          title="Channel performance"
          description="Messages sent and engaged with, per channel."
          className="xl:col-span-1"
          legend={[
            { label: "Sent", swatch: "bg-chart-neutral" },
            { label: "Engaged", swatch: "bg-primary" },
          ]}
        >
          <BarsChart
            categories={channels.map((item) => CHANNEL_THEME[item.channel].label)}
            series={[
              { name: "Sent", data: channels.map((item) => item.sent) },
              { name: "Engaged", data: channels.map((item) => item.engaged) },
            ]}
            colors={[CHART_COLORS.neutral, CHART_COLORS.primary]}
            height={260}
          />
        </ChartCard>

        <PanelCard
          title="Step-by-step performance"
          description="Where contacts move on, and where they stop."
          className="xl:col-span-2"
        >
          <ul className="space-y-1.5">
            {trunk.map((entry, index) => (
              <NodeAnalyticsRow
                key={entry.node.id}
                node={entry.node}
                depth={entry.depth}
                top={top}
                previous={trunk[index - 1]?.node.entered}
              />
            ))}
          </ul>
        </PanelCard>
      </div>

      <PanelCard
        title="Completion"
        description="Everyone who entered, by where they ended up."
      >
        <ul className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Completed the journey",
              value: workflow.stats.completed,
              tone: "bg-success",
            },
            {
              label: "Still running",
              value: workflow.stats.running,
              tone: "bg-warning",
            },
            { label: "Failed a step", value: workflow.stats.failed, tone: "bg-error" },
          ].map((item) => (
            <li
              key={item.label}
              className="rounded-panel border border-border px-3.5 py-3"
            >
              <p className="text-sm font-medium text-text-secondary">{item.label}</p>
              <p className="mt-1.5 text-xl leading-none font-bold text-text-primary tabular-nums">
                {formatCount(item.value)}
              </p>
              <ProgressBar
                value={rate(item.value, workflow.stats.entered)}
                label={item.label}
                tone={cn(item.tone)}
                className="mt-2.5"
              />
            </li>
          ))}
        </ul>
      </PanelCard>
    </div>
  );
}
