"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Info, Lightbulb } from "lucide-react";

import { NODE_META } from "@/constants/automation";
import { cn } from "@/lib/utils";
import type {
  ValidationIssue,
  ValidationSeverity,
  WorkflowEdge,
  WorkflowNode,
} from "@/types/workflow";
import { missingTokens } from "./variables";

/**
 * What has to be true before a workflow can be published.
 *
 * A pure function over the graph, so the same rules run on every keystroke in
 * the builder and again at publish time.
 *
 * Three severities, and the distinction is doing real work. An `error` makes
 * the workflow impossible to run and blocks publishing — a message node with
 * no template will fail on its first contact, and finding that out from the
 * Activity log is the worst possible way to find it out. A `warning` will
 * probably bite but might be deliberate. A `recommendation` is advice about
 * the journey rather than a defect in it; collapsing it into "warning" is how
 * a validation panel becomes noise nobody reads.
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

  if (nodes.length <= 1) {
    issues.push({
      id: "no-steps",
      severity: "error",
      message: "This workflow has no steps",
      fix: "Add at least one action after the trigger.",
    });
  }

  const incoming = new Set(edges.map((edge) => edge.to));
  const outgoing = new Map<string, WorkflowEdge[]>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  }

  let hasEnd = false;

  for (const node of nodes) {
    const meta = NODE_META[node.kind];
    const unset = !node.summary || UNSET.test(node.summary);
    const leaves = outgoing.get(node.id) ?? [];

    if (node.kind === "end") hasEnd = true;

    /* ------------------------------------------------------------- Errors */

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
        message: `${node.title} has no message ${
          node.kind === "send_sms" ? "text" : "template"
        }`,
        fix: "Open the node and choose what it should send.",
      });
    }

    if (meta?.category === "messaging" && !unset) {
      const missing = missingTokens(node);
      if (missing.length > 0) {
        issues.push({
          id: `${node.id}-variables`,
          severity: "error",
          nodeId: node.id,
          message: `${node.title} has ${missing.length} unmapped variable${
            missing.length === 1 ? "" : "s"
          } (${missing.map((token) => `{{${token}}}`).join(", ")})`,
          fix: "Map every token in the Variables section, or the message sends with the raw token in it.",
        });
      }
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

    if (node.kind === "wait" && !node.config.duration) {
      issues.push({
        id: `${node.id}-delay`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} has no duration`,
        fix: "Set how long the contact should wait here.",
      });
    }

    if (meta?.category === "wait" && node.kind !== "wait" && unset) {
      issues.push({
        id: `${node.id}-wait`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} has nothing to wait for`,
        fix: "Choose the date, time, event or condition it waits on.",
      });
    }

    if (node.kind === "webhook" && !node.config.url) {
      issues.push({
        id: `${node.id}-url`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} has no endpoint URL`,
        fix: "Add the URL this step should POST to.",
      });
    }

    if (
      (meta?.category === "crm" ||
        meta?.category === "marketing" ||
        node.kind === "api_action" ||
        node.kind === "custom_event") &&
      unset
    ) {
      issues.push({
        id: `${node.id}-unconfigured`,
        severity: "error",
        nodeId: node.id,
        message: `${node.title} is not configured`,
        fix: "Open the node and fill in what it should act on.",
      });
    }

    if (node.branches?.length) {
      const taken = new Set(leaves.map((edge) => edge.branchId));
      const empty = node.branches.filter((branch) => !taken.has(branch.id));

      if (empty.length > 0) {
        issues.push({
          id: `${node.id}-branch`,
          severity: "error",
          nodeId: node.id,
          message: `${node.title} has an empty branch (${empty
            .map((branch) => branch.label)
            .join(", ")})`,
          fix: "Add a step to the branch, or remove the branch.",
        });
      }
    }

    /* ----------------------------------------------------------- Warnings */

    if (node.kind === "send_whatsapp" && !unset && !node.config.connection) {
      issues.push({
        id: `${node.id}-connection`,
        severity: "warning",
        nodeId: node.id,
        message: `${node.title} has no WhatsApp connection`,
        fix: "Pick which connected number sends it, or the workspace default is used.",
      });
    }

    if (node.kind === "wait_until_event" && !node.config.timeout) {
      issues.push({
        id: `${node.id}-timeout`,
        severity: "warning",
        nodeId: node.id,
        message: `${node.title} waits forever`,
        fix: "Set a timeout so contacts who never reply still leave the journey.",
      });
    }

    if (node.kind !== "end" && !node.branches?.length && leaves.length === 0) {
      issues.push({
        id: `${node.id}-dead-end`,
        severity: "warning",
        nodeId: node.id,
        message: `Nothing follows ${node.title}`,
        fix: "Add an End Workflow step so the exit is explicit.",
      });
    }

    /* ---------------------------------------------------- Recommendations */

    if (node.kind === "split" && !node.config.sticky) {
      issues.push({
        id: `${node.id}-sticky`,
        severity: "recommendation",
        nodeId: node.id,
        message: `${node.title} can show a contact both variants`,
        fix: "Turn on sticky assignment so a re-entering contact stays on one side of the test.",
      });
    }
  }

  const waits = nodes.filter((node) => NODE_META[node.kind]?.category === "wait");
  const sends = nodes.filter((node) => NODE_META[node.kind]?.category === "messaging");

  if (sends.length > 1 && waits.length === 0) {
    issues.push({
      id: "no-waits",
      severity: "recommendation",
      message: "Several messages send back to back",
      fix: "Add a Wait between them — two messages in the same second reads as a bug to the customer.",
    });
  }

  if (!hasEnd && nodes.length > 2) {
    issues.push({
      id: "no-end",
      severity: "recommendation",
      message: "This workflow has no End step",
      fix: "An explicit End makes it obvious where the journey finishes, and where the goal is measured.",
    });
  }

  return issues;
}

export const countBySeverity = (
  issues: ValidationIssue[],
  severity: ValidationSeverity,
) => issues.filter((issue) => issue.severity === severity).length;

export const countErrors = (issues: ValidationIssue[]) =>
  countBySeverity(issues, "error");

/* -------------------------------------------------------------------------- */
/* Panel                                                                      */
/* -------------------------------------------------------------------------- */

const SEVERITY_DOT: Record<ValidationSeverity, string> = {
  error: "bg-error",
  warning: "bg-warning",
  recommendation: "bg-info",
};

const SEVERITY_LABEL: Record<ValidationSeverity, string> = {
  error: "Error",
  warning: "Warning",
  recommendation: "Recommendation",
};

/**
 * The validation state, as a disclosure rather than a banner.
 *
 * Collapsed it is one line, because that is all a reader needs while they are
 * building. Expanded, every issue names its node and what to do about it, and
 * selecting one moves the canvas selection there — which is the only thing
 * anybody ever wants to do with a validation message.
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

  const errors = countBySeverity(issues, "error");
  const warnings = countBySeverity(issues, "warning");
  const tips = countBySeverity(issues, "recommendation");

  const tone =
    errors > 0
      ? "border-error/40 bg-error-soft/60 text-error-text"
      : warnings > 0
        ? "border-warning/40 bg-warning-soft/60 text-warning-text"
        : tips > 0
          ? "border-info/40 bg-info-soft/60 text-info-text"
          : "border-success/40 bg-success-soft/60 text-success-text";

  const Icon =
    errors > 0 ? AlertTriangle : warnings > 0 ? Info : tips > 0 ? Lightbulb : CheckCircle2;

  const summary =
    errors > 0
      ? `${errors} ${errors === 1 ? "issue blocks" : "issues block"} publishing`
      : warnings > 0
        ? `${warnings} ${warnings === 1 ? "warning" : "warnings"}`
        : tips > 0
          ? `${tips} ${tips === 1 ? "recommendation" : "recommendations"}`
          : "Ready to publish";

  /* Errors first, then warnings, then advice — the order they should be dealt
     with, which is not the order the graph happens to be walked in. */
  const ordered = [...issues].sort((a, b) => {
    const rank = { error: 0, warning: 1, recommendation: 2 } as const;
    return rank[a.severity] - rank[b.severity];
  });

  return (
    <div className={cn("rounded-panel border backdrop-blur", tone, className)}>
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
          <>
            {errors > 0 && (warnings > 0 || tips > 0) ? (
              <span className="text-[11px] opacity-80 tabular-nums">
                +{warnings + tips} more
              </span>
            ) : null}
            <ChevronDown
              className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </>
        ) : null}
      </button>

      {open && issues.length > 0 ? (
        <ul className="max-h-64 space-y-1 overflow-y-auto border-t border-current/15 p-2">
          {ordered.map((issue) => (
            <li key={issue.id}>
              <button
                type="button"
                disabled={!issue.nodeId || !onSelectNode}
                onClick={() => issue.nodeId && onSelectNode?.(issue.nodeId)}
                className="flex w-full items-start gap-2 rounded-btn bg-surface/90 px-2.5 py-2 text-left transition-colors hover:bg-surface focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-default"
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    SEVERITY_DOT[issue.severity],
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium text-text-primary">
                    {issue.message}
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    <span className="sr-only">{SEVERITY_LABEL[issue.severity]}. </span>
                    {issue.fix}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
