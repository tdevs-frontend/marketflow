"use client";

import { useState } from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronDownSquare,
  CircleDot,
  Copy,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  Type,
  User,
  type LucideIcon,
} from "lucide-react";

import { StepSection } from "@/components/marketing-hub/campaign/shared";
import { Badge } from "@/components/ui/badge";
import { IconButton } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FIELD_KINDS, fieldKindMeta } from "@/constants/forms";
import { CONSENT_CHANNELS } from "@/lib/customer-fixtures";
import { cn } from "@/lib/utils";
import type { ContactChannel } from "@/types/contact";
import type { FormField, FormFieldKind } from "@/types/form";

/**
 * The Fields step: a palette to add from, and the form's fields in order.
 *
 * Order is changed with move up / move down rather than drag and drop. The
 * dashboard has no drag-and-drop library, and one control per direction is
 * also the version a keyboard user and a phone can both operate - which a
 * drag handle on its own is not.
 *
 * One field is open for editing at a time. Twelve fields each showing label,
 * help text and choices is a settings page; a list of names with the one being
 * edited open is a form you can read top to bottom.
 */

const ICONS: Record<FormFieldKind, LucideIcon> = {
  first_name: User,
  last_name: User,
  email: Mail,
  phone: Phone,
  company: Building2,
  message: MessageSquare,
  text: Type,
  textarea: AlignLeft,
  dropdown: ChevronDownSquare,
  radio: CircleDot,
  checkbox: CheckSquare,
  consent: ShieldCheck,
};

let fieldSequence = 0;
const newFieldId = () => {
  fieldSequence += 1;
  return `fld-${Date.now().toString(36)}-${fieldSequence}`;
};

const DEFAULT_OPTIONS = ["Option 1", "Option 2"];

export function newField(kind: FormFieldKind): FormField {
  const meta = fieldKindMeta(kind);
  return {
    id: newFieldId(),
    kind,
    label:
      kind === "consent"
        ? "I agree to receive emails. Unsubscribe at any time."
        : meta.label,
    required: kind === "email",
    options: meta.hasOptions ? [...DEFAULT_OPTIONS] : undefined,
    consentChannel: kind === "consent" ? "email" : undefined,
  };
}

export function FieldList({
  fields,
  onChange,
  issues,
}: {
  fields: FormField[];
  onChange: (next: FormField[]) => void;
  /** Problems keyed by field id, shown on the field. */
  issues: Record<string, string>;
}) {
  const [openId, setOpenId] = useState<string | null>(fields[0]?.id ?? null);

  const present = new Set(fields.map((item) => item.kind));

  function add(kind: FormFieldKind) {
    const created = newField(kind);
    onChange([...fields, created]);
    setOpenId(created.id);
  }

  function patch(id: string, next: Partial<FormField>) {
    onChange(fields.map((item) => (item.id === id ? { ...item, ...next } : item)));
  }

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= fields.length) return;
    const next = [...fields];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function duplicate(index: number) {
    const source = fields[index];
    const copy: FormField = {
      ...source,
      id: newFieldId(),
      label: `${source.label} (copy)`,
      options: source.options ? [...source.options] : undefined,
    };
    const next = [...fields];
    next.splice(index + 1, 0, copy);
    onChange(next);
    setOpenId(copy.id);
  }

  function remove(id: string) {
    onChange(fields.filter((item) => item.id !== id));
    if (openId === id) setOpenId(null);
  }

  const palette = (group: "contact" | "input") =>
    FIELD_KINDS.filter((item) => item.group === group).map((item) => {
      const Icon = ICONS[item.kind];
      const taken = Boolean(item.unique && present.has(item.kind));

      return (
        <button
          key={item.kind}
          type="button"
          onClick={() => add(item.kind)}
          disabled={taken}
          title={taken ? `This form already has a ${item.label} field` : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-btn border px-3 py-2 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
            taken
              ? "cursor-not-allowed border-border bg-surface-secondary text-text-muted"
              : "border-border text-text-secondary hover:border-primary hover:bg-primary-soft hover:text-primary-dark",
          )}
        >
          {taken ? (
            <Icon className="size-4" aria-hidden />
          ) : (
            <Plus className="size-4" aria-hidden />
          )}
          {item.label}
        </button>
      );
    });

  return (
    <div className="space-y-6">
      <StepSection
        title="Add fields"
        hint="Contact fields are written to the CRM and used to match existing contacts. Each can appear once."
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">{palette("contact")}</div>
          <div className="flex flex-wrap gap-2">{palette("input")}</div>
        </div>
      </StepSection>

      <StepSection
        title={`Fields on this form (${fields.length})`}
        hint="Visitors see them in this order. Open one to change its label, help text or choices."
      >
        {fields.length === 0 ? (
          <p className="rounded-panel border border-dashed border-border-strong px-4 py-6 text-center text-sm font-medium text-text-muted">
            No fields yet. Start with Email - it is how submissions find their contact.
          </p>
        ) : (
          <ol className="space-y-2">
            {fields.map((item, index) => {
              const Icon = ICONS[item.kind];
              const meta = fieldKindMeta(item.kind);
              const open = openId === item.id;
              const issue = issues[item.id];
              const editorId = `field-editor-${item.id}`;

              return (
                <li
                  key={item.id}
                  className={cn(
                    "rounded-panel border",
                    issue ? "border-error/50" : open ? "border-primary-border" : "border-border",
                  )}
                >
                  <div className="flex items-center gap-2 px-3 py-2.5">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : item.id)}
                      aria-expanded={open}
                      aria-controls={editorId}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-btn text-left focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-btn bg-surface-secondary text-text-muted">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-text-primary">
                          {item.label || "Untitled field"}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
                          {meta.label}
                          {meta.crmProperty ? <span>· writes {meta.crmProperty}</span> : null}
                          {item.kind === "consent" ? (
                            <span>
                              ·{" "}
                              {CONSENT_CHANNELS.find((channel) => channel.value === item.consentChannel)
                                ?.label ?? "Email"}{" "}
                              consent
                            </span>
                          ) : null}
                        </span>
                      </span>
                      {item.required ? (
                        <Badge variant="primary" casing="none" className="max-sm:hidden">
                          Required
                        </Badge>
                      ) : null}
                      <ChevronDown
                        className={cn("size-4 shrink-0 text-text-muted transition-transform", open && "rotate-180")}
                        aria-hidden
                      />
                    </button>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <IconButton
                        label={`Move ${item.label} up`}
                        size="sm"
                        variant="quiet"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUp aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`Move ${item.label} down`}
                        size="sm"
                        variant="quiet"
                        disabled={index === fields.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDown aria-hidden />
                      </IconButton>
                      <IconButton
                        label={
                          meta.unique
                            ? `${meta.label} can appear once, so it cannot be duplicated`
                            : `Duplicate ${item.label}`
                        }
                        size="sm"
                        variant="quiet"
                        disabled={meta.unique}
                        onClick={() => duplicate(index)}
                        className="max-sm:hidden"
                      >
                        <Copy aria-hidden />
                      </IconButton>
                      <IconButton
                        label={`Delete ${item.label}`}
                        size="sm"
                        variant="quiet-danger"
                        onClick={() => remove(item.id)}
                      >
                        <Trash2 aria-hidden />
                      </IconButton>
                    </div>
                  </div>

                  {issue ? (
                    <p className="px-3 pb-2.5 text-sm text-error">{issue}</p>
                  ) : null}

                  {open ? (
                    <div
                      id={editorId}
                      className="grid gap-4 border-t border-border px-3 py-4 sm:grid-cols-2"
                    >
                      <div className="sm:col-span-2">
                        <Field
                          label={item.kind === "consent" ? "Consent wording" : "Label"}
                          htmlFor={`${item.id}-label`}
                        >
                          {item.kind === "consent" ? (
                            <Textarea
                              id={`${item.id}-label`}
                              rows={2}
                              value={item.label}
                              onChange={(event) => patch(item.id, { label: event.target.value })}
                            />
                          ) : (
                            <Input
                              id={`${item.id}-label`}
                              value={item.label}
                              onChange={(event) => patch(item.id, { label: event.target.value })}
                            />
                          )}
                        </Field>
                      </div>

                      <div className="sm:col-span-2">
                        <Field
                          label="Help text"
                          htmlFor={`${item.id}-help`}
                          hint="Optional. Shown under the field."
                        >
                          <Input
                            id={`${item.id}-help`}
                            value={item.helpText ?? ""}
                            onChange={(event) =>
                              patch(item.id, { helpText: event.target.value || undefined })
                            }
                          />
                        </Field>
                      </div>

                      {meta.hasOptions ? (
                        <div className="sm:col-span-2">
                          <Field
                            label="Choices"
                            htmlFor={`${item.id}-options`}
                            hint="One per line, in the order visitors see them."
                          >
                            <Textarea
                              id={`${item.id}-options`}
                              rows={4}
                              value={(item.options ?? []).join("\n")}
                              onChange={(event) =>
                                patch(item.id, { options: event.target.value.split("\n") })
                              }
                            />
                          </Field>
                        </div>
                      ) : null}

                      {item.kind === "consent" ? (
                        <Field
                          label="Channel"
                          htmlFor={`${item.id}-channel`}
                          hint="A ticked box opts in to this channel only."
                        >
                          <Select
                            id={`${item.id}-channel`}
                            label="Channel"
                            hideLabel={false}
                            value={item.consentChannel ?? "email"}
                            onChange={(next) =>
                              patch(item.id, { consentChannel: next as ContactChannel })
                            }
                            options={CONSENT_CHANNELS}
                          />
                        </Field>
                      ) : null}

                      <div className="flex items-end sm:col-span-2">
                        <CheckboxField
                          id={`${item.id}-required`}
                          label="Required"
                          hint={
                            item.kind === "consent"
                              ? "Visitors must tick it to submit."
                              : "The form will not send until this is answered."
                          }
                          checked={item.required}
                          onCheckedChange={(on) => patch(item.id, { required: on })}
                        />
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </StepSection>
    </div>
  );
}
