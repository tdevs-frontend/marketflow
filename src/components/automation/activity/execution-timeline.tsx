"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NODE_META } from "@/constants/automation";
import { CHANNEL_THEME } from "@/constants/channels";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { WorkflowRun, WorkflowRunStep } from "@/types/workflow";
import { ExecutionDot, ExecutionStatusBadge } from "../automation-badges";
import { NodeIcon } from "../node-icon";

/** Durations here run from 50ms to half an hour, so the unit has to move. */
export function formatDuration(ms?: number): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

const timeOf = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso),
  );

/**
 * What the step was given and what it gave back.
 *
 * Collapsed by default, because a timeline of nine steps each showing two JSON
 * objects is unreadable — and because the payload only matters once something
 * has gone wrong. A `<details>` rather than React state: the browser already
 * knows how to do this, and it stays open across a re-render for free.
 */
function StepPayload({ step }: { step: WorkflowRunStep }) {
  if (!step.input && !step.output) return null;

  return (
    <details className="group mt-2">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none">
        <span className="transition-transform group-open:rotate-90">›</span>
        Input and output
      </summary>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(
          [
            ["Input", step.input],
            ["Output", step.output],
          ] as const
        ).map(([label, payload]) =>
          payload ? (
            <div key={label}>
              <p className="text-sm font-medium text-text-muted">
                {label}
              </p>
              <pre className="custom-scrollbar mt-1 overflow-x-auto rounded-btn bg-surface-secondary px-2.5 py-2 font-mono text-sm text-text-secondary">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          ) : null,
        )}
      </div>
    </details>
  );
}

/**
 * What a failed step actually says.
 *
 * The provider's own response is shown verbatim, in mono, because "Recipient
 * mailbox unavailable" is a paraphrase and `550 5.1.1` is the thing an admin
 * can search for. The three recovery actions sit with it rather than in a
 * toolbar somewhere else — the moment you understand the error is the moment
 * you want to retry it.
 */
function StepError({
  step,
  onRetry,
  onSkip,
}: {
  step: WorkflowRunStep;
  onRetry?: () => void;
  onSkip?: () => void;
}) {
  if (!step.error) return null;

  return (
    <div className="mt-2 rounded-panel border border-error/40 bg-error-soft/40 p-3">
      <p className="flex items-start gap-2 text-sm font-medium text-error-text">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        {step.error.message}
      </p>

      <pre className="custom-scrollbar mt-2 overflow-x-auto rounded-btn bg-surface px-2.5 py-2 font-mono text-sm text-text-secondary">
        {step.error.providerResponse}
      </pre>

      <p className="mt-2 text-sm text-text-muted">
        {step.error.retries} {step.error.retries === 1 ? "retry" : "retries"} ·
        last attempt {formatDateTime(step.error.lastAttemptAt)}
      </p>

      {onRetry || onSkip ? (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry step
            </Button>
          ) : null}
          {onSkip ? (
            <Button size="sm" variant="ghost" onClick={onSkip}>
              Skip step
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A run, top to bottom.
 *
 * The vertical rule is drawn per item rather than as one absolute line behind
 * the list, so the last step has no tail hanging off it — a timeline that runs
 * past its final entry reads as "and then something else happened".
 */
export function ExecutionTimeline({
  run,
  onRetryStep,
  onSkipStep,
  className,
}: {
  run: WorkflowRun;
  onRetryStep?: (step: WorkflowRunStep) => void;
  onSkipStep?: (step: WorkflowRunStep) => void;
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0", className)}>
      {run.steps.map((step, index) => {
        const last = index === run.steps.length - 1;
        const channel = step.channel ? CHANNEL_THEME[step.channel] : undefined;

        return (
          <li key={step.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <ExecutionDot status={step.status} />
              {last ? null : <span aria-hidden className="w-px flex-1 bg-border" />}
            </div>

            <div className={cn("min-w-0 flex-1", last ? "pb-0" : "pb-5")}>
              <div className="flex flex-wrap items-center gap-2">
                <time
                  dateTime={step.at}
                  className="text-sm font-medium text-text-muted tabular-nums"
                >
                  {timeOf(step.at)}
                </time>
                <NodeIcon kind={step.kind} size="sm" />
                <p className="text-sm font-semibold text-text-primary">
                  {step.title}
                </p>
                <ExecutionStatusBadge status={step.status} />
              </div>

              <p className="mt-1 text-sm text-text-secondary">
                {step.event}
                {step.detail ? (
                  <span className="text-text-muted"> · {step.detail}</span>
                ) : null}
              </p>

              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
                <span>{NODE_META[step.kind]?.label}</span>
                {channel ? (
                  <span className={cn("font-medium", channel.text)}>{channel.label}</span>
                ) : null}
                {step.durationMs !== undefined ? (
                  <span className="tabular-nums">{formatDuration(step.durationMs)}</span>
                ) : null}
                {step.finishedAt ? (
                  <span className="tabular-nums">
                    finished {timeOf(step.finishedAt)}
                  </span>
                ) : null}
                {step.attempt && step.attempt > 1 ? (
                  <span className="font-medium text-warning-text tabular-nums">
                    attempt {step.attempt}
                  </span>
                ) : null}
              </p>

              <StepPayload step={step} />

              <StepError
                step={step}
                onRetry={onRetryStep ? () => onRetryStep(step) : undefined}
                onSkip={onSkipStep ? () => onSkipStep(step) : undefined}
              />
            </div>
          </li>
        );
      })}

      {run.nextActionAt ? (
        <li className="flex gap-3 pt-1">
          <div className="flex flex-col items-center">
            <span
              aria-hidden
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-dashed border-border-strong bg-surface"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-secondary">Next action</p>
            <p className="mt-0.5 text-sm text-text-muted">
              Scheduled for {formatDateTime(run.nextActionAt)}
            </p>
          </div>
        </li>
      ) : null}
    </ol>
  );
}

/** The summary block above a timeline: who, which workflow, how long. */
export function ExecutionSummary({ run }: { run: WorkflowRun }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
      <div className="min-w-0">
        <dt className="text-sm font-medium text-text-muted">
          Contact
        </dt>
        <dd className="mt-1 truncate text-sm font-medium">
          <Link
            href="/dashboard/contacts"
            className="inline-flex items-center gap-1 rounded-btn text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
          >
            {run.contactName}
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </dd>
      </div>

      <div className="min-w-0">
        <dt className="text-sm font-medium text-text-muted">
          Workflow
        </dt>
        <dd className="mt-1 truncate text-sm font-medium">
          <Link
            href={AUTOMATION_ROUTES.workflow(run.workflowId)}
            className="inline-flex items-center gap-1 rounded-btn text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
          >
            {run.workflowName}
            <ExternalLink className="size-3" aria-hidden />
          </Link>
        </dd>
      </div>

      <div className="min-w-0">
        <dt className="text-sm font-medium text-text-muted">
          Run ID
        </dt>
        <dd className="mt-1 truncate">
          <code className="font-mono text-sm text-text-secondary">{run.id}</code>
        </dd>
      </div>

      <div className="min-w-0">
        <dt className="text-sm font-medium text-text-muted">
          Started
        </dt>
        <dd className="mt-1 text-sm text-text-secondary">
          {formatDateTime(run.startedAt)}
        </dd>
      </div>

      <div className="min-w-0">
        <dt className="text-sm font-medium text-text-muted">
          State
        </dt>
        <dd className="mt-1">
          <ExecutionStatusBadge status={run.status} />
        </dd>
      </div>

      <div className="min-w-0">
        <dt className="text-sm font-medium text-text-muted">
          Total duration
        </dt>
        <dd className="mt-1 text-sm text-text-secondary tabular-nums">
          {run.durationMs === undefined ? (
            <Badge tone="warning">In progress</Badge>
          ) : (
            formatDuration(run.durationMs)
          )}
        </dd>
      </div>
    </dl>
  );
}
