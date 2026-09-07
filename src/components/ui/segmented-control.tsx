"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive tech — the buttons carry no visible label. */
  label: string;
  size?: "sm" | "md";
  className?: string;
}

const SIZES = {
  sm: "h-7 px-2.5 text-[11px]",
  md: "h-8 px-3 text-xs",
} as const;

/**
 * Filter chips in a tinted track.
 *
 * `role="tablist"` would promise arrow-key navigation between tabs and a
 * matching `tabpanel`; these switch a chart in place, so they stay ordinary
 * buttons in a labelled group and `aria-pressed` carries the state.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-btn bg-surface-secondary p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "rounded-[7px] font-medium whitespace-nowrap transition-colors focus-visible:shadow-focus focus-visible:outline-none",
              SIZES[size],
              selected
                ? "bg-surface text-text-primary shadow-btn"
                : "text-text-muted hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
