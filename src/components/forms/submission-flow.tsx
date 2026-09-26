import { ArrowDown, ExternalLink } from "lucide-react";

import { NodeIcon } from "@/components/automation/node-icon";
import { WorkflowStatusBadge } from "@/components/automation/automation-badges";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AUTOMATION_ROUTES } from "@/constants/automation";
import { LEAD_SOURCES, segmentById, stageLabel } from "@/lib/customer-fixtures";
import type { FormBehavior } from "@/types/form";
import type { NodeKind, Workflow } from "@/types/workflow";

/**
 * What one submission sets in motion, in order.
 *
 * Two owners, drawn as two groups, because that split is the architecture: the
 * form's own CRM steps run first (match or create the contact, open the lead,
 * tag, segment) and only then does it raise `form.submitted`, which the
 * connected workflow in Automation picks up. The workflow half is that
 * workflow's actual nodes, drawn with Automation's own `NodeIcon` - Forms
 * shows the journey, it does not own a copy of it.
 */

interface Step {
  kind: NodeKind;
  title: string;
  summary: string;
}

function crmSteps(behavior: FormBehavior): Step[] {
  const steps: Step[] = [];

  if (behavior.createContact) {
    steps.push({
      kind: "update_contact",
      title: "Create or update contact",
      summary:
        behavior.duplicates === "ignore"
          ? "Matched by email, then phone · repeats ignored"
          : "Matched by email, then phone · never duplicated",
    });
  } else {
    steps.push({
      kind: "update_contact",
      title: "Hold for review",
      summary: "Linked to a contact when someone reviews it",
    });
  }

  if (behavior.createLead) {
    const source =
      LEAD_SOURCES.find((item) => item.value === behavior.leadSource)?.label ?? behavior.leadSource;
    steps.push({
      kind: "update_stage",
      title: "Create lead",
      summary: `${stageLabel(behavior.leadStage)} · source ${source} · open lead reused`,
    });
  }

  if (behavior.tags.length) {
    steps.push({ kind: "add_tag", title: "Add tags", summary: behavior.tags.join(", ") });
  }

  if (behavior.segmentIds.length) {
    steps.push({
      kind: "add_segment",
      title: "Add to segment",
      summary: behavior.segmentIds.map((id) => segmentById(id)?.name ?? id).join(", "),
    });
  }

  return steps;
}

function StepRow({ step }: { step: Step }) {
  return (
    <li className="flex items-start gap-3 rounded-panel border border-border bg-surface px-3 py-2.5">
      <NodeIcon kind={step.kind} size="sm" className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-text-primary">{step.title}</span>
        {step.summary ? (
          <span className="block truncate text-sm text-text-muted">{step.summary}</span>
        ) : null}
      </span>
    </li>
  );
}

const Connector = () => (
  <li aria-hidden className="flex justify-center py-0.5 text-border-strong">
    <ArrowDown className="size-4" />
  </li>
);

export function SubmissionFlow({
  formName,
  behavior,
  workflow,
}: {
  formName: string;
  behavior: FormBehavior;
  workflow?: Workflow | null;
}) {
  const crm = crmSteps(behavior);
  /* The workflow's own trigger is the event below, so it is not drawn twice. */
  const nodes = (workflow?.nodes ?? []).filter((node) => node.kind !== "trigger");

  return (
    <div className="space-y-4">
      <section aria-label="Runs in Forms">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-text-secondary">In Forms</p>
          <Badge variant="outline" casing="none">
            {formName || "This form"}
          </Badge>
        </div>
        <ol className="space-y-0">
          <StepRow
            step={{ kind: "trigger", title: "Form submitted", summary: "A visitor sends the form" }}
          />
          {crm.map((step) => (
            <FragmentStep key={step.title} step={step} />
          ))}
          <Connector />
          <li className="flex items-center gap-2 rounded-panel border border-dashed border-primary-border bg-primary-subtle px-3 py-2.5">
            <span className="text-sm font-semibold text-primary-dark">Raises</span>
            <code className="rounded-btn bg-surface px-1.5 py-0.5 font-mono text-sm text-text-secondary">
              form.submitted
            </code>
          </li>
        </ol>
      </section>

      <section aria-label="Runs in Automation">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-text-secondary">In Automation</p>
          {workflow ? <WorkflowStatusBadge status={workflow.status} /> : null}
        </div>

        {workflow ? (
          <>
            <ol className="space-y-0">
              <li className="rounded-panel border border-border bg-surface-secondary px-3 py-2.5">
                <span className="block text-sm font-semibold text-text-primary">{workflow.name}</span>
                <span className="block text-sm text-text-muted">
                  Enrols the contact when the event arrives
                </span>
              </li>
              {nodes.map((node) => (
                <FragmentStep
                  key={node.id}
                  step={{ kind: node.kind, title: node.title, summary: node.summary }}
                />
              ))}
            </ol>
            <ButtonLink
              href={AUTOMATION_ROUTES.workflow(workflow.id)}
              variant="text"
              size="inline"
              className="mt-2.5"
            >
              Open in Automation
              <ExternalLink aria-hidden />
            </ButtonLink>
          </>
        ) : (
          <p className="rounded-panel border border-dashed border-border-strong px-3.5 py-3 text-sm font-medium text-text-muted">
            No workflow is connected. The event is still raised, so any workflow
            listening for every form picks it up.
          </p>
        )}
      </section>
    </div>
  );
}

function FragmentStep({ step }: { step: Step }) {
  return (
    <>
      <Connector />
      <StepRow step={step} />
    </>
  );
}
