import { Copy, Eye, Pencil, Trash2 } from "lucide-react";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu } from "@/components/ui/menu";
import { formatNumber, formatPercent, formatRelativeTime, rate } from "@/lib/format";
import {
  TEMPLATE_LANGUAGES,
  TEMPLATE_USE_CASES,
  WA_TEMPLATE_PERFORMANCE,
} from "@/lib/whatsapp-fixtures";
import { cn } from "@/lib/utils";
import type {
  TemplateCategory,
  TemplateStatus,
  TemplateUseCase,
  WhatsAppTemplate,
} from "@/types/marketing";

const STATUS_TONES: Record<TemplateStatus, BadgeVariant> = {
  /* The channel's green rather than the generic one - see `BadgeVariant`. */
  approved: "whatsapp",
  pending: "warning",
  rejected: "error",
};

const CATEGORY_TONES: Record<TemplateCategory, BadgeVariant> = {
  marketing: "primary",
  utility: "info",
  authentication: "default",
};

export function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <Badge variant={STATUS_TONES[status]} className="gap-1.5">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "approved"
            ? "bg-whatsapp"
            : status === "pending"
              ? "bg-warning"
              : "bg-error",
        )}
      />
      {status}
    </Badge>
  );
}

/**
 * How a template has actually done, for the card that offers to edit it.
 *
 * Analytics has computed this all along and the library never showed it, so
 * deciding which of two promotional templates to reuse meant leaving Templates,
 * reading the performance table, and coming back. A template that has never
 * sent has no row and the card simply omits the line - a "0% reply rate" on a
 * draft is a lie about a template nobody has tried.
 */
const performanceOf = (id: string) =>
  WA_TEMPLATE_PERFORMANCE.find((item) => item.id === id);

export const useCaseLabel = (useCase: TemplateUseCase) =>
  TEMPLATE_USE_CASES.find((item) => item.value === useCase)?.label ?? useCase;

export function languageLabel(code: string) {
  return TEMPLATE_LANGUAGES.find((item) => item.value === code)?.label ?? code;
}

export function TemplateCard({
  template,
  onPreview,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  template: WhatsAppTemplate;
  onPreview: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const performance = performanceOf(template.id);

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Template names are the API identifier, so they render as code. */}
          {/* The card's subject, so it carries the card: semibold, not medium.
              It was set one weight below the badges underneath it. */}
          <h3 className="truncate font-mono text-sm font-semibold text-text-primary">
            {template.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* Use case first: it is the shelf a merchant thinks in. The Meta
                category sits beside it because it drives review and pricing. */}
            <Badge variant="default">{useCaseLabel(template.useCase)}</Badge>
            <Badge variant={CATEGORY_TONES[template.category]}>{template.category}</Badge>
            <TemplateStatusBadge status={template.status} />
          </div>
        </div>

        <Menu
          label={`Actions for ${template.name}`}
          items={[
            { label: "Preview", icon: <Eye className="size-4" />, onSelect: onPreview },
            { label: "Edit", icon: <Pencil className="size-4" />, onSelect: onEdit },
            {
              label: "Duplicate",
              icon: <Copy className="size-4" />,
              onSelect: onDuplicate,
            },
            {
              label: "Delete",
              icon: <Trash2 className="size-4" />,
              onSelect: onDelete,
              destructive: true,
            },
          ]}
        />
      </div>

      <p className="mt-4 line-clamp-3 min-h-15 rounded-panel bg-surface-secondary px-3.5 py-3 text-sm leading-relaxed text-text-secondary">
        {template.body}
      </p>

      {template.status === "rejected" && template.rejectionReason ? (
        <p className="mt-2.5 rounded-panel border border-error/25 bg-error-soft px-3 py-2 text-sm text-error-text">
          {template.rejectionReason}
        </p>
      ) : null}

      {template.variables.length > 0 ? (
        <div className="mt-3">
          {/* The module's section rule - 13px semibold on secondary, the same
              setting as the headings in the Inbox details panel and the Overview
              panels. It was 14px medium on muted, which is a heading set
              lighter than the list it introduces. */}
          <p className="text-meta font-semibold  text-text-secondary uppercase">
            Variables
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {template.variables.map((variable) => (
              <li
                key={variable}
                className="rounded-btn bg-primary-soft px-1.5 py-0.5 font-mono text-sm text-primary-dark"
              >
                {`{{${variable}}}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/*
       * How it has done, above the language and the timestamp.
       *
       * Reply rate is bold because it is the figure that decides which of two
       * templates to reuse; the send count is the context that says whether the
       * rate is worth trusting. A template that has never sent shows neither,
       * and the rule below moves up to carry the card's footer on its own.
       */}
      {performance ? (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 text-sm">
          <span className="text-text-muted">
            {formatNumber(performance.sent)} sent
          </span>
          <span className="text-text-secondary">
            <span className="font-bold text-text-primary tabular-nums">
              {formatPercent(rate(performance.replies, performance.delivered))}
            </span>{" "}
            reply rate
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "flex items-center justify-between gap-3 text-sm text-text-muted",
          performance ? "mt-2.5" : "mt-4 border-t border-border pt-3.5",
        )}
      >
        {/* The language is a property of the template; the timestamp is only
            when it last moved. Metadata and muted, in that order. */}
        <span className="font-medium text-text-secondary">
          {languageLabel(template.language)}
        </span>
        <span className="text-text-muted">
          Updated {formatRelativeTime(template.updatedAt)}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onPreview}>
          <Eye aria-hidden />
          Preview
        </Button>
        <Button variant="secondary" size="sm" className="flex-1" onClick={onEdit}>
          <Pencil aria-hidden />
          Edit
        </Button>
      </div>
    </Card>
  );
}
