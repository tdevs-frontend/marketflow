"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  Layers,
  Plug,
  Target,
  Users,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  AUTOMATION_ROUTES,
  NODE_META,
  templateCategoryLabel,
} from "@/constants/automation";
import { APP_ROUTES } from "@/constants/app";
import { formatCount } from "@/lib/format";
import { createDraftWorkflow } from "@/lib/workflow-fixtures";
import { cn } from "@/lib/utils";
import type { AutomationTemplate } from "@/types/workflow";
import { ChannelChips, ComplexityBadge } from "../automation-badges";
import { NodeIcon } from "../node-icon";
import { WorkflowMiniMapRow } from "../workflow-mini-map";

/**
 * A template, in full, before anybody commits to it.
 *
 * A page rather than a drawer: this is a linkable thing ("use this one") and
 * it carries a step-by-step explanation, the integrations it needs and the
 * message templates it expects — more than a drawer can hold without
 * scrolling twice.
 *
 * The requirements block is the part that matters. A journey adopted without
 * the WhatsApp template it sends fails on its first contact, and finding that
 * out in the Activity log a day later is the failure this page exists to
 * prevent.
 */
export function TemplatePreview({ template }: { template: AutomationTemplate }) {
  const router = useRouter();
  const toast = useToast();

  function use() {
    const workflow = createDraftWorkflow({
      name: template.name,
      description: template.description,
      triggerKey: template.triggerKey,
      triggerLabel: template.steps[0]?.title ?? "Trigger",
      template,
    });

    toast(`${template.name} added as a draft workflow`, "success");
    router.push(AUTOMATION_ROUTES.workflow(workflow.id));
  }

  const facts = [
    {
      icon: Target,
      label: "Goal",
      value: template.goal,
      /* A sentence, not a figure — it needs to wrap rather than set the row's
         type scale. */
      wrap: true,
    },
    {
      icon: Layers,
      label: "Steps",
      value: `${template.steps.length}`,
    },
    {
      icon: Clock,
      label: "Estimated setup",
      value: `${template.setupMinutes} min`,
    },
    {
      icon: Users,
      label: "Used by",
      value: `${formatCount(template.installs)} teams`,
    },
  ];

  return (
    <>
      <Link
        href={AUTOMATION_ROUTES.templates}
        className="inline-flex w-fit items-center gap-1.5 rounded-btn text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Back to Templates
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
            <ComplexityBadge level={template.complexity} />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">
            {template.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-text-muted">
              {templateCategoryLabel(template.category)}
            </span>
            <ChannelChips channels={template.channels} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <ButtonLink href={AUTOMATION_ROUTES.templates} variant="outline">
            Back
          </ButtonLink>
          <Button onClick={use}>Use This Template</Button>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map((fact) => (
          <Card key={fact.label} className="flex items-center gap-3 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-btn bg-primary-soft text-primary">
              <fact.icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="text-sm font-medium tracking-[0.06em] text-text-muted uppercase">
                {fact.label}
              </dt>
              <dd
                className={cn(
                  "font-bold text-text-primary",
                  fact.wrap ? "text-sm leading-snug" : "text-lg leading-tight",
                )}
              >
                {fact.value}
              </dd>
            </div>
          </Card>
        ))}
      </dl>

      <Card>
        <CardHeader
          title="Workflow preview"
          description="Every step this template creates, in the order a contact meets them."
        />
        <CardBody>
          <WorkflowMiniMapRow steps={template.steps} />
        </CardBody>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="How it works"
            description="What happens at each step, and why."
          />
          <CardBody>
            <ol className="space-y-4">
              {template.steps.map((step, index) => (
                <li key={`${step.title}-${index}`} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-secondary text-xs font-bold text-text-secondary tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <NodeIcon kind={step.kind} size="sm" />
                      <p className="text-sm font-semibold text-text-primary">
                        {step.title}
                      </p>
                      <span className="text-sm font-medium tracking-[0.06em] text-text-muted uppercase">
                        {NODE_META[step.kind]?.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {NODE_META[step.kind]?.description}
                      {step.summary ? (
                        <span className="text-text-muted"> · {step.summary}</span>
                      ) : null}
                    </p>
                    {step.branches ? (
                      <p className="mt-1.5 flex flex-wrap gap-1.5">
                        {step.branches.map((branch) => (
                          <span
                            key={branch}
                            className="rounded-full border border-dashed border-border-strong px-2 py-0.5 text-sm text-text-secondary"
                          >
                            {branch}
                          </span>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Best for" />
            <CardBody>
              <ul className="space-y-2">
                {template.bestFor.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Before you start"
              description="What this journey needs in place to run."
            />
            <CardBody className="space-y-4">
              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-medium tracking-[0.06em] text-text-muted uppercase">
                  <Plug className="size-3.5" aria-hidden />
                  Integrations
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {template.requiredIntegrations.map((item) => (
                    <li
                      key={item}
                      className="flex items-center justify-between gap-2 rounded-btn border border-border px-2.5 py-1.5 text-sm text-text-secondary"
                    >
                      {item}
                      <Link
                        href={APP_ROUTES.integrations}
                        className="shrink-0 rounded text-sm font-medium text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
                      >
                        Check
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="flex items-center gap-1.5 text-sm font-medium tracking-[0.06em] text-text-muted uppercase">
                  <FileText className="size-3.5" aria-hidden />
                  Message templates
                </h3>
                {template.requiredMessageTemplates.length === 0 ? (
                  <p className="mt-2 text-sm text-text-muted">
                    None — every message in this journey is written by you.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {template.requiredMessageTemplates.map((item) => (
                      <li
                        key={item}
                        className="flex items-center justify-between gap-2 rounded-btn border border-border px-2.5 py-1.5"
                      >
                        <code className="truncate font-mono text-sm text-text-secondary">
                          {item}
                        </code>
                        <Link
                          href={APP_ROUTES.whatsappTemplates}
                          className="shrink-0 rounded text-sm font-medium text-primary transition-colors hover:text-primary-dark focus-visible:shadow-focus focus-visible:outline-none"
                        >
                          Open
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardBody>
          </Card>

          <Card className="p-4">
            <p className="text-sm text-text-secondary">
              Using this template creates a <strong>draft</strong> workflow. Nothing
              sends until you review every step and publish it.
            </p>
            <Button className="mt-3 w-full" onClick={use}>
              Use This Template
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}
