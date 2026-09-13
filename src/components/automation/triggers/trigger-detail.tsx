"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ChevronLeft, Clock, Pause, Play, Plus, Workflow as WorkflowIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {
  AUTOMATION_ROUTES,
  triggerCategoryLabel,
} from "@/constants/automation";
import { formatCount, formatDateTime, formatRelativeTime } from "@/lib/format";
import { createDraftWorkflow, workflowById } from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { AutomationTrigger, TriggerStatus } from "@/types/workflow";
import { EventKey, TriggerStatusBadge, WorkflowStatusBadge } from "../automation-badges";
import { EventPayloadViewer } from "./event-payload-viewer";

/**
 * One event, in full.
 *
 * Two audiences on one page, in the order they need it: a marketer wants to
 * know what listens to this and whether it is firing, so that is the left
 * column; an integrator wants the key and the payload shape, so that is the
 * right. Neither has to read the other's half.
 */
export function TriggerDetail({ trigger }: { trigger: AutomationTrigger }) {
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState<TriggerStatus>(trigger.status);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const workflows = trigger.workflowIds
    .map((id) => workflowById(id))
    .filter((workflow) => workflow !== undefined);

  function createWorkflow() {
    const workflow = createDraftWorkflow({
      name: `${trigger.name} workflow`,
      description: `Automated journey starting from ${trigger.name.toLowerCase()}.`,
      triggerKey: trigger.eventKey,
      triggerLabel: trigger.name,
    });

    toast(`Draft created from ${trigger.name}`, "success");
    router.push(AUTOMATION_ROUTES.workflow(workflow.id));
  }

  const facts = [
    {
      icon: WorkflowIcon,
      label: "Used by",
      value: `${trigger.workflowIds.length} workflow${trigger.workflowIds.length === 1 ? "" : "s"}`,
    },
    {
      icon: Activity,
      label: "Events today",
      value: formatCount(trigger.events24h),
    },
    {
      icon: Clock,
      label: "Last fired",
      value: trigger.lastEventAt ? formatRelativeTime(trigger.lastEventAt) : "Never",
    },
  ];

  return (
    <>
      <Link
        href={AUTOMATION_ROUTES.triggers}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Triggers
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{trigger.name}</h1>
            <TriggerStatusBadge status={status} />
            {trigger.custom ? <Badge tone="brand">Custom</Badge> : null}
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">
            {trigger.description}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
            <span>{triggerCategoryLabel(trigger.category)}</span>
            <span aria-hidden>·</span>
            <span>Source: {trigger.source}</span>
            <span aria-hidden>·</span>
            <EventKey value={trigger.eventKey} />
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() =>
              status === "disabled"
                ? (setStatus("active"), toast(`${trigger.name} enabled`, "success"))
                : setConfirmDisable(true)
            }
          >
            {status === "disabled" ? <Play aria-hidden /> : <Pause aria-hidden />}
            {status === "disabled" ? "Enable" : "Disable"}
          </Button>
          <Button onClick={createWorkflow}>
            <Plus aria-hidden />
            Create Workflow
          </Button>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        {facts.map((fact) => (
          <Card key={fact.label} className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
              <fact.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
                {fact.label}
              </dt>
              <dd className="truncate text-lg leading-tight font-bold text-text-primary">
                {fact.value}
              </dd>
            </div>
          </Card>
        ))}
      </dl>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Used by workflows"
            description="Every journey that starts from this event."
          />
          <CardBody>
            {workflows.length === 0 ? (
              <div className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center">
                <p className="text-sm font-semibold text-text-primary">
                  Nothing listens to this yet
                </p>
                <p className="mx-auto mt-1.5 max-w-sm text-xs text-text-secondary">
                  The event is being recorded, but no workflow starts from it.
                  Create one and every future event will enter it.
                </p>
                <Button size="sm" className="mt-3" onClick={createWorkflow}>
                  <Plus aria-hidden />
                  Create Workflow
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {workflows.map((workflow) => (
                  <li key={workflow.id}>
                    <Link
                      href={AUTOMATION_ROUTES.workflow(workflow.id)}
                      className="flex items-center gap-3 rounded-panel border border-border px-3.5 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-secondary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-text-primary">
                          {workflow.name}
                        </span>
                        <span className="block truncate text-[11px] text-text-muted">
                          {workflow.nodes.length} steps ·{" "}
                          {formatCount(workflow.stats.entered)} entered
                        </span>
                      </span>
                      <WorkflowStatusBadge status={workflow.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Sample payload"
            description="The fields this event carries. Workflows can branch on any of them."
          />
          <CardBody className="space-y-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.06em] text-text-muted uppercase">
                Event key
              </p>
              <p className="mt-1.5">
                <EventKey value={trigger.eventKey} className="text-xs" />
              </p>
            </div>
            <EventPayloadViewer payload={trigger.payload} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent events"
          description="The last few deliveries, newest first."
        />
        <CardBody>
          {trigger.recentEvents.length === 0 ? (
            <div className="rounded-panel border border-dashed border-border-strong px-4 py-8 text-center">
              <p className="text-sm font-semibold text-text-primary">
                No trigger events yet
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-xs text-text-secondary">
                Nothing has raised {trigger.eventKey} in the last 24 hours. Events
                appear here within a few seconds of arriving.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {trigger.recentEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 first:pt-0 last:pb-0"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 shrink-0 rounded-full",
                      event.status === "failed"
                        ? "bg-error"
                        : event.status === "ignored"
                          ? "bg-border-strong"
                          : "bg-success",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
                    {event.summary}
                    {event.contactName ? (
                      <span className="text-text-muted"> · {event.contactName}</span>
                    ) : null}
                  </span>
                  <Badge
                    tone={
                      event.status === "failed"
                        ? "danger"
                        : event.status === "ignored"
                          ? "neutral"
                          : "success"
                    }
                  >
                    {event.status}
                  </Badge>
                  <time
                    dateTime={event.at}
                    className="shrink-0 text-[11px] text-text-muted"
                  >
                    {formatDateTime(event.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        onConfirm={() => {
          setStatus("disabled");
          setConfirmDisable(false);
          toast(`${trigger.name} disabled`, "success");
        }}
        title="Disable this trigger?"
        description={`${trigger.workflowIds.length} workflow${
          trigger.workflowIds.length === 1 ? "" : "s"
        } listen to ${trigger.eventKey}.`}
        confirmLabel="Disable trigger"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          The event keeps being recorded, but no workflow starts from it. Anyone
          already inside a journey carries on — this only closes the door.
        </p>
      </ConfirmDialog>
    </>
  );
}
