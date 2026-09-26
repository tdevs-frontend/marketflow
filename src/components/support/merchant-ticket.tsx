"use client";

import { ChevronLeft } from "lucide-react";

import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SUPPORT_ROUTES, categoryLabel, resourceTypeLabel } from "@/constants/support";
import { formatDateTime } from "@/lib/format";
import { merchantReply, useMerchantTicket } from "@/lib/support-service";
import { Conversation, ReplyComposer } from "./conversation";
import { PriorityBadge, TicketStatusBadge } from "./support-badges";
import { useMerchantActor, useSupportEffects } from "./use-support";

/**
 * One ticket, from the merchant's side.
 *
 * `useMerchantTicket` returns the merchant *view* - internal notes are gone
 * before it is built, and a ticket from another workspace comes back as
 * `null`, exactly like one that does not exist. The side panel shows who is
 * handling it by name only: no agent email, no assignment history, no queue.
 */
export function MerchantTicket({ ticketNumber }: { ticketNumber: string }) {
  const actor = useMerchantActor();
  const ticket = useMerchantTicket(actor, ticketNumber);
  const { toast } = useSupportEffects();

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
    const result = await merchantReply(actor, ticketNumber, body, files);
    if (!result.ok) {
      toast(result.error, "error");
      return false;
    }
    toast(result.reopened ? "Reply sent - your ticket is reopened" : "Reply sent", "success");
    return true;
  }

  return (
    <>
      {back}

      <div>
        <p className="font-mono text-sm text-text-muted">#{ticket.ticketNumber}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{ticket.subject}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TicketStatusBadge status={ticket.status} audience="merchant" />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* On a phone the facts come first and stay short; on a desktop they
            sit beside the thread. */}
        <Card className="h-fit lg:order-2">
          <CardHeader title="Ticket information" />
          <CardBody className="py-2">
            <dl className="divide-y divide-border">
              <SummaryRow label="Ticket ID" value={`#${ticket.ticketNumber}`} />
              <SummaryRow label="Status" value={<TicketStatusBadge status={ticket.status} audience="merchant" />} />
              <SummaryRow label="Priority" value={<PriorityBadge priority={ticket.priority} />} />
              <SummaryRow label="Category" value={categoryLabel(ticket.category)} />
              {ticket.relatedResourceType ? (
                <SummaryRow
                  label={resourceTypeLabel(ticket.relatedResourceType)}
                  value={ticket.relatedResourceLabel ?? "-"}
                />
              ) : null}
              <SummaryRow label="Assigned to" value={ticket.assignedAgentName ?? "Waiting for an agent"} />
              <SummaryRow label="Created" value={formatDateTime(ticket.createdAt)} />
              <SummaryRow label="Last updated" value={formatDateTime(ticket.updatedAt)} />
            </dl>
          </CardBody>
        </Card>

        <Card className="lg:order-1">
          <CardBody className="space-y-6">
            <Conversation
              actor={actor}
              messages={ticket.messages.map((message) => ({
                ...message,
                senderRole: message.senderRole,
              }))}
            />
            <ReplyComposer
              audience="merchant"
              onSend={send}
              disabledReason={
                ticket.status === "closed"
                  ? "This ticket is closed. If the problem is back, create a new ticket and mention this one's number."
                  : undefined
              }
            />
            {ticket.status === "resolved" ? (
              <p className="text-sm text-text-muted">
                Marked as resolved. Replying reopens it and sends it back to the support team.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
