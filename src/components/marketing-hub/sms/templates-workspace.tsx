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
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  SMS_TEMPLATES,
  SMS_TEMPLATE_CATEGORIES,
  SMS_SUBSTITUTIONS,
} from "@/lib/sms-fixtures";
import { formatNumber, formatPercent, formatRelativeTime } from "@/lib/format";
import { SMS_CONCAT_LIMIT, SMS_SINGLE_LIMIT, countSmsSegments } from "@/types/sms";
import type { SmsTemplate, SmsTemplateCategory } from "@/types/sms";
import { SmsComposer, SmsPreview } from "./composer";

/**
 * The SMS template library.
 *
 * Cards show the message body in full rather than truncated, because an SMS
 * template *is* its body - there is no layout, no subject and no imagery to
 * summarise. The segment count sits on every card for the same reason it is in
 * the composer: a two-segment template doubles the cost of every campaign that
 * uses it, and that is worth knowing before you pick one.
 *
 * Text-first, and kept that way. The card used to draw a progress bar under
 * the body showing characters against the segment capacity, which is the one
 * reading here that a length cannot carry: what matters is not that a message
 * fills 62% of its allowance, it is whether it crosses 160 and doubles the
 * bill - a threshold, and the segment badge already names it. The bar is now a
 * line of type, the card is shorter for it, and three of these fit the screen
 * where two did.
 *
 * Three figures on the footer, not two. Delivery rate alone ranked the
 * verification code above everything in the library and the feedback request
 * near the bottom, which is exactly backwards for a template you are choosing
 * because you want an answer.
 *
 * The card is two zones and the gap between them is elastic. Everything above
 * the rule is the template - name, badges, body, length, placeholders - and
 * everything below it is how the template has performed. `mt-auto` on the
 * footer pins the second zone to the bottom so a row of cards has its figures
 * on one line however long the bodies above them run, and the `pt-5` beside
 * it is the part that was missing: with `mt-auto` alone a card whose content
 * exactly filled the space put the placeholder chips hard against the rule.
 * The padding is a floor, the auto margin is the slack.
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
  const [sort, setSort] = useState<
    "updated" | "usage" | "delivery" | "reply" | "name"
  >("usage");

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
      if (sort === "reply") return b.replyRate - a.replyRate;
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
              { value: "reply", label: "Best reply rate" },
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
          <ul className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((template) => {
              const { characters, segments } = countSmsSegments(
                template.body,
                SMS_SUBSTITUTIONS,
              );
              const multipart = segments > 1;
              /* Concatenated parts lose seven characters to the header, so a
                 two-part template holds 306 rather than 320. */
              const capacity = multipart ? SMS_CONCAT_LIMIT : SMS_SINGLE_LIMIT;

              return (
                <li key={template.id}>
                  <Card className="flex h-full flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* One step up from the `text-sm` the rest of the
                            card sits on. The name is what the eye lands on
                            first and it was the same size as its own
                            metadata. */}
                        <h3 className="truncate text-base font-semibold text-text-primary">
                          {template.name}
                        </h3>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <Badge tone={CATEGORY_TONES[template.category]} size="sm">
                            {categoryLabel(template.category)}
                          </Badge>
                          <Badge
                            tone={multipart ? "warning" : "neutral"}
                            size="sm"
                          >
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

                    {/* Body in full - an SMS template is its body. The
                        24px leading is what makes this read as a message
                        rather than a paragraph of code: at `leading-relaxed`
                        the mono face packed three lines into the height two
                        should take. */}
                    <p className="mt-4 rounded-panel bg-surface-secondary px-3.5 py-3 font-mono text-sm leading-6 text-text-secondary">
                      {template.body}
                    </p>

                    {/* The length, as a sentence. The number that decides
                        anything is the capacity it is measured against, and
                        that only changes at the threshold the badge names. */}
                    <p className="mt-3.5 text-sm text-text-muted tabular-nums">
                      {characters} of {segments * capacity} characters when
                      personalised
                      {multipart ? (
                        <span className="font-medium text-warning-text">
                          {" "}
                          · billed {segments}×
                        </span>
                      ) : null}
                    </p>

                    {/* The chips get their own band. They were sharing the
                        length line's margin on one side and the rule's on the
                        other, which put a run of eight placeholders in contact
                        with both. */}
                    {template.variables.length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {template.variables.map((variable) => (
                          <li
                            key={variable}
                            className="rounded-btn bg-sms-soft px-1.5 py-0.5 font-mono text-sm text-sms-dark"
                          >
                            {`{{${variable}}}`}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {/* The performance zone. `mt-auto` takes the slack, the
                        `pt-5` guarantees the clearance. */}
                    <div className="mt-auto pt-5">
                      <dl className="grid grid-cols-3 gap-3 border-t border-border pt-4">
                        {[
                          {
                            label: "Used",
                            value: formatNumber(template.usageCount),
                          },
                          {
                            label: "Delivery",
                            value: formatPercent(template.deliveryRate),
                          },
                          {
                            label: "Reply",
                            value: formatPercent(template.replyRate),
                          },
                        ].map((cell) => (
                          <div key={cell.label} className="min-w-0">
                            <dt className="truncate text-sm text-text-muted">
                              {cell.label}
                            </dt>
                            {/* One step up from the label and all three on the
                                same ink. Reply used to be the channel purple,
                                which made one of three equivalent readings
                                look like the one that counted. */}
                            <dd className="mt-1 text-base font-bold text-text-primary tabular-nums">
                              {cell.value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <p className="mt-3 text-sm text-text-muted">
                        Updated {formatRelativeTime(template.updatedAt)}
                      </p>

                      {/* A two-column grid rather than two flexed children:
                          `flex-1` splits the free space, not the row, so
                          "Preview" and "Edit" came out different widths. */}
                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewing(template)}
                        >
                          <Eye aria-hidden />
                          Preview
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openEditor(template)}
                        >
                          <Pencil aria-hidden />
                          Edit
                        </Button>
                      </div>
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
            <p className="text-sm font-medium  text-text-muted capitalize">
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
              <p className="text-sm font-semibold  text-text-primary capitalize">
                Raw template
              </p>
              <p className="mt-1.5 font-mono text-sm leading-relaxed text-text-secondary">
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
                {
                  label: "Reply rate",
                  value: formatPercent(previewing.replyRate),
                },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-sm text-text-muted">{row.label}</dt>
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
