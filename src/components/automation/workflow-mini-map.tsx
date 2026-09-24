import { ChevronDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { NODE_META } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type { TemplateStep, Workflow } from "@/types/workflow";
import { NodeIcon } from "./node-icon";

/**
 * The small flow diagram on a workflow or template card.
 *
 * It exists because a list of workflow *names* tells you nothing - "Order
 * Journey" could be one message or nine - and the shape of the journey is the
 * single most useful thing a card can carry. Four trunk steps and, where there
 * is one, the fork: past that a card stops being scannable and the reader
 * should open the builder instead.
 *
 * Deliberately not the canvas at small scale. A zoomed-out canvas is
 * unreadable at 200px wide; this is its own diagram, drawn from the same
 * nodes.
 */

/** Flattens a workflow graph into the trunk, plus its first fork. */
export function workflowPreview(workflow: Workflow, max = 4): TemplateStep[] {
  const byId = new Map(workflow.nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, typeof workflow.edges>();
  for (const edge of workflow.edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  }

  const start = workflow.nodes.find((node) => node.kind === "trigger") ?? workflow.nodes[0];
  const steps: TemplateStep[] = [];
  let current = start;

  while (current && steps.length < max) {
    const branches = current.branches;

    if (branches?.length) {
      steps.push({
        kind: current.kind,
        title: current.title,
        summary: current.summary,
        branches: [branches[0].label, branches[1]?.label ?? "Otherwise"],
      });
      break;
    }

    steps.push({ kind: current.kind, title: current.title, summary: current.summary });

    const next = outgoing.get(current.id)?.[0];
    const following = next ? byId.get(next.to) : undefined;
    if (!following) break;
    current = following;
  }

  return steps;
}

function Pill({ step }: { step: TemplateStep }) {
  return (
    <span className="flex w-full min-w-0 items-center gap-2 rounded-btn border border-border bg-surface px-2 py-1.5">
      <NodeIcon kind={step.kind} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
        {step.title}
      </span>
    </span>
  );
}

function Connector() {
  return (
    <span aria-hidden className="relative flex h-3 w-full items-center justify-center">
      <span className="absolute inset-y-0 w-px bg-border" />
      <ChevronDown className="relative size-3 bg-surface text-border-strong" />
    </span>
  );
}

export function WorkflowMiniMap({
  steps,
  className,
}: {
  steps: TemplateStep[];
  className?: string;
}) {
  if (steps.length === 0) {
    return (
      <p className={cn("text-sm text-text-muted", className)}>
        No steps yet - open the builder to add the first one.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-panel border border-border bg-surface-secondary/60 p-3",
        className,
      )}
    >
      {steps.map((step, index) => (
        <div key={`${step.title}-${index}`} className="flex w-full flex-col items-center">
          {index > 0 ? <Connector /> : null}
          <Pill step={step} />

          {step.branches ? (
            <>
              <Connector />
              <div className="grid w-full grid-cols-2 gap-2">
                {step.branches.map((label) => (
                  <span
                    key={label}
                    className="truncate rounded-btn border border-dashed border-border-strong bg-surface px-2 py-1 text-center text-sm font-medium text-text-secondary"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * The same diagram laid out horizontally, for the template preview page where
 * there is width to spend and the whole journey should be visible at once.
 */
export function WorkflowMiniMapRow({
  steps,
  className,
}: {
  steps: TemplateStep[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-wrap items-stretch gap-2", className)}>
      {steps.map((step, index) => (
        <li
          key={`${step.title}-${index}`}
          className="flex min-w-40 flex-1 flex-col gap-2 rounded-panel border border-border bg-surface p-3"
        >
          <div className="flex items-center gap-2">
            <NodeIcon kind={step.kind} size="sm" />
            <span className="text-sm font-medium text-text-muted">
              {NODE_META[step.kind]?.label ?? "Step"}
            </span>
          </div>
          <p className="text-sm font-semibold text-text-primary">{step.title}</p>
          {step.summary ? (
            <p className="text-sm text-text-muted">{step.summary}</p>
          ) : null}
          {step.branches ? (
            <div className="mt-auto flex flex-wrap gap-1 pt-1">
              {step.branches.map((label) => (
                <Badge key={label} variant="dashed" casing="none" className="px-2">
                  {label}
                </Badge>
              ))}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
