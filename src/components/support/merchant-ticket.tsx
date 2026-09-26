"use client";

import { ChevronLeft, RotateCcw } from "lucide-react";

import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import {
  SUPPORT_ROUTES,
  categoryLabel,
  resourceTypeLabel,
  statusLabel,
} from "@/constants/support";
import { formatDateTime } from "@/lib/format";
import {
  acceptsReplies,
  reopenTicket,
  replyToTicket,
  useSupportTicket,
} from "@/lib/support-service";
import type { SupportTicketEvent } from "@/types/support";
import { Conversation, ReplyComposer } from "./conversation";
import { PriorityBadge, TicketStatusBadge } from "./support-badges";
import { useMerchantActor } from "./use-support";

/**
 * One ticket, from the merchant's side.
 *
 * The thread holds both sides - the merchant's messages and the support
 * team's replies, which the separate Admin dashboard sends through the API.
 * Status, priority and category are shown, not edited: those are the support
 * team's to change. The merchant's own actions are replying and, on a resolved
 * ticket, reopening it.
 */
export function MerchantTicket({ ticketNumber }: { ticketNumber: string }) {
  const actor = useMerchantActor();
  const ticket = useSupportTicket(actor, ticketNumber);
  const toast = useToast();

  const back = (
    <ButtonLink href={SUPPORT_ROUTES.center} variant="subtle" size="inline" className="w-fit text-[15px]">
      <ChevronLeft aria-hidden />
      Back to Support Center
    </ButtonLink>
  );

  if (!ticket) {
    return (
      <>
        {back}
        <EmptyState
          title="Ticket not found"
          description="It doesn't exist, or it belongs to another workspace. Tickets you create are kept for this browser session."
          action={
            <ButtonLink href={SUPPORT_ROUTES.center} size="sm" variant="outline">
              Back to Support Center
            </ButtonLink>
          }
        />
      </>
    );
  }

  async function send(body: string, files: File[]) {
    const result = await replyToTicket(actor, ticketNumber, body, files);
    if (!result.ok) {
      toast(result.error, "error");
      return false;
    }
    toast(result.reopened ? "Reply sent - your ticket is reopened" : "Reply sent to the support team", "success");
    return true;
  }

  function reopen() {
    const result = reopenTicket(actor, ticketNumber);
    toast(result.ok ? "Ticket reopened - it's back with the support team" : result.error, result.ok ? "success" : "error");
  }

  return (
    <>
      {back}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-sm text-text-muted">#{ticket.ticketNumber}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        {ticket.status === "resolved" ? (
          <Button variant="outline" size="compact" onClick={reopen} className="shrink-0">
            <RotateCcw aria-hidden />
            Reopen ticket
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* On a phone the facts come first and stay short; on a desktop they
            sit beside the thread. */}
        <div className="space-y-4 lg:order-2">
          <Card>
            <CardHeader title="Ticket information" />
            <CardBody className="py-2">
              <dl className="divide-y divide-border">
                <SummaryRow label="Ticket ID" value={`#${ticket.ticketNumber}`} />
                <SummaryRow label="Status" value={<TicketStatusBadge status={ticket.status} />} />
                <SummaryRow label="Priority" value={<PriorityBadge priority={ticket.priority} />} />
                <SummaryRow label="Category" value={categoryLabel(ticket.category)} />
                {ticket.relatedResourceType ? (
                  <SummaryRow
                    label={resourceTypeLabel(ticket.relatedResourceType)}
                    value={ticket.relatedResourceLabel ?? "-"}
                  />
                ) : null}
                <SummaryRow label="Created" value={formatDateTime(ticket.createdAt)} />
                <SummaryRow label="Last updated" value={formatDateTime(ticket.updatedAt)} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="History" />
            <CardBody>
              <ol className="space-y-2.5">
                {[...ticket.events].reverse().map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="font-medium text-text-primary">{describeEvent(item)}</p>
                    <p className="text-text-muted">{formatDateTime(item.createdAt)}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit lg:order-1">
          <CardBody className="space-y-6">
            <Conversation actor={actor} messages={ticket.messages} />
            <ReplyComposer
              onSend={send}
              disabledReason={
                acceptsReplies(ticket.status)
                  ? undefined
                  : "This ticket is closed. If the problem is back, create a new ticket and mention this one's number."
              }
            />
            {ticket.status === "resolved" ? (
              <p className="text-sm text-text-muted">
                Marked as resolved by the support team. Replying, or Reopen ticket, sends it back to them.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function describeEvent(event: SupportTicketEvent) {
  const who = event.actor === "support" ? "Support" : "You";
  switch (event.type) {
    case "created":
      return "You opened the ticket";
    case "resolved":
      return "Support resolved it";
    case "closed":
      return "Support closed it";
    case "reopened":
      return `${who} reopened it`;
    default:
      return `${who} moved it to ${event.to ? statusLabel(event.to) : "a new status"}`;
  }
}
