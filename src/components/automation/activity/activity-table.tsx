"use client";

import Link from "next/link";

import { AvatarLabel } from "@/components/ui/avatar";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { CHANNEL_THEME } from "@/constants/channels";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityRow } from "@/types/workflow";
import { ExecutionStatusBadge } from "../automation-badges";
import { NodeIcon } from "../node-icon";
import { formatDuration } from "./execution-timeline";

const timeOf = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));

/**
 * The execution log.
 *
 * A row is one *step*, not one run — which is the difference between this page
 * and a list of runs. Debugging an automation means finding the step that
 * failed, and a run-level list makes you open nine runs to find it. The run is
 * one click away on every row.
 *
 * The workflow column is optional because the same table renders inside a
 * workflow's own Activity tab, where every row would repeat the same name.
 */
export function ActivityTable({
  rows,
  onOpen,
  showWorkflow = true,
}: {
  rows: ActivityRow[];
  onOpen: (runId: string) => void;
  showWorkflow?: boolean;
}) {
  return (
    <>
      <Table minWidth={showWorkflow ? "68rem" : "58rem"} className="max-lg:hidden">
        <THead>
          <TH>Time</TH>
          <TH>Contact</TH>
          {showWorkflow ? <TH>Workflow</TH> : null}
          <TH>Step</TH>
          <TH>Event</TH>
          <TH>Status</TH>
          <TH align="right">Duration</TH>
        </THead>

        <TBody>
          {rows.map((row) => {
            const channel = row.channel ? CHANNEL_THEME[row.channel] : undefined;

            return (
              <TR
                key={row.id}
                onClick={() => onOpen(row.runId)}
                className="cursor-pointer"
              >
                <TD className="whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(row.runId);
                    }}
                    className="rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <span className="block text-sm font-medium text-text-primary tabular-nums">
                      {timeOf(row.at)}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {formatRelativeTime(row.at)}
                    </span>
                  </button>
                </TD>

                <TD>
                  <Link
                    href="/dashboard/contacts"
                    onClick={(event) => event.stopPropagation()}
                    className="inline-block max-w-48 rounded-btn focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <AvatarLabel name={row.contactName} size="sm" />
                  </Link>
                </TD>

                {showWorkflow ? (
                  <TD>
                    <Link
                      href={AUTOMATION_ROUTES.workflow(row.workflowId)}
                      onClick={(event) => event.stopPropagation()}
                      className="block max-w-44 truncate rounded-btn text-xs font-medium text-text-secondary transition-colors hover:text-primary focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      {row.workflowName}
                    </Link>
                  </TD>
                ) : null}

                <TD>
                  <span className="flex items-center gap-2">
                    <NodeIcon kind={row.kind} size="sm" />
                    <span className="max-w-40 truncate text-xs text-text-secondary">
                      {row.title}
                    </span>
                  </span>
                </TD>

                <TD>
                  <span className="block max-w-44 truncate text-xs text-text-primary">
                    {row.event}
                  </span>
                  {channel ? (
                    <span className={cn("text-[11px] font-medium", channel.text)}>
                      {channel.label}
                    </span>
                  ) : null}
                </TD>

                <TD>
                  <ExecutionStatusBadge status={row.status} />
                </TD>

                <TD
                  align="right"
                  className="text-xs whitespace-nowrap text-text-muted tabular-nums"
                >
                  {formatDuration(row.durationMs)}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>

      {/* Below `lg` the seven columns become a card. Time, who, what, and the
          status — the four things a monitoring screen is scanned for. */}
      <ul className="space-y-2.5 lg:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onOpen(row.runId)}
              className="w-full rounded-panel border border-border p-3.5 text-left transition-colors hover:bg-primary-soft/40 focus-visible:shadow-focus focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-2">
                <AvatarLabel
                  name={row.contactName}
                  secondary={showWorkflow ? row.workflowName : row.title}
                  size="sm"
                />
                <ExecutionStatusBadge status={row.status} />
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <NodeIcon kind={row.kind} size="sm" />
                <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
                  {row.event}
                </span>
                <span className="text-[11px] text-text-muted tabular-nums">
                  {timeOf(row.at)} · {formatDuration(row.durationMs)}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
