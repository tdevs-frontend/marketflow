"use client";

import { useState } from "react";
import { ExternalLink, MessageCircle, Phone, Plus, Reply, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_LANGUAGES,
  TEMPLATE_VARIABLES,
} from "@/lib/whatsapp-fixtures";
import { cn, slugify } from "@/lib/utils";
import type {
  TemplateButton,
  TemplateCategory,
  WhatsAppTemplate,
} from "@/types/marketing";
import { languageLabel } from "./template-card";

/** Swaps `{{name}}` for the sample value, so the preview reads as a real message. */
export function renderWithSamples(body: string) {
  return body.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const variable = TEMPLATE_VARIABLES.find((item) => item.name === key);
    return variable ? variable.sample : match;
  });
}

const BUTTON_ICONS: Record<TemplateButton["type"], typeof Reply> = {
  url: ExternalLink,
  "quick-reply": Reply,
  phone: Phone,
};

/* -------------------------------------------------------------------------- */
/* Preview                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The template as the customer receives it — a chat bubble on the WhatsApp
 * wallpaper ground, with variables filled in. Approving a template is a
 * judgement about the message someone actually reads, not the raw string.
 */
export function TemplatePreviewDialog({
  template,
  onClose,
}: {
  template: WhatsAppTemplate | null;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={Boolean(template)}
      onClose={onClose}
      title="Template preview"
      description={template ? template.name : undefined}
    >
      {template ? (
        <div className="rounded-card bg-[#e8ddd3] p-4">
          <div className="flex items-center gap-2.5 pb-3">
            <span className="grid size-8 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
              MF
            </span>
            <span>
              <span className="block text-[13px] font-medium text-text-primary">
                MarketFlow
              </span>
              <span className="block text-[10px] text-text-muted">Business account</span>
            </span>
          </div>

          <div className="max-w-[85%] rounded-panel rounded-tl-sm bg-white p-3 shadow-btn">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-text-primary">
              {renderWithSamples(template.body)}
            </p>

            {template.footer ? (
              <p className="mt-2 text-[11px] text-text-muted">{template.footer}</p>
            ) : null}

            <p className="mt-1.5 text-right text-[10px] text-text-muted">09:41</p>

            {template.buttons.length > 0 ? (
              <ul className="mt-2 space-y-1 border-t border-border pt-2">
                {template.buttons.map((button) => {
                  const Icon = BUTTON_ICONS[button.type];

                  return (
                    <li key={button.label}>
                      <span className="flex items-center justify-center gap-1.5 rounded-btn py-1.5 text-[13px] font-medium text-accent">
                        <Icon className="size-3.5" aria-hidden />
                        {button.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <p className="mt-3 text-center text-[11px] text-text-muted">
            {languageLabel(template.language)} · variables shown with sample data
          </p>
        </div>
      ) : null}
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/* Create / edit                                                              */
/* -------------------------------------------------------------------------- */

interface Draft {
  name: string;
  category: TemplateCategory;
  language: string;
  body: string;
  footer: string;
  buttons: TemplateButton[];
}

const EMPTY: Draft = {
  name: "",
  category: "marketing",
  language: "en_US",
  body: "",
  footer: "",
  buttons: [],
};

function draftFrom(template: WhatsAppTemplate): Draft {
  return {
    name: template.name,
    category: template.category,
    language: template.language,
    body: template.body,
    footer: template.footer ?? "",
    buttons: template.buttons,
  };
}

export function TemplateFormDialog({
  open,
  template,
  onClose,
}: {
  open: boolean;
  /** Present when editing; absent when creating. */
  template: WhatsAppTemplate | null;
  onClose: () => void;
}) {
  const toast = useToast();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonType, setButtonType] = useState<TemplateButton["type"]>("url");
  const [hydratedFor, setHydratedFor] = useState<string | null>(null);

  /* Load the template into the draft once per open, adjusted during render so
     the first paint already shows the values. */
  const key = template?.id ?? (open ? "new" : null);
  if (open && key !== hydratedFor) {
    setHydratedFor(key);
    setDraft(template ? draftFrom(template) : EMPTY);
    setErrors({});
  }
  if (!open && hydratedFor !== null) setHydratedFor(null);

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  /** Variables are derived from the body, not tracked separately. */
  const usedVariables = [
    ...new Set([...draft.body.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1])),
  ];

  function insertVariable(name: string) {
    set("body", `${draft.body}{{${name}}}`);
  }

  function submit() {
    const next: Record<string, string> = {};
    if (!draft.name.trim()) next.name = "Name the template.";
    if (!draft.body.trim()) next.body = "Write the message body.";
    if (draft.body.length > 1024) next.body = "Body must be 1024 characters or fewer.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    onClose();
    toast(template ? "Template updated successfully" : "Template created successfully");
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={template ? `Edit ${template.name}` : "Create template"}
      description="Templates are reviewed by Meta before they can be sent."
      size="lg"
      footer={
        <>
          <Button variant="outline" size="compact" onClick={onClose}>
            Cancel
          </Button>
          <Button size="compact" onClick={submit}>
            {template ? "Save template" : "Submit for review"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Template Name"
            htmlFor="tpl-name"
            error={errors.name}
            hint="Lowercase and underscores — this is the API identifier."
          >
            <Input
              id="tpl-name"
              value={draft.name}
              error={Boolean(errors.name)}
              placeholder="order_confirmation"
              className="h-11 font-mono"
              onChange={(event) =>
                set("name", slugify(event.target.value).replace(/-/g, "_"))
              }
            />
          </Field>

          <Field label="Category" htmlFor="tpl-category">
            <Select
              id="tpl-category"
              label="Category"
              hideLabel={false}
              value={draft.category}
              onChange={(next) => set("category", next as TemplateCategory)}
              options={TEMPLATE_CATEGORIES}
            />
          </Field>
        </div>

        <Field label="Language" htmlFor="tpl-language">
          <Select
            id="tpl-language"
            label="Language"
            hideLabel={false}
            value={draft.language}
            onChange={(next) => set("language", next)}
            options={TEMPLATE_LANGUAGES}
          />
        </Field>

        <Field
          label="Message Body"
          htmlFor="tpl-body"
          error={errors.body}
          hint={`${draft.body.length} / 1024 characters`}
        >
          <Textarea
            id="tpl-body"
            value={draft.body}
            error={Boolean(errors.body)}
            rows={5}
            placeholder="Hi {{name}}, your order {{order_id}} has been confirmed."
            onChange={(event) => set("body", event.target.value)}
          />
        </Field>

        {/* Variables */}
        <div>
          <p className="text-sm font-medium text-text-primary">Variables</p>
          <p className="mt-0.5 text-xs text-text-muted">
            Click to insert. Whatever appears in the body becomes a variable.
          </p>

          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((variable) => {
              const used = usedVariables.includes(variable.name);

              return (
                <li key={variable.name}>
                  <button
                    type="button"
                    onClick={() => insertVariable(variable.name)}
                    className={cn(
                      "rounded-btn border px-2 py-1 font-mono text-[11px] transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                      used
                        ? "border-primary bg-primary-soft text-primary-dark"
                        : "border-border text-text-secondary hover:border-primary hover:bg-primary-subtle",
                    )}
                  >
                    {`{{${variable.name}}}`}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <Field label="Footer" htmlFor="tpl-footer" hint="Optional. Small print below the message.">
          <Input
            id="tpl-footer"
            value={draft.footer}
            placeholder="Reply STOP to opt out"
            className="h-11"
            onChange={(event) => set("footer", event.target.value)}
          />
        </Field>

        {/* Buttons */}
        <div>
          <p className="text-sm font-medium text-text-primary">Buttons</p>
          <p className="mt-0.5 text-xs text-text-muted">
            Up to three call-to-action or quick-reply buttons.
          </p>

          {draft.buttons.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {draft.buttons.map((button) => (
                <li
                  key={button.label}
                  className="flex items-center gap-2.5 rounded-panel border border-border px-3 py-2"
                >
                  <MessageCircle className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
                    {button.label}
                  </span>
                  <span className="shrink-0 text-[11px] text-text-muted">
                    {button.type}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${button.label}`}
                    onClick={() =>
                      set(
                        "buttons",
                        draft.buttons.filter((item) => item.label !== button.label),
                      )
                    }
                    className="grid size-6 shrink-0 place-items-center rounded-btn text-text-muted transition-colors hover:bg-surface-secondary hover:text-error focus-visible:shadow-focus focus-visible:outline-none"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-2.5 flex flex-wrap gap-2">
            <Input
              value={buttonLabel}
              placeholder="Shop Now"
              aria-label="Button label"
              className="h-11 min-w-0 flex-1"
              onChange={(event) => setButtonLabel(event.target.value)}
            />
            <Select
              label="Button type"
              value={buttonType}
              onChange={(next) => setButtonType(next as TemplateButton["type"])}
              options={[
                { value: "url", label: "Visit URL" },
                { value: "quick-reply", label: "Quick reply" },
                { value: "phone", label: "Call phone" },
              ]}
              className="w-40"
            />
            <Button
              variant="outline"
              size="compact"
              disabled={!buttonLabel.trim() || draft.buttons.length >= 3}
              onClick={() => {
                set("buttons", [
                  ...draft.buttons,
                  { label: buttonLabel.trim(), type: buttonType },
                ]);
                setButtonLabel("");
              }}
            >
              <Plus aria-hidden />
              Add
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
