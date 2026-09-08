import { cn } from "@/lib/utils";

/**
 * A rate as a bar.
 *
 * `role="progressbar"` with the value attributes, so the number is available
 * to assistive tech without the visible label having to repeat it. Used for
 * delivery/open/click rates, quota use and step progress — anywhere a
 * percentage is easier to compare as a length than as digits.
 */
export function ProgressBar({
  value,
  label,
  tone = "bg-primary",
  size = "md",
  className,
}: {
  /** 0–100. Clamped, so a rate computed off a stale total cannot overflow. */
  value: number;
  /** Accessible name. Pass it even when a visible label sits alongside. */
  label: string;
  tone?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-secondary",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width]", tone)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** Label, value and bar as one block — the shape a metric list repeats. */
export function MeterRow({
  label,
  value,
  display,
  tone,
  hint,
}: {
  label: string;
  value: number;
  /** The formatted number shown on the right. */
  display: string;
  tone?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-[13px] font-medium text-text-secondary">{label}</p>
        <p className="shrink-0 text-[13px] font-bold text-text-primary tabular-nums">
          {display}
        </p>
      </div>
      <ProgressBar value={value} label={label} tone={tone} className="mt-2" />
      {hint ? <p className="mt-1.5 text-[11px] text-text-muted">{hint}</p> : null}
    </div>
  );
}
