"use client";

import { ChevronDown, Plus } from "lucide-react";

import { Icon } from "@/components/ui/icon";
import { CHANNEL_THEME } from "@/constants/channels";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { FlowStep, FlowStepType } from "@/types/automation";

/**
 * One step in an automation, and the connectors between steps.
 *
 * The node types are told apart by shape and border rather than by colour
 * alone: a trigger is filled, a condition has a dashed border and a fork
 * beneath it, a delay is a narrow pill, and actions are plain cards. That
 * survives being printed, being colour-blind, and being scanned at speed —
 * three things a colour-coded flow chart does not.
 */

const TYPE_STYLE: Record<
  FlowStepType,
  { border: string; tile: string; label: string }
> = {
  trigger: {
    border: "border-primary bg-primary-soft",
    tile: "bg-primary text-white",
    label: "Trigger",
  },
  action: {
    border: "border-border bg-surface",
    tile: "bg-surface-secondary text-text-secondary",
    label: "Action",
  },
  condition: {
    /* Dashed, because a condition is the one node that does not simply pass
       everyone through to the next step. */
    border: "border-dashed border-warning/60 bg-warning-soft/40",
    tile: "bg-warning-soft text-warning-text",
    label: "Condition",
  },
  delay: {
    border: "border-border bg-surface-secondary",
    tile: "bg-surface text-text-muted",
    label: "Delay",
  },
  goal: {
    border: "border-primary-border bg-primary-subtle",
    tile: "bg-primary-soft text-primary",
    label: "Goal",
  },
};

/** The vertical rule between two nodes. */
export function FlowConnector({
  label,
  className,
}: {
  /** Branch name, drawn on a chip over the line. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("relative flex h-6 items-center justify-center", className)}
    >
      <span className="absolute inset-y-0 w-px bg-border" />
      {label ? (
        <span className="relative rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted">
          {label}
        </span>
      ) : (
        <ChevronDown className="relative size-3.5 bg-surface text-border-strong" />
      )}
    </div>
  );
}

/**
 * A single node.
 *
 * `entered` is the honest measure of a step — how many contacts got this far —
 * and it is what makes a flow diagram diagnostic rather than decorative: the
 * step where the count falls off a cliff is the step to fix.
 */
export function AutomationNode({
  step,
  selected = false,
  onSelect,
  className,
}: {
  step: FlowStep;
  selected?: boolean;
  onSelect?: (step: FlowStep) => void;
  className?: string;
}) {
  const style = TYPE_STYLE[step.type];
  const channel = step.channel ? CHANNEL_THEME[step.channel] : undefined;
  const interactive = Boolean(onSelect);

  const Element = interactive ? "button" : "div";

  return (
    <Element
      {...(interactive
        ? {
            type: "button" as const,
            onClick: () => onSelect?.(step),
            "aria-pressed": selected,
          }
        : {})}
      className={cn(
        "flex w-full items-center gap-3 rounded-panel border px-3.5 text-left transition-all",
        step.type === "delay" ? "py-2" : "py-3",
        style.border,
        interactive &&
          "hover:border-border-strong hover:shadow-card focus-visible:shadow-focus focus-visible:outline-none",
        selected && "border-primary shadow-focus",
        className,
      )}
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-btn",
          step.type === "delay" ? "size-7" : "size-9",
          /* A sending step takes its channel's colour; everything else takes
             its node type's, so the flow reads channel-first where it matters. */
          channel ? cn(channel.soft, channel.text) : style.tile,
        )}
      >
        <Icon name={step.icon} className={step.type === "delay" ? "size-3.5" : "size-4"} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              "font-medium text-text-primary",
              step.type === "delay" ? "text-[13px]" : "text-sm",
            )}
          >
            {step.title}
          </span>
          <span className="text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
            {style.label}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-text-secondary">
          {step.detail}
        </span>
      </span>

      {typeof step.entered === "number" && step.entered > 0 ? (
        <span className="shrink-0 text-right">
          <span className="block text-[13px] font-bold text-text-primary tabular-nums">
            {formatNumber(step.entered)}
          </span>
          <span className="block text-[10px] text-text-muted">reached</span>
        </span>
      ) : null}
    </Element>
  );
}

/**
 * A step and everything below it, recursing through a condition's branches.
 *
 * Branches render as side-by-side columns from `md` and stack below it — two
 * 200px columns on a phone are unreadable, and a flow is still legible read
 * top to bottom as "if replied … otherwise …".
 */
export function FlowBranch({
  steps,
  selectedId,
  onSelect,
  depth = 0,
}: {
  steps: FlowStep[];
  selectedId?: string;
  onSelect?: (step: FlowStep) => void;
  depth?: number;
}) {
  return (
    <div>
      {steps.map((step, index) => (
        <div key={step.id}>
          {index > 0 ? <FlowConnector /> : null}

          <AutomationNode
            step={step}
            selected={step.id === selectedId}
            onSelect={onSelect}
          />

          {step.branches?.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {step.branches.map((branch) => (
                <div key={branch.label}>
                  <FlowConnector label={branch.label} />
                  {/* The rail makes the nesting visible without indenting the
                      nodes themselves, which would shrink them at each level. */}
                  <div
                    className={cn(
                      "border-l-2 pl-3",
                      branch.label.toLowerCase().startsWith("no") ||
                        branch.label.toLowerCase().includes("not") ||
                        branch.label.toLowerCase().includes("still") ||
                        branch.label.toLowerCase().includes("ignored")
                        ? "border-border"
                        : "border-primary-border",
                    )}
                  >
                    <FlowBranch
                      steps={branch.steps}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      depth={depth + 1}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** The "add a step here" affordance between nodes, in edit mode. */
export function AddStepSlot({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="relative flex h-8 items-center justify-center">
      <span aria-hidden className="absolute inset-y-0 w-px bg-border" />
      <button
        type="button"
        onClick={onAdd}
        className="relative grid size-6 place-items-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <Plus className="size-3.5" aria-hidden />
        <span className="sr-only">Add a step here</span>
      </button>
    </div>
  );
}
