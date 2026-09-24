"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pause, Play, Plus, Workflow as WorkflowIcon } from "lucide-react";

import { Menu } from "@/components/ui/menu";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { formatCount, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AutomationTrigger } from "@/types/workflow";
import { EventKey, TriggerStatusBadge } from "../automation-badges";

/**
 * The event registry.
 *
 * A table rather than cards, because this page is a reference: the question is
 * "what is the key for order paid, and is anything listening" - which is two
 * columns and a count, read across a row. Cards would put eight facts in a box
 * and make the reader hunt for the one they came for.
 *
 * Traffic is the column that turns it into a diagnostic. A trigger with four
 * workflows and no events in 24 hours is either quiet or broken, and that is
 * exactly the pair of numbers that says so.
 */
export function TriggerTable({
  triggers,
  onToggle,
  onCreateWorkflow,
}: {
  triggers: AutomationTrigger[];
  onToggle: (trigger: AutomationTrigger) => void;
  onCreateWorkflow: (trigger: AutomationTrigger) => void;
}) {
  const router = useRouter();

  const actions = (trigger: AutomationTrigger) => [
    {
      label: "View details",
      icon: <Eye className="size-4" />,
      onSelect: () => router.push(AUTOMATION_ROUTES.trigger(trigger.id)),
    },
    {
      label: "Create workflow from this",
      icon: <Plus className="size-4" />,
      onSelect: () => onCreateWorkflow(trigger),
    },
    {
      label: trigger.status === "disabled" ? "Enable trigger" : "Disable trigger",
      icon:
        trigger.status === "disabled" ? (
          <Play className="size-4" />
        ) : (
          <Pause className="size-4" />
        ),
      onSelect: () => onToggle(trigger),
      destructive: trigger.status !== "disabled",
    },
  ];

  return (
    <>
      <Table minWidth="72rem" className="max-lg:hidden">
        <THead>
          <TH>Trigger</TH>
          <TH>Source</TH>
          <TH>Event key</TH>
          <TH align="right">Workflows</TH>
          <TH align="right">Events 24h</TH>
          <TH>Last event</TH>
          <TH>Status</TH>
          <TH align="right" />
        </THead>

        <TBody>
          {triggers.map((trigger) => (
            <TR key={trigger.id}>
              <TD>
                <Link
                  href={AUTOMATION_ROUTES.trigger(trigger.id)}
                  className="block max-w-64 rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <span className="block truncate text-sm font-bold text-text-primary transition-colors hover:text-primary">
                    {trigger.name}
                  </span>
                  <span className="block truncate text-sm text-text-muted">
                    {trigger.description}
                  </span>
                </Link>
              </TD>

              <TD className="whitespace-nowrap text-text-secondary">
                {trigger.source}
              </TD>

              <TD>
                <EventKey value={trigger.eventKey} />
              </TD>

              <TD align="right">
                {trigger.workflowIds.length === 0 ? (
                  <span className="text-sm text-text-muted">-</span>
                ) : (
                  <Tooltip
                    content={`${trigger.workflowIds.length} workflow${
                      trigger.workflowIds.length === 1 ? "" : "s"
                    } listening`}
                  >
                    <span
                      tabIndex={0}
                      className="inline-flex items-center gap-1 rounded-btn text-sm font-bold text-text-primary tabular-nums focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <WorkflowIcon className="size-3.5 text-text-muted" aria-hidden />
                      {trigger.workflowIds.length}
                    </span>
                  </Tooltip>
                )}
              </TD>

              <TD align="right" className="whitespace-nowrap">
                <span className="text-sm font-bold text-text-primary tabular-nums">
                  {formatCount(trigger.events24h)}
                </span>
                {trigger.failed24h > 0 ? (
                  <span className="ml-1.5 text-sm font-medium text-error tabular-nums">
                    {trigger.failed24h} failed
                  </span>
                ) : null}
              </TD>

              <TD className="whitespace-nowrap text-text-muted">
                {trigger.lastEventAt ? formatRelativeTime(trigger.lastEventAt) : "Never"}
              </TD>

              <TD>
                <TriggerStatusBadge status={trigger.status} />
              </TD>

              <TD align="right">
                <Menu items={actions(trigger)} label={`Actions for ${trigger.name}`} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <ul className="space-y-2.5 lg:hidden">
        {triggers.map((trigger) => (
          <li
            key={trigger.id}
            className="rounded-panel border border-border p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={AUTOMATION_ROUTES.trigger(trigger.id)}
                className="min-w-0 flex-1 rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
              >
                <span className="block truncate text-sm font-medium text-text-primary">
                  {trigger.name}
                </span>
                <span className="mt-1 block">
                  <EventKey value={trigger.eventKey} />
                </span>
              </Link>
              <Menu items={actions(trigger)} label={`Actions for ${trigger.name}`} />
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-text-secondary">
              {trigger.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <TriggerStatusBadge status={trigger.status} />
              <span className="text-sm text-text-muted">
                {trigger.workflowIds.length} workflows
              </span>
              <span
                className={cn(
                  "text-sm tabular-nums",
                  trigger.failed24h > 0 ? "text-error" : "text-text-muted",
                )}
              >
                {formatCount(trigger.events24h)} events / 24h
              </span>
              <span className="ml-auto text-sm text-text-muted">
                {trigger.lastEventAt
                  ? formatRelativeTime(trigger.lastEventAt)
                  : "Never fired"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
