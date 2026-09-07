import { Copy, Eye, Pencil, Trash2 } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Menu } from "@/components/ui/menu";
import { formatRelativeTime } from "@/lib/format";
import { TEMPLATE_LANGUAGES } from "@/lib/whatsapp-fixtures";
import { cn } from "@/lib/utils";
import type {
  TemplateCategory,
  TemplateStatus,
  WhatsAppTemplate,
} from "@/types/marketing";

const STATUS_TONES: Record<TemplateStatus, BadgeTone> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

const CATEGORY_TONES: Record<TemplateCategory, BadgeTone> = {
  marketing: "brand",
  utility: "info",
  authentication: "neutral",
};

export function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]} className="gap-1.5">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          status === "approved"
            ? "bg-success"
            : status === "pending"
              ? "bg-warning"
              : "bg-error",
        )}
      />
      {status}
    </Badge>
  );
}

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
  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* Template names are the API identifier, so they render as code. */}
          <h3 className="truncate font-mono text-sm font-medium text-text-primary">
            {template.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone={CATEGORY_TONES[template.category]}>{template.category}</Badge>
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

      <p className="mt-4 line-clamp-3 min-h-15 rounded-panel bg-surface-secondary px-3.5 py-3 text-[13px] leading-relaxed text-text-secondary">
        {template.body}
      </p>

      {template.status === "rejected" && template.rejectionReason ? (
        <p className="mt-2.5 rounded-panel border border-error/25 bg-error-soft px-3 py-2 text-xs text-error-text">
          {template.rejectionReason}
        </p>
      ) : null}

      {template.variables.length > 0 ? (
        <div className="mt-3">
          <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
            Variables
          </p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {template.variables.map((variable) => (
              <li
                key={variable}
                className="rounded-btn bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] text-primary-dark"
              >
                {`{{${variable}}}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 text-xs text-text-muted">
        <span>{languageLabel(template.language)}</span>
        <span>Updated {formatRelativeTime(template.updatedAt)}</span>
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
