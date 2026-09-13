"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Info } from "lucide-react";

import { NODE_META } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type { ValidationIssue, WorkflowEdge, WorkflowNode } from "@/types/workflow";

/**
 * What has to be true before a workflow can be published.
 *
 * A pure function over the graph, so the same rules run on every keystroke in
 * the builder and again at publish time. The distinction between `error` and
 * `warning` is doing real work: errors block publishing because sending is
 * impossible without them, warnings do not because "this branch just ends" is
 * sometimes exactly what was meant.
 *
 * A summary that still reads "No template selected" is how an unconfigured
 * node is detected. That is deliberate: the summary is what the node shows the
 * reader, so anything the validator complains about is something they can see
 * on the canvas without opening the inspector.
 */
const UNSET = /^(no |not configured|choose |none)/i;

export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const triggers = nodes.filter((node) => node.kind === "trigger");

  if (triggers.length === 0) {
    issues.push({
      id: "no-trigger",
      severity: "error",
      message: "This workflow has no trigger",
      fix: "Add a Trigger node — nothing can enter without one.",
    });
  }

  if (triggers.length > 1) {
    issues.push({
      id: "many-triggers",
      severity: "error",
      nodeId: triggers[1].id,
      message: "More than one trigger",
      fix: "A workflow has a single entry point. Remove the extra trigger.",
    });
  }

  const incoming = new Set(edges.map((edge) => edge.to));
  const outgoing = new Map<string, WorkflowEdge[]>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  }

  for (const node of nodes) {
    const meta = NODE_META[node.kind];
    const unset = !node.summary || UNSET.test(node.summary);

    if (node.kind !== "trigger" && !incoming.has(node.id)) {
      issues.push({
        id: `${node.id}-orphan`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} is not connected`,
        fix: "Drag it under a step so contacts can reach it.",
      });
    }

    if (meta?.category === "messaging" && unset) {
      issues.push({
        id: `${node.id}-template`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} has no message template`,
        fix: "Open the node and choose the template it should send.",
      });
    }

    if (
      node.kind === "send_whatsapp" &&
      !unset &&
      !node.config.connection
    ) {
      issues.push({
        id: `${node.id}-connection`,
        severity: "warning",
        nodeId: node.id,
        message: `${node.title} has no WhatsApp connection`,
        fix: "Pick which connected number sends it, or the workspace default is used.",
      });
    }

    if ((node.kind === "condition" || node.kind === "if_else") && unset) {
      issues.push({
        id: `${node.id}-condition`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} has no rule`,
        fix: "Set the field, operator and value the branch is decided on.",
      });
    }

    if (node.branches?.length) {
      const taken = new Set(
        (outgoing.get(node.id) ?? []).map((edge) => edge.branchId),
      );
      const empty = node.branches.filter((branch) => !taken.has(branch.id));

      if (empty.length > 0) {
        issues.push({
          id: `${node.id}-branch`,
          severity: "error",
          nodeId: node.id,
          message: `${node.title} has an empty branch (${empty
            .map((branch) => branch.label)
            .join(", ")})`,
          fix: "Add a step to the branch, or remove it.",
        });
      }
    }

    if (
      meta?.category === "crm" ||
      node.kind === "webhook" ||
      node.kind === "notify" ||
      node.kind === "custom_event"
    ) {
      if (unset) {
        issues.push({
          id: `${node.id}-unconfigured`,
          severity: "error",
          nodeId: node.id,
          message: `${node.title} is not configured`,
          fix: "Open the node and fill in what it should act on.",
        });
      }
    }

    if (
      node.kind !== "end" &&
      !node.branches?.length &&
      (outgoing.get(node.id) ?? []).length === 0
    ) {
      issues.push({
        id: `${node.id}-dead-end`,
        severity: "warning",
        nodeId: node.id,
        message: `Nothing follows ${node.title}`,
        fix: "Add an End Workflow step so the exit is explicit.",
      });
    }
  }

  return issues;
}

export const countErrors = (issues: ValidationIssue[]) =>
  issues.filter((issue) => issue.severity === "error").length;

/**
 * The validation state, as a disclosure rather than a banner.
 *
 * Collapsed it is one line — "Workflow has 2 issues" — because that is all the
 * reader needs while they are building. Expanded, every issue names its node
 * and what to do about it, and selecting one moves the canvas selection there,
 * which is the only thing anybody wants to do with a validation message.
 */
export function WorkflowValidator({
  issues,
  onSelectNode,
  className,
}: {
  issues: ValidationIssue[];
  onSelectNode?: (nodeId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const errors = countErrors(issues);
  const warnings = issues.length - errors;

  const tone =
    errors > 0
      ? "border-error/40 bg-error-soft/50 text-error-text"
      : warnings > 0
        ? "border-warning/40 bg-warning-soft/50 text-warning-text"
        : "border-success/40 bg-success-soft/50 text-success-text";

  const Icon = errors > 0 ? AlertTriangle : warnings > 0 ? Info : CheckCircle2;

  const summary =
    errors > 0
      ? `${errors} ${errors === 1 ? "issue blocks" : "issues block"} publishing`
      : warnings > 0
        ? `${warnings} ${warnings === 1 ? "suggestion" : "suggestions"}`
        : "Ready to publish";

  return (
    <div className={cn("rounded-panel border", tone, className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        disabled={issues.length === 0}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-medium focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-default"
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        {issues.length > 0 ? (
          <ChevronDown
            className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        ) : null}
      </button>

      {open && issues.length > 0 ? (
        <ul className="space-y-1 border-t border-current/15 p-2">
          {issues.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                disabled={!issue.nodeId || !onSelectNode}
                onClick={() => issue.nodeId && onSelectNode?.(issue.nodeId)}
                className="flex w-full items-start gap-2 rounded-btn bg-surface/80 px-2.5 py-2 text-left transition-colors hover:bg-surface focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-default"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    issue.severity === "error" ? "bg-error" : "bg-warning",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-text-primary">
                    {issue.message}
                  </span>
                  <span className="block text-[11px] text-text-muted">{issue.fix}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
