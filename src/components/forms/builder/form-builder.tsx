"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FilePen,
  Link2,
  Loader2,
  MessageSquareText,
  Pause,
  Plus,
  Rocket,
  Unlink,
} from "lucide-react";

import {
  OptionCard,
  StepSection,
  SummaryRow,
  TagPicker,
  TogglePanel,
  WizardStepper,
} from "@/components/marketing-hub/campaign/shared";
import { ServiceNotice } from "@/components/settings/service-notice";
import { WorkflowStatusBadge } from "@/components/automation/automation-badges";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import {
  BUTTON_STYLES,
  DEFAULT_BEHAVIOR,
  DEFAULT_DESIGN,
  DUPLICATE_RULES,
  FORM_LAYOUTS,
  FORM_RADII,
  FORM_ROUTES,
  FORM_SPACINGS,
  FORM_TYPES,
  formTypeLabel,
} from "@/constants/forms";
import {
  CONSENT_CHANNELS,
  CUSTOMER_SEGMENTS,
  LEAD_SOURCES,
  OWNERS,
  PIPELINE_STAGES,
  TAG_NAMES,
  segmentById,
  stageLabel,
} from "@/lib/customer-fixtures";
import { FORM_WORKFLOWS, formWorkflowById } from "@/lib/form-fixtures";
import { createForm, updateForm, type FormDraft } from "@/lib/form-store";
import type { LeadSource, LeadStage } from "@/types/lead";
import type { Form, FormField, FormStatus, FormType } from "@/types/form";
import { FormPreview } from "../form-preview";
import { SubmissionFlow } from "../submission-flow";
import { FieldList, newField } from "./field-list";

/**
 * The form builder, for a new form and an existing one alike.
 *
 * Six steps in the Campaign Wizard's own stepper and step furniture - same
 * rail, same section legends, same option cards - so making a form feels like
 * making a campaign. This component owns the draft and nothing else; each step
 * renders part of it and writes back through `set`, and every derived figure is
 * recomputed on render so the Publish summary cannot disagree with the steps.
 *
 * It is deliberately not a page builder (the Design step is six settings) and
 * not a workflow builder (the Automation step points at one).
 */

const STEPS = [
  { value: "details", label: "Details" },
  { value: "fields", label: "Fields" },
  { value: "design", label: "Design" },
  { value: "behavior", label: "Submission Behavior" },
  { value: "automation", label: "Automation" },
  { value: "publish", label: "Publish" },
] as const;

type StepKey = (typeof STEPS)[number]["value"];
type AutomationMode = "none" | "existing" | "create";

/** Only static segments can be joined - a dynamic one is its rules. */
const JOINABLE_SEGMENTS = CUSTOMER_SEGMENTS.filter(
  (segment) => segment.type === "static" && !segment.system,
);

/** The fields a new form of each type starts with. */
function starterFields(type: FormType): FormField[] {
  const kinds: Record<FormType, FormField["kind"][]> = {
    lead_capture: ["first_name", "last_name", "email", "phone", "company", "consent"],
    contact: ["first_name", "last_name", "email", "phone", "message", "consent"],
    newsletter: ["email", "first_name", "consent"],
    quote: ["first_name", "last_name", "email", "phone", "company", "textarea"],
    registration: ["first_name", "last_name", "email", "company", "consent"],
    custom: ["email"],
  };
  return kinds[type].map((kind) => {
    const created = newField(kind);
    return kind === "textarea" ? { ...created, label: "What do you need a quote for?" } : created;
  });
}

function emptyDraft(): FormDraft {
  return {
    name: "",
    description: "",
    type: "lead_capture",
    status: "draft",
    fields: starterFields("lead_capture"),
    design: { ...DEFAULT_DESIGN },
    behavior: { ...DEFAULT_BEHAVIOR, createLead: true },
    automation: {},
    ownerId: OWNERS[0]?.id ?? "own-1",
  };
}

const URL_PATTERN = /^https?:\/\/[^\s.]+\.[^\s]+$/i;

/** Blockers per step. A step with any cannot be left forwards. */
function issuesFor(draft: FormDraft) {
  const byStep: Record<StepKey, string[]> = {
    details: [],
    fields: [],
    design: [],
    behavior: [],
    automation: [],
    publish: [],
  };
  const byField: Record<string, string> = {};

  if (!draft.name.trim()) byStep.details.push("Give the form a name.");

  if (draft.fields.length === 0) byStep.fields.push("Add at least one field.");
  if (!draft.fields.some((item) => item.kind === "email" || item.kind === "phone")) {
    byStep.fields.push(
      "Add an Email or Phone field - it is how a submission is matched to its contact.",
    );
  }
  for (const item of draft.fields) {
    if (!item.label.trim()) byField[item.id] = "Give this field a label.";
    else if (
      (item.kind === "dropdown" || item.kind === "radio" || item.kind === "checkbox") &&
      (item.options ?? []).filter((option) => option.trim()).length === 0
    ) {
      byField[item.id] = "Add at least one choice.";
    }
  }
  if (Object.keys(byField).length) byStep.fields.push("Fix the fields marked below.");

  if (!draft.design.buttonLabel.trim()) byStep.design.push("Give the submit button a label.");
  if (draft.behavior.onSuccess === "message" && !draft.design.successMessage.trim()) {
    byStep.design.push("Write the success message visitors see.");
  }

  if (
    draft.behavior.onSuccess === "redirect" &&
    !URL_PATTERN.test(draft.behavior.redirectUrl ?? "")
  ) {
    byStep.behavior.push("Enter the full redirect address, starting with https://.");
  }

  return { byStep, byField };
}

/** Trims choices and drops empty ones - the textarea keeps blanks while typing. */
function cleaned(draft: FormDraft): FormDraft {
  return {
    ...draft,
    name: draft.name.trim(),
    description: draft.description.trim(),
    fields: draft.fields.map((item) => ({
      ...item,
      label: item.label.trim(),
      helpText: item.helpText?.trim() || undefined,
      options: item.options?.map((option) => option.trim()).filter(Boolean),
    })),
  };
}

export function FormBuilder({ form }: { form?: Form }) {
  const router = useRouter();
  const toast = useToast();

  const [draft, setDraft] = useState<FormDraft>(() =>
    form
      ? {
          name: form.name,
          description: form.description,
          type: form.type,
          status: form.status,
          fields: form.fields.map((item) => ({ ...item })),
          design: { ...form.design },
          behavior: { ...form.behavior },
          automation: { ...form.automation },
          ownerId: form.ownerId,
        }
      : emptyDraft(),
  );
  const [mode, setMode] = useState<AutomationMode>(
    form?.automation.workflowId ? "existing" : "none",
  );
  /* Editing opens with every step reachable - the form already exists. */
  const [index, setIndex] = useState(0);
  const [furthest, setFurthest] = useState(form ? STEPS.length - 1 : 0);
  const [showIssues, setShowIssues] = useState(false);
  const [saving, setSaving] = useState(false);
  /* A new form defaults to going live - that is what the last step is for. */
  const [publishAs, setPublishAs] = useState<FormStatus>(
    form && form.status !== "draft" ? form.status : "active",
  );
  /* Whether the fields still match the type's starter set - if so, changing
     the type swaps them; once edited, they are the author's and stay. */
  const [fieldsTouched, setFieldsTouched] = useState(Boolean(form));

  const step = STEPS[index].value;
  const { byStep, byField } = useMemo(() => issuesFor(draft), [draft]);
  const stepIssues = byStep[step];
  const workflow = formWorkflowById(draft.automation.workflowId);

  const set = <K extends keyof FormDraft>(key: K, value: FormDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const setDesign = (patch: Partial<FormDraft["design"]>) =>
    setDraft((current) => ({ ...current, design: { ...current.design, ...patch } }));
  const setBehavior = (patch: Partial<FormDraft["behavior"]>) =>
    setDraft((current) => ({ ...current, behavior: { ...current.behavior, ...patch } }));

  function goNext() {
    if (stepIssues.length) {
      setShowIssues(true);
      return;
    }
    setShowIssues(false);
    const next = Math.min(index + 1, STEPS.length - 1);
    setIndex(next);
    setFurthest((value) => Math.max(value, next));
  }

  function save(status: FormStatus) {
    /* Every step's blockers apply to a save, not just this one's - jump to the
       first step that has any, rather than saving a form that cannot work. */
    const firstBlocked = STEPS.findIndex((item) => byStep[item.value].length > 0);
    if (firstBlocked !== -1) {
      setIndex(firstBlocked);
      setShowIssues(true);
      return;
    }

    setSaving(true);
    const payload = cleaned({
      ...draft,
      status,
      automation: mode === "existing" ? draft.automation : {},
    });
    const saved = form ? updateForm(form.id, payload) : createForm(payload);
    setSaving(false);
    if (!saved) {
      toast("That form no longer exists - it may have been deleted.", "error");
      return;
    }

    toast(
      status === "active"
        ? `${saved.name} is published`
        : form
          ? `${saved.name} saved`
          : `${saved.name} saved as a draft`,
      "success",
    );

    if (mode === "create") {
      /* The workflow is built in Automation, with the trigger already set to
         this form - Forms does not grow a second builder. */
      router.push(
        `${AUTOMATION_ROUTES.create}?event=form.submitted&form=${encodeURIComponent(saved.id)}`,
      );
      return;
    }
    router.push(FORM_ROUTES.form(saved.id));
  }

  const preview = (
    <div className="lg:sticky lg:top-24">
      <p className="mb-2 text-sm font-bold text-text-secondary">Live preview</p>
      <FormPreview
        fields={draft.fields}
        design={draft.design}
        behavior={draft.behavior}
        note="Preview only - nothing was saved. Use Preview on a saved form to record a test submission."
      />
    </div>
  );

  return (
    <Card className="p-5">
      <WizardStepper
        steps={STEPS}
        active={index}
        furthest={furthest}
        onJump={(next) => {
          setIndex(next);
          setShowIssues(false);
        }}
      />

      <div className="mt-6 border-t border-border pt-6">
        {step === "details" ? (
          <div className="max-w-3xl space-y-6">
            <StepSection title="About this form" hint="Only your team sees the name and description.">
              <div className="grid gap-4">
                <Field
                  label="Form name"
                  htmlFor="form-name"
                  error={showIssues && !draft.name.trim() ? "Give the form a name." : undefined}
                >
                  <Input
                    id="form-name"
                    value={draft.name}
                    error={showIssues && !draft.name.trim()}
                    onChange={(event) => set("name", event.target.value)}
                  />
                </Field>
                <Field
                  label="Internal description"
                  htmlFor="form-description"
                  hint="Where it is embedded and what it is for. Never shown to visitors."
                >
                  <Textarea
                    id="form-description"
                    rows={3}
                    value={draft.description}
                    onChange={(event) => set("description", event.target.value)}
                  />
                </Field>
              </div>
            </StepSection>

            <StepSection
              title="Form type"
              hint={
                fieldsTouched
                  ? "Changing the type keeps the fields you have already set up."
                  : "The type picks sensible starting fields. You can change all of them next."
              }
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {FORM_TYPES.map((item) => (
                  <OptionCard
                    key={item.value}
                    selected={draft.type === item.value}
                    onClick={() => {
                      setDraft((current) => ({
                        ...current,
                        type: item.value,
                        fields: fieldsTouched ? current.fields : starterFields(item.value),
                        behavior:
                          fieldsTouched || form
                            ? current.behavior
                            : {
                                ...current.behavior,
                                createLead: ["lead_capture", "contact", "quote"].includes(item.value),
                              },
                      }));
                    }}
                    title={item.label}
                    hint={item.hint}
                  />
                ))}
              </div>
            </StepSection>
          </div>
        ) : null}

        {step === "fields" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <FieldList
              fields={draft.fields}
              issues={showIssues ? byField : {}}
              onChange={(next) => {
                setFieldsTouched(true);
                set("fields", next);
              }}
            />
            {preview}
          </div>
        ) : null}

        {step === "design" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <div className="space-y-6">
              <StepSection title="Layout" hint="The form takes the width of the page it is embedded in.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {FORM_LAYOUTS.map((item) => (
                    <OptionCard
                      key={item.value}
                      selected={draft.design.layout === item.value}
                      onClick={() => setDesign({ layout: item.value })}
                      title={item.label}
                      hint={item.hint}
                    />
                  ))}
                </div>
              </StepSection>

              <StepSection title="Style" hint="MarketFlow's own controls, with three small choices.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Field spacing" htmlFor="design-spacing">
                    <Select
                      id="design-spacing"
                      label="Field spacing"
                      hideLabel={false}
                      value={draft.design.spacing}
                      onChange={(next) => setDesign({ spacing: next })}
                      options={FORM_SPACINGS}
                    />
                  </Field>
                  <Field label="Border radius" htmlFor="design-radius">
                    <Select
                      id="design-radius"
                      label="Border radius"
                      hideLabel={false}
                      value={draft.design.radius}
                      onChange={(next) => setDesign({ radius: next })}
                      options={FORM_RADII}
                    />
                  </Field>
                  <Field label="Button style" htmlFor="design-button-style">
                    <Select
                      id="design-button-style"
                      label="Button style"
                      hideLabel={false}
                      value={draft.design.buttonStyle}
                      onChange={(next) => setDesign({ buttonStyle: next })}
                      options={BUTTON_STYLES}
                    />
                  </Field>
                </div>
              </StepSection>

              <StepSection title="Wording">
                <div className="grid gap-4">
                  <Field
                    label="Button label"
                    htmlFor="design-button-label"
                    error={
                      showIssues && !draft.design.buttonLabel.trim()
                        ? "Give the submit button a label."
                        : undefined
                    }
                  >
                    <Input
                      id="design-button-label"
                      value={draft.design.buttonLabel}
                      error={showIssues && !draft.design.buttonLabel.trim()}
                      onChange={(event) => setDesign({ buttonLabel: event.target.value })}
                    />
                  </Field>
                  <Field
                    label="Success message"
                    htmlFor="design-success"
                    hint={
                      draft.behavior.onSuccess === "redirect"
                        ? "Not shown - this form redirects on success. Change that in Submission Behavior."
                        : "What visitors read after they submit."
                    }
                  >
                    <Textarea
                      id="design-success"
                      rows={3}
                      value={draft.design.successMessage}
                      onChange={(event) => setDesign({ successMessage: event.target.value })}
                    />
                  </Field>
                </div>
              </StepSection>
            </div>
            {preview}
          </div>
        ) : null}

        {step === "behavior" ? (
          <div className="max-w-3xl space-y-6">
            <StepSection title="After a visitor submits" hint="What they see once the form has sent.">
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard
                  selected={draft.behavior.onSuccess === "message"}
                  onClick={() => setBehavior({ onSuccess: "message" })}
                  icon={<MessageSquareText aria-hidden />}
                  title="Show the success message"
                  hint="Replaces the form with your message, on the same page."
                />
                <OptionCard
                  selected={draft.behavior.onSuccess === "redirect"}
                  onClick={() => setBehavior({ onSuccess: "redirect" })}
                  icon={<ExternalLink aria-hidden />}
                  title="Redirect to a page"
                  hint="A thank-you page, a booking link, a download."
                />
              </div>
              {draft.behavior.onSuccess === "redirect" ? (
                <div className="mt-4">
                  <Field
                    label="Redirect URL"
                    htmlFor="behavior-redirect"
                    error={
                      showIssues && !URL_PATTERN.test(draft.behavior.redirectUrl ?? "")
                        ? "Enter the full address, starting with https://."
                        : undefined
                    }
                  >
                    <Input
                      id="behavior-redirect"
                      type="url"
                      value={draft.behavior.redirectUrl ?? ""}
                      error={showIssues && !URL_PATTERN.test(draft.behavior.redirectUrl ?? "")}
                      onChange={(event) => setBehavior({ redirectUrl: event.target.value })}
                    />
                  </Field>
                </div>
              ) : null}
            </StepSection>

            <StepSection
              title="Contact and lead"
              hint="A submission is matched to Customers by email, then phone. A match is updated, never duplicated."
            >
              <div className="space-y-3">
                <TogglePanel
                  id="behavior-contact"
                  checked={draft.behavior.createContact}
                  onCheckedChange={(on) => setBehavior({ createContact: on })}
                  label="Create or update the contact automatically"
                  hint={
                    draft.behavior.createContact
                      ? "New people become contacts; people already in Customers are updated."
                      : "Off: submissions wait on the Submissions tab until someone links them."
                  }
                >
                  <Field label="When the same person submits again" htmlFor="behavior-duplicates">
                    <Select
                      id="behavior-duplicates"
                      label="When the same person submits again"
                      hideLabel={false}
                      value={draft.behavior.duplicates}
                      onChange={(next) => setBehavior({ duplicates: next })}
                      options={DUPLICATE_RULES}
                    />
                  </Field>
                </TogglePanel>

                <TogglePanel
                  id="behavior-lead"
                  checked={draft.behavior.createLead}
                  onCheckedChange={(on) => setBehavior({ createLead: on })}
                  label="Create a lead"
                  hint="Opens a deal in the pipeline once the contact is known. A contact with an open lead keeps that one."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Lead source" htmlFor="behavior-lead-source">
                      <Select
                        id="behavior-lead-source"
                        label="Lead source"
                        hideLabel={false}
                        value={draft.behavior.leadSource}
                        onChange={(next) => setBehavior({ leadSource: next as LeadSource })}
                        options={LEAD_SOURCES}
                      />
                    </Field>
                    <Field label="Lead status" htmlFor="behavior-lead-stage" hint="The pipeline stage it opens in.">
                      <Select
                        id="behavior-lead-stage"
                        label="Lead status"
                        hideLabel={false}
                        value={draft.behavior.leadStage}
                        onChange={(next) => setBehavior({ leadStage: next as LeadStage })}
                        options={PIPELINE_STAGES.filter((item) => item.stage !== "won").map((item) => ({
                          value: item.stage,
                          label: item.label,
                        }))}
                      />
                    </Field>
                  </div>
                </TogglePanel>
              </div>
            </StepSection>

            <StepSection title="Tags" hint="From Customers → Tags. Added to the contact on every processed submission.">
              <TagPicker
                options={TAG_NAMES}
                selected={draft.behavior.tags}
                onChange={(next) => setBehavior({ tags: next })}
                emptyLabel="No tags - the contact is left as it is."
              />
            </StepSection>

            <StepSection
              title="Segments"
              hint="Only static segments can be joined. Dynamic ones, like New Leads, pick contacts up from their own rules."
            >
              <TagPicker
                options={JOINABLE_SEGMENTS.map((segment) => segment.name)}
                selected={draft.behavior.segmentIds
                  .map((id) => segmentById(id)?.name)
                  .filter((name): name is string => Boolean(name))}
                onChange={(names) =>
                  setBehavior({
                    segmentIds: JOINABLE_SEGMENTS.filter((segment) => names.includes(segment.name)).map(
                      (segment) => segment.id,
                    ),
                  })
                }
                emptyLabel="Not added to a segment."
              />
            </StepSection>

            <StepSection
              title="Consent and opt-in"
              hint="Each Consent Checkbox opts in to one channel. Nobody is subscribed to a channel they did not tick."
            >
              <div className="space-y-3">
                <ConsentSummary fields={draft.fields} />
                <TogglePanel
                  id="behavior-double-opt-in"
                  checked={draft.behavior.doubleOptIn}
                  onCheckedChange={(on) => setBehavior({ doubleOptIn: on })}
                  label="Require email double opt-in"
                  hint="Email consent counts only once the visitor clicks the confirmation link. Until then the submission waits."
                />
              </div>
            </StepSection>
          </div>
        ) : null}

        {step === "automation" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <div className="space-y-6">
              <StepSection
                title="Connected workflow"
                hint="Every submission raises Form Submitted in Automation. Choose the workflow that should act on it."
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <OptionCard
                    selected={mode === "none"}
                    onClick={() => setMode("none")}
                    icon={<Unlink aria-hidden />}
                    title="None"
                    hint="Only the CRM steps run."
                  />
                  <OptionCard
                    selected={mode === "existing"}
                    onClick={() => {
                      setMode("existing");
                      if (!draft.automation.workflowId && FORM_WORKFLOWS[0]) {
                        set("automation", { workflowId: FORM_WORKFLOWS[0].id });
                      }
                    }}
                    icon={<Link2 aria-hidden />}
                    title="Existing workflow"
                    hint="One that starts on Form Submitted."
                  />
                  <OptionCard
                    selected={mode === "create"}
                    onClick={() => setMode("create")}
                    icon={<Plus aria-hidden />}
                    title="Create new workflow"
                    hint="Opens Automation after you save."
                  />
                </div>
              </StepSection>

              {mode === "existing" ? (
                <StepSection title="Choose the workflow">
                  <Field
                    label="Workflow"
                    htmlFor="automation-workflow"
                    hint="Only workflows whose trigger is Form Submitted are listed."
                  >
                    <Select
                      id="automation-workflow"
                      label="Workflow"
                      hideLabel={false}
                      value={draft.automation.workflowId ?? ""}
                      onChange={(next) => set("automation", { workflowId: next })}
                      options={FORM_WORKFLOWS.map((item) => ({
                        value: item.id,
                        label: item.name,
                        hint: item.description,
                      }))}
                    />
                  </Field>
                  {workflow && workflow.status !== "active" ? (
                    <p className="mt-2.5 flex flex-wrap items-center gap-2 text-sm font-medium text-text-secondary">
                      <WorkflowStatusBadge status={workflow.status} />
                      It will not run until it is published in Automation.
                    </p>
                  ) : null}
                </StepSection>
              ) : null}

              {mode === "create" ? (
                <StepSection title="What happens next">
                  <p className="text-sm font-medium text-text-secondary">
                    When you save, the form is kept and the Automation builder
                    opens with <strong>Form Submitted</strong> already chosen and
                    scoped to this form. Build the journey there - Send WhatsApp,
                    Wait, Assign Owner and every other step are Automation&apos;s
                    own - then connect it here once it is published.
                  </p>
                  <ButtonLink
                    href={AUTOMATION_ROUTES.template("tpl-form-lead-nurture")}
                    variant="outline"
                    size="sm"
                    className="mt-3"
                  >
                    See the Form Lead Nurture template
                  </ButtonLink>
                </StepSection>
              ) : null}
            </div>

            <div>
              <p className="mb-2 text-sm font-bold text-text-secondary">What a submission does</p>
              <SubmissionFlow
                formName={draft.name}
                behavior={draft.behavior}
                workflow={mode === "existing" ? workflow : null}
              />
            </div>
          </div>
        ) : null}

        {step === "publish" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <div className="space-y-6">
              <StepSection title="Review">
                <dl className="divide-y divide-border rounded-panel border border-border px-4">
                  <SummaryRow label="Name" value={draft.name || "-"} />
                  <SummaryRow label="Type" value={formTypeLabel(draft.type)} />
                  <SummaryRow
                    label="Fields"
                    value={`${draft.fields.length} · ${draft.fields.filter((item) => item.required).length} required`}
                  />
                  <SummaryRow
                    label="On success"
                    value={
                      draft.behavior.onSuccess === "redirect"
                        ? `Redirect to ${draft.behavior.redirectUrl || "-"}`
                        : "Show the success message"
                    }
                  />
                  <SummaryRow
                    label="Contact"
                    value={draft.behavior.createContact ? "Create or update automatically" : "Held for review"}
                  />
                  <SummaryRow
                    label="Lead"
                    value={
                      draft.behavior.createLead
                        ? `Create in ${stageLabel(draft.behavior.leadStage)}`
                        : "No lead"
                    }
                  />
                  <SummaryRow
                    label="Tags"
                    value={draft.behavior.tags.length ? draft.behavior.tags.join(", ") : "None"}
                  />
                  <SummaryRow
                    label="Workflow"
                    value={
                      mode === "create"
                        ? "New workflow, built next in Automation"
                        : mode === "existing"
                          ? (workflow?.name ?? "-")
                          : "Not connected"
                    }
                  />
                </dl>
              </StepSection>

              <ServiceNotice tone="session" title="Saved for this session">
                Forms, and the test submissions you make from Preview, are kept
                in this browser session. The embed code is final; the hosted
                form starts accepting real submissions once the Forms API is
                connected.
              </ServiceNotice>
            </div>

            <StepSection
              title="Status after saving"
              hint="You can publish, pause or resume later from the form's page."
            >
              <div className="space-y-3">
                <OptionCard
                  selected={publishAs === "active"}
                  onClick={() => setPublishAs("active")}
                  icon={<Rocket aria-hidden />}
                  title={form?.status === "active" ? "Keep it live" : "Publish now"}
                  hint="The embed accepts submissions."
                />
                {form?.status === "paused" ? (
                  <OptionCard
                    selected={publishAs === "paused"}
                    onClick={() => setPublishAs("paused")}
                    icon={<Pause aria-hidden />}
                    title="Keep it paused"
                    hint="Pages carrying the embed say it is not accepting responses."
                  />
                ) : null}
                {!form || form.status === "draft" ? (
                  <OptionCard
                    selected={publishAs === "draft"}
                    onClick={() => setPublishAs("draft")}
                    icon={<FilePen aria-hidden />}
                    title="Save as draft"
                    hint="Nothing is public until you publish."
                  />
                ) : null}
              </div>
            </StepSection>
          </div>
        ) : null}
      </div>

      {showIssues && stepIssues.length > 0 ? (
        <div role="alert" className="mt-5 rounded-panel border border-error/25 bg-error-soft px-3.5 py-3">
          <p className="text-sm font-bold text-error-text">Finish this step before continuing</p>
          <ul className="mt-1.5 space-y-1">
            {stepIssues.map((issue) => (
              <li key={issue} className="text-sm font-medium text-error-text">
                {issue}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-border pt-5">
        <Button
          variant="outline"
          size="compact"
          disabled={index === 0 || saving}
          onClick={() => {
            setIndex((value) => Math.max(value - 1, 0));
            setShowIssues(false);
          }}
        >
          <ChevronLeft aria-hidden />
          Back
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2.5">
          {/* A draft is a save, not a publish - but it still has to be a form
              that could work, so it runs the same checks. */}
          {step !== "publish" ? (
            <Button
              variant="outline"
              size="compact"
              disabled={saving}
              onClick={() => save(form ? form.status : "draft")}
            >
              {saving ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {form ? "Save changes" : "Save Draft"}
            </Button>
          ) : null}
          {step === "publish" ? (
            <Button size="compact" disabled={saving} onClick={() => save(publishAs)}>
              {publishAs === "active" ? <Rocket aria-hidden /> : null}
              {publishAs === "active"
                ? form?.status === "active"
                  ? "Save Form"
                  : "Publish Form"
                : publishAs === "paused"
                  ? "Save Form"
                  : "Save Draft"}
            </Button>
          ) : (
            <Button size="compact" disabled={saving} onClick={goNext}>
              Continue
              <ChevronRight aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Which channel each consent box grants - read from the Fields step. */
function ConsentSummary({ fields }: { fields: FormField[] }) {
  const boxes = fields.filter((item) => item.kind === "consent");

  if (boxes.length === 0) {
    return (
      <p className="rounded-panel border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-sm text-warning-text">
        This form has no consent box, so submissions opt in to nothing. Add a
        Consent Checkbox in Fields for each channel you want to message them on.
      </p>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {boxes.map((item) => (
        <li
          key={item.id}
          className="rounded-btn border border-border px-2.5 py-1 text-sm font-medium text-text-secondary"
        >
          {CONSENT_CHANNELS.find((channel) => channel.value === item.consentChannel)?.label ?? "Email"}
          {item.required ? " · required" : " · optional"}
        </li>
      ))}
    </ul>
  );
}
