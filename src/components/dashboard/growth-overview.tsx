"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { cn } from "@/lib/utils";
import { GrowthOverviewChart } from "./charts/growth-overview-chart";

/* -------------------------------------------------------------------------- */
/* Data                                                                       */
/* -------------------------------------------------------------------------- */

type RangeKey = "7d" | "30d" | "90d" | "12m";
type MetricKey = "leads" | "orders" | "revenue";

interface MetricSeries {
  current: number[];
  previous: number[];
}

interface RangeData {
  label: string;
  categories: string[];
  /** What one point means. Shown by the legend so the scale is never a guess. */
  unit: string;
  metrics: Record<MetricKey, MetricSeries>;
}

/**
 * Placeholder figures — swap for `useGetGrowthQuery(range)` once the API is
 * live. Two things are deliberate about the numbers:
 *
 * 1. The day ranges plot a daily rate, so all three converge on the same
 *    end-of-May figure (470 leads, 54 orders, $1,980 a day). Switching range
 *    changes the window, never the last reading.
 * 2. The 12-month view plots monthly totals, and its final month is exactly
 *    the KPI row above — 12,480 leads, 1,284 orders, $48.2K, each against a
 *    previous-period point that reproduces the KPI's own percentage.
 *
 * Every range carries its own `previous` window so the comparison line is a
 * real series rather than the current one shifted sideways.
 */
const RANGES: Record<RangeKey, RangeData> = {
  "7d": {
    label: "7 Days",
    unit: "per day",
    categories: ["May 24", "May 25", "May 26", "May 27", "May 28", "May 29", "May 30"],
    metrics: {
      leads: {
        current: [408, 432, 419, 451, 444, 468, 470],
        previous: [346, 362, 355, 381, 374, 394, 400],
      },
      orders: {
        current: [42, 46, 44, 49, 47, 52, 54],
        previous: [34, 37, 36, 40, 39, 42, 44],
      },
      revenue: {
        current: [1620, 1740, 1680, 1860, 1810, 1940, 1980],
        previous: [1330, 1420, 1380, 1520, 1480, 1590, 1640],
      },
    },
  },
  "30d": {
    label: "30 Days",
    unit: "per day",
    categories: ["May 1", "May 5", "May 10", "May 15", "May 20", "May 25", "May 30"],
    metrics: {
      leads: {
        current: [280, 320, 360, 390, 420, 450, 470],
        previous: [230, 260, 300, 330, 350, 370, 400],
      },
      orders: {
        current: [30, 34, 38, 42, 46, 50, 54],
        previous: [25, 28, 31, 35, 38, 41, 44],
      },
      revenue: {
        current: [1120, 1280, 1440, 1580, 1720, 1860, 1980],
        previous: [920, 1050, 1180, 1290, 1410, 1520, 1640],
      },
    },
  },
  "90d": {
    label: "90 Days",
    unit: "per day",
    categories: ["Mar 1", "Mar 15", "Apr 1", "Apr 15", "May 1", "May 15", "May 30"],
    metrics: {
      leads: {
        current: [268, 302, 336, 372, 404, 438, 470],
        previous: [224, 248, 272, 300, 328, 362, 400],
      },
      orders: {
        current: [24, 29, 34, 39, 44, 49, 54],
        previous: [19, 23, 27, 31, 35, 39, 44],
      },
      revenue: {
        current: [880, 1060, 1240, 1420, 1600, 1790, 1980],
        previous: [700, 840, 980, 1130, 1290, 1460, 1640],
      },
    },
  },
  "12m": {
    label: "12 Months",
    unit: "per month",
    categories: [
      "Jun", "Jul", "Aug", "Sep", "Oct", "Nov",
      "Dec", "Jan", "Feb", "Mar", "Apr", "May",
    ],
    metrics: {
      leads: {
        current: [6200, 6800, 7400, 7100, 8200, 8900, 9800, 9400, 10200, 11100, 11800, 12480],
        previous: [5100, 5400, 5900, 6000, 6600, 7100, 7800, 7600, 8100, 8800, 9300, 10540],
      },
      orders: {
        current: [640, 700, 760, 740, 860, 940, 1060, 1020, 1120, 1180, 1240, 1284],
        previous: [520, 560, 620, 610, 700, 760, 860, 830, 910, 960, 1010, 1099],
      },
      revenue: {
        current: [
          23800, 26200, 28600, 27900, 32400, 35200, 39800, 38200,
          41800, 44100, 46200, 48200,
        ],
        previous: [
          19200, 21000, 23100, 22600, 26100, 28400, 32100, 30800,
          33600, 35400, 37900, 39670,
        ],
      },
    },
  },
};

const RANGE_OPTIONS = (Object.keys(RANGES) as RangeKey[]).map((key) => ({
  value: key,
  label: RANGES[key].label,
}));

const METRICS: { value: MetricKey; label: string; format: "number" | "currency" }[] = [
  { value: "leads", label: "Leads", format: "number" },
  { value: "orders", label: "Orders", format: "number" },
  { value: "revenue", label: "Revenue", format: "currency" },
];

/* -------------------------------------------------------------------------- */
/* Section                                                                    */
/* -------------------------------------------------------------------------- */

function LegendSwatch({ className, children }: { className: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
      <span aria-hidden className={cn("h-0.5 w-4 rounded-full", className)} />
      {children}
    </span>
  );
}

export function GrowthOverview({ className }: { className?: string }) {
  const [range, setRange] = useState<RangeKey>("30d");
  const [metric, setMetric] = useState<MetricKey>("leads");

  const active = METRICS.find((item) => item.value === metric) ?? METRICS[0];
  const data = RANGES[range].metrics[metric];

  return (
    <Card className={cn("flex flex-col p-5", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-base">Growth Overview</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Track leads, orders and revenue over time.
          </p>
        </div>

        <SegmentedControl
          label="Date range"
          options={RANGE_OPTIONS}
          value={range}
          onChange={setRange}
          className="max-xl:-mx-1 max-xl:overflow-x-auto"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label="Metric"
          size="sm"
          options={METRICS.map(({ value, label }) => ({ value, label }))}
          value={metric}
          onChange={setMetric}
        />

        {/* A two-item legend beats Apex's own — it sits with the controls
            instead of stealing a strip of the plot area. The unit belongs
            here too: the day ranges plot a rate, the year plots totals. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <LegendSwatch className="bg-primary">{active.label}</LegendSwatch>
          <LegendSwatch className="bg-border-strong">Previous period</LegendSwatch>
          <span className="text-xs text-text-muted">{RANGES[range].unit}</span>
        </div>
      </div>

      <div className="mt-2 -ml-2.5">
        <GrowthOverviewChart
          categories={RANGES[range].categories}
          current={data.current}
          previous={data.previous}
          seriesName={active.label}
          format={active.format}
        />
      </div>
    </Card>
  );
}
