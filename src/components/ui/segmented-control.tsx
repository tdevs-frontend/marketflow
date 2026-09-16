"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Which job the control is doing.
 *
 * `control` is the original: a compact switch that swaps a chart or a panel in
 * place, sitting inside a card header beside a title. It is deliberately dense
 * and bold — it is chrome, and it is read at a glance rather than scanned.
 *
 * `filter` is a page's primary filter strip: wider, lighter in weight, and with
 * a bordered chip for the active item so it reads as a *selected* thing rather
 * than a highlighted one. It is the first control on the page and carries
 * counts, so its inactive items sit on secondary ink instead of muted — they
 * have to stay readable, not recede.
 *
 * Two variants rather than restyling the one: thirty-odd call sites use the
 * compact form for chart toolbars, and making them all page-weight would be a
 * change to every analytics panel in the product.
 */
export type SegmentedVariant = "control" | "filter";

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Names the group for assistive tech. */
  label: string;
  size?: "sm" | "md";
  variant?: SegmentedVariant;
  className?: string;
}

/* Geometry only. Weight and colour belong to the variant, so the two never
   fight over the same utility — `cn()` is a plain join, and a class that loses
   the cascade is a class that silently does nothing. */
const SIZES = {
  sm: "h-7 px-2.5 text-sm",
  md: "h-8 px-3 text-sm",
} as const;

const VARIANTS: Record<
  SegmentedVariant,
  { track: string; item: string; active: string; idle: string }
> = {
  control: {
    track: "gap-0.5 rounded-btn p-0.5",
    item: "rounded-[4px] font-bold transition-colors",
    active: "bg-surface text-primary",
    idle: "text-text-muted hover:text-text-primary",
  },
  filter: {
    /* A touch more room than the compact form — this is a control a merchant
       aims at, not one they glance past. */
    track: "gap-1 rounded-panel p-1",
    /* The border is on both states, transparent when idle, so selecting an
       item cannot shift the row by a pixel. */
    item: "rounded-btn border font-bold transition-all",
    active: "border-border bg-white text-primary",
    idle: "border-transparent text-text-primary/70 hover:text-text-primary",
  },
};

/**
 * Filter chips in a tinted track. Not `role="tablist"` — that would promise
 * arrow-key navigation and a `tabpanel`; these just switch what a list or a
 * chart is showing, in place.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  variant = "control",
  className,
}: SegmentedControlProps<T>) {
  const style = VARIANTS[variant];

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center bg-gray/50",
        style.track,
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
              "font-semibold whitespace-nowrap focus-visible:shadow-focus focus-visible:outline-none",
              SIZES[size],
              style.item,
              selected ? style.active : style.idle,
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
