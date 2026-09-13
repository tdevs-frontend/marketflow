"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { SegmentedControl } from "@/components/ui/segmented-control";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

export type RangeKey = "7d" | "30d" | "90d" | "12m";

export interface RangeMeta {
  /** Short form, for a segmented button inside a card header. */
  label: string;
  /** What a trend figure on this page is measured against. */
  comparison: string;
  /** What one point on the growth chart means. */
  unit: string;
}

export const RANGES: Record<RangeKey, RangeMeta> = {
  "7d": {
    label: "7 Days",
    comparison: "vs last 7 days",
    unit: "per day",
  },
  "30d": {
    label: "30 Days",
    comparison: "vs last 30 days",
    unit: "per day",
  },
  "90d": {
    label: "90 Days",
    comparison: "vs last 90 days",
    unit: "per day",
  },
  "12m": {
    label: "12 Months",
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
 * "vs last period" without saying which. One state means the chart's chips
 * relabel and refigure the KPI row above them, so the two halves of the
 * analytics band can never disagree about the window they describe.
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

const SEGMENT_OPTIONS = RANGE_KEYS.map((value) => ({
  value,
  label: RANGES[value].label,
}));

/**
 * The page's period control, in the Growth Overview header.
 *
 * The only one on the page: a second picker in the page header sat beside the
 * primary CTA saying the same thing these chips already say, which reads as two
 * settings rather than one.
 */
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
