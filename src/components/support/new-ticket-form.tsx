"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";

import { SummaryRow } from "@/components/marketing-hub/campaign/shared";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  MESSAGE_MAX,
  MESSAGE_MIN,
  RELATED_RESOURCE_TYPES,
  SUBJECT_MAX,
  SUPPORT_ROUTES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from "@/constants/support";
import { WHATSAPP_CONNECTIONS } from "@/lib/campaign-fixtures";
import { ORDERS } from "@/lib/commerce-fixtures";
import { INTEGRATIONS } from "@/lib/integration-fixtures";
import { CAMPAIGNS } from "@/lib/marketing-fixtures";
import { createTicket } from "@/lib/support-service";
import { WORKFLOWS } from "@/lib/workflow-fixtures";
import type { RelatedResourceType, TicketCategory, TicketPriority } from "@/types/support";
import { AttachmentPicker } from "./attachments";
import { useMerchantActor } from "./use-support";

/**
 * Opening a ticket - four questions and an optional pointer.
 *
 * Everything support needs that the app already knows (who, which workspace,
 * which plan, when) is attached by the service from the session and shown in
 * the side card so the merchant can see what is sent, without being asked to
 * type any of it. The related resource is a real record from this workspace,
 * picked rather than typed, so an agent opening the ticket lands on it.
 */

const NONE = "none";

/** This workspace's records, by the kind of thing a ticket can point at. */
const RESOURCES: Record<RelatedResourceType, { value: string; label: string }[]> = {
  whatsapp_connection: WHATSAPP_CONNECTIONS.map((item) => ({ value: item.id, label: item.label })),
  campaign: CAMPAIGNS.map((item) => ({ value: item.id, label: item.name })),
  /* "Order" in the label: order references share the MF- prefix with ticket
     numbers, and an agent reading "#MF-10255" should not go looking for a ticket. */
  order: ORDERS.map((item) => ({ value: item.id, label: `Order ${item.reference} · ${item.customer.name}` })),
  workflow: WORKFLOWS.map((item) => ({ value: item.id, label: item.name })),
  integration: INTEGRATIONS.map((item) => ({ value: item.id, label: item.name })),
};

export function NewTicketForm() {
  const router = useRouter();
  const actor = useMerchantActor();
  const toast = useToast();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("technical");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [resourceType, setResourceType] = useState<RelatedResourceType | typeof NONE>(NONE);
  const [resourceId, setResourceId] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const resources = resourceType === NONE ? [] : RESOURCES[resourceType];
  const resource = resources.find((item) => item.value === resourceId);

  const subjectError =
    touched && subject.trim().length < 5 ? "Give the ticket a subject of at least 5 characters." : undefined;
  const descriptionError =
    touched && description.trim().length < MESSAGE_MIN
      ? `Describe the problem in at least ${MESSAGE_MIN} characters.`
      : undefined;

  async function submit() {
    setTouched(true);
    if (subject.trim().length < 5 || description.trim().length < MESSAGE_MIN) return;

    setSending(true);
    setError(null);
    const result = await createTicket(actor, {
      subject,
      category,
      priority,
      description,
      files,
      related:
        resourceType !== NONE && resource
          ? { type: resourceType, id: resource.value, label: resource.label }
          : undefined,
    });
    setSending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(`Ticket #${result.ticketNumber} created - the support team will reply here`, "success");
    router.push(SUPPORT_ROUTES.ticket(result.ticketNumber));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Card>
        <CardHeader title="Describe the problem" description="The more specific, the faster we can help." />
        <CardBody className="space-y-5">
          <Field label="Subject" htmlFor="ticket-subject" error={subjectError} hint="One line - what is going wrong.">
            <Input
              id="ticket-subject"
              value={subject}
              maxLength={SUBJECT_MAX}
              error={Boolean(subjectError)}
              onChange={(event) => setSubject(event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="ticket-category">
              <Select
                id="ticket-category"
                label="Category"
                hideLabel={false}
                value={category}
                onChange={setCategory}
                options={TICKET_CATEGORIES}
              />
            </Field>
            <Field
              label="Priority"
              htmlFor="ticket-priority"
              hint={priority === "urgent" ? "For something that has stopped your business - it pages the on-call agent." : "How much it is affecting your business."}
            >
              <Select
                id="ticket-priority"
                label="Priority"
                hideLabel={false}
                value={priority}
                onChange={setPriority}
                options={TICKET_PRIORITIES}
              />
            </Field>
          </div>

          <Field
            label="Description"
            htmlFor="ticket-description"
            error={descriptionError}
            hint="What you expected, what happened instead, and when it started."
          >
            <Textarea
              id="ticket-description"
              rows={7}
              maxLength={MESSAGE_MAX}
              value={description}
              error={Boolean(descriptionError)}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Related to" htmlFor="ticket-resource-type" hint="Optional. Points support at the record.">
              <Select
                id="ticket-resource-type"
                label="Related to"
                hideLabel={false}
                value={resourceType}
                onChange={(next) => {
                  setResourceType(next);
                  setResourceId("");
                }}
                options={[{ value: NONE, label: "Nothing specific" }, ...RELATED_RESOURCE_TYPES]}
              />
            </Field>
            {resourceType !== NONE ? (
              <Field label="Which one" htmlFor="ticket-resource">
                <Select
                  id="ticket-resource"
                  label="Which one"
                  hideLabel={false}
                  placeholder=""
                  value={resourceId}
                  onChange={setResourceId}
                  options={resources}
                />
              </Field>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <p className="text-sm font-bold text-text-secondary">Attachments</p>
            <AttachmentPicker files={files} onChange={setFiles} disabled={sending} />
          </div>

          {error ? (
            <p role="alert" className="rounded-panel border border-error/25 bg-error-soft px-3.5 py-2.5 text-sm font-medium text-error-text">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-border pt-5">
            <ButtonLink href={SUPPORT_ROUTES.center} variant="cancel" size="compact">
              Cancel
            </ButtonLink>
            <Button size="compact" onClick={submit} disabled={sending}>
              {sending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
              Create Ticket
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card className="h-fit">
        <CardHeader title="Sent with your ticket" description="Added automatically, so you don't have to." />
        <CardBody>
          <dl className="divide-y divide-border">
            <SummaryRow label="From" value={actor.name} />
            <SummaryRow label="Email" value={<span className="break-all">{actor.email}</span>} />
            <SummaryRow label="Workspace" value={<code className="font-mono text-sm">{actor.workspaceId}</code>} />
            <SummaryRow label="Plan" value={actor.planName} />
            <SummaryRow label="Created" value="When you send it" />
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
