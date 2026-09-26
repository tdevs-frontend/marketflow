"use client";

import { CheckCircle2, ChevronLeft, Lock, RotateCcw, UserPlus, XCircle } from "lucide-react";

import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  STATUS_TRANSITIONS,
  SUPPORT_ROUTES,
  TICKET_PRIORITIES,
  categoryLabel,
  priorityLabel,
  resourceTypeLabel,
  statusLabel,
} from "@/constants/support";
import { formatDate, formatDateTime } from "@/lib/format";
import { SUPPORT_AGENTS, agentById } from "@/lib/support-fixtures";
import {
  CURRENT_AGENT,
  agentReply,
  assignTicket,
  setTicketPriority,
  setTicketStatus,
  useAgentTicket,
} from "@/lib/support-service";
import type { TicketEvent, TicketPriority, TicketStatus } from "@/types/support";
import { Conversation, ReplyComposer, type SendOptions } from "../conversation";
import { PriorityBadge, TicketStatusBadge } from "../support-badges";
import { useSupportEffects } from "../use-support";

/**
 * One ticket, from the desk.
 *
 * The agent view is the only one that carries internal notes and the event
 * history, and it is only ever built for an agent actor. Every control on the
 * right writes through the service, which enforces the status transitions and
 * returns the merchant notifications a change raised - delivered into the
 * product's own notification feed by `useSupportEffects`.
 */

const UNASSIGNED = "unassigned";

export function AgentTicket({ ticketNumber }: { ticketNumber: string }) {
  const ticket = useAgentTicket(CURRENT_AGENT, ticketNumber);
  const { deliver, toast } = useSupportEffects();

  const back = (
    <ButtonLink href={SUPPORT_ROUTES.desk} variant="subtle" size="inline" className="w-fit text-[15px]">
      <ChevronLeft aria-hidden />
      Back to Support Desk
    </ButtonLink>
  );

  if (!ticket) {
    return (
      <>
        {back}
        <EmptyState
          title="Ticket not found"
          description="No ticket has that number. Tickets created this session are kept for the browser session only."
        />
      </>
    );
  }

  const number = ticket.ticketNumber;

  function changeStatus(next: TicketStatus) {
    const result = setTicketStatus(CURRENT_AGENT, number, next);
    if (!result.ok) return toast(result.error, "error");
    deliver(result.notices);
    toast(`Status set to ${statusLabel(next)} - the merchant has been notified`, "success");
  }

  function changePriority(next: TicketPriority) {
    const result = setTicketPriority(CURRENT_AGENT, number, next);
    if (!result.ok) return toast(result.error, "error");
    toast(`Priority set to ${priorityLabel(next)}`, "success");
  }

  function assign(next: string | null) {
    const result = assignTicket(CURRENT_AGENT, number, next);
    if (!result.ok) return toast(result.error, "error");
    toast(next ? `Assigned to ${agentById(next)?.name}` : "Ticket unassigned", "success");
  }

  async function send(body: string, files: File[], options: SendOptions) {
    const result = await agentReply(CURRENT_AGENT, number, body, files, options);
    if (!result.ok) {
      toast(result.error, "error");
      return false;
    }
    deliver(result.notices);
    toast(options.internal ? "Internal note added - not visible to the merchant" : "Reply sent to the merchant", "success");
    return true;
  }

  const statusOptions = [ticket.status, ...STATUS_TRANSITIONS[ticket.status]].map((value) => ({
    value,
    label: statusLabel(value),
  }));
  const done = ticket.status === "resolved" || ticket.status === "closed";

  return (
    <>
      {back}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm text-text-muted">
            #{number} · {ticket.workspace?.name ?? ticket.workspaceId}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          {done ? (
            <Button variant="outline" size="compact" onClick={() => changeStatus("waiting_support")}>
              <RotateCcw aria-hidden />
              Reopen
            </Button>
          ) : (
            <Button size="compact" onClick={() => changeStatus("resolved")}>
              <CheckCircle2 aria-hidden />
              Resolve
            </Button>
          )}
          {ticket.status !== "closed" ? (
            <Button variant="outline" size="compact" onClick={() => changeStatus("closed")}>
              <XCircle aria-hidden />
              Close
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4 lg:order-2">
          <Card>
            <CardHeader title="Ticket" />
            <CardBody className="space-y-4">
              <Field label="Status" htmlFor="desk-status" hint="Only the moves this status allows are listed.">
                <Select id="desk-status" label="Status" hideLabel={false} value={ticket.status} onChange={changeStatus} options={statusOptions} />
              </Field>
              <Field label="Priority" htmlFor="desk-priority">
                <Select id="desk-priority" label="Priority" hideLabel={false} value={ticket.priority} onChange={changePriority} options={TICKET_PRIORITIES} />
              </Field>
              <Field label="Assigned to" htmlFor="desk-assignee">
                <Select
                  id="desk-assignee"
                  label="Assigned to"
                  hideLabel={false}
                  value={ticket.assignedTo ?? UNASSIGNED}
                  onChange={(next) => assign(next === UNASSIGNED ? null : next)}
                  options={[
                    { value: UNASSIGNED, label: "Unassigned" },
                    ...SUPPORT_AGENTS.map((agent) => ({ value: agent.id, label: agent.name, hint: agent.title })),
                  ]}
                />
              </Field>
              {ticket.assignedTo !== CURRENT_AGENT.agentId ? (
                <Button variant="outline" size="sm" onClick={() => assign(CURRENT_AGENT.agentId)}>
                  <UserPlus aria-hidden />
                  Assign to me
                </Button>
              ) : null}
              <dl className="divide-y divide-border border-t border-border">
                <SummaryRow label="Ticket ID" value={`#${number}`} />
                <SummaryRow label="Category" value={categoryLabel(ticket.category)} />
                {ticket.relatedResourceType ? (
                  <SummaryRow
                    label={resourceTypeLabel(ticket.relatedResourceType)}
                    value={
                      <span>
                        {ticket.relatedResourceLabel}
                        <code className="block font-mono text-sm font-normal text-text-muted">{ticket.relatedResourceId}</code>
                      </span>
                    }
                  />
                ) : null}
                <SummaryRow label="Created" value={formatDateTime(ticket.createdAt)} />
                <SummaryRow label="Last updated" value={formatDateTime(ticket.updatedAt)} />
                <SummaryRow label="First response" value={ticket.firstResponseAt ? formatDateTime(ticket.firstResponseAt) : "Not yet"} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Merchant" />
            <CardBody className="py-2">
              <dl className="divide-y divide-border">
                <SummaryRow label="Name" value={ticket.merchantName} />
                <SummaryRow label="Email" value={<span className="break-all">{ticket.merchantEmail}</span>} />
                <SummaryRow label="Plan" value={ticket.planName} />
              </dl>
            </CardBody>
          </Card>

          {ticket.workspace ? (
            <Card>
              <CardHeader title="Workspace" />
              <CardBody className="py-2">
                <dl className="divide-y divide-border">
                  <SummaryRow label="Name" value={ticket.workspace.name} />
                  <SummaryRow label="ID" value={<code className="font-mono text-sm">{ticket.workspace.id}</code>} />
                  <SummaryRow label="Owner" value={ticket.workspace.ownerName} />
                  <SummaryRow label="Country" value={ticket.workspace.country} />
                  <SummaryRow label="Members" value={String(ticket.workspace.memberCount)} />
                  <SummaryRow label="Customer since" value={formatDate(ticket.workspace.createdAt)} />
                </dl>
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="History" description="Assignment, status and priority changes." />
            <CardBody>
              <ol className="space-y-2.5">
                {[...ticket.events].reverse().map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium text-text-primary">{describeEvent(item, ticket.merchantName)}</p>
                    <p className="text-text-muted">{formatDateTime(item.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit lg:order-1">
          <CardBody className="space-y-6">
            <p className="flex items-center gap-1.5 text-sm text-text-muted">
              <Lock className="size-4" aria-hidden />
              Amber messages are internal notes. The merchant never receives them.
            </p>
            <Conversation
              actor={CURRENT_AGENT}
              messages={ticket.messages.map((message) => ({
                id: message.id,
                senderName: message.senderName,
                senderRole: message.senderRole,
                senderType: message.senderType,
                body: message.body,
                createdAt: message.createdAt,
                attachments: message.attachments,
                internal: message.isInternalNote,
              }))}
            />
            <ReplyComposer audience="agent" onSend={send} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function describeEvent(event: TicketEvent, merchantName: string) {
  const who =
    event.actorType === "merchant"
      ? merchantName
      : event.actorType === "system"
        ? "MarketFlow"
        : (agentById(event.actorId)?.name ?? "An agent");
  const status = (value?: string) => (value ? statusLabel(value as TicketStatus) : "-");

  switch (event.type) {
    case "created":
      return `${who} opened the ticket`;
    case "assigned":
      return `${who} assigned it to ${agentById(event.to)?.name ?? "an agent"}`;
    case "unassigned":
      return `${who} unassigned ${agentById(event.from)?.name ?? "it"}`;
    case "priority_changed":
      return `${who} changed priority ${priorityLabel(event.from as TicketPriority)} → ${priorityLabel(event.to as TicketPriority)}`;
    case "resolved":
      return `${who} resolved it`;
    case "closed":
      return `${who} closed it`;
    case "reopened":
      return `${who} reopened it`;
    default:
      return `${who} moved it ${status(event.from)} → ${status(event.to)}`;
  }
}
