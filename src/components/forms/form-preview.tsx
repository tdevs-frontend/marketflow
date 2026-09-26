"use client";

import { useId, useState } from "react";
import type { CSSProperties } from "react";
import { Check, CheckCircle2, ExternalLink, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/checkbox";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  FormBehavior,
  FormDesign,
  FormField,
  FormRadius,
  FormSpacing,
  SubmissionValue,
} from "@/types/form";

/**
 * The form as a visitor would meet it.
 *
 * Built from the dashboard's own `Field`, `Input`, `Select` and `Button`, so
 * "MarketFlow styles by default" is literal: the embed ships these same
 * controls. The design settings reach in only through the two radius tokens
 * and a gap - scoped to this container as custom properties, so the preview can
 * be square or pill without a single global token changing.
 *
 * It is a working form. Required fields are enforced, email and phone are
 * checked, and the success state is the one the visitor will see. What happens
 * to the answers is the caller's: the builder shows the success state and
 * stops, the preview dialog records a test submission.
 */

const RADIUS: Record<FormRadius, CSSProperties> = {
  square: { "--radius-field": "2px", "--radius-btn": "2px" } as CSSProperties,
  rounded: {},
  pill: { "--radius-field": "22px", "--radius-btn": "999px" } as CSSProperties,
};

const GAP: Record<FormSpacing, string> = {
  compact: "gap-3",
  comfortable: "gap-4",
  spacious: "gap-6",
};

/** Kinds that always take the full row, even in the two-column layout. */
const FULL_WIDTH = new Set(["message", "textarea", "radio", "checkbox", "consent"]);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(fields: FormField[], values: Record<string, SubmissionValue>) {
  const errors: Record<string, string> = {};

  for (const item of fields) {
    const value = values[item.id];
    const empty =
      value === undefined ||
      value === false ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0);

    if (item.required && empty) {
      errors[item.id] =
        item.kind === "consent" ? "Please tick the box to continue." : "This field is required.";
      continue;
    }

    if (item.kind === "email" && typeof value === "string" && value && !EMAIL.test(value)) {
      errors[item.id] = "Enter a valid email address.";
    }
    if (
      item.kind === "phone" &&
      typeof value === "string" &&
      value &&
      value.replace(/\D/g, "").length < 7
    ) {
      errors[item.id] = "Enter a phone number with its country code.";
    }
  }

  return errors;
}

export function FormPreview({
  fields,
  design,
  behavior,
  onSubmit,
  note,
  className,
}: {
  fields: FormField[];
  design: FormDesign;
  behavior: Pick<FormBehavior, "onSuccess" | "redirectUrl">;
  /** Receives valid answers. Omit and the preview stops at the success state. */
  onSubmit?: (values: Record<string, SubmissionValue>) => void;
  /** A line under the success message - what the preview did with the answers. */
  note?: string;
  className?: string;
}) {
  const idBase = useId();
  const [values, setValues] = useState<Record<string, SubmissionValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const set = (id: string, value: SubmissionValue) => {
    setValues((current) => ({ ...current, [id]: value }));
    if (errors[id]) setErrors((current) => ({ ...current, [id]: "" }));
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const found = validate(fields, values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    onSubmit?.(values);
    setDone(true);
  }

  function reset() {
    setValues({});
    setErrors({});
    setDone(false);
  }

  const shell = cn(
    "rounded-card border border-border bg-surface p-5 sm:p-6",
    className,
  );

  if (done) {
    return (
      <div className={shell} style={RADIUS[design.radius]} role="status">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid size-11 place-items-center rounded-full bg-success-soft text-success-text">
            <CheckCircle2 className="size-5.5" aria-hidden />
          </span>
          {behavior.onSuccess === "redirect" && behavior.redirectUrl ? (
            <p className="max-w-sm text-sm font-medium text-text-secondary">
              Visitors are sent to{" "}
              <span className="inline-flex items-center gap-1 font-semibold break-all text-text-primary">
                {behavior.redirectUrl}
                <ExternalLink className="size-3.5 shrink-0" aria-hidden />
              </span>
            </p>
          ) : (
            <p className="max-w-sm text-sm font-semibold text-text-primary">
              {design.successMessage || "Thanks - your answers have been sent."}
            </p>
          )}
          {note ? <p className="max-w-sm text-sm text-text-muted">{note}</p> : null}
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw aria-hidden />
            Fill it in again
          </Button>
        </div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className={cn(shell, "py-10 text-center")}>
        <p className="text-sm font-medium text-text-muted">
          Add a field and it appears here.
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className={shell}
      style={RADIUS[design.radius]}
    >
      <div
        className={cn(
          "grid",
          GAP[design.spacing],
          design.layout === "two_column" && "sm:grid-cols-2",
        )}
      >
        {fields.map((item) => {
          const id = `${idBase}-${item.id}`;
          const error = errors[item.id] || undefined;
          const value = values[item.id];
          const wide = design.layout === "two_column" && FULL_WIDTH.has(item.kind);
          const label = item.required ? `${item.label} *` : item.label;

          return (
            <div key={item.id} className={cn(wide && "sm:col-span-2")}>
              <FieldControl
                id={id}
                field={item}
                label={label}
                value={value}
                error={error}
                onChange={(next) => set(item.id, next)}
              />
            </div>
          );
        })}
      </div>

      <Button
        type="submit"
        variant={design.buttonStyle}
        className={cn(
          "w-full sm:w-auto",
          design.spacing === "spacious" ? "mt-7" : design.spacing === "compact" ? "mt-4" : "mt-5",
        )}
      >
        {design.buttonLabel || "Submit"}
      </Button>
    </form>
  );
}

/** One field, by kind. Identity kinds are inputs with the right `type`. */
function FieldControl({
  id,
  field,
  label,
  value,
  error,
  onChange,
}: {
  id: string;
  field: FormField;
  label: string;
  value: SubmissionValue | undefined;
  error?: string;
  onChange: (value: SubmissionValue) => void;
}) {
  const text = typeof value === "string" ? value : "";
  const describedBy = error ? `${id}-error` : field.helpText ? `${id}-hint` : undefined;

  switch (field.kind) {
    case "message":
    case "textarea":
      return (
        <Field label={label} htmlFor={id} hint={field.helpText} error={error}>
          <Textarea
            id={id}
            rows={4}
            value={text}
            error={Boolean(error)}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      );

    case "dropdown":
      return (
        <Field label={label} htmlFor={id} hint={field.helpText} error={error}>
          <Select
            id={id}
            label={field.label}
            hideLabel={false}
            placeholder=""
            value={text}
            error={Boolean(error)}
            onChange={onChange}
            options={(field.options ?? []).map((option) => ({ value: option, label: option }))}
          />
        </Field>
      );

    case "radio":
      return (
        <fieldset aria-describedby={describedBy}>
          <legend className="mb-1.5 block text-sm font-bold text-text-secondary">{label}</legend>
          <div className="space-y-2">
            {(field.options ?? []).map((option) => {
              const selected = text === option;
              return (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-2.5 rounded-btn text-sm font-medium text-text-secondary focus-within:shadow-focus"
                >
                  <input
                    type="radio"
                    name={id}
                    value={option}
                    checked={selected}
                    onChange={() => onChange(option)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-4.5 shrink-0 place-items-center rounded-full border transition-colors",
                      selected ? "border-primary bg-primary text-white" : "border-border-strong bg-surface",
                    )}
                  >
                    {selected ? <Check className="size-3" strokeWidth={3.5} /> : null}
                  </span>
                  {option}
                </label>
              );
            })}
          </div>
          <FieldNote id={id} error={error} hint={field.helpText} />
        </fieldset>
      );

    case "checkbox": {
      const chosen = Array.isArray(value) ? value : [];
      return (
        <fieldset aria-describedby={describedBy}>
          <legend className="mb-1.5 block text-sm font-bold text-text-secondary">{label}</legend>
          <div className="space-y-2">
            {(field.options ?? []).map((option, index) => (
              <CheckboxField
                key={option}
                id={`${id}-${index}`}
                label={option}
                checked={chosen.includes(option)}
                onCheckedChange={(on) =>
                  onChange(on ? [...chosen, option] : chosen.filter((item) => item !== option))
                }
              />
            ))}
          </div>
          <FieldNote id={id} error={error} hint={field.helpText} />
        </fieldset>
      );
    }

    case "consent":
      return (
        <div>
          <CheckboxField
            id={id}
            label={label}
            hint={field.helpText}
            checked={value === true}
            onCheckedChange={(on) => onChange(on)}
          />
          <FieldNote id={id} error={error} />
        </div>
      );

    default: {
      const type =
        field.kind === "email" ? "email" : field.kind === "phone" ? "tel" : "text";
      const autoComplete: Record<string, string> = {
        first_name: "given-name",
        last_name: "family-name",
        email: "email",
        phone: "tel",
        company: "organization",
      };

      return (
        <Field label={label} htmlFor={id} hint={field.helpText} error={error}>
          <Input
            id={id}
            type={type}
            autoComplete={autoComplete[field.kind] ?? "off"}
            value={text}
            error={Boolean(error)}
            aria-describedby={describedBy}
            onChange={(event) => onChange(event.target.value)}
          />
        </Field>
      );
    }
  }
}

/** The error-or-hint line for the grouped controls `Field` does not wrap. */
function FieldNote({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-error">
        {error}
      </p>
    );
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="mt-1.5 text-sm font-medium text-text-muted">
        {hint}
      </p>
    );
  }
  return null;
}
