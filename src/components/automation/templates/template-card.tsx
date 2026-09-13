"use client";

import { Clock, Layers, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AUTOMATION_ROUTES, templateCategoryLabel } from "@/constants/automation";
import { formatCount } from "@/lib/format";
import type { AutomationTemplate } from "@/types/workflow";
import { ChannelChips, ComplexityBadge } from "../automation-badges";
import { WorkflowMiniMap } from "../workflow-mini-map";

/**
 * One template, as a card.
 *
 * The three figures under the diagram are the ones that decide whether a
 * template is worth opening: how many steps it is, how long it takes to set
 * up, and how many teams here already run it. Install count is doing real work
 * — a template used four hundred times is a different proposition from one
 * used twice, and hiding that makes every card look equally plausible.
 *
 * Two actions, and Preview comes first: nobody should adopt a five-step
 * journey that sends real messages without reading it.
 */
export function TemplateCard({
  template,
  onUse,
}: {
  template: AutomationTemplate;
  onUse: (template: AutomationTemplate) => void;
}) {
  return (
    <Card className="flex h-full flex-col p-4" interactive>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-text-primary">
            {template.name}
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            {templateCategoryLabel(template.category)}
          </p>
        </div>
        {template.custom ? (
          <Badge tone="brand">Custom</Badge>
        ) : (
          <ComplexityBadge level={template.complexity} />
        )}
      </div>

      <p className="mt-2.5 line-clamp-2 text-xs text-text-secondary">
        {template.description}
      </p>

      <WorkflowMiniMap steps={template.steps.slice(0, 4)} className="mt-3" />

      <div className="mt-3">
        <ChannelChips channels={template.channels} size="sm" />
      </div>

      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3.5" aria-hidden />
          <dt className="sr-only">Steps</dt>
          <dd>
            <span className="font-medium text-text-secondary">
              {template.steps.length}
            </span>{" "}
            steps
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          <dt className="sr-only">Estimated setup</dt>
          <dd>
            <span className="font-medium text-text-secondary">
              {template.setupMinutes} min
            </span>{" "}
            setup
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden />
          <dt className="sr-only">Installs</dt>
          <dd>
            <span className="font-medium text-text-secondary">
              {formatCount(template.installs)}
            </span>{" "}
            uses
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex gap-2">
        <ButtonLink
          href={AUTOMATION_ROUTES.template(template.id)}
          variant="outline"
          size="sm"
          className="flex-1"
        >
          Preview
        </ButtonLink>
        <Button size="sm" className="flex-1" onClick={() => onUse(template)}>
          Use Template
        </Button>
      </div>
    </Card>
  );
}
