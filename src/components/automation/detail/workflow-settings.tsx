"use client";

import { useId, useState } from "react";
import { Archive, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { OWNERS } from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowSettings as Settings } from "@/types/workflow";

/**
 * Everything about the workflow that is not a step.
 *
 * Grouped by the question each section answers — who can get in, what takes
 * them out, when it is allowed to send, and what happens when a send fails —
 * rather than as one long form, because those are four separate decisions and
 * only one of them is usually being changed.
 *
 * Entry and exit rules are the two that quietly cause the most support
 * tickets ("why did this customer get it twice?"), so they are stated in full
 * sentences rather than as toggle labels.
 */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMEZONES = [
  { value: "Workspace timezone (GMT+4)", label: "Workspace timezone (GMT+4)" },
  { value: "Contact timezone", label: "Contact timezone" },
  { value: "UTC", label: "UTC" },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function WorkflowSettings({
  workflow,
  onArchive,
  onDelete,
}: {
  workflow: Workflow;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const id = useId();
  const toast = useToast();

  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [ownerId, setOwnerId] = useState(workflow.ownerId);
  const [settings, setSettings] = useState<Settings>(workflow.settings);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const patch = <K extends keyof Settings>(key: K, value: Partial<Settings[K]>) =>
    setSettings((current) => ({
      ...current,
      [key]: { ...current[key], ...value },
    }));

  const reEntry = settings.entry.mode === "re_entry";

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="General"
          description="What this workflow is called, and who is responsible for it."
        >
          <Field label="Workflow name" htmlFor={`${id}-name`}>
            <Input
              id={`${id}-name`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>

          <Field
            label="Description"
            htmlFor={`${id}-description`}
            hint="Shown on the workflow card and in the template library."
          >
            <Textarea
              id={`${id}-description`}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </Field>

          <Field
            label="Owner"
            htmlFor={`${id}-owner`}
            hint="Gets the internal notifications this workflow raises."
          >
            <Select
              id={`${id}-owner`}
              hideLabel={false}
              label="Owner"
              value={ownerId}
              onChange={setOwnerId}
              options={OWNERS.map((owner) => ({ value: owner.id, label: owner.name }))}
            />
          </Field>
        </Section>

        <Section
          title="Entry rules"
          description="Who is allowed into this journey, and how often."
        >
          <Field label="Entry" htmlFor={`${id}-entry`}>
            <Select
              id={`${id}-entry`}
              hideLabel={false}
              label="Entry"
              value={settings.entry.mode}
              onChange={(mode) => patch("entry", { mode: mode as Settings["entry"]["mode"] })}
              options={[
                {
                  value: "once",
                  label: "Allow a contact to enter once",
                  hint: "The safe default for anything that sends a message",
                },
                {
                  value: "re_entry",
                  label: "Allow re-entry",
                  hint: "For recurring journeys — orders, appointments, birthdays",
                },
              ]}
            />
          </Field>

          <div className={cn("grid gap-4 sm:grid-cols-2", !reEntry && "opacity-60")}>
            <Field
              label="Maximum entries"
              htmlFor={`${id}-max`}
              hint="Per contact, for the life of the workflow."
            >
              <Input
                id={`${id}-max`}
                type="number"
                min={1}
                value={settings.entry.maxEntries}
                disabled={!reEntry}
                onChange={(event) =>
                  patch("entry", { maxEntries: Number(event.target.value) })
                }
              />
            </Field>

            <Field
              label="Cooldown (hours)"
              htmlFor={`${id}-cooldown`}
              hint="The gap before the same contact can re-enter."
            >
              <Input
                id={`${id}-cooldown`}
                type="number"
                min={0}
                value={settings.entry.cooldownHours}
                disabled={!reEntry}
                onChange={(event) =>
                  patch("entry", { cooldownHours: Number(event.target.value) })
                }
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Exit rules"
          description="What takes a contact out of the journey before it finishes."
        >
          <CheckboxField
            id={`${id}-exit-goal`}
            checked={settings.exit.goalReached}
            onCheckedChange={(checked) => patch("exit", { goalReached: checked })}
            label="Goal reached"
            hint="Exit as soon as the workflow's goal is met — a purchase, a reply, a booking."
          />
          <CheckboxField
            id={`${id}-exit-segment`}
            checked={settings.exit.leavesSegment}
            onCheckedChange={(checked) => patch("exit", { leavesSegment: checked })}
            label="Contact leaves the entry segment"
            hint="Only applies to workflows triggered by segment membership."
          />
          <CheckboxField
            id={`${id}-exit-unsub`}
            checked={settings.exit.unsubscribes}
            onCheckedChange={(checked) => patch("exit", { unsubscribes: checked })}
            label="Contact unsubscribes"
            hint="Strongly recommended. Consent is per channel, and this respects it."
          />
          <CheckboxField
            id={`${id}-exit-manual`}
            checked={settings.exit.manualStop}
            onCheckedChange={(checked) => patch("exit", { manualStop: checked })}
            label="Allow manual stop"
            hint="Lets an agent remove someone from the journey from Activity."
          />
        </Section>

        <Section
          title="Timing"
          description="When this workflow is allowed to reach people."
        >
          <Field label="Timezone" htmlFor={`${id}-tz`}>
            <Select
              id={`${id}-tz`}
              hideLabel={false}
              label="Timezone"
              value={settings.timing.timezone}
              onChange={(timezone) => patch("timing", { timezone })}
              options={TIMEZONES}
            />
          </Field>

          <CheckboxField
            id={`${id}-quiet`}
            checked={settings.timing.quietHours.enabled}
            onCheckedChange={(checked) =>
              patch("timing", {
                quietHours: { ...settings.timing.quietHours, enabled: checked },
              })
            }
            label="Hold messages during quiet hours"
            hint="Anything due inside the window is sent when it closes."
          />

          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              !settings.timing.quietHours.enabled && "opacity-60",
            )}
          >
            <Field label="From" htmlFor={`${id}-quiet-from`}>
              <Input
                id={`${id}-quiet-from`}
                type="time"
                value={settings.timing.quietHours.from}
                disabled={!settings.timing.quietHours.enabled}
                onChange={(event) =>
                  patch("timing", {
                    quietHours: {
                      ...settings.timing.quietHours,
                      from: event.target.value,
                    },
                  })
                }
              />
            </Field>
            <Field label="Until" htmlFor={`${id}-quiet-to`}>
              <Input
                id={`${id}-quiet-to`}
                type="time"
                value={settings.timing.quietHours.to}
                disabled={!settings.timing.quietHours.enabled}
                onChange={(event) =>
                  patch("timing", {
                    quietHours: { ...settings.timing.quietHours, to: event.target.value },
                  })
                }
              />
            </Field>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text-primary">
              Allowed sending days
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const on = settings.timing.days.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      patch("timing", {
                        days: on
                          ? settings.timing.days.filter((item) => item !== day)
                          : [...settings.timing.days, day],
                      })
                    }
                    className={cn(
                      "rounded-btn border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      on
                        ? "border-primary bg-primary-soft text-primary-dark"
                        : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text-primary",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </Section>

        <Section
          title="Failure handling"
          description="What happens when a step cannot complete."
        >
          <CheckboxField
            id={`${id}-retry`}
            checked={settings.failure.retry}
            onCheckedChange={(checked) => patch("failure", { retry: checked })}
            label="Retry failed actions"
            hint="Retries use exponential backoff, starting at one minute."
          />

          <Field
            label="Maximum retries"
            htmlFor={`${id}-retries`}
            hint="After this, the step is marked failed and the rules below apply."
          >
            <Input
              id={`${id}-retries`}
              type="number"
              min={0}
              max={10}
              value={settings.failure.maxRetries}
              disabled={!settings.failure.retry}
              onChange={(event) =>
                patch("failure", { maxRetries: Number(event.target.value) })
              }
            />
          </Field>

          <CheckboxField
            id={`${id}-continue`}
            checked={settings.failure.continueOnNonCritical}
            onCheckedChange={(checked) =>
              patch("failure", { continueOnNonCritical: checked })
            }
            label="Continue on a non-critical error"
            hint="A tag that could not be written should not stop a delivery message."
          />
          <CheckboxField
            id={`${id}-stop`}
            checked={settings.failure.stopOnCritical}
            onCheckedChange={(checked) => patch("failure", { stopOnCritical: checked })}
            label="Stop the workflow on a critical error"
            hint="A revoked WhatsApp connection stops the journey rather than failing every contact in turn."
          />
        </Section>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Archive"
            description="Take the workflow out of the list without losing its reporting."
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-text-secondary">
              Archiving stops new contacts entering and holds everyone already
              inside. The workflow stays available under the Archived filter, and
              its runs remain in Activity.
            </p>
            <Button variant="outline" onClick={() => setConfirmArchive(true)}>
              <Archive aria-hidden />
              Archive Workflow
            </Button>
          </CardBody>
        </Card>

        <Card className="border-error/40 xl:col-span-2">
          <CardHeader
            title="Danger zone"
            description="Irreversible, and immediate."
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-text-secondary">
              Deleting removes the workflow, its steps, its settings and its
              execution history. Contacts inside the journey are stopped at once
              and no scheduled message will be sent.
            </p>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden />
              Delete Workflow
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2.5 rounded-card border border-border bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <p className="mr-auto text-xs text-text-muted">
          Changes apply to contacts entering from now on — people already inside
          keep the rules they entered under.
        </p>
        <Button
          variant="outline"
          size="compact"
          onClick={() => {
            setName(workflow.name);
            setDescription(workflow.description);
            setOwnerId(workflow.ownerId);
            setSettings(workflow.settings);
            toast("Changes discarded", "info");
          }}
        >
          Discard
        </Button>
        <Button size="compact" onClick={() => toast("Settings saved", "success")}>
          Save settings
        </Button>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => {
          setConfirmArchive(false);
          onArchive();
        }}
        title="Archive this workflow?"
        description="It stops running and leaves the workflow list."
        confirmLabel="Archive"
        tone="primary"
      >
        <p className="text-sm text-text-secondary">
          You can restore it at any time from the Archived filter. Its analytics
          and run history are kept.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          onDelete();
        }}
        title={`Delete ${workflow.name}?`}
        description="This cannot be undone."
        confirmLabel="Delete workflow"
        tone="danger"
      >
        <p className="text-sm text-text-secondary">
          {workflow.stats.running.toLocaleString("en-US")} contacts are inside
          this journey right now. They will be stopped immediately and their
          scheduled messages cancelled. Archive it instead if you might want the
          reporting later.
        </p>
      </ConfirmDialog>
    </>
  );
}
