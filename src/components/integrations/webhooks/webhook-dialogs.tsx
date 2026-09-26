"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { WEBHOOK_EVENT_COUNT } from "@/constants/integrations";
import { createWebhook } from "@/lib/integration-fixtures";
import type { Webhook } from "@/types/integration";
import { OneTimeSecret } from "../credential-field";
import { EventKeyList, EventPicker } from "./event-picker";

/**
 * Creating an endpoint, and the two confirmations that guard the destructive
 * things you can do to one.
 *
 * The create dialog is two-phase on purpose: the signing secret is generated
 * server-side and returned exactly once, so the dialog cannot close on save -
 * it has to stay open long enough for the merchant to copy it. Closing before
 * that point is the failure case the second phase exists to prevent.
 *
 * Its state is mount-scoped - the parent renders it only while it is open - so
 * closing discards both the draft and the secret without an effect that resets
 * six fields one at a time.
 */

const TIMEOUTS = [
  { value: "5", label: "5 seconds" },
  { value: "10", label: "10 seconds", hint: "Recommended" },
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
];

const RETRIES = [
  { value: "0", label: "No retries" },
  { value: "3", label: "3 attempts", hint: "Recommended" },
  { value: "5", label: "5 attempts" },
];

export function CreateWebhookDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (webhook: Webhook) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [timeoutSeconds, setTimeoutSeconds] = useState("10");
  const [retries, setRetries] = useState("3");
  const [touched, setTouched] = useState(false);
  const [created, setCreated] = useState<Webhook | null>(null);


  const urlError =
    touched && url.trim() && !url.trim().startsWith("https://")
      ? "The endpoint must be HTTPS - deliveries carry a signature and payload data."
      : undefined;
  const nameError = touched && !name.trim() ? "Give the endpoint a name." : undefined;
  const eventsError =
    touched && events.length === 0 ? "Select at least one event to send." : undefined;

  const valid = Boolean(name.trim()) && url.trim().startsWith("https://") && events.length > 0;

  function submit() {
    setTouched(true);
    if (!valid) return;

    const webhook = createWebhook({
      name: name.trim(),
      url: url.trim(),
      events,
      timeoutSeconds: Number(timeoutSeconds),
      retryAttempts: Number(retries),
    });

    onCreate(webhook);
    setCreated(webhook);
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={created ? "Endpoint created" : "Add Webhook"}
      description={
        created
          ? "Store the signing secret before you close this."
          : "Send MarketFlow events to an external application in real time."
      }
      footer={
        created ? (
          <Button size="compact" onClick={onClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="cancel" size="compact" onClick={onClose}>
              Cancel
            </Button>
            <Button size="compact" onClick={submit}>
              Create endpoint
            </Button>
          </>
        )
      }
    >
      {created ? (
        <div className="space-y-4">
          <OneTimeSecret
            secret={created.secretReveal}
            label="Signing secret"
            note="MarketFlow signs every delivery with this. Store it in your application before closing - it can be regenerated later, but doing so invalidates the old one."
          />

          <dl className="space-y-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm text-text-muted">Endpoint</dt>
              <dd className="min-w-0 truncate font-mono text-meta text-text-primary">
                {created.url}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-sm text-text-muted">Events</dt>
              <dd className="min-w-0">
                <EventKeyList events={created.events} max={4} className="justify-end" />
              </dd>
            </div>
          </dl>
        </div>
      ) : (
        <div className="space-y-5">
          <Field
            label="Name"
            htmlFor="webhook-name"
            hint="How this endpoint appears in the list. Name it after the system receiving it."
            error={nameError}
          >
            <Input
              id="webhook-name"
              value={name}
              error={Boolean(nameError)}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field
            label="Endpoint URL"
            htmlFor="webhook-url"
            hint="MarketFlow sends a POST with a JSON body to this address."
            error={urlError}
          >
            <Input
              id="webhook-url"
              type="url"
              value={url}
              error={Boolean(urlError)}
              onChange={(event) => setUrl(event.target.value)}
              className="font-mono"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Timeout"
              htmlFor="webhook-timeout"
              hint="A slower endpoint is treated as a failure."
            >
              <Select
                id="webhook-timeout"
                label="Timeout"
                hideLabel={false}
                value={timeoutSeconds}
                onChange={setTimeoutSeconds}
                options={TIMEOUTS}
              />
            </Field>

            <Field
              label="Retry attempts"
              htmlFor="webhook-retries"
              hint="Retried with an increasing delay between each."
            >
              <Select
                id="webhook-retries"
                label="Retry attempts"
                hideLabel={false}
                value={retries}
                onChange={setRetries}
                options={RETRIES}
              />
            </Field>
          </div>

          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-text-primary">Events</p>
              <p className="text-meta text-text-muted tabular-nums">
                {events.length} of {WEBHOOK_EVENT_COUNT} selected
              </p>
            </div>
            {eventsError ? (
              <p className="mt-1.5 text-sm text-error">{eventsError}</p>
            ) : (
              <p className="mt-1.5 text-sm text-text-muted">
                Only the events you select are delivered. Subscribing to
                everything costs quota and makes the log harder to read.
              </p>
            )}
            <EventPicker selected={events} onChange={setEvents} className="mt-3" />
          </div>
        </div>
      )}
    </Dialog>
  );
}

/** Deleting an endpoint. Irreversible, so it says so in the merchant's terms. */
export function DeleteWebhookDialog({
  webhook,
  open,
  onClose,
  onConfirm,
}: {
  webhook: Webhook | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!webhook) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${webhook.name}?`}
      description="This endpoint stops receiving events immediately."
      confirmLabel="Delete endpoint"
    >
      <p className="text-sm text-text-secondary">
        {webhook.events.length} subscribed{" "}
        {webhook.events.length === 1 ? "event" : "events"} will no longer be
        delivered to <span className="font-mono">{webhook.url}</span>. The
        delivery history is deleted with it and the signing secret is revoked.
      </p>
    </ConfirmDialog>
  );
}

/** Regenerating a signing secret - reversible, but it breaks every consumer. */
export function RegenerateSecretDialog({
  webhook,
  open,
  onClose,
  onConfirm,
}: {
  webhook: Webhook | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!webhook) return null;

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Regenerate signing secret?"
      description={`Deliveries to ${webhook.name} will be signed with the new secret straight away.`}
      confirmLabel="Regenerate secret"
    >
      <p className="text-sm text-text-secondary">
        Any application still verifying with the old secret will start rejecting
        deliveries. Update the receiving end first, or accept both values during
        the switchover.
      </p>
    </ConfirmDialog>
  );
}
