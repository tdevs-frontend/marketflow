import {
  AlertTriangle,
  Archive,
  Ban,
  CheckCircle2,
  CircleDashed,
  Clock,
  Loader,
  Pause,
  Pencil,
  Play,
  SkipForward,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CHANNEL_THEME } from "@/constants/channels";
import { executionLabel } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type { MarketingChannel } from "@/types/marketing";
import type {
  ExecutionStatus,
  TemplateComplexity,
  TriggerStatus,
  WorkflowStatus,
} from "@/types/workflow";
import { CHANNEL_ICON } from "./node-icon";

/**
 * Every state in the Automation module, as a badge.
 *
 * All of them pair a tone with an icon and a word. That is the accessibility
 * rule the brief asks for — status is never colour alone — and it is also what
 * makes a run log readable at speed: `Failed` and `Skipped` are both muted
 * reds at a glance, and the glyph is what separates them.
 */

interface StateStyle {
  tone: BadgeTone;
  icon: LucideIcon;
  label: string;
}

const WORKFLOW_STATE: Record<WorkflowStatus, StateStyle> = {
  active: { tone: "success", icon: Play, label: "Active" },
  draft: { tone: "neutral", icon: Pencil, label: "Draft" },
  paused: { tone: "warning", icon: Pause, label: "Paused" },
  error: { tone: "danger", icon: AlertTriangle, label: "Error" },
  archived: { tone: "neutral", icon: Archive, label: "Archived" },
};

export function WorkflowStatusBadge({
  status,
  className,
}: {
  status: WorkflowStatus;
  className?: string;
}) {
  const { tone, icon: Icon, label } = WORKFLOW_STATE[status];

  return (
    <Badge tone={tone} className={className}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

const EXECUTION_STATE: Record<ExecutionStatus, { tone: BadgeTone; icon: LucideIcon }> = {
  completed: { tone: "success", icon: CheckCircle2 },
  running: { tone: "info", icon: Loader },
  waiting: { tone: "warning", icon: Clock },
  queued: { tone: "neutral", icon: CircleDashed },
  failed: { tone: "danger", icon: XCircle },
  skipped: { tone: "neutral", icon: SkipForward },
  cancelled: { tone: "neutral", icon: Ban },
};

export function ExecutionStatusBadge({
  status,
  className,
}: {
  status: ExecutionStatus;
  className?: string;
}) {
  const { tone, icon: Icon } = EXECUTION_STATE[status];

  return (
    <Badge tone={tone} className={className}>
      <Icon className="size-3" aria-hidden />
      {executionLabel(status)}
    </Badge>
  );
}

/** The dot a timeline uses instead of a badge, where the word is already there. */
export function ExecutionDot({
  status,
  className,
}: {
  status: ExecutionStatus;
  className?: string;
}) {
  const { icon: Icon } = EXECUTION_STATE[status];
  const tone =
    status === "failed"
      ? "border-error bg-error-soft text-error"
      : status === "completed"
        ? "border-success bg-success-soft text-success-text"
        : status === "waiting" || status === "running"
          ? "border-warning bg-warning-soft text-warning-text"
          : "border-border-strong bg-surface-secondary text-text-muted";

  return (
    <span
      aria-hidden
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full border-2",
        tone,
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

const TRIGGER_STATE: Record<TriggerStatus, StateStyle> = {
  active: { tone: "success", icon: Play, label: "Active" },
  disabled: { tone: "neutral", icon: Pause, label: "Disabled" },
  beta: { tone: "info", icon: CircleDashed, label: "Beta" },
};

export function TriggerStatusBadge({ status }: { status: TriggerStatus }) {
  const { tone, icon: Icon, label } = TRIGGER_STATE[status];

  return (
    <Badge tone={tone}>
      <Icon className="size-3" aria-hidden />
      {label}
    </Badge>
  );
}

const COMPLEXITY_LABEL: Record<TemplateComplexity, string> = {
  starter: "Starter",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function ComplexityBadge({ level }: { level: TemplateComplexity }) {
  return (
    <Badge tone={level === "advanced" ? "warning" : "neutral"}>
      {COMPLEXITY_LABEL[level]}
    </Badge>
  );
}

/**
 * The channels a workflow or template sends on.
 *
 * Icon plus name, in the channel's own accent — the same treatment the
 * Marketing modules use, so a WhatsApp chip is the same object everywhere in
 * the product.
 */
export function ChannelChips({
  channels,
  size = "md",
  className,
}: {
  channels: MarketingChannel[];
  size?: "sm" | "md";
  className?: string;
}) {
  if (channels.length === 0) {
    return <span className="text-xs text-text-muted">—</span>;
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {channels.map((channel) => {
        const theme = CHANNEL_THEME[channel];
        const Icon = CHANNEL_ICON[channel];

        return (
          <span
            key={channel}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
              size === "sm" ? "text-xs" : "text-xs",
              theme.soft,
              theme.text,
            )}
          >
            <Icon className={size === "sm" ? "size-2.5" : "size-3"} aria-hidden />
            {theme.label}
          </span>
        );
      })}
    </span>
  );
}

/** The dotted event key, wherever one is shown. */
export function EventKey({ value, className }: { value: string; className?: string }) {
  return (
    <code
      className={cn(
        "rounded-btn bg-surface-secondary px-1.5 py-0.5 font-mono text-xs text-text-secondary",
        className,
      )}
    >
      {value}
    </code>
  );
}
