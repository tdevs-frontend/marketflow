"use client";

import { useState } from "react";
import { CircleStop, ExternalLink, RefreshCw, SkipForward, Workflow } from "lucide-react";

import { ButtonLink, Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Drawer } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { APP_ROUTES } from "@/constants/app";
import type { WorkflowRun, WorkflowRunStep } from "@/types/workflow";
import { ExecutionSummary, ExecutionTimeline } from "./execution-timeline";

/**
 * One run, in a drawer.
 *
 * A drawer rather than a page transition because Activity is a monitoring
 * screen: the reader is working through a list of failures and needs to get
 * back to it. The same content has a route of its own -
 * `/automation/activity/[runId]` - for links out of an alert or a support
 * ticket, and both render `ExecutionDetailBody`.
 */
export function ExecutionDetailBody({
  run,
  onRetryStep,
  onSkipStep,
  onStopRun,
}: {
  run: WorkflowRun;
  onRetryStep?: (step: WorkflowRunStep) => void;
  onSkipStep?: (step: WorkflowRunStep) => void;
  onStopRun?: () => void;
}) {
  const stoppable = run.status === "running" || run.status === "waiting" || run.status === "queued";

  return (
    <div className="space-y-5">
      <ExecutionSummary run={run} />

      <div className="flex flex-wrap items-center gap-2 border-y border-border py-3">
        <ButtonLink href={APP_ROUTES.contacts} variant="outline" size="sm">
          <ExternalLink aria-hidden />
          View contact
        </ButtonLink>
        <ButtonLink
          href={AUTOMATION_ROUTES.workflow(run.workflowId)}
          variant="outline"
          size="sm"
        >
          <Workflow aria-hidden />
          Open workflow
        </ButtonLink>
        {stoppable && onStopRun ? (
          <Button variant="outline" size="sm" onClick={onStopRun} className="ml-auto">
            <CircleStop aria-hidden />
            Stop run
          </Button>
        ) : null}
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold">Execution timeline</h3>
        <ExecutionTimeline
          run={run}
          onRetryStep={onRetryStep}
          onSkipStep={onSkipStep}
        />
      </section>
    </div>
  );
}

export function ExecutionDetailDrawer({
  run,
  onClose,
}: {
  run: WorkflowRun | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState<WorkflowRunStep | null>(null);

  return (
    <>
      <Drawer
        open={Boolean(run)}
        onClose={onClose}
        title={run ? `Run ${run.id}` : "Run"}
        description={run ? `${run.contactName} · ${run.workflowName}` : undefined}
      >
        {run ? (
          <ExecutionDetailBody
            run={run}
            onRetryStep={(step) =>
              toast(`Retrying ${step.title} for ${run.contactName}`, "info")
            }
            onSkipStep={setConfirmSkip}
            onStopRun={() => setConfirmStop(true)}
          />
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={() => {
          toast(`Run ${run?.id} stopped`, "success");
          setConfirmStop(false);
          onClose();
        }}
        title="Stop this run?"
        description="The contact leaves the journey immediately."
        confirmLabel="Stop run"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          Every scheduled action for {run?.contactName ?? "this contact"} is
          cancelled, including messages that have not been sent yet. They can
          re-enter later if the workflow&apos;s entry rules allow it.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(confirmSkip)}
        onClose={() => setConfirmSkip(null)}
        onConfirm={() => {
          toast(`${confirmSkip?.title} skipped - the run continues`, "success");
          setConfirmSkip(null);
        }}
        title="Skip this step?"
        description="The run carries on from the next step."
        confirmLabel="Skip step"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          Whatever this step would have done - a message, a tag, a CRM update -
          does not happen for this contact. The rest of the journey is
          unaffected.
        </p>
      </ConfirmDialog>
    </>
  );
}

/** The retry button used on a failed run's row, kept here for one wording. */
export function RetryRunButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onRetry}>
      <RefreshCw aria-hidden />
      Retry
    </Button>
  );
}

export { SkipForward };
