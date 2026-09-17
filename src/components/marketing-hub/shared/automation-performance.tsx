import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Gauge,
  Play,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress";
import { formatCount, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Workflow as WorkflowRecord } from "@/types/workflow";

/* -------------------------------------------------------------------------- */
/* Derivation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Everything this panel shows, read off the workflow records themselves.
 *
 * Derived rather than handed a pre-aggregated fixture so the four headline
 * figures, the pipeline and the per-flow rows cannot disagree: they are one
 * set of workflows summed three ways. The only inputs that are not derivable
 * are the period-over-period changes, which a single snapshot cannot produce.
 */
export interface AutomationSummary {
  activeFlows: number;
  entered: number;
  completed: number;
  converted: number;
  /** Share of entrants that finished the journey. */
  completionRate: number;
  flows: {
    id: string;
    name: string;
    entered: number;
    completionRate: number;
    status: WorkflowRecord["status"];
  }[];
}

export function summariseAutomations(
  workflows: WorkflowRecord[],
  limit = 3,
): AutomationSummary {
  const live = workflows.filter((item) => item.stats.entered > 0);

  const entered = live.reduce((sum, item) => sum + item.stats.entered, 0);
  const completed = live.reduce((sum, item) => sum + item.stats.completed, 0);
  const converted = live.reduce((sum, item) => sum + item.stats.converted, 0);

  const rateOf = (item: WorkflowRecord) =>
    item.stats.entered === 0
      ? 0
      : (item.stats.completed / item.stats.entered) * 100;

  return {
    activeFlows: workflows.filter((item) => item.status === "active").length,
    entered,
    completed,
    converted,
    completionRate: entered === 0 ? 0 : (completed / entered) * 100,
    flows: [...live]
      .sort((a, b) => rateOf(b) - rateOf(a))
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        name: item.name,
        entered: item.stats.entered,
        completionRate: rateOf(item),
        status: item.status,
      })),
  };
}

/* -------------------------------------------------------------------------- */
/* Pieces                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * One of the four headline blocks.
 *
 * Deliberately not the dashboard's `StatsGrid` card. That component is a card
 * in its own right — white ground, its own border and shadow — and four of
 * them nested inside a panel would be cards inside a card. These share one
 * tinted ground instead, so the block reads as a single instrument panel and
 * the surrounding card stays the only card.
 */
function MetricBlock({
  label,
  value,
  change,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  /** Signed. Omitted where there is no prior period to compare against. */
  change?: number;
  icon: LucideIcon;
  /** Text utility for the icon. */
  tone: string;
}) {
  const rising = (change ?? 0) >= 0;
  const TrendIcon = rising ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="rounded-panel bg-surface-secondary px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-sm font-medium text-text-secondary">
        <Icon className={cn("size-3.5 shrink-0", tone)} aria-hidden />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1.5 text-xl leading-none font-bold text-text-primary tabular-nums">
        {value}
      </p>
      {change === undefined ? null : (
        <p
          className={cn(
            "mt-1.5 inline-flex items-center gap-0.5 text-meta font-medium tabular-nums",
            rising ? "text-primary" : "text-error",
          )}
        >
          <TrendIcon className="size-3" aria-hidden />
          {Math.abs(change).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

/**
 * The journey as three stages, each measured against the one before it.
 *
 * A rail rather than a funnel drawing: the merchant overview already owns a
 * tapering five-stage funnel, and a second taper on this page would read as
 * the same widget twice however different its stages were. Here each stage is
 * a bar of its own share, the step between two stages carries the drop-off,
 * and the whole thing is three rows tall so it can sit in a half-width panel.
 */
function PipelineStage({
  label,
  value,
  share,
  tone,
  dropOff,
}: {
  label: string;
  value: number;
  /** 0–100, against the first stage. */
  share: number;
  tone: string;
  /** Contacts lost since the previous stage. Absent on the first. */
  dropOff?: number;
}) {
  return (
    <li>
      {dropOff === undefined ? null : (
        <p className="py-1 pl-3 text-meta font-medium text-text-muted">
          ↓ {formatNumber(dropOff)} did not continue
        </p>
      )}
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-medium text-text-secondary">
          {label}
        </p>
        <p className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
          {formatNumber(value)}
          <span className="ml-1.5 font-medium text-text-muted">
            {formatPercent(share)}
          </span>
        </p>
      </div>
      <ProgressBar
        value={share}
        label={`${label} share of entrants`}
        tone={tone}
        className="mt-1.5"
      />
    </li>
  );
}

/** A flow's own state, as the badge beside its name. */
const FLOW_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  active: { label: "Live", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  error: { label: "Error", tone: "danger" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
};

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Automation analytics for the Marketing workspace.
 *
 * Three readings of one set of workflows, in the order a question about
 * automation gets asked: how much is running (the four blocks), where the
 * contacts inside it are getting to (the pipeline), and which individual flows
 * are carrying it (the rows).
 *
 * The violet is the automation module's own hue, used only on the pipeline
 * bars and the flow bars — the card stays white, the blocks stay on the
 * neutral tint, and the only other colour is whatever a flow's status badge
 * brings.
 */
export function AutomationPerformance({
  summary,
  hrefFor,
  changes,
}: {
  summary: AutomationSummary;
  /** Where a flow row links. Omit for a read-only panel. */
  hrefFor?: (flowId: string) => string;
  /** Period-over-period movement, which no snapshot can derive. */
  changes?: { entered?: number; completed?: number; completionRate?: number };
}) {
  const { entered, completed, converted } = summary;
  const share = (value: number) => (entered === 0 ? 0 : (value / entered) * 100);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricBlock
          label="Active Flows"
          value={formatNumber(summary.activeFlows)}
          icon={Workflow}
          tone="text-sms"
        />
        <MetricBlock
          label="Triggered"
          value={formatCount(entered)}
          change={changes?.entered}
          icon={Play}
          tone="text-primary"
        />
        <MetricBlock
          label="Completed"
          value={formatCount(completed)}
          change={changes?.completed}
          icon={CheckCircle2}
          tone="text-success"
        />
        <MetricBlock
          label="Success Rate"
          value={formatPercent(summary.completionRate)}
          change={changes?.completionRate}
          icon={Gauge}
          tone="text-info"
        />
      </div>

      <ul className="space-y-1">
        <PipelineStage
          label="Entered a journey"
          value={entered}
          share={100}
          tone="bg-sms"
        />
        <PipelineStage
          label="Completed the journey"
          value={completed}
          share={share(completed)}
          tone="bg-primary"
          dropOff={entered - completed}
        />
        <PipelineStage
          label="Converted"
          value={converted}
          share={share(converted)}
          tone="bg-success"
          dropOff={completed - converted}
        />
      </ul>

      <div className="border-t border-border pt-4">
        <p className="text-sm font-semibold text-text-primary">
          Best completing flows
        </p>

        <ul className="mt-3 space-y-3">
          {summary.flows.map((flow) => {
            const status = FLOW_STATUS[flow.status] ?? FLOW_STATUS.draft;
            const href = hrefFor?.(flow.id);

            const body = (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm font-semibold text-text-primary">
                      {flow.name}
                    </span>
                    <Badge tone={status.tone} size="sm" className="shrink-0">
                      {status.label}
                    </Badge>
                  </p>
                  <span className="shrink-0 text-sm font-bold text-text-primary tabular-nums">
                    {formatPercent(flow.completionRate)}
                  </span>
                </div>
                <ProgressBar
                  value={flow.completionRate}
                  label={`${flow.name} completion rate`}
                  tone="bg-sms"
                  size="sm"
                  className="mt-1.5"
                />
                <p className="mt-1 text-sm text-text-muted tabular-nums">
                  {formatNumber(flow.entered)} entered
                </p>
              </>
            );

            return (
              <li key={flow.id}>
                {href ? (
                  <Link
                    href={href}
                    className="-mx-2 block rounded-panel px-2 py-1.5 transition-colors hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
