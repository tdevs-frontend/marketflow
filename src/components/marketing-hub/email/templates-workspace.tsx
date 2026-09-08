"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, MailOpen, Pencil, Plus, Trash2, X } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu } from "@/components/ui/menu";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { EMAIL_TEMPLATE_CATEGORIES, EMAIL_TEMPLATES } from "@/lib/email-fixtures";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EmailTemplate, EmailTemplateCategory } from "@/types/email";
import { EmailTemplateBuilder } from "./template-builder";

/**
 * The email template library.
 *
 * Cards rather than a table, and each card shows a miniature of the layout
 * rather than a thumbnail image: what distinguishes two templates is their
 * *structure* — where the image sits, how many buttons, whether there is a
 * product grid — and a stack of grey bars at the right proportions conveys
 * that faster than a screenshot scaled to 200px.
 *
 * Selecting Edit swaps the whole page for the builder rather than opening a
 * modal: editing a template is a task, not a dialog, and a 600px canvas inside
 * a 512px modal is unusable.
 */

const ALL = "all";

const CATEGORY_TONES: Record<EmailTemplateCategory, BadgeTone> = {
  welcome: "brand",
  newsletter: "info",
  promotion: "warning",
  "product-launch": "info",
  "abandoned-cart": "warning",
  "follow-up": "neutral",
  "re-engagement": "neutral",
};

/**
 * A blank template for the Create path.
 *
 * Logo and footer are pre-placed because every email needs both and the
 * builder treats them as structural — starting with a truly empty canvas just
 * means the first two things anyone does are add them back.
 */
const BLANK_TEMPLATE: EmailTemplate = {
  id: "et-new",
  name: "Untitled template",
  description: "",
  category: "promotion",
  status: "draft",
  subject: "",
  previewText: "",
  blocks: [
    { id: "b1", type: "logo", content: "MarketFlow" },
    { id: "b2", type: "heading", content: "Your headline" },
    { id: "b3", type: "footer", content: "MarketFlow · Unsubscribe" },
  ],
  usageCount: 0,
  openRate: 0,
  /* A fixed date, not `Date.now()`: a module-scope clock read differs between
     the server render and hydration, and an unsaved template has no
     meaningful modified time anyway. */
  updatedAt: "2026-09-08T00:00:00Z",
};

const categoryLabel = (category: EmailTemplateCategory) =>
  EMAIL_TEMPLATE_CATEGORIES.find((item) => item.value === category)?.label ?? category;

/**
 * The layout miniature. Bar heights and widths are derived from the block
 * type, so the shape genuinely reflects the template rather than being
 * decorative noise.
 */
function LayoutThumb({ template }: { template: EmailTemplate }) {
  return (
    <div
      aria-hidden
      className="flex flex-col gap-1 rounded-panel border border-border bg-surface-secondary p-2.5"
    >
      {template.blocks.slice(0, 7).map((block) => {
        switch (block.type) {
          case "logo":
            return (
              <span
                key={block.id}
                className="mx-auto h-1.5 w-10 rounded-full bg-border-strong"
              />
            );
          case "heading":
            return (
              <span key={block.id} className="h-2 w-3/5 rounded-full bg-text-muted/60" />
            );
          case "text":
            return (
              <span key={block.id} className="flex flex-col gap-0.5">
                <span className="block h-1 w-full rounded-full bg-border-strong" />
                <span className="block h-1 w-4/5 rounded-full bg-border-strong" />
              </span>
            );
          case "image":
            return (
              <span key={block.id} className="block h-6 w-full rounded bg-email/20" />
            );
          case "button":
            return (
              <span key={block.id} className="block h-2.5 w-16 rounded-full bg-email" />
            );
          case "divider":
            return <span key={block.id} className="block h-px w-full bg-border-strong" />;
          case "products":
            return (
              <span key={block.id} className="grid grid-cols-3 gap-1">
                {[0, 1, 2].map((index) => (
                  <span key={index} className="block h-5 rounded bg-border-strong" />
                ))}
              </span>
            );
          case "social":
            return (
              <span key={block.id} className="mx-auto flex gap-1">
                {[0, 1, 2, 3].map((index) => (
                  <span key={index} className="block size-1.5 rounded-full bg-border-strong" />
                ))}
              </span>
            );
          case "footer":
            return (
              <span
                key={block.id}
                className="mx-auto mt-auto h-1 w-2/3 rounded-full bg-border-strong"
              />
            );
        }
      })}
    </div>
  );
}

export function EmailTemplatesWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EmailTemplateCategory | typeof ALL>(ALL);
  const [status, setStatus] = useState<"published" | "draft" | typeof ALL>(ALL);
  const [sort, setSort] = useState<"updated" | "usage" | "openRate" | "name">("updated");

  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [previewing, setPreviewing] = useState<EmailTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EmailTemplate | null>(null);

  const activeFilters = (category === ALL ? 0 : 1) + (status === ALL ? 0 : 1);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return EMAIL_TEMPLATES.filter((template) => {
      if (
        term &&
        !template.name.toLowerCase().includes(term) &&
        !template.subject.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (category !== ALL && template.category !== category) return false;
      if (status !== ALL && template.status !== status) return false;
      return true;
    }).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "usage") return b.usageCount - a.usageCount;
      if (sort === "openRate") return b.openRate - a.openRate;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [category, search, sort, status]);

  /* Edit takes over the page. The header stays so the way back is obvious. */
  if (editing) {
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">
              {editing.id === BLANK_TEMPLATE.id ? "New template" : "Editing template"}
            </p>
            <h2 className="text-lg">{editing.name}</h2>
          </div>
          <Button variant="outline" size="compact" onClick={() => setEditing(null)}>
            <X aria-hidden />
            Close builder
          </Button>
        </div>

        <EmailTemplateBuilder template={editing} />
      </>
    );
  }

  return (
    <>
      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search name or subject…"
          activeCount={activeFilters}
          onReset={() => {
            setCategory(ALL);
            setStatus(ALL);
          }}
          trailing={
            <Button size="compact" onClick={() => setEditing(BLANK_TEMPLATE)}>
              <Plus aria-hidden />
              Create Template
            </Button>
          }
        >
          <Select
            label="Filter by category"
            size="sm"
            value={category}
            onChange={(next) => setCategory(next as EmailTemplateCategory | typeof ALL)}
            options={[
              { value: ALL, label: "All categories" },
              ...EMAIL_TEMPLATE_CATEGORIES,
            ]}
            className="lg:w-42"
          />
          <Select
            label="Filter by status"
            size="sm"
            value={status}
            onChange={(next) => setStatus(next as "published" | "draft" | typeof ALL)}
            options={[
              { value: ALL, label: "All statuses" },
              { value: "published", label: "Published" },
              { value: "draft", label: "Draft" },
            ]}
            className="lg:w-36"
          />
          <Select
            label="Sort templates"
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "updated", label: "Recently updated" },
              { value: "usage", label: "Most used" },
              { value: "openRate", label: "Best open rate" },
              { value: "name", label: "Name A–Z" },
            ]}
            className="lg:w-44"
          />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title="No templates match those filters"
            description="Try a different search term, or clear the filters to see all nine."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory(ALL);
                  setStatus(ALL);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((template) => (
              <li key={template.id}>
                <Card className="flex h-full flex-col p-4">
                  <LayoutThumb template={template} />

                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-text-primary">
                        {template.name}
                      </h3>
                      <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                        {template.description}
                      </p>
                    </div>

                    <Menu
                      label={`Actions for ${template.name}`}
                      items={[
                        {
                          label: "Preview",
                          icon: <Eye className="size-4" />,
                          onSelect: () => setPreviewing(template),
                        },
                        {
                          label: "Edit",
                          icon: <Pencil className="size-4" />,
                          onSelect: () => setEditing(template),
                        },
                        {
                          label: "Duplicate",
                          icon: <Copy className="size-4" />,
                          onSelect: () => toast(`${template.name} duplicated`),
                        },
                        {
                          label: "Delete",
                          icon: <Trash2 className="size-4" />,
                          onSelect: () => setPendingDelete(template),
                          destructive: true,
                        },
                      ]}
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone={CATEGORY_TONES[template.category]}>
                      {categoryLabel(template.category)}
                    </Badge>
                    {template.status === "draft" ? (
                      <Badge tone="neutral">Draft</Badge>
                    ) : null}
                  </div>

                  <p className="mt-3 truncate rounded-panel bg-surface-secondary px-3 py-2 text-[11px] text-text-secondary">
                    {template.subject}
                  </p>

                  <dl className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-[11px]">
                    <div>
                      <dt className="text-text-muted">Used in</dt>
                      <dd className="font-bold text-text-primary tabular-nums">
                        {formatNumber(template.usageCount)} campaigns
                      </dd>
                    </div>
                    <div className="text-right">
                      <dt className="text-text-muted">Avg open</dt>
                      <dd
                        className={cn(
                          "font-bold tabular-nums",
                          template.openRate > 0 ? "text-email" : "text-text-muted",
                        )}
                      >
                        {template.openRate > 0
                          ? formatPercent(template.openRate)
                          : "No sends"}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-2.5 text-[11px] text-text-muted">
                    Updated {formatRelativeTime(template.updatedAt)}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewing(template)}
                    >
                      <Eye aria-hidden />
                      Preview
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditing(template)}
                    >
                      <Pencil aria-hidden />
                      Edit
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog
        open={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
        title={previewing?.name ?? "Template preview"}
        description={previewing?.subject}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="compact"
              onClick={() => setPreviewing(null)}
            >
              Close
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setEditing(previewing);
                setPreviewing(null);
              }}
            >
              <Pencil aria-hidden />
              Edit template
            </Button>
          </>
        }
      >
        {previewing ? (
          <div className="space-y-4">
            <div className="rounded-panel border border-border bg-surface-secondary px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] text-text-muted uppercase">
                <MailOpen className="size-3" aria-hidden />
                Inbox preview
              </p>
              <p className="mt-1.5 text-sm font-bold text-text-primary">
                {previewing.subject}
              </p>
              <p className="text-xs text-text-muted">{previewing.previewText}</p>
            </div>

            <ol className="space-y-2">
              {previewing.blocks.map((block, index) => (
                <li
                  key={block.id}
                  className="flex gap-3 rounded-panel border border-border px-3.5 py-2.5"
                >
                  <span className="w-4 shrink-0 text-[11px] font-bold text-text-muted tabular-nums">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium tracking-[0.06em] text-text-muted uppercase">
                      {block.type.replace("-", " ")}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-text-secondary">
                      {block.content || <em className="text-text-muted">Empty</em>}
                    </span>
                    {block.meta ? (
                      <span className="mt-0.5 block font-mono text-[11px] text-email-dark">
                        {block.meta}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => toast(`${pendingDelete?.name} deleted`)}
        title={`Delete ${pendingDelete?.name}?`}
        confirmLabel="Delete template"
      >
        <p className="text-sm text-text-secondary">
          {pendingDelete && pendingDelete.usageCount > 0 ? (
            <>
              This template is used by {pendingDelete.usageCount} campaigns. Those
              already sent keep their content; scheduled ones will fail until you
              pick a replacement.
            </>
          ) : (
            <>This template has never been sent, so nothing else is affected.</>
          )}
        </p>
      </ConfirmDialog>
    </>
  );
}
