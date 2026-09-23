"use client";

import { useId, useState } from "react";
import { Archive, History, Target, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Tag } from "@/components/ui/tag";
import { useToast } from "@/components/ui/toast";
import { GOAL_TYPES } from "@/constants/automation";
import { CUSTOMER_SEGMENTS, OWNERS, TAG_NAMES } from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";
import type { Workflow, WorkflowSettings as Settings } from "@/types/workflow";
import { VersionHistoryDialog } from "./version-history";

/**
 * Everything about the workflow that is not a step.
 *
 * Grouped by the question each section answers - who gets in, who is never let
 * in, what takes them out, what counts as success, when we are allowed to
 * send, and what happens when a send fails. Six questions, six cards. One long
 * form would be shorter to write and far harder to audit, and these are the
 * settings a marketing team is actually held to.
 *
 * Enrollment and suppression sit first because they cause the most support
 * tickets: "why did this customer get it twice" and "why did an unsubscribed
 * contact get anything at all".
 */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMEZONES = [
  { value: "workspace", label: "Workspace timezone (GMT+4)" },
  { value: "contact", label: "Contact timezone" },
];

function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader title={title} description={description} action={action} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function WorkflowSettings({
  workflow,
  onArchive,
  onDelete,
  onRestoreVersion,
}: {
  workflow: Workflow;
  onArchive: () => void;
  onDelete: () => void;
  /** Brings an old version back as the working draft. */
  onRestoreVersion?: (version: number) => void;
}) {
  const id = useId();
  const toast = useToast();

  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description);
  const [ownerId, setOwnerId] = useState(workflow.ownerId);
  const [settings, setSettings] = useState<Settings>(workflow.settings);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const patch = <K extends keyof Settings>(key: K, value: Partial<Settings[K]>) =>
    setSettings((current) => ({
      ...current,
      [key]: { ...current[key], ...value },
    }));

  const { enrollment, suppression, exit, goal, timing, failure } = settings;
  const repeatable = enrollment.mode !== "once";

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <Section
          title="General"
          description="What this workflow is called, and who is responsible for it."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
            >
              <History aria-hidden />
              Version history
            </Button>
          }
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
          title="Enrollment"
          description="Who is allowed into this journey, and how often."
        >
          <Field label="A contact may enter" htmlFor={`${id}-entry`}>
            <Select
              id={`${id}-entry`}
              hideLabel={false}
              label="A contact may enter"
              value={enrollment.mode}
              onChange={(mode) =>
                patch("enrollment", { mode: mode as Settings["enrollment"]["mode"] })
              }
              options={[
                {
                  value: "once",
                  label: "Only once",
                  hint: "The safe default for anything that sends a message",
                },
                {
                  value: "every_time",
                  label: "Every time the trigger fires",
                  hint: "For recurring events - orders, appointments, birthdays",
                },
                {
                  value: "cooldown",
                  label: "Again after a cooldown",
                  hint: "Repeatable, but never twice in the same week",
                },
              ]}
            />
          </Field>

          <div className={cn("grid gap-4 sm:grid-cols-2", !repeatable && "opacity-60")}>
            <Field
              label="Cooldown (days)"
              htmlFor={`${id}-cooldown`}
              hint="The gap before the same contact can re-enter."
            >
              <Input
                id={`${id}-cooldown`}
                type="number"
                min={0}
                value={enrollment.cooldownDays}
                disabled={enrollment.mode !== "cooldown"}
                onChange={(event) =>
                  patch("enrollment", { cooldownDays: Number(event.target.value) })
                }
              />
            </Field>

            <Field
              label="Maximum entries"
              htmlFor={`${id}-max`}
              hint="Per contact, for the life of the workflow."
            >
              <Input
                id={`${id}-max`}
                type="number"
                min={1}
                value={enrollment.maxEntries}
                disabled={!repeatable}
                onChange={(event) =>
                  patch("enrollment", { maxEntries: Number(event.target.value) })
                }
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Suppression"
          description="Contacts who are never enrolled, whatever the trigger says."
        >
          <CheckboxField
            id={`${id}-sup-unsub`}
            checked={suppression.unsubscribed}
            onCheckedChange={(checked) => patch("suppression", { unsubscribed: checked })}
            label="Unsubscribed contacts"
            hint="Consent is per channel, and this respects it. Turning it off is almost never right."
          />
          <CheckboxField
            id={`${id}-sup-list`}
            checked={suppression.suppressionList}
            onCheckedChange={(checked) =>
              patch("suppression", { suppressionList: checked })
            }
            label="Anyone on the workspace suppression list"
          />
          <CheckboxField
            id={`${id}-sup-invalid`}
            checked={suppression.invalidContact}
            onCheckedChange={(checked) =>
              patch("suppression", { invalidContact: checked })
            }
            label="Invalid or unreachable contacts"
            hint="No usable phone or email for the channels this workflow sends on."
          />
          <CheckboxField
            id={`${id}-sup-blocked`}
            checked={suppression.blockedWhatsApp}
            onCheckedChange={(checked) =>
              patch("suppression", { blockedWhatsApp: checked })
            }
            label="Contacts who blocked your WhatsApp number"
          />

          <Field
            label="Also exclude a segment"
            htmlFor={`${id}-sup-segment`}
            hint="Anyone in it is skipped, even if they match the trigger."
          >
            <Select
              id={`${id}-sup-segment`}
              hideLabel={false}
              label="Also exclude a segment"
              value={suppression.segmentIds[0] ?? ""}
              placeholder="No segment excluded"
              onChange={(next) =>
                patch("suppression", { segmentIds: next ? [next] : [] })
              }
              options={[
                { value: "", label: "No segment excluded" },
                ...CUSTOMER_SEGMENTS.map((segment) => ({
                  value: segment.id,
                  label: segment.name,
                })),
              ]}
            />
          </Field>

          <Field label="Also exclude a tag" htmlFor={`${id}-sup-tag`}>
            <Select
              id={`${id}-sup-tag`}
              hideLabel={false}
              label="Also exclude a tag"
              value={suppression.tags[0] ?? ""}
              placeholder="No tag excluded"
              onChange={(next) => patch("suppression", { tags: next ? [next] : [] })}
              options={[
                { value: "", label: "No tag excluded" },
                ...TAG_NAMES.map((tag) => ({ value: tag, label: tag })),
              ]}
            />
          </Field>

          {suppression.segmentIds.length > 0 || suppression.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {suppression.segmentIds.map((segmentId) => (
                <Tag
                  key={segmentId}
                  label={
                    CUSTOMER_SEGMENTS.find((segment) => segment.id === segmentId)?.name ??
                    segmentId
                  }
                  onRemove={() => patch("suppression", { segmentIds: [] })}
                />
              ))}
              {suppression.tags.map((tag) => (
                <Tag key={tag} label={tag} onRemove={() => patch("suppression", { tags: [] })} />
              ))}
            </div>
          ) : null}
        </Section>

        <Section
          title="Goal"
          description="What success looks like. Conversion is measured against this."
          action={
            goal.enabled ? (
              <Badge tone="brand">
                <Target className="size-3" aria-hidden />
                Set
              </Badge>
            ) : null
          }
        >
          <CheckboxField
            id={`${id}-goal-on`}
            checked={goal.enabled}
            onCheckedChange={(checked) => patch("goal", { enabled: checked })}
            label="Measure this workflow against a goal"
            hint="Without one, conversion is just 'reached the last step', which is not the same thing."
          />

          <div className={cn("space-y-4", !goal.enabled && "opacity-60")}>
            <Field label="Goal" htmlFor={`${id}-goal`}>
              <Select
                id={`${id}-goal`}
                hideLabel={false}
                label="Goal"
                value={goal.type}
                disabled={!goal.enabled}
                onChange={(next) => patch("goal", { type: next as Settings["goal"]["type"] })}
                options={GOAL_TYPES.map((item) => ({
                  value: item.value,
                  label: item.label,
                  hint: item.hint,
                }))}
              />
            </Field>

            {goal.type === "purchase_value" ? (
              <Field
                label="Minimum order value"
                htmlFor={`${id}-goal-value`}
                hint="Orders below this do not count as a conversion."
              >
                <Input
                  id={`${id}-goal-value`}
                  type="number"
                  min={0}
                  value={goal.value ?? 100}
                  disabled={!goal.enabled}
                  onChange={(event) => patch("goal", { value: Number(event.target.value) })}
                />
              </Field>
            ) : null}

            <Field
              label="Attribution window (days)"
              htmlFor={`${id}-goal-window`}
              hint="How long after entry the goal can still be credited to this workflow."
            >
              <Input
                id={`${id}-goal-window`}
                type="number"
                min={1}
                value={goal.windowDays}
                disabled={!goal.enabled}
                onChange={(event) => patch("goal", { windowDays: Number(event.target.value) })}
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
            checked={exit.goalReached}
            onCheckedChange={(checked) => patch("exit", { goalReached: checked })}
            label="The goal is reached"
            hint="Stop messaging somebody about a cart they have already bought."
          />
          <CheckboxField
            id={`${id}-exit-purchase`}
            checked={exit.purchased}
            onCheckedChange={(checked) => patch("exit", { purchased: checked })}
            label="They place an order"
          />
          <CheckboxField
            id={`${id}-exit-won`}
            checked={exit.leadWon}
            onCheckedChange={(checked) => patch("exit", { leadWon: checked })}
            label="Their lead is marked Won"
          />
          <CheckboxField
            id={`${id}-exit-segment`}
            checked={exit.enteredSegment}
            onCheckedChange={(checked) => patch("exit", { enteredSegment: checked })}
            label="They enter a segment"
          />

          {exit.enteredSegment ? (
            <Field label="Which segment" htmlFor={`${id}-exit-segment-id`}>
              <Select
                id={`${id}-exit-segment-id`}
                hideLabel={false}
                label="Which segment"
                value={exit.segmentId ?? ""}
                placeholder="Choose a segment"
                onChange={(next) => patch("exit", { segmentId: next })}
                options={CUSTOMER_SEGMENTS.map((segment) => ({
                  value: segment.id,
                  label: segment.name,
                }))}
              />
            </Field>
          ) : null}

          <CheckboxField
            id={`${id}-exit-tag`}
            checked={exit.tagAdded}
            onCheckedChange={(checked) => patch("exit", { tagAdded: checked })}
            label="A tag is added to them"
          />

          {exit.tagAdded ? (
            <Field label="Which tag" htmlFor={`${id}-exit-tag-name`}>
              <Select
                id={`${id}-exit-tag-name`}
                hideLabel={false}
                label="Which tag"
                value={exit.tag ?? ""}
                placeholder="Choose a tag"
                onChange={(next) => patch("exit", { tag: next })}
                options={TAG_NAMES.map((tag) => ({ value: tag, label: tag }))}
              />
            </Field>
          ) : null}

          <CheckboxField
            id={`${id}-exit-unsub`}
            checked={exit.unsubscribes}
            onCheckedChange={(checked) => patch("exit", { unsubscribes: checked })}
            label="They unsubscribe"
            hint="Strongly recommended, and required on most channels."
          />
          <CheckboxField
            id={`${id}-exit-manual`}
            checked={exit.manualStop}
            onCheckedChange={(checked) => patch("exit", { manualStop: checked })}
            label="An agent stops them manually"
            hint="Lets support remove someone from the journey from Activity."
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
              value={timing.timezone}
              onChange={(next) =>
                patch("timing", { timezone: next as Settings["timing"]["timezone"] })
              }
              options={TIMEZONES}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Send from" htmlFor={`${id}-send-from`}>
              <Input
                id={`${id}-send-from`}
                type="time"
                value={timing.sendFrom}
                onChange={(event) => patch("timing", { sendFrom: event.target.value })}
              />
            </Field>
            <Field label="Send until" htmlFor={`${id}-send-to`}>
              <Input
                id={`${id}-send-to`}
                type="time"
                value={timing.sendTo}
                onChange={(event) => patch("timing", { sendTo: event.target.value })}
              />
            </Field>
          </div>

          <CheckboxField
            id={`${id}-quiet`}
            checked={timing.quietHours.enabled}
            onCheckedChange={(checked) =>
              patch("timing", { quietHours: { ...timing.quietHours, enabled: checked } })
            }
            label="Hold promotional messages during quiet hours"
            hint="Anything due inside the window is sent when it closes. Transactional steps can opt out per node."
          />

          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2",
              !timing.quietHours.enabled && "opacity-60",
            )}
          >
            <Field label="Quiet from" htmlFor={`${id}-quiet-from`}>
              <Input
                id={`${id}-quiet-from`}
                type="time"
                value={timing.quietHours.from}
                disabled={!timing.quietHours.enabled}
                onChange={(event) =>
                  patch("timing", {
                    quietHours: { ...timing.quietHours, from: event.target.value },
                  })
                }
              />
            </Field>
            <Field label="Quiet until" htmlFor={`${id}-quiet-to`}>
              <Input
                id={`${id}-quiet-to`}
                type="time"
                value={timing.quietHours.to}
                disabled={!timing.quietHours.enabled}
                onChange={(event) =>
                  patch("timing", {
                    quietHours: { ...timing.quietHours, to: event.target.value },
                  })
                }
              />
            </Field>
          </div>

          <fieldset>
            <legend className="block mb-2 text-sm font-bold text-text-secondary">
              Allowed sending days
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const on = timing.days.includes(day);

                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      patch("timing", {
                        days: on
                          ? timing.days.filter((item) => item !== day)
                          : [...timing.days, day],
                      })
                    }
                    className={cn(
                      "rounded-btn border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
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
          className="xl:col-span-2"
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <CheckboxField
                id={`${id}-retry`}
                checked={failure.retry}
                onCheckedChange={(checked) => patch("failure", { retry: checked })}
                label="Retry failed actions automatically"
                hint="Retries back off exponentially from the interval below."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Maximum retries" htmlFor={`${id}-retries`}>
                  <Input
                    id={`${id}-retries`}
                    type="number"
                    min={0}
                    max={10}
                    value={failure.maxRetries}
                    disabled={!failure.retry}
                    onChange={(event) =>
                      patch("failure", { maxRetries: Number(event.target.value) })
                    }
                  />
                </Field>
                <Field label="First retry after (minutes)" htmlFor={`${id}-interval`}>
                  <Input
                    id={`${id}-interval`}
                    type="number"
                    min={1}
                    value={failure.retryIntervalMinutes}
                    disabled={!failure.retry}
                    onChange={(event) =>
                      patch("failure", {
                        retryIntervalMinutes: Number(event.target.value),
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4">
              <CheckboxField
                id={`${id}-continue`}
                checked={failure.continueOnNonCritical}
                onCheckedChange={(checked) =>
                  patch("failure", { continueOnNonCritical: checked })
                }
                label="Continue on a non-critical error"
                hint="A tag that could not be written should not stop a delivery message."
              />
              <CheckboxField
                id={`${id}-stop`}
                checked={failure.stopOnCritical}
                onCheckedChange={(checked) => patch("failure", { stopOnCritical: checked })}
                label="Stop the workflow on a critical error"
                hint="A revoked WhatsApp connection stops the journey rather than failing every contact in turn."
              />
            </div>
          </div>
        </Section>

        <Card className="xl:col-span-2">
          <CardHeader
            title="Archive"
            description="Take the workflow out of the list without losing its reporting."
          />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-text-secondary">
              Archiving stops new contacts entering and holds everyone already
              inside. The workflow stays available under the Archived filter,
              and its runs remain in Activity.
            </p>
            <Button variant="outline" onClick={() => setConfirmArchive(true)}>
              <Archive aria-hidden />
              Archive Workflow
            </Button>
          </CardBody>
        </Card>

        <Card className="border-error/40 xl:col-span-2">
          <CardHeader title="Danger zone" description="Irreversible, and immediate." />
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-xl text-sm text-text-secondary">
              Deleting removes the workflow, every version of it, its settings
              and its execution history. Contacts inside the journey are stopped
              at once and no scheduled message will be sent.
            </p>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 aria-hidden />
              Delete Workflow
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-end gap-2.5 rounded-card border border-border bg-surface/95 px-4 py-3 shadow-float backdrop-blur">
        <p className="mr-auto text-sm text-text-muted">
          Settings apply to contacts entering from now on - people already
          inside keep the rules they entered under.
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

      <VersionHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        workflow={workflow}
        onRestore={(version) => {
          setHistoryOpen(false);
          onRestoreVersion?.(version);
        }}
      />

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
