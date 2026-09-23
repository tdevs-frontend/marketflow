"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import type { WorkflowRun, WorkflowRunStep } from "@/types/workflow";
import { ExecutionStatusBadge } from "../automation-badges";
import { ExecutionDetailBody } from "./execution-detail";

/**
 * One run, as a page.
 *
 * The same body the drawer renders. A run needs a route of its own because
 * failures get linked to - from an alert, a ticket, a message to a colleague -
 * and a drawer has no address. Anybody arriving from inside the product gets
 * the drawer instead, which keeps their place in the log.
 */
export function RunDetail({ run }: { run: WorkflowRun }) {
  const toast = useToast();
  const [confirmStop, setConfirmStop] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState<WorkflowRunStep | null>(null);

  return (
    <>
      <Link
        href={AUTOMATION_ROUTES.activity}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-[15px] font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Activity
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">
              Run <span className="font-mono text-lg">{run.id}</span>
            </h1>
            <ExecutionStatusBadge status={run.status} />
          </div>
          <p className="mt-1 truncate text-sm text-text-secondary">
            {run.contactName} · {run.workflowName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader
          title="Execution detail"
          description="Every step this contact took, and what each one did."
        />
        <CardBody>
          <ExecutionDetailBody
            run={run}
            onRetryStep={(step) =>
              toast(`Retrying ${step.title} for ${run.contactName}`, "info")
            }
            onSkipStep={setConfirmSkip}
            onStopRun={() => setConfirmStop(true)}
          />
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={() => {
          setConfirmStop(false);
          toast(`Run ${run.id} stopped`, "success");
        }}
        title="Stop this run?"
        description="The contact leaves the journey immediately."
        confirmLabel="Stop run"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          Every scheduled action for {run.contactName} is cancelled, including
          messages that have not been sent yet. They can re-enter later if the
          workflow&apos;s entry rules allow it.
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
