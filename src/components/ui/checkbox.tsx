"use client";

import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name. Pass `labelledBy` instead when a visible label names it. */
  label?: string;
  labelledBy?: string;
  /** The id of a description to announce with the label. */
  describedBy?: string;
  /** The dash state a select-all header shows when only some rows are on. */
  indeterminate?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * A checkbox drawn as a button.
 *
 * Native `input[type=checkbox]` cannot be styled consistently across browsers
 * and has no real indeterminate rendering, so this uses `role="checkbox"` with
 * `aria-checked="mixed"` - which is the state a screen reader should hear on a
 * partially selected header. Space and Enter toggle, as the role requires.
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  labelledBy,
  describedBy,
  indeterminate = false,
  disabled = false,
  id,
  className,
}: CheckboxProps) {
  const state = indeterminate ? "mixed" : checked;

  return (
    <button
      id={id}
      type="button"
      role="checkbox"
      aria-checked={state}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      onKeyDown={(event) => {
        /* Enter does not activate a button by default in every browser, and
           the checkbox role is expected to answer both keys. */
        if (event.key === "Enter") {
          event.preventDefault();
          onCheckedChange(!checked);
        }
      }}
      className={cn(
        "grid size-4.5 shrink-0 place-items-center rounded-[5px] border transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        checked || indeterminate
          ? "border-primary bg-primary text-white"
          : "border-border-strong bg-surface hover:border-primary",
        className,
      )}
    >
      {indeterminate ? (
        <Minus className="size-3" strokeWidth={3.5} aria-hidden />
      ) : checked ? (
        <Check className="size-3" strokeWidth={3.5} aria-hidden />
      ) : null}
    </button>
  );
}

/** Checkbox with a clickable text label beside it. */
export function CheckboxField({
  checked,
  onCheckedChange,
  label,
  hint,
  disabled,
  id,
  className,
}: Omit<CheckboxProps, "label" | "labelledBy"> & {
  label: string;
  hint?: string;
}) {
  const labelId = `${id ?? label.replace(/\s+/g, "-").toLowerCase()}-label`;
  const hintId = `${labelId}-hint`;

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        labelledBy={labelId}
        describedBy={hint ? hintId : undefined}
        disabled={disabled}
        className="mt-0.5"
      />
      {/*
       * The whole text block is the hit target - title and description both -
       * the way a `<label>` would be. Title in primary ink at medium weight,
       * description in secondary ink: the two lines a person actually reads to
       * decide, and muted grey was too faint for either. Disabled dims both
       * together, so the pair stays legible and reads as one unavailable item.
       */}
      <span
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          "min-w-0 select-none",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        )}
      >
        <span id={labelId} className="block text-sm leading-5 font-medium text-text-primary">
          {label}
        </span>
        {hint ? (
          <span id={hintId} className="block text-sm leading-5 text-text-secondary">
            {hint}
          </span>
        ) : null}
      </span>
    </div>
  );
}
