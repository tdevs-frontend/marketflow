"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FlaskConical, Play, RotateCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { NODE_META } from "@/constants/automation";
import { CONTACTS, contactName } from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";
import type { WorkflowEdge, WorkflowNode } from "@/types/workflow";
import { ExecutionDot } from "../automation-badges";
import { NodeIcon } from "../node-icon";

/**
 * A dry run of the workflow against one real contact.
 *
 * Nothing is sent. That is the entire point of the feature and the reason the
 * banner is the first thing in the dialog rather than a footnote: a test that
 * might have messaged a customer is a test nobody runs.
 *
 * The walk follows the first branch at every fork and reports which one it
 * took, which is what makes the result readable - a simulation that explored
 * every path would print a tree, and the question being asked here is "what
 * happens to this person".
 */

interface SimulatedStep {
  nodeId: string;
  title: string;
  detail: string;
  kind: WorkflowNode["kind"];
  outcome: string;
  status: "completed" | "waiting" | "skipped";
}

function simulate(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  who: string,
): SimulatedStep[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, WorkflowEdge[]>();
  for (const edge of edges) {
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  }

  const steps: SimulatedStep[] = [];
  let current = nodes.find((node) => node.kind === "trigger") ?? nodes[0];
  let guard = 0;

  while (current && guard < 24) {
    guard += 1;
    const meta = NODE_META[current.kind];
    const branch = current.branches?.[0];

    const outcome =
      current.kind === "trigger"
        ? `Trigger passed for ${who}`
        : meta?.category === "messaging"
          ? `${meta.label.replace("Send ", "")} simulated - nothing sent`
          : meta?.category === "wait"
            ? `Delay skipped in test mode (${current.summary})`
            : branch
              ? `Condition evaluated - "${branch.label}" branch selected`
              : `${current.title} applied`;

    steps.push({
      nodeId: current.id,
      title: current.title,
      detail: current.summary,
      kind: current.kind,
      outcome,
      status: meta?.category === "wait" ? "skipped" : "completed",
    });

    if (current.kind === "end") break;

    const next = branch
      ? (outgoing.get(current.id) ?? []).find((edge) => edge.branchId === branch.id)
      : (outgoing.get(current.id) ?? [])[0];

    const following = next ? byId.get(next.to) : undefined;
    if (!following) break;
    current = following;
  }

  return steps;
}

export function TestWorkflowDialog({
  open,
  onClose,
  nodes,
  edges,
}: {
  open: boolean;
  onClose: () => void;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}) {
  const [contactId, setContactId] = useState(CONTACTS[0]?.id ?? "");
  const [revealed, setRevealed] = useState(0);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);

  const contact = CONTACTS.find((item) => item.id === contactId);
  const name = contact ? contactName(contact) : "this contact";

  const steps = useMemo(() => simulate(nodes, edges, name), [nodes, edges, name]);

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  /* Closing cancels the pending reveals. A ref write is fine in an effect;
     the state that goes with it is adjusted during render below, which is what
     keeps a reopened dialog from flashing the last run's steps. */
  useEffect(() => {
    if (!open) clearTimers();
  }, [open]);

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (!open) {
      setRevealed(0);
      setRunning(false);
    }
  }

  function run() {
    clearTimers();
    setRevealed(0);
    setRunning(true);

    /* Staggered rather than instant: the value of a test run is watching the
       journey happen in order, which is also how a reader spots the step that
       went somewhere unexpected. */
    steps.forEach((_, index) => {
      timers.current.push(
        window.setTimeout(() => {
          setRevealed(index + 1);
          if (index === steps.length - 1) setRunning(false);
        }, 260 * (index + 1)),
      );
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Test workflow"
      description="Walk one contact through every step without sending anything."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Close
          </Button>
          {revealed > 0 ? (
            <Button variant="outline" size="compact" onClick={run} disabled={running}>
              <RotateCcw aria-hidden />
              Run again
            </Button>
          ) : null}
          <Button size="compact" onClick={run} disabled={running || steps.length === 0}>
            <Play aria-hidden />
            {running ? "Running…" : "Run test"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-panel border border-warning/40 bg-warning-soft/50 px-3.5 py-2.5 text-sm text-warning-text">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-medium">Test mode.</span> No WhatsApp, email or
            SMS is sent, no tag is written and no CRM record changes. Delays are
            skipped so the whole journey runs in seconds.
          </span>
        </p>

        <Select
          label="Sample contact"
          hideLabel={false}
          value={contactId}
          onChange={(next) => {
            setContactId(next);
            setRevealed(0);
          }}
          options={CONTACTS.slice(0, 12).map((item) => ({
            value: item.id,
            label: contactName(item),
            hint: item.email ?? item.phone ?? undefined,
          }))}
        />

        {revealed === 0 ? (
          <p className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center text-sm text-text-muted">
            Run the test to see how {name} moves through {steps.length} steps.
          </p>
        ) : (
          <ol className="space-y-2">
            {steps.slice(0, revealed).map((step, index) => (
              <li
                key={step.nodeId}
                className={cn(
                  "flex items-start gap-3 rounded-panel border border-border bg-surface px-3.5 py-3",
                  index === revealed - 1 && running && "border-primary",
                )}
              >
                <ExecutionDot
                  status={step.status === "skipped" ? "skipped" : "completed"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <NodeIcon kind={step.kind} size="sm" />
                    <p className="text-sm font-semibold text-text-primary">
                      {step.title}
                    </p>
                    {step.status === "skipped" ? (
                      <Badge tone="neutral">Skipped</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary font-medium">{step.outcome}</p>
                  {step.detail ? (
                    <p className="mt-0.5 text-sm text-text-muted">{step.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}

        {revealed === steps.length && steps.length > 0 && !running ? (
          <p className="text-center text-sm font-medium text-success-text">
            Test complete - {steps.length} steps ran without an error.
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}
