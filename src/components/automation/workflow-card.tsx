"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Copy,
  Pause,
  Pencil,
  Play,
  SquareArrowOutUpRight,
  Trash2,
  Zap,
} from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Menu } from "@/components/ui/menu";
import { Tooltip } from "@/components/ui/tooltip";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { ownerName } from "@/lib/customer-fixtures";
import { formatCount, formatPercent, formatRelativeTime, rate } from "@/lib/format";
import { conversionRate } from "@/lib/workflow-fixtures";
import type { Workflow } from "@/types/workflow";
import { ChannelChips, WorkflowStatusBadge } from "./automation-badges";
import { WorkflowMiniMap, workflowPreview } from "./workflow-mini-map";

export interface WorkflowCardActions {
  onDuplicate: (workflow: Workflow) => void;
  onToggleStatus: (workflow: Workflow) => void;
  onRename: (workflow: Workflow) => void;
  onArchive: (workflow: Workflow) => void;
  onDelete: (workflow: Workflow) => void;
}

/** The row-actions menu, shared by the card and the table so they never drift. */
export function workflowMenuItems(
  workflow: Workflow,
  actions: WorkflowCardActions,
  open: () => void,
) {
  const running = workflow.status === "active";

  return [
    {
      label: "Open",
      icon: <SquareArrowOutUpRight className="size-4" />,
      onSelect: open,
    },
    {
      label: "Duplicate",
      icon: <Copy className="size-4" />,
      onSelect: () => actions.onDuplicate(workflow),
    },
    {
      label: running ? "Pause" : "Activate",
      icon: running ? <Pause className="size-4" /> : <Play className="size-4" />,
      onSelect: () => actions.onToggleStatus(workflow),
      disabled: workflow.status === "archived",
    },
    {
      label: "Rename",
      icon: <Pencil className="size-4" />,
      onSelect: () => actions.onRename(workflow),
    },
    {
      label: "Archive",
      icon: <Archive className="size-4" />,
      onSelect: () => actions.onArchive(workflow),
      disabled: workflow.status === "archived",
    },
    {
      label: "Delete",
      icon: <Trash2 className="size-4" />,
      onSelect: () => actions.onDelete(workflow),
      destructive: true,
    },
  ];
}

/**
 * One workflow, as a card.
 *
 * The mini-map is the point of this card: it answers "what does this
 * automation actually do" without an open, which a name and a status badge
 * cannot. Everything else is the three numbers that decide whether it is worth
 * opening — how many entered, how many converted, and the rate between them.
 *
 * The status is a subtle badge, never a coloured card. Seventeen of these in a
 * grid, each tinted by state, is a dashboard nobody can read.
 */
export function WorkflowCard({
  workflow,
  actions,
}: {
  workflow: Workflow;
  actions: WorkflowCardActions;
}) {
  const router = useRouter();
  const href = AUTOMATION_ROUTES.workflow(workflow.id);
  const { entered, running } = workflow.stats;

  return (
    <Card className="flex h-full flex-col p-4" interactive>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1.5">
          <Link
            href={href}
            className="block truncate rounded-btn text-sm font-semibold text-text-primary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
          >
            {workflow.name}
          </Link>
          <span className="flex flex-wrap items-center gap-1.5">
            <WorkflowStatusBadge status={workflow.status} />
            <span className="inline-flex items-center gap-1 text-[11px] text-text-muted">
              <Zap className="size-3" aria-hidden />
              {workflow.triggerLabel}
            </span>
          </span>
        </div>

        <Menu
          items={workflowMenuItems(workflow, actions, () => router.push(href))}
          label={`Actions for ${workflow.name}`}
        />
      </div>

      <p className="mt-2.5 line-clamp-2 text-xs text-text-secondary">
        {workflow.description}
      </p>

      <WorkflowMiniMap steps={workflowPreview(workflow)} className="mt-3" />

      <div className="mt-3 flex items-center justify-between gap-2">
        <ChannelChips channels={workflow.channels} size="sm" />
        <span className="text-[11px] text-text-muted">
          {workflow.nodes.length} steps
        </span>
      </div>

      {/* Active, entered, conversion. The first is what is happening now, the
          second is the scale it has run at, the third is whether it works —
          three questions, and nothing on the card that answers none of them. */}
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <dt className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
            Active
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
            {formatCount(running)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
            Entered
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-text-primary tabular-nums">
            {formatCount(entered)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
            Conversion
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-primary tabular-nums">
            {formatPercent(conversionRate(workflow))}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <p className="truncate text-[11px] text-text-muted">
          Edited {formatRelativeTime(workflow.updatedAt)}
        </p>
        <Tooltip content={ownerName(workflow.ownerId)}>
          <span tabIndex={0} className="rounded-full focus-visible:shadow-focus focus-visible:outline-none">
            <Avatar name={ownerName(workflow.ownerId)} size="xs" />
          </span>
        </Tooltip>
      </div>
    </Card>
  );
}

/** The completion figure the table shows — a share of everyone who entered. */
export const completionRate = (workflow: Workflow) =>
  rate(workflow.stats.completed, workflow.stats.entered);
