"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  AudiencePreview,
  RuleGroupEditor,
} from "@/components/customers/segment-rule-builder";
import {
  AUTOMATION_ROUTES,
  TRIGGER_CATEGORIES,
  startTypeMeta,
} from "@/constants/automation";
import { OWNERS, emptyGroup, type RuleGroup } from "@/lib/customer-fixtures";
import { formatCount } from "@/lib/format";
import { AUTOMATION_TRIGGERS, createDraftWorkflow } from "@/lib/workflow-fixtures";
import { useForms } from "@/lib/form-store";
import { cn } from "@/lib/utils";
import type { StartTypeKey, TriggerCategory } from "@/types/workflow";
import { EventKey } from "../automation-badges";
import { StartTypeCards } from "./start-type-cards";

/**
 * Creating an automation, in two steps.
 *
 * Step one is the mechanism - how contacts get in. Step two configures it, and
 * only then does the builder open. That order is the whole point: a canvas
 * whose trigger is already answered is a canvas somebody can start from, and
 * "choose how customers should enter this workflow" is a question everybody
 * can answer on their first day.
 *
 * Two of the six start types have no second step. Template hands off to the
 * library, and Blank goes straight to the canvas - because somebody who picked
 * "start from scratch" has already said they do not want to be asked anything.
 */

const SCHEDULES = [
  { value: "birthday", label: "Birthday", hint: "On the contact's birthday" },
  { value: "appointment", label: "Appointment date", hint: "Before a booked slot" },
  { value: "renewal", label: "Renewal date", hint: "Before a subscription renews" },
  { value: "custom_field", label: "Custom contact date field", hint: "Any date you store" },
  { value: "specific", label: "A specific date", hint: "One run, at a time you pick" },
  { value: "daily", label: "Daily", hint: "Every day at a set time" },
  { value: "weekly", label: "Weekly", hint: "One day a week" },
  { value: "monthly", label: "Monthly", hint: "One day a month" },
];

const OFFSETS = [
  { value: "3_before", label: "3 days before" },
  { value: "1_before", label: "1 day before" },
  { value: "on", label: "On the day" },
  { value: "1_after", label: "1 day after" },
  { value: "7_after", label: "7 days after" },
];

const AUTH_MODES = [
  { value: "signature", label: "Signed with your workspace secret" },
  { value: "bearer", label: "Bearer token" },
  { value: "none", label: "No authentication (not recommended)" },
];

/** The step rail. Two steps, so it says where you are without a progress bar. */
function Steps({ step }: { step: 1 | 2 }) {
  const items = ["Choose a start type", "Configure the start"];

  return (
    <ol className="flex flex-wrap items-center gap-2">
      {items.map((label, index) => {
        const number = index + 1;
        const active = number === step;
        const done = number < step;

        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
                active
                  ? "border-primary bg-primary-soft text-primary-dark"
                  : done
                    ? "border-border bg-surface text-text-secondary"
                    : "border-border bg-surface text-text-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-full text-xs font-bold tabular-nums",
                  active || done ? "bg-primary text-white" : "bg-surface-secondary text-text-muted",
                )}
              >
                {number}
              </span>
              {label}
            </span>
            {number < items.length ? (
              <ChevronRight className="size-4 text-border-strong" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * `initialEvent` and `initialFormId` come from the URL - Forms links here with
 * `?event=form.submitted&form=…` when someone picks "Create new workflow" - and
 * open the wizard on step two with that event, and that form, already chosen.
 */
export function CreateWorkflowWizard({
  initialEvent,
  initialFormId,
}: {
  initialEvent?: string;
  initialFormId?: string;
} = {}) {
  const router = useRouter();
  const toast = useToast();
  const forms = useForms();

  const presetTrigger = initialEvent
    ? AUTOMATION_TRIGGERS.find((item) => item.eventKey === initialEvent)
    : undefined;
  const presetForm = forms.find((form) => form.id === initialFormId);

  const [step, setStep] = useState<1 | 2>(presetTrigger ? 2 : 1);
  const [startType, setStartType] = useState<StartTypeKey | null>(
    presetTrigger ? "event" : null,
  );

  const [name, setName] = useState(
    presetTrigger ? `${presetForm?.name ?? presetTrigger.name} follow-up` : "",
  );
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(OWNERS[0]?.id ?? "own-1");
  const [touched, setTouched] = useState(false);

  /* Event-based */
  const [category, setCategory] = useState<TriggerCategory>(
    presetTrigger?.category ?? "leads",
  );
  const [eventKey, setEventKey] = useState(presetTrigger?.eventKey ?? "lead.created");
  /* Form Submitted only: the one form it listens to, or every form. */
  const [formId, setFormId] = useState(presetForm?.id ?? "");
  const [entryFilter, setEntryFilter] = useState<RuleGroup>(emptyGroup("entry", "all"));

  /* Criteria-based */
  const [criteria, setCriteria] = useState<RuleGroup>(emptyGroup("criteria", "all"));

  /* Schedule-based */
  const [schedule, setSchedule] = useState("birthday");
  const [offset, setOffset] = useState("on");
  const [time, setTime] = useState("09:00");

  /* Webhook */
  const [customKey, setCustomKey] = useState("demo_requested");
  const [auth, setAuth] = useState("signature");

  const meta = startType ? startTypeMeta(startType) : null;

  const eventsInCategory = useMemo(
    () =>
      AUTOMATION_TRIGGERS.filter(
        (trigger) => trigger.category === category && trigger.status !== "disabled",
      ),
    [category],
  );

  const trigger = AUTOMATION_TRIGGERS.find((item) => item.eventKey === eventKey);

  function choose(key: StartTypeKey) {
    setStartType(key);

    /* The two shortcuts do not have a second step - asking anyway would be
       ceremony for its own sake. */
    if (key === "template") {
      router.push(AUTOMATION_ROUTES.templates);
      return;
    }

    if (key === "blank") {
      const workflow = createDraftWorkflow({
        name: "Untitled workflow",
        description: "Built from an empty canvas.",
        triggerKey: "",
        triggerLabel: "Trigger",
        start: { type: "blank" },
      });
      toast("Blank workflow created - add a trigger to start", "success");
      router.push(AUTOMATION_ROUTES.workflow(workflow.id));
      return;
    }

    setName((current) => current || suggestedName(key));
    setStep(2);
  }

  function suggestedName(key: StartTypeKey) {
    switch (key) {
      case "event":
        return `${trigger?.name ?? "Event"} follow-up`;
      case "criteria":
        return "Criteria-based journey";
      case "schedule":
        return "Scheduled journey";
      case "webhook":
        return "API-triggered journey";
      default:
        return "Untitled workflow";
    }
  }

  function create() {
    setTouched(true);
    if (!startType || name.trim().length === 0) return;

    const label =
      startType === "event"
        ? (trigger?.name ?? "Trigger")
        : startType === "criteria"
          ? "Matches criteria"
          : startType === "schedule"
            ? (SCHEDULES.find((item) => item.value === schedule)?.label ?? "Schedule")
            : "Webhook received";

    const key =
      startType === "event"
        ? eventKey
        : startType === "webhook"
          ? customKey
          : startType === "schedule"
            ? `date.${schedule}`
            : "segment.entered";

    const scopedForm =
      startType === "event" && eventKey === "form.submitted"
        ? forms.find((form) => form.id === formId)
        : undefined;

    const workflow = createDraftWorkflow({
      name: name.trim(),
      description:
        description.trim() || `Automated journey starting from ${label.toLowerCase()}.`,
      triggerKey: key,
      triggerLabel: label,
      ownerId,
      triggerSummary:
        startType === "event" && eventKey === "form.submitted"
          ? (scopedForm?.name ?? "Any form")
          : undefined,
      start: {
        type: startType,
        eventKey: startType === "event" ? eventKey : undefined,
        formId: scopedForm?.id,
        criteria: startType === "criteria" ? criteria : undefined,
        schedule:
          startType === "schedule"
            ? `${SCHEDULES.find((item) => item.value === schedule)?.label} · ${
                OFFSETS.find((item) => item.value === offset)?.label
              } at ${time}`
            : undefined,
        conditions: startType === "event" ? entryFilter : undefined,
      },
    });

    toast(`${workflow.name} created as a draft`, "success");
    router.push(AUTOMATION_ROUTES.workflow(workflow.id));
  }

  return (
    <>
      <ButtonLink
        href={AUTOMATION_ROUTES.workflows}
        variant="subtle"
        size="inline"
        className="w-fit text-[15px]"
      >
        <ChevronLeft aria-hidden />
        Back to Workflows
      </ButtonLink>

      <PageHeader
        title="Create Automation"
        description="Choose how customers should enter this workflow."
        action={
          step === 2 ? (
            <Button onClick={create}>
              <Plus aria-hidden />
              Create workflow
            </Button>
          ) : undefined
        }
        secondaryActions={
          step === 2 ? (
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft aria-hidden />
              Back
            </Button>
          ) : undefined
        }
      />

      <Steps step={step} />

      {step === 1 ? (
        <>
          <StartTypeCards value={startType ?? undefined} onSelect={choose} />

          <p className="text-sm text-text-muted">
            Not sure? <strong>Event-based</strong> covers most journeys - a lead
            arrives, an order is paid, somebody messages you on WhatsApp.
          </p>
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            {startType === "event" ? (
              <Card>
                <CardHeader
                  title="Choose the event"
                  description="The moment a contact is enrolled."
                />
                <CardBody className="space-y-4">
                  <div
                    role="group"
                    aria-label="Event sources"
                    className="custom-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
                  >
                    {TRIGGER_CATEGORIES.map((item) => {
                      const selected = category === item.value;

                      return (
                        <button
                          key={item.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => {
                            setCategory(item.value);
                            const first = AUTOMATION_TRIGGERS.find(
                              (candidate) =>
                                candidate.category === item.value &&
                                candidate.status !== "disabled",
                            );
                            if (first) setEventKey(first.eventKey);
                          }}
                          className={cn(
                            "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                            selected
                              ? "border-primary bg-primary-soft text-primary-dark"
                              : "border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary",
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <ul className="grid gap-2 sm:grid-cols-2">
                    {eventsInCategory.map((item) => {
                      const selected = eventKey === item.eventKey;

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-pressed={selected}
                            onClick={() => setEventKey(item.eventKey)}
                            className={cn(
                              "w-full rounded-panel border p-3 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                              selected
                                ? "border-primary bg-primary-soft/40"
                                : "border-border hover:border-border-strong hover:bg-surface-secondary",
                            )}
                          >
                            <span className="block text-sm font-semibold text-text-primary">
                              {item.name}
                            </span>
                            <span className="mt-1 block">
                              <EventKey value={item.eventKey} />
                            </span>
                            <span className="mt-1.5 block text-sm text-text-muted">
                              {item.description}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>

                  {eventKey === "form.submitted" ? (
                    <Field
                      label="Form"
                      htmlFor="wizard-form"
                      hint="Scope the journey to one form, or run it for every form in the workspace."
                    >
                      <Select
                        id="wizard-form"
                        hideLabel={false}
                        label="Form"
                        value={formId}
                        onChange={setFormId}
                        options={[
                          { value: "", label: "Any form" },
                          ...forms.map((form) => ({ value: form.id, label: form.name })),
                        ]}
                      />
                    </Field>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            {startType === "event" ? (
              <Card>
                <CardHeader
                  title="Enrollment conditions"
                  description="Optional. Only contacts matching these are enrolled when the event fires."
                />
                <CardBody className="space-y-3">
                  <RuleGroupEditor rule={entryFilter} onChange={setEntryFilter} />
                  <p className="text-sm text-text-muted">
                    Leave this empty and every contact the event fires for is
                    enrolled.
                  </p>
                </CardBody>
              </Card>
            ) : null}

            {startType === "criteria" ? (
              <Card>
                <CardHeader
                  title="Enrollment criteria"
                  description="Contacts are enrolled the moment they start matching this rule."
                />
                <CardBody className="space-y-4">
                  <RuleGroupEditor rule={criteria} onChange={setCriteria} />
                  <AudiencePreview rule={criteria} type="dynamic" />
                  <p className="text-sm text-text-muted">
                    The count above is who matches right now. New contacts are
                    enrolled as they start matching, so the workflow keeps
                    running after today.
                  </p>
                </CardBody>
              </Card>
            ) : null}

            {startType === "schedule" ? (
              <Card>
                <CardHeader
                  title="Choose the schedule"
                  description="When this workflow should start, relative to a date or a clock."
                />
                <CardBody className="space-y-4">
                  <Field label="Start from" htmlFor="schedule-kind">
                    <Select
                      id="schedule-kind"
                      hideLabel={false}
                      label="Start from"
                      value={schedule}
                      onChange={setSchedule}
                      options={SCHEDULES}
                    />
                  </Field>

                  {["birthday", "appointment", "renewal", "custom_field"].includes(
                    schedule,
                  ) ? (
                    <Field
                      label="Relative to that date"
                      htmlFor="schedule-offset"
                      hint="A reminder usually wants to arrive before; a follow-up after."
                    >
                      <Select
                        id="schedule-offset"
                        hideLabel={false}
                        label="Relative to that date"
                        value={offset}
                        onChange={setOffset}
                        options={OFFSETS}
                      />
                    </Field>
                  ) : null}

                  <Field
                    label="Time of day"
                    htmlFor="schedule-time"
                    hint="In the contact's timezone where one is known."
                  >
                    <Input
                      id="schedule-time"
                      type="time"
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                    />
                  </Field>
                </CardBody>
              </Card>
            ) : null}

            {startType === "webhook" ? (
              <Card>
                <CardHeader
                  title="Event endpoint"
                  description="Where your systems POST to start this workflow."
                />
                <CardBody className="space-y-4">
                  <Field
                    label="Event key"
                    htmlFor="webhook-key"
                    hint="Lowercase, dots and underscores. This is what you POST."
                  >
                    <Input
                      id="webhook-key"
                      value={customKey}
                      onChange={(event) => setCustomKey(event.target.value)}
                      className="font-mono text-sm"
                    />
                  </Field>

                  <Field label="Authentication" htmlFor="webhook-auth">
                    <Select
                      id="webhook-auth"
                      hideLabel={false}
                      label="Authentication"
                      value={auth}
                      onChange={setAuth}
                      options={AUTH_MODES}
                    />
                  </Field>

                  <div>
                    <p className="text-sm font-medium text-text-muted">
                      Endpoint
                    </p>
                    <pre className="custom-scrollbar mt-1.5 overflow-x-auto rounded-panel bg-surface-secondary px-3.5 py-3 font-mono text-sm text-text-secondary">
{`POST https://api.marketflow.app/v1/events
{
  "event": "${customKey}",
  "contact_id": "CT-8451"
}`}
                    </pre>
                  </div>
                </CardBody>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader
                title="Name this workflow"
                description="You can change all of this later in Settings."
              />
              <CardBody className="space-y-4">
                <Field
                  label="Workflow name"
                  htmlFor="wizard-name"
                  error={
                    touched && name.trim().length === 0
                      ? "Give the workflow a name."
                      : undefined
                  }
                >
                  <Input
                    id="wizard-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    error={touched && name.trim().length === 0}
                  />
                </Field>

                <Field
                  label="Description"
                  htmlFor="wizard-description"
                  hint="One line, shown on the workflow card."
                >
                  <Textarea
                    id="wizard-description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                  />
                </Field>

                <Field label="Owner" htmlFor="wizard-owner">
                  <Select
                    id="wizard-owner"
                    hideLabel={false}
                    label="Owner"
                    value={ownerId}
                    onChange={setOwnerId}
                    options={OWNERS.map((owner) => ({
                      value: owner.id,
                      label: owner.name,
                    }))}
                  />
                </Field>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Summary" description="What you are about to create." />
              <CardBody className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-text-muted">Start type</span>
                  <span className="text-right text-sm font-medium text-text-primary">
                    {meta?.label}
                  </span>
                </div>

                {startType === "event" ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-text-muted">Event</span>
                      <span className="text-right text-sm font-medium text-text-primary">
                        {trigger?.name ?? "-"}
                      </span>
                    </div>
                    {eventKey === "form.submitted" ? (
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm text-text-muted">Form</span>
                        <span className="text-right text-sm font-medium text-text-primary">
                          {forms.find((form) => form.id === formId)?.name ?? "Any form"}
                        </span>
                      </div>
                    ) : null}
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm text-text-muted">Traffic</span>
                      <span className="text-right text-sm text-text-secondary tabular-nums">
                        {formatCount(trigger?.events24h ?? 0)} events / 24h
                      </span>
                    </div>
                  </>
                ) : null}

                {startType === "schedule" ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-text-muted">Schedule</span>
                    <span className="text-right text-sm font-medium text-text-primary">
                      {SCHEDULES.find((item) => item.value === schedule)?.label} at {time}
                    </span>
                  </div>
                ) : null}

                {startType === "webhook" ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-sm text-text-muted">Event key</span>
                    <EventKey value={customKey} />
                  </div>
                ) : null}

                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm text-text-muted">Status on create</span>
                  <Badge variant="default">Draft</Badge>
                </div>

                <p className="border-t border-border pt-3 text-sm text-text-muted">
                  Nothing sends until you build the journey and publish it.
                </p>

                <Button className="w-full" onClick={create}>
                  <Plus aria-hidden />
                  Create workflow
                </Button>
                <ButtonLink
                  href={AUTOMATION_ROUTES.templates}
                  variant="outline"
                  className="w-full"
                >
                  Start from a template instead
                </ButtonLink>
              </CardBody>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
