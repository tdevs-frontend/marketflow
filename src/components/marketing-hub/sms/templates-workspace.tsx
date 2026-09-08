"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { FilterBar } from "@/components/ui/filter-bar";
import { Menu } from "@/components/ui/menu";
import { ProgressBar } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  SMS_TEMPLATES,
  SMS_TEMPLATE_CATEGORIES,
  SMS_SUBSTITUTIONS,
} from "@/lib/sms-fixtures";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { countSmsSegments } from "@/types/sms";
import type { SmsTemplate, SmsTemplateCategory } from "@/types/sms";
import { SmsComposer, SmsPreview } from "./composer";

/**
 * The SMS template library.
 *
 * Cards show the message body in full rather than truncated, because an SMS
 * template *is* its body — there is no layout, no subject and no imagery to
 * summarise. The segment count sits on every card for the same reason it is in
 * the composer: a two-segment template doubles the cost of every campaign that
 * uses it, and that is worth knowing before you pick one.
 */

const ALL = "all";

const CATEGORY_TONES: Record<SmsTemplateCategory, BadgeTone> = {
  promotion: "warning",
  reminder: "info",
  alert: "danger",
  otp: "neutral",
  "follow-up": "neutral",
  order: "brand",
};

const categoryLabel = (category: SmsTemplateCategory) =>
  SMS_TEMPLATE_CATEGORIES.find((item) => item.value === category)?.label ?? category;

export function SmsTemplatesWorkspace() {
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SmsTemplateCategory | typeof ALL>(ALL);
  const [length, setLength] = useState<"single" | "multi" | typeof ALL>(ALL);
  const [sort, setSort] = useState<"updated" | "usage" | "delivery" | "name">("usage");

  /* Separate from `editing`, because a new template has no record to edit. */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [previewing, setPreviewing] = useState<SmsTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SmsTemplate | null>(null);

  /* The editor's live draft, so the counter reacts as it is typed. */
  const [draftBody, setDraftBody] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftCategory, setDraftCategory] = useState<SmsTemplateCategory>("reminder");

  const activeFilters = (category === ALL ? 0 : 1) + (length === ALL ? 0 : 1);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return SMS_TEMPLATES.filter((template) => {
      if (
        term &&
        !template.name.toLowerCase().includes(term) &&
        !template.body.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (category !== ALL && template.category !== category) return false;
      if (length !== ALL) {
        const { segments } = countSmsSegments(template.body, SMS_SUBSTITUTIONS);
        if (length === "single" && segments > 1) return false;
        if (length === "multi" && segments <= 1) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "delivery") return b.deliveryRate - a.deliveryRate;
      if (sort === "updated") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      return b.usageCount - a.usageCount;
    });
  }, [category, length, search, sort]);

  function openEditor(template: SmsTemplate | null) {
    setEditing(template);
    setDraftBody(template?.body ?? "");
    setDraftName(template?.name ?? "");
    setDraftCategory(template?.category ?? "reminder");
    setEditorOpen(true);
  }

  return (
    <>
      <Card className="p-5">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          placeholder="Search name or message…"
          activeCount={activeFilters}
          onReset={() => {
            setCategory(ALL);
            setLength(ALL);
          }}
          trailing={
            <Button size="compact" onClick={() => openEditor(null)}>
              <Plus aria-hidden />
              Create Template
            </Button>
          }
        >
          <Select
            label="Filter by category"
            size="sm"
            value={category}
            onChange={(next) => setCategory(next as SmsTemplateCategory | typeof ALL)}
            options={[
              { value: ALL, label: "All categories" },
              ...SMS_TEMPLATE_CATEGORIES,
            ]}
            className="lg:w-40"
          />
          <Select
            label="Filter by length"
            size="sm"
            value={length}
            onChange={(next) => setLength(next as "single" | "multi" | typeof ALL)}
            options={[
              { value: ALL, label: "Any length" },
              { value: "single", label: "One segment" },
              { value: "multi", label: "Multi-segment" },
            ]}
            className="lg:w-40"
          />
          <Select
            label="Sort templates"
            size="sm"
            value={sort}
            onChange={setSort}
            options={[
              { value: "usage", label: "Most used" },
              { value: "delivery", label: "Best delivery" },
              { value: "updated", label: "Recently updated" },
              { value: "name", label: "Name A–Z" },
            ]}
            className="lg:w-44"
          />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState
            title="No templates match those filters"
            description="Try a different search term, or clear the filters."
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setCategory(ALL);
                  setLength(ALL);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((template) => {
              const { characters, segments } = countSmsSegments(
                template.body,
                SMS_SUBSTITUTIONS,
              );
              const multipart = segments > 1;

              return (
                <li key={template.id}>
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-text-primary">
                          {template.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge tone={CATEGORY_TONES[template.category]}>
                            {categoryLabel(template.category)}
                          </Badge>
                          <Badge tone={multipart ? "warning" : "neutral"}>
                            {segments} segment{segments === 1 ? "" : "s"}
                          </Badge>
                        </div>
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
                            onSelect: () => openEditor(template),
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

                    {/* Body in full — an SMS template is its body. */}
                    <p className="mt-4 min-h-20 rounded-panel bg-surface-secondary px-3.5 py-3 font-mono text-[12px] leading-relaxed text-text-secondary">
                      {template.body}
                    </p>

                    <div className="mt-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[11px] text-text-muted">
                          {characters} characters when personalised
                        </p>
                        <p
                          className={cn(
                            "text-[11px] font-medium tabular-nums",
                            multipart ? "text-warning-text" : "text-sms",
                          )}
                        >
                          {segments * (segments > 1 ? 153 : 160)} available
                        </p>
                      </div>
                      <ProgressBar
                        value={(characters / (segments * (segments > 1 ? 153 : 160))) * 100}
                        label={`${template.name} length`}
                        tone={multipart ? "bg-warning" : "bg-sms"}
                        size="sm"
                        className="mt-1.5"
                      />
                    </div>

                    {template.variables.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {template.variables.map((variable) => (
                          <li
                            key={variable}
                            className="rounded-btn bg-sms-soft px-1.5 py-0.5 font-mono text-[11px] text-sms-dark"
                          >
                            {`{{${variable}}}`}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <dl className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5 text-[11px]">
                      <div>
                        <dt className="text-text-muted">Used</dt>
                        <dd className="font-bold text-text-primary tabular-nums">
                          {formatNumber(template.usageCount)} times
                        </dd>
                      </div>
                      <div className="text-right">
                        <dt className="text-text-muted">Delivery</dt>
                        <dd className="font-bold text-sms tabular-nums">
                          {formatPercent(template.deliveryRate)}
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
                        onClick={() => openEditor(template)}
                      >
                        <Pencil aria-hidden />
                        Edit
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ------------------------------------------------------------- Editor */}
      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? `Edit ${editing.name}` : "New template"}
        size="lg"
        footer={
          <>
            <Button variant="outline" size="compact" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              size="compact"
              onClick={() => {
                setEditorOpen(false);
                toast(`${draftName || "Template"} saved`);
              }}
            >
              Save template
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Template name" htmlFor="tpl-name">
              <Input
                id="tpl-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Appointment Reminder"
              />
            </Field>
            <Field label="Category" htmlFor="tpl-category">
              <Select
                id="tpl-category"
                hideLabel={false}
                label="Category"
                value={draftCategory}
                onChange={setDraftCategory}
                options={SMS_TEMPLATE_CATEGORIES}
              />
            </Field>
          </div>

          <SmsComposer value={draftBody} onChange={setDraftBody} id="tpl-body" />

          <div>
            <p className="text-[11px] font-medium tracking-[0.08em] text-text-muted uppercase">
              Preview
            </p>
            <SmsPreview message={draftBody} className="mt-2" />
          </div>
        </div>
      </Dialog>

      {/* ------------------------------------------------------------ Preview */}
      <Dialog
        open={Boolean(previewing)}
        onClose={() => setPreviewing(null)}
        title={previewing?.name ?? "Template"}
        description={
          previewing ? categoryLabel(previewing.category) : undefined
        }
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
                openEditor(previewing);
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
            <SmsPreview message={previewing.body} />

            <div className="rounded-panel border border-border px-3.5 py-3">
              <p className="text-[10px] font-medium tracking-[0.08em] text-text-muted uppercase">
                Raw template
              </p>
              <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-text-secondary">
                {previewing.body}
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              {[
                {
                  label: "Characters",
                  value: String(
                    countSmsSegments(previewing.body, SMS_SUBSTITUTIONS).characters,
                  ),
                },
                {
                  label: "Segments",
                  value: String(
                    countSmsSegments(previewing.body, SMS_SUBSTITUTIONS).segments,
                  ),
                },
                { label: "Times used", value: formatNumber(previewing.usageCount) },
                {
                  label: "Delivery rate",
                  value: formatPercent(previewing.deliveryRate),
                },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-xs text-text-muted">{row.label}</dt>
                  <dd className="font-medium text-text-primary tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
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
              This template has been sent {formatNumber(pendingDelete.usageCount)}{" "}
              times. Past sends keep their message text; any automation still
              pointing at it will fail until you pick a replacement.
            </>
          ) : (
            <>This template has never been sent, so nothing else is affected.</>
          )}
        </p>
      </ConfirmDialog>
    </>
  );
}
