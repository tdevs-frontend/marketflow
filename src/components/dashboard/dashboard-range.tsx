"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

export type RangeKey = "7d" | "30d" | "90d" | "12m";

export interface RangeMeta {
  /** Short form, for a segmented button inside a card header. */
  label: string;
  /** Long form, for the page-level picker. */
  longLabel: string;
  /** What a trend figure on this page is measured against. */
  comparison: string;
  /** What one point on the growth chart means. */
  unit: string;
}

export const RANGES: Record<RangeKey, RangeMeta> = {
  "7d": {
    label: "7 Days",
    longLabel: "Last 7 days",
    comparison: "vs last 7 days",
    unit: "per day",
  },
  "30d": {
    label: "30 Days",
    longLabel: "Last 30 days",
    comparison: "vs last 30 days",
    unit: "per day",
  },
  "90d": {
    label: "90 Days",
    longLabel: "Last 90 days",
    comparison: "vs last 90 days",
    unit: "per day",
  },
  "12m": {
    label: "12 Months",
    longLabel: "Last 12 months",
    comparison: "vs last 12 months",
    unit: "per month",
  },
};

export const RANGE_KEYS = Object.keys(RANGES) as RangeKey[];

/* -------------------------------------------------------------------------- */
/* Context                                                                    */
/* -------------------------------------------------------------------------- */

interface DashboardRangeValue {
  range: RangeKey;
  setRange: (range: RangeKey) => void;
  meta: RangeMeta;
}

const DashboardRangeContext = createContext<DashboardRangeValue | null>(null);

/**
 * The overview's one reporting period.
 *
 * It exists because the page used to carry the range in two unconnected
 * places: the growth chart owned a 7/30/90/12m switcher, and every KPI said
 * "vs last period" without saying which. One state means the header picker and
 * the chart's own switcher are two affordances onto the same number — move
 * either and the KPI row relabels with it.
 *
 * Scope is deliberately the analytics band. Business Pulse is a live "today"
 * reading and the inbox, orders and activity feeds are latest-first lists, so
 * none of them take a period; the cards that report a window state it in their
 * own subtitle.
 */
export function DashboardRangeProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<RangeKey>("30d");

  const value = useMemo<DashboardRangeValue>(
    () => ({ range, setRange, meta: RANGES[range] }),
    [range],
  );

  return (
    <DashboardRangeContext.Provider value={value}>
      {children}
    </DashboardRangeContext.Provider>
  );
}

export function useDashboardRange(): DashboardRangeValue {
  const value = useContext(DashboardRangeContext);
  if (!value) {
    throw new Error("useDashboardRange must be used inside <DashboardRangeProvider>");
  }
  return value;
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

const SELECT_OPTIONS = RANGE_KEYS.map((value) => ({
  value,
  label: RANGES[value].longLabel,
}));

const SEGMENT_OPTIONS = RANGE_KEYS.map((value) => ({
  value,
  label: RANGES[value].label,
}));

/**
 * The page-level picker, for the header.
 *
 * A `Select` rather than a second segmented control: the chart already shows
 * the range as four chips, and two identical strips on one screen reads as two
 * settings rather than one.
 */
export function DashboardRangeSelect({ className }: { className?: string }) {
  const { range, setRange } = useDashboardRange();

  return (
    <Select
      label="Reporting period"
      size="sm"
      value={range}
      onChange={setRange}
      options={SELECT_OPTIONS}
      className={className}
    />
  );
}

/** The same range as chips, for a card header. */
export function DashboardRangeChips({ className }: { className?: string }) {
  const { range, setRange } = useDashboardRange();

  return (
    <SegmentedControl
      label="Reporting period"
      size="sm"
      options={SEGMENT_OPTIONS}
      value={range}
      onChange={setRange}
      className={className}
    />
  );
}
