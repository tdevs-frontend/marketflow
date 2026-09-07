"use client";

import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name. Pass `labelledBy` instead when a visible label names it. */
  label?: string;
  labelledBy?: string;
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
 * `aria-checked="mixed"` — which is the state a screen reader should hear on a
 * partially selected header. Space and Enter toggle, as the role requires.
 */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  labelledBy,
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

  return (
    <div className={cn("flex items-start gap-2.5", className)}>
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        labelledBy={labelId}
        disabled={disabled}
        className="mt-0.5"
      />
      <span className="min-w-0">
        <span
          id={labelId}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            "block cursor-pointer text-sm text-text-secondary select-none",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {label}
        </span>
        {hint ? <span className="block text-xs text-text-muted">{hint}</span> : null}
      </span>
    </div>
  );
}
