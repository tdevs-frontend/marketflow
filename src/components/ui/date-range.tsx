"use client";

import { CalendarDays } from "lucide-react";

import { Button } from "./button";
import { Input } from "./input";
import { Select } from "./select";
import { cn } from "@/lib/utils";
import type { DateRangePreset } from "@/types/analytics";

export const RANGE_PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "ytd", label: "Year to date" },
  { value: "custom", label: "Custom range" },
];

export interface DateRangeValue {
  preset: DateRangePreset;
  from: string;
  to: string;
}

export const DEFAULT_RANGE: DateRangeValue = { preset: "30d", from: "", to: "" };

/**
 * Period selector for the toolbar.
 *
 * A preset list rather than two date inputs, because "last 30 days" is what a
 * marketer actually wants nine times in ten; the two inputs only appear once
 * `custom` is chosen. That keeps the common case one click and the rare case
 * possible, instead of charging everyone the cost of a calendar.
 */
export function DateRangePicker({
  value,
  onChange,
  className,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
}) {
  const custom = value.preset === "custom";

  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <Select
        label="Date range"
        size="sm"
        value={value.preset}
        onChange={(preset) => onChange({ ...value, preset })}
        options={RANGE_PRESETS}
        className="w-full lg:w-40"
      />

      {custom ? (
        <>
          <Input
            type="date"
            aria-label="From date"
            value={value.from}
            max={value.to || undefined}
            onChange={(event) => onChange({ ...value, from: event.target.value })}
            className="h-10 w-full lg:w-36"
          />
          <span aria-hidden className="text-xs text-text-muted max-lg:hidden">
            to
          </span>
          <Input
            type="date"
            aria-label="To date"
            value={value.to}
            min={value.from || undefined}
            onChange={(event) => onChange({ ...value, to: event.target.value })}
            className="h-10 w-full lg:w-36"
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * Period stepper for the social calendar — prev, next, a label and a jump back
 * to today. Not a range: a calendar is browsed one period at a time.
 *
 * `unit` names what the arrows move by. It is not cosmetic: the same control
 * drives the month, week and day views, and an arrow that announces itself as
 * "Previous month" while actually moving one day is worse than an unlabelled
 * one.
 */
export function MonthStepper({
  label,
  unit = "month",
  onPrev,
  onNext,
  onToday,
  className,
}: {
  label: string;
  unit?: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center rounded-btn border border-border bg-surface">
        <button
          type="button"
          onClick={onPrev}
          aria-label={`Previous ${unit}`}
          className="grid h-9 w-9 place-items-center rounded-l-btn text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span aria-hidden>‹</span>
        </button>
        <span className="min-w-36 border-x border-border px-3 text-center text-sm font-medium text-text-primary">
          {label}
        </span>
        <button
          type="button"
          onClick={onNext}
          aria-label={`Next ${unit}`}
          className="grid h-9 w-9 place-items-center rounded-r-btn text-text-muted transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:shadow-focus focus-visible:outline-none"
        >
          <span aria-hidden>›</span>
        </button>
      </div>

      <Button variant="outline" size="sm" onClick={onToday}>
        <CalendarDays aria-hidden />
        Today
      </Button>
    </div>
  );
}
