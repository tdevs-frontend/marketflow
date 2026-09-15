"use client";

import type { ReactNode } from "react";

import { CheckboxField } from "@/components/ui/checkbox";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";

/**
 * The pieces every wizard step is built from.
 *
 * None of these are new design — they are the radio card, section legend and
 * summary row the wizard already used, lifted out of one 980-line file so that
 * seven steps cannot each drift their own version. Same classes, same
 * behaviour, one definition.
 */

/** A labelled block of a step. Replaces a bare `fieldset` + `legend` pair. */
export function StepSection({
  title,
  hint,
  action,
  children,
  className,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-text-secondary">{title}</h3>
          {hint ? (
            <p className="mt-1 text-sm font-medium text-text-muted">{hint}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * The selectable card the wizard uses for every either/or choice.
 *
 * `aria-pressed` rather than a radio input because the visual is a card, not a
 * dot — and because the same component has to serve single-select (channel,
 * send mode) and multi-select (social accounts) without changing shape.
 */
export function OptionCard({
  selected,
  onClick,
  icon,
  title,
  hint,
  trailing,
  disabled,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  hint?: string;
  trailing?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-start gap-3 rounded-panel border p-3.5 text-left transition-colors focus-visible:shadow-focus focus-visible:outline-none",
        disabled
          ? "cursor-not-allowed border-border bg-surface-secondary opacity-60"
          : selected
            ? "border-primary bg-primary-subtle"
            : "border-border hover:border-border-strong",
        className,
      )}
    >
      {icon ? (
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-btn [&_svg]:size-4",
            selected ? "bg-primary text-white" : "bg-surface-secondary text-text-muted",
          )}
        >
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text-primary">{title}</span>
        {hint ? (
          <span className="mt-0.5 block text-sm font-medium text-text-muted">
            {hint}
          </span>
        ) : null}
      </span>

      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </button>
  );
}

/** A row in the Review step's summary list. */
export function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="max-w-[60%] text-right text-sm font-medium text-text-primary">
        {value}
      </dd>
    </div>
  );
}

/**
 * A setting that is on or off, with room for the fields it reveals.
 *
 * The bordered panel is what makes a disclosed sub-form read as belonging to
 * its switch rather than floating beside it — quiet hours and the frequency cap
 * both need that, and both would otherwise invent it separately.
 */
export function TogglePanel({
  id,
  checked,
  onCheckedChange,
  label,
  hint,
  children,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-border px-3.5 py-3">
      <CheckboxField
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        label={label}
        hint={hint}
      />
      {checked && children ? (
        <div className="mt-3.5 border-t border-border pt-3.5">{children}</div>
      ) : null}
    </div>
  );
}

/** A figure with a word under it. The Send step's headline numbers. */
export function StatTile({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const TONES = {
    neutral: "text-text-primary",
    success: "text-success-text",
    warning: "text-warning-text",
    danger: "text-error-text",
  };

  return (
    <div className="rounded-panel border border-border px-3.5 py-3">
      <dt className="text-sm font-medium text-text-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 text-lg leading-none font-bold tabular-nums",
          TONES[tone],
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * A fixed vocabulary of labels, picked by toggling.
 *
 * Free text would be a third tag system — the workspace already has campaign
 * tags and contact tags, and a campaign labelled "summer-sale" cannot be
 * grouped with one labelled "Summer Sale".
 */
export function TagPicker({
  options,
  selected,
  onChange,
  emptyLabel = "No tags selected",
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  emptyLabel?: string;
}) {
  const chosen = new Set(selected);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const on = chosen.has(option);

          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() =>
                onChange(
                  on
                    ? selected.filter((item) => item !== option)
                    : [...selected, option],
                )
              }
              className={cn(
                "rounded-btn border px-2.5 py-1 text-sm font-medium transition-colors focus-visible:shadow-focus focus-visible:outline-none",
                on
                  ? "border-primary bg-primary-soft text-primary-dark"
                  : "border-border text-text-secondary hover:border-border-strong hover:text-text-primary",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected.length === 0 ? (
        <p className="text-sm font-medium text-text-muted">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((item) => (
            <Tag
              key={item}
              label={item}
              tone="bg-primary-soft text-primary-dark"
              onRemove={() => onChange(selected.filter((tag) => tag !== item))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** The warning strip the wizard already used for soft problems. */
export function WarningNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-panel border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-sm text-warning-text">
      {children}
    </p>
  );
}
